import type { DeviceCategory, DiscoveredDevice } from './types';

interface ClassificationRule {
  category: DeviceCategory;
  weight: number;
  match: (device: DiscoveredDevice) => boolean;
}

const SERVICE_RULES: ClassificationRule[] = [
  // Media players / casting
  { category: 'media-player', weight: 3, match: d => d.services.some(s => s.serviceType.includes('_googlecast._tcp')) },
  { category: 'media-player', weight: 3, match: d => d.services.some(s => s.serviceType.includes('_spotify-connect._tcp')) },
  { category: 'media-player', weight: 3, match: d => d.services.some(s => s.serviceType.includes('_airplay._tcp')) },
  { category: 'media-player', weight: 2, match: d => d.services.some(s => s.serviceType.includes('_raop._tcp')) },

  // Speakers
  { category: 'speaker', weight: 3, match: d => d.services.some(s => s.serviceType.includes('_sonos._tcp')) },

  // Lights
  { category: 'light', weight: 3, match: d => d.services.some(s => s.serviceType.includes('_hue._tcp')) },

  // IoT hubs
  { category: 'iot-hub', weight: 3, match: d => d.services.some(s => s.serviceType.includes('_hap._tcp')) },
  { category: 'iot-hub', weight: 2, match: d => d.services.some(s => s.serviceType.includes('_matter._tcp')) },
  { category: 'iot-hub', weight: 2, match: d => d.services.some(s => s.serviceType.includes('_matterc._udp')) },

  // Printers
  { category: 'printer', weight: 3, match: d => d.services.some(s => s.serviceType.includes('_ipp._tcp')) },
  { category: 'printer', weight: 3, match: d => d.services.some(s => s.serviceType.includes('_printer._tcp')) },

  // TVs (from SSDP device types)
  { category: 'tv', weight: 3, match: d => d.services.some(s => s.serviceType.includes('MediaRenderer') && s.serviceType.includes('upnp')) },
  { category: 'tv', weight: 3, match: d => d.services.some(s => s.serviceType.includes('dial-multiscreen')) },
];

const MANUFACTURER_RULES: ClassificationRule[] = [
  // Speakers
  { category: 'speaker', weight: 2, match: d => matchManufacturer(d, ['sonos']) },
  { category: 'speaker', weight: 2, match: d => matchManufacturer(d, ['bose']) },
  { category: 'speaker', weight: 2, match: d => matchManufacturer(d, ['harman', 'jbl', 'harman kardon']) },

  // Lights
  { category: 'light', weight: 2, match: d => matchManufacturer(d, ['signify', 'philips lighting', 'philips hue']) },
  { category: 'light', weight: 1, match: d => matchManufacturer(d, ['ikea', 'lifesmart']) },

  // TVs
  { category: 'tv', weight: 2, match: d => matchManufacturer(d, ['samsung']) && hasDisplayHint(d) },
  { category: 'tv', weight: 2, match: d => matchManufacturer(d, ['lg electronics']) && hasDisplayHint(d) },
  { category: 'tv', weight: 2, match: d => matchManufacturer(d, ['sony']) && hasDisplayHint(d) },
  { category: 'tv', weight: 2, match: d => matchManufacturer(d, ['vizio', 'tcl', 'hisense']) },

  // Media players
  { category: 'media-player', weight: 2, match: d => matchManufacturer(d, ['roku']) },
  { category: 'media-player', weight: 2, match: d => matchManufacturer(d, ['apple']) && hasMediaHint(d) },

  // Printers
  { category: 'printer', weight: 2, match: d => matchManufacturer(d, ['hp', 'hewlett']) && hasPrinterHint(d) },
  { category: 'printer', weight: 2, match: d => matchManufacturer(d, ['epson', 'brother', 'canon']) },

  // Cameras
  { category: 'camera', weight: 2, match: d => matchManufacturer(d, ['hikvision', 'dahua', 'axis communications', 'wyze', 'ring']) },

  // Routers / networking
  { category: 'router', weight: 2, match: d => matchManufacturer(d, ['netgear', 'asus', 'linksys', 'd-link', 'ubiquiti', 'aruba', 'ruckus', 'tp-link']) },

  // IoT
  { category: 'iot-hub', weight: 1, match: d => matchManufacturer(d, ['smartthings', 'wink', 'ecobee']) },
  { category: 'iot-sensor', weight: 1, match: d => matchManufacturer(d, ['espressif', 'tuya', 'shelly']) },

  // Computers
  { category: 'computer', weight: 1, match: d => matchManufacturer(d, ['dell', 'lenovo', 'intel', 'microsoft']) },

  // Phones
  { category: 'phone', weight: 1, match: d => matchManufacturer(d, ['xiaomi', 'huawei']) && !hasNetworkHint(d) },
];

