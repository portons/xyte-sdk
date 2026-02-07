import { createWriteStream, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import PDFDocument from 'pdfkit';

import { extractArray } from '../tui/data-loaders';
import type { XyteClient } from '../types/client';
import { INSPECT_DEEP_DIVE_SCHEMA_VERSION, INSPECT_FLEET_SCHEMA_VERSION, REPORT_SCHEMA_VERSION } from '../contracts/versions';
import { withSpan } from '../observability/tracing';

interface StatusCounts {
  [key: string]: number;
}

export interface FleetSnapshot {
  generatedAtUtc: string;
  tenantId: string;
  devices: any[];
  spaces: any[];
  incidents: any[];
  tickets: any[];
}

export interface FleetInspectResult {
  schemaVersion: typeof INSPECT_FLEET_SCHEMA_VERSION;
  generatedAtUtc: string;
  tenantId: string;
  totals: {
    devices: number;
    spaces: number;
    incidents: number;
    tickets: number;
  };
  status: {
    devices: StatusCounts;
    incidents: StatusCounts;
    tickets: StatusCounts;
    spaces: StatusCounts;
  };
  highlights: {
    offlineDevices: number;
    offlinePct: number;
    activeIncidents: number;
    activeIncidentPct: number;
    openTickets: number;
  };
}

export interface DeepDiveResult {
  schemaVersion: typeof INSPECT_DEEP_DIVE_SCHEMA_VERSION;
  generatedAtUtc: string;
  tenantId: string;
  windowHours: number;
  summary: string[];
  topOfflineSpaces: Array<{ space: string; offlineDevices: number; shareOfOfflinePct: number }>;
  topIncidentDevices: Array<{ device: string; incidentCount: number; activeIncidents: number }>;
  activeIncidentAging: Array<{ device: string; space: string; ageHours: number; createdAtUtc: string }>;
  churn24h: {
    incidents: number;
    devices: number;
    spaces: number;
    bySpace: Array<{ space: string; incidents: number }>;
    byDevice: Array<{ device: string; incidents: number }>;
  };
  ticketPosture: {
    openTickets: number;
    overlappingActiveIncidentDevices: number;
    oldestOpenTickets: Array<{ ticketId: string; title: string; ageHours: number; deviceId: string; createdAtUtc: string }>;
  };
  dataQuality: {
    statusMismatches: Array<{ device: string; status: string; stateStatus: string; lastSeen: string; space: string }>;
  };
}

export interface FleetReportResult {
  schemaVersion: typeof REPORT_SCHEMA_VERSION;
  generatedAtUtc: string;
  tenantId: string;
  format: 'markdown' | 'pdf';
  outputPath: string;
  includeSensitive: boolean;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function toCounter(items: string[]): StatusCounts {
  const counter: StatusCounts = {};
  for (const item of items) {
    counter[item] = (counter[item] ?? 0) + 1;
  }
  return counter;
}

function pct(count: number, total: number): number {
  if (!total) {
    return 0;
  }
  return Number(((count * 100) / total).toFixed(1));
}

function parseTimestamp(value: unknown): Date | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }
  const normalized = value.endsWith('Z') ? value : `${value}Z`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed;
}

function ageHours(createdAt: unknown): number {
  const parsed = parseTimestamp(createdAt);
  if (!parsed) {
    return 0;
  }
  const now = Date.now();
  return Math.max(0, Math.round((now - parsed.getTime()) / 3_600_000));
}

function topEntries(counter: Record<string, number>, limit = 10): Array<[string, number]> {
  return Object.entries(counter)
    .sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }
      return a[0].localeCompare(b[0]);
    })
    .slice(0, limit);
}

function identifier(value: unknown): string {
  if (value === undefined || value === null) {
    return 'n/a';
  }
  return String(value);
}

function safeSpacePath(value: any): string {
  return identifier(value?.space_tree_path_name ?? value?.space?.full_path ?? value?.space?.name ?? value?.space_id ?? 'unknown');
}

function safeDeviceName(value: any): string {
  return identifier(value?.device_name ?? value?.name ?? value?.device?.name ?? value?.device_id ?? 'unknown');
}

