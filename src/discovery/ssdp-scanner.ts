import { Client as SsdpClient } from 'node-ssdp';
import { parseStringPromise } from 'xml2js';
import type { Scanner, ScanOptions, RawScanEntry, DiscoveredService } from './types';

const XML_FETCH_TIMEOUT = 2000;

export function createSsdpScanner(): Scanner {
  return {
    protocol: 'ssdp',
    async scan(options: ScanOptions & { localIp: string }): Promise<RawScanEntry[]> {
      const entries = new Map<string, RawScanEntry>();
      const locationsSeen = new Set<string>();
      const locationsByIp = new Map<string, string[]>();

      const searchTimeout = options.timeout ?? 5000;

      await new Promise<void>((resolve) => {
        const client = new SsdpClient();
        let resolved = false;

        const done = () => {
          if (resolved) return;
          resolved = true;
          try { client.stop(); } catch { /* ignore */ }
          resolve();
        };

        const timer = setTimeout(done, searchTimeout);

        if (options.signal) {
          options.signal.addEventListener('abort', () => {
            clearTimeout(timer);
            done();
          }, { once: true });
        }

        client.on('response', (headers: any, _statusCode: number, rinfo: { address: string }) => {
          const ip = rinfo.address;
          if (ip === options.localIp) return;

          const location = headers['LOCATION'] ?? headers['location'];
          const st = headers['ST'] ?? headers['st'] ?? '';
          const server = headers['SERVER'] ?? headers['server'] ?? '';
          const usn = headers['USN'] ?? headers['usn'] ?? '';

          if (location && !locationsSeen.has(location)) {
            locationsSeen.add(location);
            const existing = locationsByIp.get(ip) ?? [];
            existing.push(location);
            locationsByIp.set(ip, existing);
          }

          const service: DiscoveredService = {
            protocol: 'ssdp',
            serviceType: st,
            txt: {
              ...(server ? { server } : {}),
              ...(usn ? { usn } : {}),
            },
          };

          const existing = entries.get(ip);
          if (existing) {
            if (!existing.services.some(s => s.serviceType === st)) {
              existing.services.push(service);
            }
          } else {
            entries.set(ip, {
              ip,
              services: [service],
              openPorts: [],
              source: 'ssdp',
            });
          }
        });

        client.search('ssdp:all');
      });

      // Fetch device description XML for each location
      const fetchPromises: Promise<void>[] = [];
      for (const [ip, locations] of locationsByIp) {
        const entry = entries.get(ip);
        if (!entry) continue;

        const url = locations[0];
        fetchPromises.push(
          fetchDeviceDescription(url, options.signal)
            .then(desc => {
              if (!desc) return;
              if (desc.friendlyName) entry.name = desc.friendlyName;
              if (desc.manufacturer) entry.manufacturer = desc.manufacturer;
              if (desc.modelName) entry.model = desc.modelName;
            })
            .catch(() => { /* ignore fetch failures */ })
        );
      }

      await Promise.allSettled(fetchPromises);

      return Array.from(entries.values());
    },
  };
}

interface DeviceDescription {
  friendlyName?: string;
  manufacturer?: string;
  modelName?: string;
  deviceType?: string;
}

async function fetchDeviceDescription(url: string, signal?: AbortSignal): Promise<DeviceDescription | undefined> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), XML_FETCH_TIMEOUT);

    if (signal) {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) return undefined;

    const xml = await response.text();
    const parsed = await parseStringPromise(xml, { explicitArray: false, ignoreAttrs: true });

    const root = parsed?.root ?? parsed;
    const device = root?.device ?? root?.Device ?? findDevice(root);

    if (!device) return undefined;

    return {
      friendlyName: device.friendlyName ?? device.FriendlyName,
      manufacturer: device.manufacturer ?? device.Manufacturer,
      modelName: device.modelName ?? device.ModelName ?? device.modelDescription,
      deviceType: device.deviceType ?? device.DeviceType,
    };
  } catch {
    return undefined;
  }
}

function findDevice(obj: any): any {
  if (!obj || typeof obj !== 'object') return undefined;
  if (obj.friendlyName || obj.FriendlyName) return obj;
  for (const val of Object.values(obj)) {
    const result = findDevice(val);
    if (result) return result;
  }
  return undefined;
}