const PORT_RULES: ClassificationRule[] = [
  { category: 'camera', weight: 1, match: d => d.openPorts.includes(554) },
  { category: 'printer', weight: 1, match: d => d.openPorts.includes(631) },
  { category: 'printer', weight: 1, match: d => d.openPorts.includes(9100) },
  { category: 'speaker', weight: 1, match: d => d.openPorts.includes(1400) },
  { category: 'media-player', weight: 1, match: d => d.openPorts.includes(7000) },
  { category: 'media-player', weight: 1, match: d => d.openPorts.includes(8008) },
  { category: 'media-player', weight: 1, match: d => d.openPorts.includes(8060) },
  { category: 'iot-sensor', weight: 1, match: d => d.openPorts.includes(1883) },
];

const HOSTNAME_RULES: ClassificationRule[] = [
  { category: 'media-player', weight: 1, match: d => matchHostname(d, ['roku', 'chromecast', 'appletv', 'apple-tv', 'fire-tv', 'firetv']) },
  { category: 'tv', weight: 1, match: d => matchHostname(d, ['-tv', 'smarttv', 'bravia', 'tizen']) },
  { category: 'speaker', weight: 1, match: d => matchHostname(d, ['sonos', 'homepod', 'echo', 'google-home']) },
  { category: 'printer', weight: 1, match: d => matchHostname(d, ['printer', 'laserjet', 'deskjet', 'officejet', 'pixma']) },
  { category: 'camera', weight: 1, match: d => matchHostname(d, ['camera', 'ipcam', 'cam-']) },
  { category: 'router', weight: 1, match: d => matchHostname(d, ['router', 'gateway', 'modem', 'access-point', 'ap-']) },
  { category: 'light', weight: 1, match: d => matchHostname(d, ['hue-', 'philips-hue', 'tradfri', 'lightbulb']) },
  { category: 'phone', weight: 1, match: d => matchHostname(d, ['iphone', 'android', 'galaxy', 'pixel-']) },
  { category: 'computer', weight: 1, match: d => matchHostname(d, ['macbook', 'imac', 'thinkpad', 'desktop', 'laptop']) },
];

const ALL_RULES = [...SERVICE_RULES, ...MANUFACTURER_RULES, ...PORT_RULES, ...HOSTNAME_RULES];

function matchManufacturer(device: DiscoveredDevice, keywords: string[]): boolean {
  const mfr = (device.manufacturer ?? '').toLowerCase();
  return keywords.some(k => mfr.includes(k));
}

function matchHostname(device: DiscoveredDevice, patterns: string[]): boolean {
  const h = (device.hostname ?? '').toLowerCase();
  const n = (device.name ?? '').toLowerCase();
  return patterns.some(p => h.includes(p) || n.includes(p));
}

function hasDisplayHint(device: DiscoveredDevice): boolean {
  const name = (device.name ?? '').toLowerCase();
  const model = (device.model ?? '').toLowerCase();
  const hostname = (device.hostname ?? '').toLowerCase();
  return (
    device.services.some(s =>
      s.serviceType.includes('_googlecast._tcp') ||
      s.serviceType.includes('dial-multiscreen') ||
      s.serviceType.includes('MediaRenderer')
    ) ||
    ['tv', 'television', 'display', 'bravia', 'tizen'].some(k => name.includes(k) || model.includes(k) || hostname.includes(k)) ||
    device.openPorts.includes(8001) ||
    device.openPorts.includes(8443)
  );
}

function hasMediaHint(device: DiscoveredDevice): boolean {
  return device.services.some(s =>
    s.serviceType.includes('_airplay._tcp') ||
    s.serviceType.includes('_raop._tcp')
  );
}

function hasPrinterHint(device: DiscoveredDevice): boolean {
  return (
    device.services.some(s => s.serviceType.includes('_ipp._tcp') || s.serviceType.includes('_printer._tcp')) ||
    device.openPorts.includes(631) ||
    device.openPorts.includes(9100)
  );
}

function hasNetworkHint(device: DiscoveredDevice): boolean {
  return device.services.some(s =>
    s.serviceType.includes('_http._tcp') && s.port === 80
  );
}

export function classifyDevice(device: DiscoveredDevice): { category: DeviceCategory; confidence: number } {
  const scores = new Map<DeviceCategory, number>();

  for (const rule of ALL_RULES) {
    if (rule.match(device)) {
      scores.set(rule.category, (scores.get(rule.category) ?? 0) + rule.weight);
    }
  }

  if (scores.size === 0) {
    return { category: 'unknown', confidence: 0 };
  }

  let bestCategory: DeviceCategory = 'unknown';
  let bestScore = 0;
  let totalScore = 0;

  for (const [cat, score] of scores) {
    totalScore += score;
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat;
    }
  }

  const maxPossible = Math.max(totalScore, 6);
  const confidence = Math.min(bestScore / maxPossible, 1);

  return { category: bestCategory, confidence: Math.round(confidence * 100) / 100 };
}