function redactSensitive(value: string, includeSensitive: boolean): string {
  if (includeSensitive || value === 'n/a') {
    return value;
  }
  if (value.length <= 8) {
    return '***';
  }
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

async function loadAllSpaces(client: XyteClient, tenantId: string): Promise<any[]> {
  const perPage = 100;
  const all: any[] = [];

  for (let page = 1; page <= 50; page += 1) {
    const raw = await client.organization.getSpaces({
      tenantId,
      query: { page, per_page: perPage }
    });
    const pageItems = extractArray(raw, ['spaces', 'data', 'items']);
    if (!pageItems.length) {
      break;
    }
    all.push(...pageItems);
    if (pageItems.length < perPage) {
      break;
    }
  }

  if (all.length > 0) {
    return all;
  }

  const single = await client.organization.getSpaces({ tenantId });
  return extractArray(single, ['spaces', 'data', 'items']);
}

export async function collectFleetSnapshot(client: XyteClient, tenantId: string): Promise<FleetSnapshot> {
  return withSpan('xyte.inspect.collect_snapshot', { 'xyte.tenant.id': tenantId }, async () => {
    const [devicesRaw, spaces, incidentsRaw, orgTicketsRaw, partnerTicketsRaw] = await Promise.all([
      client.organization.getDevices({ tenantId }).catch(() => client.partner.getDevices({ tenantId })),
      loadAllSpaces(client, tenantId),
      client.organization.getIncidents({ tenantId }),
      client.organization.getTickets({ tenantId }).catch(() => ({ items: [] })),
      client.partner.getTickets({ tenantId }).catch(() => ({ items: [] }))
    ]);

    const devices = extractArray(devicesRaw, ['devices', 'data', 'items']);
    const incidents = extractArray(incidentsRaw, ['incidents', 'data', 'items']);
    const orgTickets = extractArray(orgTicketsRaw, ['tickets', 'data', 'items']);
    const partnerTickets = extractArray(partnerTicketsRaw, ['tickets', 'data', 'items']);
    const tickets = [...orgTickets, ...partnerTickets];

    const stableSort = (items: any[]) =>
      items.slice().sort((a, b) => identifier(a?.id ?? a?.name ?? a?.title).localeCompare(identifier(b?.id ?? b?.name ?? b?.title)));

    return {
      generatedAtUtc: new Date().toISOString(),
      tenantId,
      devices: stableSort(devices),
      spaces: stableSort(spaces),
      incidents: stableSort(incidents),
      tickets: stableSort(tickets)
    };
  });
}

export function buildFleetInspect(snapshot: FleetSnapshot): FleetInspectResult {
  const deviceStatus = toCounter(snapshot.devices.map((item) => identifier(item?.status ?? 'unknown')));
  const incidentStatus = toCounter(snapshot.incidents.map((item) => identifier(item?.status ?? 'unknown')));
  const ticketStatus = toCounter(snapshot.tickets.map((item) => identifier(item?.status ?? 'unknown')));
  const spaceTypes = toCounter(snapshot.spaces.map((item) => identifier(item?.space_type ?? 'unknown')));

  const offlineDevices = deviceStatus.offline ?? 0;
  const activeIncidents = incidentStatus.active ?? 0;
  const openTickets = ticketStatus.open ?? 0;

  return {
    schemaVersion: INSPECT_FLEET_SCHEMA_VERSION,
    generatedAtUtc: snapshot.generatedAtUtc,
    tenantId: snapshot.tenantId,
    totals: {
      devices: snapshot.devices.length,
      spaces: snapshot.spaces.length,
      incidents: snapshot.incidents.length,
      tickets: snapshot.tickets.length
    },
    status: {
      devices: deviceStatus,
      incidents: incidentStatus,
      tickets: ticketStatus,
      spaces: spaceTypes
    },
    highlights: {
      offlineDevices,
      offlinePct: pct(offlineDevices, snapshot.devices.length),
      activeIncidents,
      activeIncidentPct: pct(activeIncidents, snapshot.incidents.length),
      openTickets
    }
  };
}

function asciiBar(label: string, count: number, total: number, width = 30): string {
  const share = total > 0 ? count / total : 0;
  const filled = Math.min(width, Math.max(0, Math.round(share * width)));
  const bar = `${'#'.repeat(filled)}${' '.repeat(width - filled)}`;
  return `${label.padEnd(12)} ${String(count).padStart(4)} |${bar}| ${String((share * 100).toFixed(1)).padStart(5)}%`;
}

export function formatFleetInspectAscii(result: FleetInspectResult): string {
  return [
    `Fleet Inspect Snapshot (${result.tenantId})`,
    `Generated: ${result.generatedAtUtc}`,
    '',
    'DEVICES',
    asciiBar('offline', result.status.devices.offline ?? 0, result.totals.devices),
    asciiBar('online', result.status.devices.online ?? 0, result.totals.devices),
    asciiBar('other', result.totals.devices - (result.status.devices.offline ?? 0) - (result.status.devices.online ?? 0), result.totals.devices),
    '',
    'INCIDENTS',
    asciiBar('active', result.status.incidents.active ?? 0, result.totals.incidents),
    asciiBar('closed', result.status.incidents.closed ?? 0, result.totals.incidents),
    '',
    'TICKETS',
    asciiBar('open', result.status.tickets.open ?? 0, Math.max(1, result.totals.tickets)),
    '',
    `Highlights: offline=${result.highlights.offlinePct}% active_incidents=${result.highlights.activeIncidentPct}% open_tickets=${result.highlights.openTickets}`
  ].join('\n');
}

export function buildDeepDive(snapshot: FleetSnapshot, windowHours = 24): DeepDiveResult {
  const offlineDevices = snapshot.devices.filter((item) => identifier(item?.status) === 'offline');
  const activeIncidents = snapshot.incidents.filter((item) => identifier(item?.status) === 'active');
  const openTickets = snapshot.tickets.filter((item) => identifier(item?.status) === 'open');

  const offlineBySpace = toCounter(offlineDevices.map((item) => safeSpacePath(item)));
  const incidentsByDevice = toCounter(snapshot.incidents.map((item) => safeDeviceName(item)));
  const activeByDevice = toCounter(activeIncidents.map((item) => safeDeviceName(item)));

  const recentIncidents = snapshot.incidents.filter((item) => ageHours(item?.created_at) <= windowHours);
  const recentSpace = toCounter(recentIncidents.map((item) => safeSpacePath(item)));
  const recentDevice = toCounter(recentIncidents.map((item) => safeDeviceName(item)));

  const activeDeviceIds = new Set(activeIncidents.map((item) => identifier(item?.device_id ?? item?.device?.id)));
  const overlapDevices = new Set(openTickets.map((item) => identifier(item?.device_id)).filter((id) => activeDeviceIds.has(id)));

  const mismatches = snapshot.devices
    .map((item) => {
      const nestedState = asRecord(item?.state).status;
      if (nestedState === undefined) {
        return undefined;
      }
      const topLevel = identifier(item?.status);
      const nested = identifier(nestedState);
      if (topLevel === nested) {
        return undefined;
      }
      return {
        device: safeDeviceName(item),
        status: topLevel,
        stateStatus: nested,
        lastSeen: identifier(item?.last_seen_at),
        space: safeSpacePath(item)
      };
    })
    .filter((item): item is { device: string; status: string; stateStatus: string; lastSeen: string; space: string } => Boolean(item))
    .sort((a, b) => a.device.localeCompare(b.device));

  const topOfflineSpaces = topEntries(offlineBySpace, 10).map(([space, count]) => ({
    space,
    offlineDevices: count,
    shareOfOfflinePct: pct(count, offlineDevices.length)
  }));

  const topIncidentDevices = topEntries(incidentsByDevice, 10).map(([device, count]) => ({
    device,
    incidentCount: count,
    activeIncidents: activeByDevice[device] ?? 0
  }));

  const activeIncidentAging = activeIncidents
    .map((item) => ({
      device: safeDeviceName(item),
      space: safeSpacePath(item),
      ageHours: ageHours(item?.created_at),
      createdAtUtc: identifier(item?.created_at)
    }))
    .sort((a, b) => b.ageHours - a.ageHours)
    .slice(0, 20);

  const oldestOpenTickets = openTickets
    .map((item) => ({
      ticketId: identifier(item?.id),
      title: identifier(item?.title ?? item?.subject),
      ageHours: ageHours(item?.created_at),
      deviceId: identifier(item?.device_id),
      createdAtUtc: identifier(item?.created_at)
    }))
    .sort((a, b) => b.ageHours - a.ageHours)
    .slice(0, 20);

  const summary = [
    `Devices: ${snapshot.devices.length} total, ${offlineDevices.length} offline (${pct(offlineDevices.length, snapshot.devices.length)}%).`,
    `Incidents: ${snapshot.incidents.length} total, ${activeIncidents.length} active (${pct(activeIncidents.length, snapshot.incidents.length)}%).`,
    `Tickets: ${snapshot.tickets.length} total, ${openTickets.length} open.`,
    `24h churn: ${recentIncidents.length} incidents across ${Object.keys(recentDevice).length} devices and ${Object.keys(recentSpace).length} spaces.`,
    `Data quality: ${mismatches.length} status mismatches detected.`
  ];

  return {
    schemaVersion: INSPECT_DEEP_DIVE_SCHEMA_VERSION,
    generatedAtUtc: snapshot.generatedAtUtc,
    tenantId: snapshot.tenantId,
    windowHours,
    summary,
    topOfflineSpaces,
    topIncidentDevices,
    activeIncidentAging,
    churn24h: {
      incidents: recentIncidents.length,
      devices: Object.keys(recentDevice).length,
      spaces: Object.keys(recentSpace).length,
      bySpace: topEntries(recentSpace, 10).map(([space, incidents]) => ({ space, incidents })),
      byDevice: topEntries(recentDevice, 10).map(([device, incidents]) => ({ device, incidents }))
    },
    ticketPosture: {
      openTickets: openTickets.length,
      overlappingActiveIncidentDevices: overlapDevices.size,
      oldestOpenTickets
    },
    dataQuality: {
      statusMismatches: mismatches
    }
  };
}

export function formatDeepDiveAscii(result: DeepDiveResult): string {
  const lines: string[] = [];
  lines.push(`Deep Dive (${result.tenantId})`);
  lines.push(`Generated: ${result.generatedAtUtc}`);
  lines.push('');
  lines.push('SUMMARY');
  result.summary.forEach((line) => lines.push(`- ${line}`));
  lines.push('');
  lines.push('TOP OFFLINE SPACES');
  result.topOfflineSpaces.forEach((row) => lines.push(`${row.space} | offline=${row.offlineDevices} | share=${row.shareOfOfflinePct}%`));
  lines.push('');
  lines.push('TOP INCIDENT DEVICES');
  result.topIncidentDevices.forEach((row) =>
    lines.push(`${row.device} | incidents=${row.incidentCount} | active=${row.activeIncidents}`)
  );
  lines.push('');
  lines.push(`24H CHURN: incidents=${result.churn24h.incidents} devices=${result.churn24h.devices} spaces=${result.churn24h.spaces}`);
  result.churn24h.bySpace.forEach((row) => lines.push(`space: ${row.space} -> ${row.incidents}`));
  lines.push('');
  lines.push(`OPEN TICKETS: ${result.ticketPosture.openTickets}`);
  lines.push(`OVERLAP DEVICES: ${result.ticketPosture.overlappingActiveIncidentDevices}`);
  return lines.join('\n');
}

export function formatDeepDiveMarkdown(result: DeepDiveResult, includeSensitive = false): string {
  const markdown: string[] = [];
  markdown.push('# Xyte Fleet Deep Dive');
  markdown.push('');
  markdown.push(`- Tenant: \`${result.tenantId}\``);
  markdown.push(`- Generated: \`${result.generatedAtUtc}\``);
  markdown.push(`- Window: \`${result.windowHours}h\``);
  markdown.push('');
  markdown.push('## Summary');
  markdown.push('');
  result.summary.forEach((line) => markdown.push(`- ${line}`));
  markdown.push('');
  markdown.push('## Top Offline Spaces');
  markdown.push('');
  markdown.push('| Space | Offline Devices | Share |');
  markdown.push('| --- | ---: | ---: |');
  result.topOfflineSpaces.forEach((row) => markdown.push(`| ${row.space} | ${row.offlineDevices} | ${row.shareOfOfflinePct}% |`));
  markdown.push('');
  markdown.push('## Top Devices by Incident Volume');
  markdown.push('');
  markdown.push('| Device | Incidents | Active |');
  markdown.push('| --- | ---: | ---: |');
  result.topIncidentDevices.forEach((row) => markdown.push(`| ${row.device} | ${row.incidentCount} | ${row.activeIncidents} |`));
  markdown.push('');
  markdown.push('## 24-Hour Churn');
  markdown.push('');
  markdown.push(
    `Incidents: **${result.churn24h.incidents}**, devices: **${result.churn24h.devices}**, spaces: **${result.churn24h.spaces}**.`
  );
  markdown.push('');
  markdown.push('| Space | Incidents |');
  markdown.push('| --- | ---: |');
  result.churn24h.bySpace.forEach((row) => markdown.push(`| ${row.space} | ${row.incidents} |`));
  markdown.push('');
  markdown.push('| Device | Incidents |');
  markdown.push('| --- | ---: |');
  result.churn24h.byDevice.forEach((row) => markdown.push(`| ${row.device} | ${row.incidents} |`));
  markdown.push('');
  markdown.push('## Ticket Posture');
  markdown.push('');
  markdown.push(`- Open tickets: **${result.ticketPosture.openTickets}**`);
  markdown.push(`- Overlapping active-incident devices: **${result.ticketPosture.overlappingActiveIncidentDevices}**`);
  markdown.push('');
  markdown.push('| Ticket ID | Title | Age (h) | Device ID | Created At |');
  markdown.push('| --- | --- | ---: | --- | --- |');
  result.ticketPosture.oldestOpenTickets.slice(0, 10).forEach((row) => {
    markdown.push(
      `| ${redactSensitive(row.ticketId, includeSensitive)} | ${row.title} | ${row.ageHours} | ${redactSensitive(
        row.deviceId,
        includeSensitive
      )} | ${row.createdAtUtc} |`
    );
  });
  markdown.push('');
  markdown.push('## Data Quality');
  markdown.push('');
  if (!result.dataQuality.statusMismatches.length) {
    markdown.push('No status mismatches detected.');
  } else {
    markdown.push('| Device | Status | state.status | Last Seen | Space |');
    markdown.push('| --- | --- | --- | --- | --- |');
    result.dataQuality.statusMismatches.forEach((row) =>
      markdown.push(`| ${row.device} | ${row.status} | ${row.stateStatus} | ${row.lastSeen} | ${row.space} |`)
    );
  }

  return markdown.join('\n');
}

function ensureDir(filePath: string): void {
  mkdirSync(dirname(resolve(filePath)), { recursive: true });
}

function ensurePageSpace(doc: PDFKit.PDFDocument, minHeight: number): boolean {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + minHeight <= bottom) {
    return false;
  }
  doc.addPage();
  return true;
}

