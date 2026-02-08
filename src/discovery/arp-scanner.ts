import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { Scanner, ScanOptions, RawScanEntry } from './types';
import { lookupOui } from './oui-lookup';

const execFileAsync = promisify(execFile);

export function createArpScanner(): Scanner {
  return {
    protocol: 'arp',
    async scan(options: ScanOptions & { localIp: string; subnet?: string }): Promise<RawScanEntry[]> {
      // In full mode, run a ping sweep first to populate ARP cache
      if (options.subnet) {
        await pingSweep(options.subnet, options.signal);
      }

      const raw = await readArpTable(options.signal);
      const entries: RawScanEntry[] = [];

      for (const { ip, mac } of raw) {
        if (ip === options.localIp) continue;
        if (mac === 'ff:ff:ff:ff:ff:ff' || mac === '00:00:00:00:00:00') continue;
        if (mac.startsWith('01:00:5e') || mac.startsWith('33:33:')) continue; // multicast

        const manufacturer = lookupOui(mac);

        entries.push({
          ip,
          mac,
          manufacturer,
          services: [],
          openPorts: [],
          source: 'arp',
        });
      }

      return entries;
    },
  };
}

interface ArpEntry {
  ip: string;
  mac: string;
}

async function readArpTable(signal?: AbortSignal): Promise<ArpEntry[]> {
  try {
    const { stdout } = await execFileAsync('arp', ['-a'], {
      timeout: 5000,
      signal,
    });
    return parseArpOutput(stdout, process.platform);
  } catch {
    return [];
  }
}

function parseArpOutput(stdout: string, platform: string): ArpEntry[] {
  const entries: ArpEntry[] = [];

  if (platform === 'win32') {
    // Windows: "  192.168.1.1          00-aa-bb-cc-dd-ee     dynamic"
    const regex = /(\d+\.\d+\.\d+\.\d+)\s+([0-9a-fA-F]{2}-[0-9a-fA-F]{2}-[0-9a-fA-F]{2}-[0-9a-fA-F]{2}-[0-9a-fA-F]{2}-[0-9a-fA-F]{2})/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(stdout)) !== null) {
      entries.push({ ip: match[1], mac: match[2].replace(/-/g, ':').toLowerCase() });
    }
  } else {
    // macOS/Linux: "? (192.168.1.1) at aa:bb:cc:dd:ee:ff on en0 ..."
    const regex = /\((\d+\.\d+\.\d+\.\d+)\)\s+at\s+([0-9a-fA-F:]+)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(stdout)) !== null) {
      const mac = normalizeMac(match[2]);
      if (mac) {
        entries.push({ ip: match[1], mac });
      }
    }
  }

  return entries;
}

function normalizeMac(raw: string): string | undefined {
  const parts = raw.split(':');
  if (parts.length !== 6) return undefined;
  return parts.map(p => p.padStart(2, '0').toLowerCase()).join(':');
}

async function pingSweep(subnet: string, signal?: AbortSignal): Promise<void> {
  // Parse CIDR: 192.168.1.0/24 → sweep 192.168.1.1-254
  const parts = subnet.split('/');
  const base = parts[0];
  const mask = parseInt(parts[1] ?? '24', 10);

  if (mask !== 24) return; // Only sweep /24 networks for safety

  const prefix = base.split('.').slice(0, 3).join('.');
  const pingArgs = process.platform === 'win32'
    ? ['-n', '1', '-w', '200']
    : ['-c', '1', '-W', process.platform === 'darwin' ? '200' : '0.2'];

  const promises: Promise<void>[] = [];
  for (let i = 1; i <= 254; i++) {
    if (signal?.aborted) break;
    const ip = `${prefix}.${i}`;
    promises.push(
      execFileAsync('ping', [...pingArgs, ip], { timeout: 1000, signal })
        .then(() => {})
        .catch(() => {})
    );
  }

  await Promise.allSettled(promises);
}
