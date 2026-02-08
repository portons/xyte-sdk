import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/discovery/mdns-scanner', () => ({
  createMdnsScanner: () => ({
    protocol: 'mdns' as const,
    scan: vi.fn().mockResolvedValue([
      {
        ip: '192.168.1.10',
        name: 'Test Chromecast',
        services: [{ protocol: 'mdns', serviceType: '_googlecast._tcp', port: 8009 }],
        openPorts: [8009],
        source: 'mdns',
      },
    ]),
  }),
}));

vi.mock('../../src/discovery/ssdp-scanner', () => ({
  createSsdpScanner: () => ({
    protocol: 'ssdp' as const,
    scan: vi.fn().mockResolvedValue([
      {
        ip: '192.168.1.20',
        name: 'Samsung TV',
        manufacturer: 'Samsung',
        services: [{ protocol: 'ssdp', serviceType: 'urn:dial-multiscreen-org:service:dial:1' }],
        openPorts: [],
        source: 'ssdp',
      },
    ]),
  }),
}));

vi.mock('../../src/discovery/arp-scanner', () => ({
  createArpScanner: () => ({
    protocol: 'arp' as const,
    scan: vi.fn().mockResolvedValue([
      {
        ip: '192.168.1.10',
        mac: 'AA:BB:CC:DD:EE:FF',
        services: [],
        openPorts: [],
        source: 'arp',
      },
    ]),
  }),
}));

vi.mock('../../src/discovery/port-scanner', () => ({
  createPortScanner: () => ({
    protocol: 'tcp' as const,
    scan: vi.fn().mockResolvedValue([]),
  }),
}));

vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return {
    ...actual,
    networkInterfaces: () => ({
      en0: [
        {
          address: '192.168.1.100',
          netmask: '255.255.255.0',
          family: 'IPv4',
          internal: false,
        },
      ],
    }),
  };
});

import { runDiscoveryScan } from '../../src/discovery/manager';

describe('runDiscoveryScan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns scan result with schema version', async () => {
    const result = await runDiscoveryScan({ mode: 'quick', timeout: 3000 });
    expect(result.schemaVersion).toBe('xyte.discovery.scan.v1');
    expect(result.mode).toBe('quick');
  });

  it('detects local network', async () => {
    const result = await runDiscoveryScan({ mode: 'quick', timeout: 3000 });
    expect(result.network.localIp).toBe('192.168.1.100');
    expect(result.network.interfaceName).toBe('en0');
  });

  it('merges results from multiple scanners', async () => {
    const result = await runDiscoveryScan({ mode: 'quick', timeout: 3000 });
    expect(result.devices.length).toBeGreaterThanOrEqual(2);
    expect(result.devices.find(d => d.ip === '192.168.1.10')).toBeDefined();
    expect(result.devices.find(d => d.ip === '192.168.1.20')).toBeDefined();
  });

  it('quick mode uses mdns and ssdp', async () => {
    const result = await runDiscoveryScan({ mode: 'quick', timeout: 3000 });
    expect(result.summary.scannersUsed).toEqual(['mdns', 'ssdp']);
  });

  it('full mode uses all four protocols', async () => {
    const result = await runDiscoveryScan({ mode: 'full', timeout: 3000 });
    expect(result.summary.scannersUsed).toContain('mdns');
    expect(result.summary.scannersUsed).toContain('ssdp');
    expect(result.summary.scannersUsed).toContain('arp');
    expect(result.summary.scannersUsed).toContain('tcp');
  });

  it('classifies devices', async () => {
    const result = await runDiscoveryScan({ mode: 'quick', timeout: 3000 });
    const chromecast = result.devices.find(d => d.ip === '192.168.1.10');
    expect(chromecast?.category).toBe('media-player');
  });

  it('includes summary with device counts', async () => {
    const result = await runDiscoveryScan({ mode: 'quick', timeout: 3000 });
    expect(result.summary.totalDevices).toBeGreaterThanOrEqual(2);
    expect(result.summary.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('supports protocol override', async () => {
    const result = await runDiscoveryScan({ protocols: ['mdns'], timeout: 3000 });
    expect(result.summary.scannersUsed).toEqual(['mdns']);
  });
});
