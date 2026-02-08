import type { DiscoveredDevice, DiscoveredService, RawScanEntry, ScanProtocol } from './types';
import { lookupOui } from './oui-lookup';
import { classifyDevice } from './classifier';

export class DeviceRegistry {
  private devices = new Map<string, DiscoveredDevice>();

  ingest(entries: RawScanEntry[]): void {
    for (const entry of entries) {
      const existing = this.devices.get(entry.ip);
      if (existing) {
        this.merge(existing, entry);
      } else {
        this.devices.set(entry.ip, this.fromRaw(entry));
      }
    }
  }

  getDevices(): DiscoveredDevice[] {
    const devices = Array.from(this.devices.values());

    for (const device of devices) {
      if (!device.manufacturer && device.mac) {
        device.manufacturer = lookupOui(device.mac);
      }
      const { category, confidence } = classifyDevice(device);
      device.category = category;
      device.confidence = confidence;
    }

    return devices.sort((a, b) => {
      const ipA = a.ip.split('.').map(Number);
      const ipB = b.ip.split('.').map(Number);
      for (let i = 0; i < 4; i++) {
        if (ipA[i] !== ipB[i]) return ipA[i] - ipB[i];
      }
      return 0;
    });
  }

  private fromRaw(entry: RawScanEntry): DiscoveredDevice {
    return {
      ip: entry.ip,
      mac: entry.mac,
      name: entry.name,
      hostname: entry.hostname,
      manufacturer: entry.manufacturer,
      model: entry.model,
      category: 'unknown',
      confidence: 0,
      services: [...entry.services],
      openPorts: [...entry.openPorts],
      sources: [entry.source],
    };
  }

  private merge(existing: DiscoveredDevice, entry: RawScanEntry): void {
    // MAC: prefer ARP source (most reliable for MAC addresses)
    if (entry.mac) {
      if (!existing.mac || entry.source === 'arp') {
        existing.mac = entry.mac;
      }
    }

    // Name: prefer mDNS/SSDP over ARP hostname
    if (entry.name) {
      if (!existing.name || (entry.source === 'mdns' || entry.source === 'ssdp')) {
        existing.name = entry.name;
      }
    }

    // Hostname
    if (entry.hostname && !existing.hostname) {
      existing.hostname = entry.hostname;
    }

    // Manufacturer: prefer SSDP XML > mDNS TXT > OUI lookup
    if (entry.manufacturer) {
      if (!existing.manufacturer) {
        existing.manufacturer = entry.manufacturer;
      } else if (entry.source === 'ssdp') {
        existing.manufacturer = entry.manufacturer;
      } else if (entry.source === 'mdns' && existing.sources.every(s => s !== 'ssdp')) {
        existing.manufacturer = entry.manufacturer;
      }
    }

    // Model
    if (entry.model) {
      if (!existing.model || entry.source === 'ssdp') {
        existing.model = entry.model;
      }
    }

    // Services: union
    for (const svc of entry.services) {
      if (!existing.services.some(s => s.serviceType === svc.serviceType && s.protocol === svc.protocol)) {
        existing.services.push(svc);
      }
    }

    // Open ports: union
    for (const port of entry.openPorts) {
      if (!existing.openPorts.includes(port)) {
        existing.openPorts.push(port);
      }
    }

    // Sources: append
    if (!existing.sources.includes(entry.source)) {
      existing.sources.push(entry.source);
    }
  }
}
