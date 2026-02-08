import Bonjour from 'bonjour-service';
import type { Scanner, ScanOptions, RawScanEntry, DiscoveredService } from './types';

const SERVICE_TYPES = [
  { type: '_googlecast._tcp', protocol: 'tcp' as const },
  { type: '_airplay._tcp', protocol: 'tcp' as const },
  { type: '_raop._tcp', protocol: 'tcp' as const },
  { type: '_hap._tcp', protocol: 'tcp' as const },
  { type: '_hue._tcp', protocol: 'tcp' as const },
  { type: '_sonos._tcp', protocol: 'tcp' as const },
  { type: '_matter._tcp', protocol: 'tcp' as const },
  { type: '_matterc._udp', protocol: 'udp' as const },
  { type: '_ipp._tcp', protocol: 'tcp' as const },
  { type: '_printer._tcp', protocol: 'tcp' as const },
  { type: '_http._tcp', protocol: 'tcp' as const },
  { type: '_smb._tcp', protocol: 'tcp' as const },
  { type: '_spotify-connect._tcp', protocol: 'tcp' as const },
];

export function createMdnsScanner(): Scanner {
  return {
    protocol: 'mdns',
    async scan(options: ScanOptions & { localIp: string }): Promise<RawScanEntry[]> {
      const entries = new Map<string, RawScanEntry>();
      const bonjour = new Bonjour();

      const browseTimeout = options.timeout ?? 5000;

      try {
        await new Promise<void>((resolve) => {
          const browsers: ReturnType<typeof bonjour.find>[] = [];

          const done = () => {
            for (const b of browsers) {
              try { b.stop(); } catch { /* ignore */ }
            }
            resolve();
          };

          const timer = setTimeout(done, browseTimeout);

          if (options.signal) {
            options.signal.addEventListener('abort', () => {
              clearTimeout(timer);
              done();
            }, { once: true });
          }

          for (const svcDef of SERVICE_TYPES) {
            const browser = bonjour.find({ type: svcDef.type.replace(/^_/, '').replace(/\._(?:tcp|udp)$/, ''), protocol: svcDef.protocol });

            browser.on('up', (service: any) => {
              const ip = extractIp(service);
              if (!ip || ip === options.localIp) return;

              const txt = extractTxt(service.txt);
              const friendlyName = service.name ?? txt['fn'] ?? txt['md'] ?? undefined;
              const manufacturer = txt['manufacturer'] ?? undefined;
              const model = txt['md'] ?? txt['model'] ?? undefined;

              const discoveredService: DiscoveredService = {
                protocol: 'mdns',
                serviceType: svcDef.type,
                port: service.port ?? undefined,
                txt,
              };

              const existing = entries.get(ip);
              if (existing) {
                existing.services.push(discoveredService);
                if (friendlyName && !existing.name) existing.name = friendlyName;
                if (manufacturer && !existing.manufacturer) existing.manufacturer = manufacturer;
                if (model && !existing.model) existing.model = model;
                if (service.host && !existing.hostname) existing.hostname = service.host;
              } else {
                entries.set(ip, {
                  ip,
                  name: friendlyName,
                  hostname: service.host ?? undefined,
                  manufacturer,
                  model,
                  services: [discoveredService],
                  openPorts: service.port ? [service.port] : [],
                  source: 'mdns',
                });
              }
            });

            browsers.push(browser);
          }
        });
      } finally {
        bonjour.destroy();
      }

      return Array.from(entries.values());
    },
  };
}

function extractIp(service: any): string | undefined {
  const addresses: string[] = service.addresses ?? service.referer?.address ? [service.referer.address] : [];
  return addresses.find((a: string) => /^\d+\.\d+\.\d+\.\d+$/.test(a));
}

function extractTxt(txt: unknown): Record<string, string> {
  if (!txt || typeof txt !== 'object') return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(txt as Record<string, unknown>)) {
    if (typeof value === 'string') {
      result[key] = value;
    } else if (Buffer.isBuffer(value)) {
      result[key] = value.toString('utf-8');
    }
  }
  return result;
}