function resolveLogoPath(): string | undefined {
  const candidates = [
    resolve(process.cwd(), 'assets/xyte-logo.png'),
    resolve(__dirname, '../../assets/xyte-logo.png'),
    resolve(__dirname, '../../../assets/xyte-logo.png')
  ];
  return candidates.find((candidate) => existsSync(candidate));
}

function drawPdfHeader(doc: PDFKit.PDFDocument, args: { tenantId: string; generatedAtUtc: string; logoPath?: string }): void {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const bandTop = 22;
  const bandHeight = 64;

  doc.save();
  doc.roundedRect(left, bandTop, right - left, bandHeight, 8).fillAndStroke('#EEF5FF', '#CBDCF6');
  doc.restore();

  if (args.logoPath) {
    try {
      doc.image(args.logoPath, left + 12, bandTop + 14, { fit: [110, 34] });
    } catch {
      doc.font('Helvetica-Bold').fontSize(28).fillColor('#1459A6').text('XYTE', left + 14, bandTop + 16);
    }
  } else {
    doc.font('Helvetica-Bold').fontSize(28).fillColor('#1459A6').text('XYTE', left + 14, bandTop + 16);
  }

  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .fillColor('#1A2332')
    .text('Fleet Findings Report', left + 150, bandTop + 14, { width: right - left - 160, align: 'left' });
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#415067')
    .text(`Tenant: ${args.tenantId}`, left + 150, bandTop + 36, { width: right - left - 160, align: 'left' })
    .text(`Generated: ${args.generatedAtUtc}`, left + 150, bandTop + 50, { width: right - left - 160, align: 'left' });

  doc.y = bandTop + bandHeight + 18;
}

