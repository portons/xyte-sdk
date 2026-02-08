import type { ScanResult, DeviceCategory } from './types';

export function formatScanTable(result: ScanResult): string {
  const lines: string[] = [];

  if (result.devices.length === 0) {
    lines.push('No devices found.');
    lines.push('');
    lines.push(`Scanned ${result.network.localIp} subnet in ${result.summary.durationMs}ms`);
    return lines.join('\n');
  }

  const ipW = Math.max(15, ...result.devices.map(d => d.ip.length));
  const nameW = Math.max(20, ...result.devices.map(d => (d.name ?? '—').length));
  const catW = Math.max(12, ...result.devices.map(d => d.category.length));
  const mfrW = Math.max(12, ...result.devices.map(d => (d.manufacturer ?? '—').length));

  const header = [
    'IP'.padEnd(ipW),
    'Name'.padEnd(nameW),
    'Category'.padEnd(catW),
    'Manufacturer'.padEnd(mfrW),
  ].join('  ');

  lines.push(header);
  lines.push('─'.repeat(header.length));

  for (const d of result.devices) {
    lines.push([
      d.ip.padEnd(ipW),
      (d.name ?? '—').padEnd(nameW),
      d.category.padEnd(catW),
      (d.manufacturer ?? '—').padEnd(mfrW),
    ].join('  '));
  }

  lines.push('');
  lines.push(formatSummaryLine(result));

  return lines.join('\n');
}

export function formatScanAscii(result: ScanResult): string {
  const lines: string[] = [];

  lines.push(`=== Network Discovery Results ===`);
  lines.push(`Network: ${result.network.localIp} (${result.network.interfaceName})`);
  lines.push(`Mode: ${result.mode}`);
  lines.push(`Duration: ${result.summary.durationMs}ms`);
  lines.push('');

  if (result.devices.length === 0) {
    lines.push('No devices found.');
    return lines.join('\n');
  }

  for (const d of result.devices) {
    lines.push(`--- ${d.ip} ---`);
    if (d.name) lines.push(`  Name:         ${d.name}`);
    if (d.hostname) lines.push(`  Hostname:     ${d.hostname}`);
    if (d.mac) lines.push(`  MAC:          ${d.mac}`);
    if (d.manufacturer) lines.push(`  Manufacturer: ${d.manufacturer}`);
    if (d.model) lines.push(`  Model:        ${d.model}`);
    lines.push(`  Category:     ${d.category} (confidence: ${d.confidence})`);
    lines.push(`  Sources:      ${d.sources.join(', ')}`);

    if (d.services.length > 0) {
      lines.push(`  Services:`);
      for (const s of d.services) {
        const portStr = s.port ? `:${s.port}` : '';
        lines.push(`    - ${s.serviceType}${portStr} [${s.protocol}]`);
        if (s.txt && Object.keys(s.txt).length > 0) {
          for (const [k, v] of Object.entries(s.txt)) {
            lines.push(`      ${k}=${v}`);
          }
        }
      }
    }

    if (d.openPorts.length > 0) {
      lines.push(`  Open Ports:   ${d.openPorts.join(', ')}`);
    }
    lines.push('');
  }

  lines.push(formatSummaryLine(result));

  return lines.join('\n');
}

function formatSummaryLine(result: ScanResult): string {
  const { totalDevices, byCategory, durationMs } = result.summary;
  const parts: string[] = [];

  const ordered: DeviceCategory[] = [
    'tv', 'speaker', 'display', 'light', 'camera', 'printer',
    'router', 'media-player', 'iot-hub', 'computer', 'phone',
    'iot-sensor', 'unknown',
  ];

  for (const cat of ordered) {
    const count = byCategory[cat];
    if (count && count > 0) {
      parts.push(`${count} ${cat}${count > 1 ? 's' : ''}`);
    }
  }

  const breakdown = parts.length > 0 ? ` (${parts.join(', ')})` : '';
  return `Found ${totalDevices} device${totalDevices !== 1 ? 's' : ''}${breakdown} in ${(durationMs / 1000).toFixed(1)}s`;
}
