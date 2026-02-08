import { describe, it, expect } from 'vitest';
import { formatScanTable, formatScanAscii } from '../../src/discovery/format';
import type { ScanResult } from '../../src/discovery/types';

function makeScanResult(overrides: Partial<ScanResult> = {}): ScanResult {
  return {
    schemaVersion: 'xyte.discovery.scan.v1',
    mode: 'quick',
    network: { interfaceName: 'en0', localIp: '192.168.1.100' },
    summary: {
      totalDevices: 0,
      byCategory: {},
      scannersUsed: ['mdns', 'ssdp'],
      scannerStatuses: [],
      durationMs: 4200,
    },
    devices: [],
    ...overrides,
  };
}

describe('formatScanTable', () => {
  it('outputs "No devices found" for empty result', () => {
    const output = formatScanTable(makeScanResult());
    expect(output).toContain('No devices found');
  });

  it('renders table rows for devices', () => {
    const result = makeScanResult({
      summary: {
        totalDevices: 2,
        byCategory: { tv: 1, speaker: 1 },
        scannersUsed: ['mdns', 'ssdp'],
        scannerStatuses: [],
        durationMs: 4200,
      },
      devices: [
        {
          ip: '192.168.1.10',
          name: 'Living Room TV',
          category: 'tv',
          confidence: 0.8,
          manufacturer: 'Samsung',
          services: [],
          openPorts: [],
          sources: ['ssdp'],
        },
        {
          ip: '192.168.1.15',
          name: 'Kitchen Speaker',
          category: 'speaker',
          confidence: 0.9,
          manufacturer: 'Sonos',
          services: [],
          openPorts: [],
          sources: ['mdns'],
        },
      ],
    });

    const output = formatScanTable(result);
    expect(output).toContain('192.168.1.10');
    expect(output).toContain('Living Room TV');
    expect(output).toContain('Samsung');
    expect(output).toContain('Kitchen Speaker');
    expect(output).toContain('Found 2 devices');
    expect(output).toContain('1 tv');
    expect(output).toContain('1 speaker');
  });
});

describe('formatScanAscii', () => {
  it('includes verbose device details', () => {
    const result = makeScanResult({
      summary: {
        totalDevices: 1,
        byCategory: { printer: 1 },
        scannersUsed: ['mdns'],
        scannerStatuses: [],
        durationMs: 3100,
      },
      devices: [
        {
          ip: '192.168.1.20',
          name: 'Office Printer',
          hostname: 'printer.local',
          mac: 'AA:BB:CC:DD:EE:FF',
          manufacturer: 'HP',
          model: 'LaserJet Pro',
          category: 'printer',
          confidence: 0.95,
          services: [{ protocol: 'mdns', serviceType: '_ipp._tcp', port: 631 }],
          openPorts: [631, 9100],
          sources: ['mdns', 'tcp'],
        },
      ],
    });

    const output = formatScanAscii(result);
    expect(output).toContain('192.168.1.20');
    expect(output).toContain('Office Printer');
    expect(output).toContain('printer.local');
    expect(output).toContain('AA:BB:CC:DD:EE:FF');
    expect(output).toContain('HP');
    expect(output).toContain('LaserJet Pro');
    expect(output).toContain('_ipp._tcp');
    expect(output).toContain('631');
    expect(output).toContain('9100');
    expect(output).toContain('mdns, tcp');
  });
});
