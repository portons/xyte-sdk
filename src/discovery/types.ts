export type ScanMode = 'quick' | 'full';

export type ScanProtocol = 'mdns' | 'ssdp' | 'arp' | 'tcp';

export type DeviceCategory =
  | 'tv'
  | 'speaker'
  | 'display'
  | 'light'
  | 'camera'
  | 'printer'
  | 'router'
  | 'media-player'
  | 'iot-hub'
  | 'computer'
  | 'phone'
  | 'iot-sensor'
  | 'unknown';

export interface ScanOptions {
  mode?: ScanMode;
  timeout?: number;
  protocols?: ScanProtocol[];
  subnet?: string;
  signal?: AbortSignal;
}

export interface DiscoveredService {
  protocol: ScanProtocol;
  serviceType: string;
  port?: number;
  txt?: Record<string, string>;
}

export interface DiscoveredDevice {
  ip: string;
  mac?: string;
  name?: string;
  hostname?: string;
  manufacturer?: string;
  model?: string;
  category: DeviceCategory;
  confidence: number;
  services: DiscoveredService[];
  openPorts: number[];
  sources: ScanProtocol[];
}

export interface ScanSummary {
  totalDevices: number;
  byCategory: Partial<Record<DeviceCategory, number>>;
  scannersUsed: ScanProtocol[];
  scannerStatuses: ScannerStatus[];
  durationMs: number;
}

export interface ScannerStatus {
  protocol: ScanProtocol;
  status: 'ok' | 'error' | 'timeout';
  devicesFound: number;
  error?: string;
}

export interface ScanResult {
  schemaVersion: string;
  mode: ScanMode;
  network: {
    interfaceName: string;
    localIp: string;
    subnet?: string;
  };
  summary: ScanSummary;
  devices: DiscoveredDevice[];
}

export interface RawScanEntry {
  ip: string;
  mac?: string;
  name?: string;
  hostname?: string;
  manufacturer?: string;
  model?: string;
  services: DiscoveredService[];
  openPorts: number[];
  source: ScanProtocol;
}

export interface Scanner {
  protocol: ScanProtocol;
  scan(options: ScanOptions & { localIp: string; subnet?: string; knownIps?: string[] }): Promise<RawScanEntry[]>;
}