function drawSectionTitle(doc: PDFKit.PDFDocument, title: string): void {
  ensurePageSpace(doc, 40);
  doc.moveDown(0.35);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#1F2937').text(title);
  doc.moveDown(0.15);
}

function drawKpiGrid(
  doc: PDFKit.PDFDocument,
  cards: Array<{ label: string; value: string; tone?: 'normal' | 'warn' | 'bad' }>
): void {
  ensurePageSpace(doc, 100);
  const startX = doc.page.margins.left;
  const topY = doc.y;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const gap = 12;
  const cardWidth = Math.floor((width - gap * 3) / 4);
  const cardHeight = 74;

  cards.slice(0, 4).forEach((card, index) => {
    const x = startX + index * (cardWidth + gap);
    const tone =
      card.tone === 'bad' ? { bg: '#FDECEC', border: '#F8C9C9', value: '#A42F2F' } : card.tone === 'warn'
      ? { bg: '#FFF5E6', border: '#F6D9A8', value: '#9A5B00' }
      : { bg: '#EEF6FF', border: '#CFE3FF', value: '#1459A6' };

    doc.save();
    doc.roundedRect(x, topY, cardWidth, cardHeight, 6).fillAndStroke(tone.bg, tone.border);
    doc.restore();
    doc.font('Helvetica').fontSize(10).fillColor('#4B5563').text(card.label, x + 10, topY + 14, {
      width: cardWidth - 20
    });
    doc.font('Helvetica-Bold').fontSize(22).fillColor(tone.value).text(card.value, x + 10, topY + 34, {
      width: cardWidth - 20
    });
  });

  doc.y = topY + cardHeight + 8;
}

