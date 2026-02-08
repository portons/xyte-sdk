import { describe, it, expect } from 'vitest';
import { classifyDevice } from '../../src/discovery/classifier';
import type { DiscoveredDevice } from '../../src/discovery/types';

function makeDevice(overrides: Partial<DiscoveredDevice> = {}): DiscoveredDevice {
  return {
    ip: '192.168.1.100',
    category: 'unknown',
    confidence: 0,
    services: [],
    openPorts: [],
    sources: [],
    ...overrides,
  };
}

describe('classifyDevice', () => {
  it('classifies googlecast service as media-player', () => {
    const device = makeDevice({
      services: [{ protocol: 'mdns', serviceType: '_googlecast._tcp', port: 8009 }],
    });
    const result = classifyDevice(device);
    expect(result.category).toBe('media-player');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('classifies sonos service as speaker', () => {
    const device = makeDevice({
      services: [{ protocol: 'mdns', serviceType: '_sonos._tcp', port: 1400 }],
    });
    expect(classifyDevice(device).category).toBe('speaker');
  });

  it('classifies hue service as light', () => {
    const device = makeDevice({
      services: [{ protocol: 'mdns', serviceType: '_hue._tcp', port: 443 }],
    });
    expect(classifyDevice(device).category).toBe('light');
  });

  it('classifies ipp service as printer', () => {
    const device = makeDevice({
      services: [{ protocol: 'mdns', serviceType: '_ipp._tcp', port: 631 }],
    });
    expect(classifyDevice(device).category).toBe('printer');
  });

  it('classifies by manufacturer (Sonos = speaker)', () => {
    const device = makeDevice({ manufacturer: 'Sonos, Inc.' });
    expect(classifyDevice(device).category).toBe('speaker');
  });

  it('classifies by manufacturer (Epson = printer)', () => {
    const device = makeDevice({ manufacturer: 'Epson' });
    expect(classifyDevice(device).category).toBe('printer');
  });

  it('classifies by open port 554 as camera', () => {
    const device = makeDevice({ openPorts: [554] });
    expect(classifyDevice(device).category).toBe('camera');
  });

  it('classifies by hostname containing roku as media-player', () => {
    const device = makeDevice({ hostname: 'roku-living-room.local' });
    expect(classifyDevice(device).category).toBe('media-player');
  });

  it('returns unknown for empty device', () => {
    const device = makeDevice();
    const result = classifyDevice(device);
    expect(result.category).toBe('unknown');
    expect(result.confidence).toBe(0);
  });

  it('service signal beats port signal when conflicting', () => {
    const device = makeDevice({
      services: [{ protocol: 'mdns', serviceType: '_sonos._tcp', port: 1400 }],
      openPorts: [631], // printer port
    });
    expect(classifyDevice(device).category).toBe('speaker');
  });
});
