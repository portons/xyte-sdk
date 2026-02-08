import * as net from 'node:net';
import type { Scanner, ScanOptions, RawScanEntry } from './types';

const DEVICE_PORTS: { port: number; hint: string }[] = [
  { port: 554, hint: 'rtsp' },
  { port: 631, hint: 'ipp' },
  { port: 1400, hint: 'sonos' },
  { port: 1883, hint: 'mqtt' },
  { port: 7000, hint: 'airplay' },
  { port: 8008, hint: 'chromecast' },
  { port: 8060, hint: 'roku' },
  { port: 9100, hint: 'raw-print' },
];

const MAX_CONCURRENT = 50;
const CONNECT_TIMEOUT_MS = 500;

async function probePort(ip: string, port: number, signal?: AbortSignal): Promise<boolean> {
  return new Promise(resolve => {
    if (signal?.aborted) {
      resolve(false);
      return;
    }

    const socket = new net.Socket();
    let settled = false;

    const cleanup = () => {
      if (!settled) {
        settled = true;
        socket.destroy();
      }
    };

    const onAbort = () => {
      cleanup();
      resolve(false);
    };

    signal?.addEventListener('abort', onAbort, { once: true });

    socket.setTimeout(CONNECT_TIMEOUT_MS);

    socket.on('connect', () => {
      signal?.removeEventListener('abort', onAbort);
      cleanup();
      resolve(true);
    });

    socket.on('timeout', () => {
      signal?.removeEventListener('abort', onAbort);
      cleanup();
      resolve(false);
    });

    socket.on('error', () => {
      signal?.removeEventListener('abort', onAbort);
      cleanup();
      resolve(false);
    });

    socket.connect(port, ip);
  });
}

async function runWithConcurrency<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export function createPortScanner(): Scanner {
  return {
    protocol: 'tcp',
    async scan(options: ScanOptions & { localIp: string; knownIps?: string[] }): Promise<RawScanEntry[]> {
      const ips = options.knownIps ?? [];
      if (ips.length === 0) return [];

      const tasks: { ip: string; port: number; hint: string }[] = [];
      for (const ip of ips) {
        if (ip === options.localIp) continue;
        for (const { port, hint } of DEVICE_PORTS) {
          tasks.push({ ip, port, hint });
        }
      }

      const probes = tasks.map(t => () => probePort(t.ip, t.port, options.signal));
      const results = await runWithConcurrency(probes, MAX_CONCURRENT);

      const byIp = new Map<string, number[]>();
      for (let i = 0; i < tasks.length; i++) {
        if (results[i]) {
          const existing = byIp.get(tasks[i].ip) ?? [];
          existing.push(tasks[i].port);
          byIp.set(tasks[i].ip, existing);
        }
      }

      const entries: RawScanEntry[] = [];
      for (const [ip, ports] of byIp) {
        entries.push({
          ip,
          services: [],
          openPorts: ports,
          source: 'tcp',
        });
      }

      return entries;
    },
  };
}