function drawBullets(doc: PDFKit.PDFDocument, lines: string[]): void {
  lines.forEach((line) => {
    ensurePageSpace(doc, 20);
    doc.font('Helvetica').fontSize(11).fillColor('#1F2937').text(`- ${line}`, {
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right
    });
  });
}

function drawTable(
  doc: PDFKit.PDFDocument,
  args: {
    title: string;
    headers: string[];
    rows: string[][];
    columnWidths?: number[];
  }
): void {
  drawSectionTitle(doc, args.title);
  const left = doc.page.margins.left;
  const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const defaultWidth = Math.floor(tableWidth / args.headers.length);
  const widths = args.columnWidths ?? args.headers.map(() => defaultWidth);
  const rowHeight = 20;

  const drawHeader = () => {
    ensurePageSpace(doc, rowHeight + 10);
    const y = doc.y;
    let x = left;
    args.headers.forEach((header, index) => {
      const width = widths[index] ?? defaultWidth;
      doc.save();
      doc.rect(x, y, width, rowHeight).fillAndStroke('#E8EDF3', '#CBD5E1');
      doc.restore();
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#1F2937').text(header, x + 6, y + 6, {
        width: width - 12,
        ellipsis: true
      });
      x += width;
    });
    doc.y = y + rowHeight;
  };

  drawHeader();
  args.rows.forEach((row) => {
    if (ensurePageSpace(doc, rowHeight + 2)) {
      drawHeader();
    }
    const y = doc.y;
    let x = left;
    row.forEach((cell, index) => {
      const width = widths[index] ?? defaultWidth;
      doc.save();
      doc.rect(x, y, width, rowHeight).fillAndStroke('#FFFFFF', '#E5E7EB');
      doc.restore();
      doc.font('Helvetica').fontSize(10).fillColor('#111827').text(cell, x + 6, y + 6, {
        width: width - 12,
        ellipsis: true
      });
      x += width;
    });
    doc.y = y + rowHeight;
  });
}

