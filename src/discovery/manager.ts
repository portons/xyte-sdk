import * as os from 'node:os';
import type { ScanOptions, ScanResult, ScanProtocol, ScannerStatus, Scanner, RawScanEntry, ScanMode } from './types';
import { DISCOVERY_SCAN_SCHEMA_VERSION } from '../contracts/versions';
import { DeviceRegistry } from './device-registry';
import { createMdnsScanner } from './mdns-scanner';
import { createSsdpScanner } from './ssdp-scanner';
import { createArpScanner } from './arp-scanner';
import { createPortScanner } from './port-scanner';

const DEFAULT_QUICK_TIMEOUT = 5000;
const DEFAULT_FULL_TIMEOUT = 30000;

export async function runDiscoveryScan(options: ScanOptions = {}): Promise<ScanResult> {
  const start = Date.now();
  const mode: ScanMode = options.mode ?? 'quick';
  const { interfaceName, localIp, subnet } = detectNetwork(options.subnet);

  const defaultTimeout = mode === 'quick' ? DEFAULT_QUICK_TIMEOUT : DEFAULT_FULL_TIMEOUT;
  const timeout = options.timeout ?? defaultTimeout;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const selectedProtocols = selectProtocols(mode, options.protocols);
  const scanners = createScanners(selectedProtocols);

  const scannerStatuses: ScannerStatus[] = [];
  const allEntries: RawScanEntry[] = [];

  try {
    // Phase 1: Run primary scanners (mdns, ssdp, arp)
    const primaryScanners = scanners.filter(s => s.protocol !== 'tcp');
    const primaryResults = await Promise.allSettled(
      primaryScanners.map(scanner =>
        scanner.scan({
          ...options,
          localIp,
          subnet,
          timeout: timeout - 500,
          signal: controller.signal,
        })
      )
    );

    for (let i = 0; i < primaryScanners.length; i++) {
      const result = primaryResults[i];
      const protocol = primaryScanners[i].protocol;

      if (result.status === 'fulfilled') {
        allEntries.push(...result.value);
        scannerStatuses.push({ protocol, status: 'ok', devicesFound: result.value.length });
      } else {
        const errorMsg = result.reason instanceof Error ? result.reason.message : String(result.reason);
        const status = errorMsg.includes('abort') ? 'timeout' : 'error';
        scannerStatuses.push({ protocol, status, devicesFound: 0, error: errorMsg });
      }
    }

    // Phase 2: If TCP port scanner is included, feed it known IPs from phase 1
    const tcpScanner = scanners.find(s => s.protocol === 'tcp');
    if (tcpScanner && !controller.signal.aborted) {
      const knownIps = [...new Set(allEntries.map(e => e.ip))];

      try {
        const tcpEntries = await tcpScanner.scan({
          ...options,
          localIp,
          subnet,
          knownIps,
          timeout: Math.max(timeout - (Date.now() - start) - 500, 2000),
          signal: controller.signal,
        });
        allEntries.push(...tcpEntries);
        scannerStatuses.push({ protocol: 'tcp', status: 'ok', devicesFound: tcpEntries.length });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const status = errorMsg.includes('abort') ? 'timeout' : 'error';
        scannerStatuses.push({ protocol: 'tcp', status, devicesFound: 0, error: errorMsg });
      }
    }
  } finally {
    clearTimeout(timer);
  }

  const registry = new DeviceRegistry();
  registry.ingest(allEntries);
  const devices = registry.getDevices();

  const byCategory: Partial<Record<string, number>> = {};
  for (const d of devices) {
    byCategory[d.category] = (byCategory[d.category] ?? 0) + 1;
  }

  return {
    schemaVersion: DISCOVERY_SCAN_SCHEMA_VERSION,
    mode,
    network: { interfaceName, localIp, subnet },
    summary: {
      totalDevices: devices.length,
      byCategory: byCategory as any,
      scannersUsed: selectedProtocols,
      scannerStatuses,
      durationMs: Date.now() - start,
    },
    devices,
  };
}

function selectProtocols(mode: ScanMode, explicit?: ScanProtocol[]): ScanProtocol[] {
  if (explicit && explicit.length > 0) return explicit;
  if (mode === 'quick') return ['mdns', 'ssdp'];
  return ['mdns', 'ssdp', 'arp', 'tcp'];
}

function createScanners(protocols: ScanProtocol[]): Scanner[] {
  const scannerMap: Record<ScanProtocol, () => Scanner> = {
    mdns: createMdnsScanner,
    ssdp: createSsdpScanner,
    arp: createArpScanner,
    tcp: createPortScanner,
  };
  return protocols.map(p => scannerMap[p]());
}

function detectNetwork(overrideSubnet?: string): { interfaceName: string; localIp: string; subnet?: string } {
  const interfaces = os.networkInterfaces();

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal) {
        const subnet = overrideSubnet ?? cidrFromNetmask(addr.address, addr.netmask);
        return { interfaceName: name, localIp: addr.address, subnet };
      }
    }
  }

  throw new Error('No active network interfaces found');
}

function cidrFromNetmask(ip: string, netmask: string): string {
  const maskBits = netmask.split('.').reduce((bits, octet) => {
    let n = parseInt(octet, 10);
    while (n > 0) {
      bits += n & 1;
      n >>= 1;
    }
    return bits;
  }, 0);

  const ipParts = ip.split('.').map(Number);
  const maskParts = netmask.split('.').map(Number);
  const network = ipParts.map((p, i) => p & maskParts[i]).join('.');

  return `${network}/${maskBits}`;
}
