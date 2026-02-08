import { describe, it, expect } from 'vitest';
import { DeviceRegistry } from '../../src/discovery/device-registry';
import type { RawScanEntry } from '../../src/discovery/types';

describe('DeviceRegistry', () => {
  it('creates device from single entry', () => {
    const registry = new DeviceRegistry();
    registry.ingest([
      {
        ip: '192.168.1.10',
        name: 'Living Room TV',
        manufacturer: 'Samsung',
        services: [{ protocol: 'ssdp', serviceType: 'urn:dial-multiscreen-org:service:dial:1' }],
        openPorts: [],
        source: 'ssdp',
      },
    ]);

    const devices = registry.getDevices();
    expect(devices).toHaveLength(1);
    expect(devices[0].ip).toBe('192.168.1.10');
    expect(devices[0].name).toBe('Living Room TV');
    expect(devices[0].manufacturer).toBe('Samsung');
    expect(devices[0].sources).toEqual(['ssdp']);
  });

  it('merges entries from different scanners by IP', () => {
    const registry = new DeviceRegistry();
    registry.ingest([
      {
        ip: '192.168.1.10',
        name: 'ChromecastTV',
        services: [{ protocol: 'mdns', serviceType: '_googlecast._tcp', port: 8009 }],
        openPorts: [8009],
        source: 'mdns',
      },
      {
        ip: '192.168.1.10',
        mac: 'AA:BB:CC:DD:EE:FF',
        services: [],
        openPorts: [],
        source: 'arp',
      },
      {
        ip: '192.168.1.10',
        services: [],
        openPorts: [8008],
        source: 'tcp',
      },
    ]);

    const devices = registry.getDevices();
    expect(devices).toHaveLength(1);

    const d = devices[0];
    expect(d.name).toBe('ChromecastTV');
    expect(d.mac).toBe('AA:BB:CC:DD:EE:FF');
    expect(d.openPorts).toContain(8009);
    expect(d.openPorts).toContain(8008);
    expect(d.sources).toEqual(['mdns', 'arp', 'tcp']);
  });

  it('prefers ARP source for MAC address', () => {
    const registry = new DeviceRegistry();
    registry.ingest([
      {
        ip: '192.168.1.10',
        mac: '11:22:33:44:55:66',
        services: [],
        openPorts: [],
        source: 'mdns',
      },
      {
        ip: '192.168.1.10',
        mac: 'AA:BB:CC:DD:EE:FF',
        services: [],
        openPorts: [],
        source: 'arp',
      },
    ]);

    const devices = registry.getDevices();
    expect(devices[0].mac).toBe('AA:BB:CC:DD:EE:FF');
  });

  it('prefers SSDP manufacturer over mDNS', () => {
    const registry = new DeviceRegistry();
    registry.ingest([
      {
        ip: '192.168.1.10',
        manufacturer: 'mDNS Mfr',
        services: [],
        openPorts: [],
        source: 'mdns',
      },
      {
        ip: '192.168.1.10',
        manufacturer: 'SSDP Mfr',
        services: [],
        openPorts: [],
        source: 'ssdp',
      },
    ]);

    const devices = registry.getDevices();
    expect(devices[0].manufacturer).toBe('SSDP Mfr');
  });

  it('sorts devices by IP address', () => {
    const registry = new DeviceRegistry();
    registry.ingest([
      { ip: '192.168.1.20', services: [], openPorts: [], source: 'mdns' },
      { ip: '192.168.1.5', services: [], openPorts: [], source: 'mdns' },
      { ip: '192.168.1.100', services: [], openPorts: [], source: 'mdns' },
    ]);

    const devices = registry.getDevices();
    expect(devices.map(d => d.ip)).toEqual(['192.168.1.5', '192.168.1.20', '192.168.1.100']);
  });

  it('falls back to OUI lookup for manufacturer', () => {
    const registry = new DeviceRegistry();
    registry.ingest([
      {
        ip: '192.168.1.10',
        mac: '48:A6:B8:00:00:01', // Sonos OUI
        services: [],
        openPorts: [],
        source: 'arp',
      },
    ]);

    const devices = registry.getDevices();
    expect(devices[0].manufacturer).toBe('Sonos');
  });
});