function renderBrandedPdfReport(deepDive: DeepDiveResult, outputPath: string, includeSensitive: boolean): Promise<void> {
  return new Promise((resolvePromise, rejectPromise) => {
    ensureDir(outputPath);
    const doc = new PDFDocument({
      size: 'LETTER',
      margin: 50
    });
    const stream = doc.pipe(createWriteStream(outputPath));
    const logoPath = resolveLogoPath();

    stream.on('finish', () => resolvePromise());
    stream.on('error', (error) => rejectPromise(error));

    drawPdfHeader(doc, {
      tenantId: deepDive.tenantId,
      generatedAtUtc: deepDive.generatedAtUtc,
      logoPath
    });

    drawKpiGrid(doc, [
      { label: 'Active incidents', value: String(deepDive.activeIncidentAging.length), tone: deepDive.activeIncidentAging.length > 0 ? 'warn' : 'normal' },
      { label: `${deepDive.windowHours}h churn`, value: String(deepDive.churn24h.incidents), tone: deepDive.churn24h.incidents > 0 ? 'warn' : 'normal' },
      { label: 'Open tickets', value: String(deepDive.ticketPosture.openTickets), tone: deepDive.ticketPosture.openTickets > 0 ? 'warn' : 'normal' },
      {
        label: 'Data mismatches',
        value: String(deepDive.dataQuality.statusMismatches.length),
        tone: deepDive.dataQuality.statusMismatches.length > 0 ? 'bad' : 'normal'
      }
    ]);

    drawSectionTitle(doc, 'Executive Summary');
    drawBullets(doc, deepDive.summary);

    drawTable(doc, {
      title: 'Top Spaces by Offline Devices',
      headers: ['Space', 'Offline', 'Share'],
      columnWidths: [320, 90, 90],
      rows: deepDive.topOfflineSpaces.map((row) => [row.space, String(row.offlineDevices), `${row.shareOfOfflinePct}%`])
    });

    drawTable(doc, {
      title: 'Top Devices by Incident Volume',
      headers: ['Device', 'Incidents', 'Active'],
      columnWidths: [320, 90, 90],
      rows: deepDive.topIncidentDevices.map((row) => [row.device, String(row.incidentCount), String(row.activeIncidents)])
    });

    drawTable(doc, {
      title: 'Active Incident Aging',
      headers: ['Device', 'Space', 'Age (h)', 'Created At (UTC)'],
      columnWidths: [130, 220, 70, 80],
      rows: deepDive.activeIncidentAging.slice(0, 12).map((row) => [row.device, row.space, String(row.ageHours), row.createdAtUtc])
    });

    drawTable(doc, {
      title: `${deepDive.windowHours}-Hour Churn by Space`,
      headers: ['Space', 'Incidents'],
      columnWidths: [410, 90],
      rows: deepDive.churn24h.bySpace.map((row) => [row.space, String(row.incidents)])
    });

    drawTable(doc, {
      title: 'Oldest Open Tickets',
      headers: ['Ticket', 'Title', 'Age (h)', 'Device', 'Created At'],
      columnWidths: [80, 200, 60, 90, 70],
      rows: deepDive.ticketPosture.oldestOpenTickets.slice(0, 10).map((row) => [
        redactSensitive(row.ticketId, includeSensitive),
        row.title,
        String(row.ageHours),
        redactSensitive(row.deviceId, includeSensitive),
        row.createdAtUtc
      ])
    });

    if (deepDive.dataQuality.statusMismatches.length) {
      drawTable(doc, {
        title: 'Data Quality: Status Mismatches',
        headers: ['Device', 'status', 'state.status', 'Last Seen', 'Space'],
        columnWidths: [120, 70, 90, 110, 120],
        rows: deepDive.dataQuality.statusMismatches.map((row) => [row.device, row.status, row.stateStatus, row.lastSeen, row.space])
      });
    }

    doc.end();
  });
}

export async function generateFleetReport(args: {
  deepDive: DeepDiveResult;
  format: 'markdown' | 'pdf';
  outPath: string;
  includeSensitive: boolean;
}): Promise<FleetReportResult> {
  const markdown = formatDeepDiveMarkdown(args.deepDive, args.includeSensitive);
  ensureDir(args.outPath);

  if (args.format === 'markdown') {
    writeFileSync(args.outPath, markdown, 'utf8');
  } else {
    await renderBrandedPdfReport(args.deepDive, args.outPath, args.includeSensitive);
  }

  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    generatedAtUtc: new Date().toISOString(),
    tenantId: args.deepDive.tenantId,
    format: args.format,
    outputPath: resolve(args.outPath),
    includeSensitive: args.includeSensitive
  };
}
