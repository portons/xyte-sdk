import type { TuiScreenId } from './types';
import { safePreviewLines } from './serialize';

export type FrameInputState = 'idle' | 'modal' | 'busy';
export type FrameTransitionState = 'idle' | 'switching';
export type FrameRefreshState = 'idle' | 'loading' | 'retrying' | 'error';

export interface HeadlessFrameMeta {
  inputState: FrameInputState;
  queueDepth: number;
  droppedEvents: number;
  transitionState: FrameTransitionState;
  refreshState: FrameRefreshState;
  activePane?: string;
  availablePanes?: string[];
  navigationMode?: 'pane-focus';
  tabId?: TuiScreenId;
  tabOrder?: TuiScreenId[];
  tabNavBoundary?: 'left' | 'right' | null;
  renderSafety?: 'ok' | 'truncated';
  [key: string]: unknown;
}

export interface SceneStat {
  label: string;
  value: string | number;
}

export interface SceneText {
  lines: string[];
}

export interface SceneTable {
  columns: string[];
  rows: Array<Array<string | number>>;
}

export interface ScenePanel {
  id: string;
  title: string;
  kind: 'stats' | 'text' | 'table';
  stats?: SceneStat[];
  text?: SceneText;
  table?: SceneTable;
  status?: string;
}

export interface HeadlessFrame {
  timestamp: string;
  mode: 'headless' | 'interactive';
  screen: TuiScreenId;
  title: string;
  status: string;
  tenantId?: string;
  motionEnabled: boolean;
  motionPhase: number;
  logo: string;
  panels: ScenePanel[];
  meta?: HeadlessFrameMeta;
}

export interface DashboardSceneState {
  tenantId?: string;
  provider?: string;
  model?: string;
  devices: any[];
  incidents: any[];
  tickets: any[];
}

export interface DevicesSceneState {
  tenantId?: string;
  searchText: string;
  selectedIndex: number;
  devices: any[];
}

export interface IncidentsSceneState {
  tenantId?: string;
  severityFilter: string;
  selectedIndex: number;
  incidents: any[];
  triageText?: string;
}

export interface TicketsSceneState {
  tenantId?: string;
  mode: 'organization' | 'partner';
  searchText: string;
  selectedIndex: number;
  tickets: any[];
  detailText?: string;
  draftText?: string;
}

export interface SpacesSceneState {
  tenantId?: string;
  searchText: string;
  selectedIndex: number;
  loading: boolean;
  paneStatus: string;
  spaces: any[];
  spaceDetail?: unknown;
  devicesInSpace: any[];
}

export interface CopilotSceneState {
  tenantId?: string;
  provider?: string;
  model?: string;
  logs: string[];
}

export interface SetupSceneState {
  tenantId?: string;
  readinessState: 'ready' | 'needs_setup' | 'degraded';
  connectionState: string;
  missingItems: string[];
  recommendedActions: string[];
  providerRows: Array<{ provider: string; slotCount: number; activeSlot: string; hasSecret: string }>;
}

export interface ConfigSceneState {
  tenantId?: string;
  tenantRows: Array<{ id: string; name: string; active: string }>;
  slotRows: Array<{ provider: string; slotId: string; name: string; active: string; hasSecret: string; fingerprint: string }>;
  doctorStatus?: string;
}

function sampleRows(items: any[], count = 6): any[] {
  return items.slice(0, count);
}

function safeId(item: any, index: number): string {
  return String(item?.id ?? item?._id ?? item?.uuid ?? item?.device_id ?? `row-${index + 1}`);
}

function safeName(item: any): string {
  return String(item?.name ?? item?.title ?? item?.subject ?? item?.status ?? 'n/a');
}

function safeStatus(item: any): string {
  return String(item?.status ?? item?.state ?? item?.online_status ?? 'unknown');
}

function clampSelection(index: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(index, total - 1));
}

export function sceneFromDashboardState(state: DashboardSceneState): ScenePanel[] {
  return [
    {
      id: 'dashboard-kpis',
      title: 'KPI',
      kind: 'stats',
      stats: [
        { label: 'Tenant', value: state.tenantId ?? 'none' },
        { label: 'Devices', value: state.devices.length },
        { label: 'Open incidents', value: state.incidents.length },
        { label: 'Open tickets', value: state.tickets.length }
      ]
    },
    {
      id: 'dashboard-provider',
      title: 'Provider Status',
      kind: 'text',
      text: {
        lines: [
          `Provider override: ${state.provider ?? 'none'}`,
          `Model override: ${state.model ?? 'none'}`,
          'Copilot outputs are advisory only.'
        ]
      }
    },
    {
      id: 'dashboard-incidents',
      title: 'Recent Incidents',
      kind: 'table',
      table: {
        columns: ['ID', 'Name', 'Status'],
        rows: sampleRows(state.incidents).map((item, index) => [safeId(item, index), safeName(item), safeStatus(item)])
      }
    },
    {
      id: 'dashboard-tickets',
      title: 'Recent Tickets',
      kind: 'table',
      table: {
        columns: ['ID', 'Subject', 'Status'],
        rows: sampleRows(state.tickets).map((item, index) => [safeId(item, index), safeName(item), safeStatus(item)])
      }
    }
  ];
}

export function sceneFromDevicesState(state: DevicesSceneState): ScenePanel[] {
  const selectedIndex = clampSelection(state.selectedIndex, state.devices.length);
  const selected = state.devices[selectedIndex];
  const preview = selected ? safePreviewLines(selected) : undefined;

  return [
    {
      id: 'devices-table',
      title: 'Devices',
      kind: 'table',
      table: {
        columns: ['ID', 'Name', 'Status', 'Space'],
        rows: state.devices.map((item, index) => [
          safeId(item, index),
          safeName(item),
          safeStatus(item),
          String(item?.space_name ?? item?.space_id ?? 'n/a')
        ])
      },
      status: state.searchText ? `filter=${state.searchText}` : 'filter=none'
    },
    {
      id: 'devices-detail',
      title: 'Device Detail',
      kind: 'text',
      text: {
        lines: preview?.lines ?? ['No matching devices.']
      }
    }
  ];
}

export function sceneFromIncidentsState(state: IncidentsSceneState): ScenePanel[] {
  const selectedIndex = clampSelection(state.selectedIndex, state.incidents.length);
  const selected = state.incidents[selectedIndex];
  const preview = selected ? safePreviewLines(selected) : undefined;

  return [
    {
      id: 'incidents-table',
      title: 'Incidents',
      kind: 'table',
      table: {
        columns: ['ID', 'Severity', 'State', 'Device'],
        rows: state.incidents.map((item, index) => [
          safeId(item, index),
          String(item?.severity ?? item?.priority ?? 'unknown'),
          safeStatus(item),
          String(item?.device_id ?? item?.device?.id ?? 'n/a')
        ])
      },
      status: state.severityFilter ? `severity=${state.severityFilter}` : 'severity=all'
    },
    {
      id: 'incidents-detail',
      title: 'Incident Detail',
      kind: 'text',
      text: {
        lines: preview?.lines ?? ['No incidents.']
      }
    },
    {
      id: 'incidents-triage',
      title: 'Triage',
      kind: 'text',
      text: {
        lines: state.triageText ? state.triageText.split('\n') : ['Run triage from interactive mode with key x.']
      }
    }
  ];
}

export function sceneFromTicketsState(state: TicketsSceneState): ScenePanel[] {
  const selectedIndex = clampSelection(state.selectedIndex, state.tickets.length);
  const selected = state.tickets[selectedIndex];
  const preview = selected ? safePreviewLines(selected) : undefined;

  return [
    {
      id: 'tickets-table',
      title: 'Tickets',
      kind: 'table',
      table: {
        columns: ['ID', 'Status', 'Priority', 'Subject'],
        rows: state.tickets.map((item, index) => [
          safeId(item, index),
          safeStatus(item),
          String(item?.priority ?? 'n/a'),
          String(item?.subject ?? item?.title ?? 'n/a')
        ])
      },
      status: `mode=${state.mode}${state.searchText ? ` filter=${state.searchText}` : ''}`
    },
    {
      id: 'tickets-detail',
      title: 'Ticket Detail',
      kind: 'text',
      text: {
        lines: state.detailText
          ? state.detailText.split('\n')
          : preview?.lines ?? ['No tickets.']
      }
    },
    {
      id: 'tickets-draft',
      title: 'Draft Tool',
      kind: 'text',
      text: {
        lines: state.draftText ? state.draftText.split('\n') : ['Run draft from interactive mode with key m.']
      }
    }
  ];
}

export function sceneFromSpacesState(state: SpacesSceneState): ScenePanel[] {
  const selectedIndex = clampSelection(state.selectedIndex, state.spaces.length);
  const selected = state.spaces[selectedIndex];
  const detailPreview = state.spaceDetail ? safePreviewLines(state.spaceDetail) : selected ? safePreviewLines(selected) : undefined;

  return [
    {
      id: 'spaces-list',
      title: 'Spaces',
      kind: 'table',
      table: {
        columns: ['ID', 'Name', 'Type', 'Path'],
        rows: state.spaces.map((item, index) => [
          safeId(item, index),
          safeName(item),
          String(item?.space_type ?? item?.type ?? 'n/a'),
          String(item?.path ?? item?.full_path ?? 'n/a')
        ])
      },
      status: state.searchText ? `filter=${state.searchText}` : 'filter=none'
    },
    {
      id: 'spaces-detail',
      title: 'Space Detail',
      kind: 'text',
      text: {
        lines: detailPreview?.lines ?? ['No spaces.']
      },
      status: state.loading ? 'loading=1' : 'loading=0'
    },
    {
      id: 'spaces-devices',
      title: 'Devices In Space',
      kind: 'table',
      table: {
        columns: ['ID', 'Name', 'Status'],
        rows: state.devicesInSpace.map((item, index) => [safeId(item, index), safeName(item), safeStatus(item)])
      },
      status: state.paneStatus
    }
  ];
}

export function sceneFromCopilotState(state: CopilotSceneState): ScenePanel[] {
  return [
    {
      id: 'copilot-status',
      title: 'Provider',
      kind: 'text',
      text: {
        lines: [
          `Provider override: ${state.provider ?? 'none'}`,
          `Model override: ${state.model ?? 'none'}`,
          `Tenant: ${state.tenantId ?? 'none'}`
        ]
      }
    },
    {
      id: 'copilot-log',
      title: 'Output',
      kind: 'text',
      text: {
        lines: state.logs.length
          ? state.logs
          : ['Use interactive mode to run prompts. In headless mode, this view is a snapshot of current copilot log state.']
      }
    }
  ];
}

export function sceneFromSetupState(state: SetupSceneState): ScenePanel[] {
  return [
    {
      id: 'setup-overview',
      title: 'Setup Readiness',
      kind: 'stats',
      stats: [
        { label: 'Readiness', value: state.readinessState },
        { label: 'Tenant', value: state.tenantId ?? 'none' },
        { label: 'Connection', value: state.connectionState }
      ]
    },
    {
      id: 'setup-providers',
      title: 'Provider Slots',
      kind: 'table',
      table: {
        columns: ['Provider', 'Slots', 'Active Slot', 'Has Secret'],
        rows: state.providerRows.map((row) => [row.provider, row.slotCount, row.activeSlot, row.hasSecret])
      }
    },
    {
      id: 'setup-checklist',
      title: 'Checklist',
      kind: 'text',
      text: {
        lines: [
          ...(state.missingItems.length ? ['Missing:'] : ['No missing setup items.']),
          ...(state.missingItems.length ? state.missingItems.map((item) => `- ${item}`) : []),
          '',
          ...(state.recommendedActions.length ? ['Recommended actions:'] : ['No recommendations.']),
          ...state.recommendedActions.map((item) => `- ${item}`),
          '',
          'Interactive actions: a=add tenant, u=use tenant, k=add key, p=set active slot, c=test connectivity, r=refresh',
          'Global keys: u/g/d/s/v/i/t/p, r refresh, ? help, q quit'
        ]
      }
    }
  ];
}

export function sceneFromConfigState(state: ConfigSceneState): ScenePanel[] {
  return [
    {
      id: 'config-tenants',
      title: 'Tenants',
      kind: 'table',
      table: {
        columns: ['ID', 'Name', 'Active'],
        rows: state.tenantRows.map((row) => [row.id, row.name, row.active])
      }
    },
    {
      id: 'config-slots',
      title: 'Key Slots',
      kind: 'table',
      table: {
        columns: ['Provider', 'Slot', 'Name', 'Active', 'Has Secret', 'Fingerprint'],
        rows: state.slotRows.map((row) => [row.provider, row.slotId, row.name, row.active, row.hasSecret, row.fingerprint])
      }
    },
    {
      id: 'config-actions',
      title: 'Actions',
      kind: 'text',
      text: {
        lines: [
          `Doctor: ${state.doctorStatus ?? 'not run'}`,
          '',
          'Interactive actions: a=add slot, n=rename, u=use slot, e=update key, x=remove slot, c=doctor',
          'Global keys: u/g/d/s/v/i/t/p, r refresh, ? help, q quit'
        ]
      }
    }
  ];
}

export function createHeadlessFrame(args: {
  screen: TuiScreenId;
  title: string;
  status: string;
  tenantId?: string;
  motionEnabled: boolean;
  motionPhase: number;
  logo: string;
  panels: ScenePanel[];
  meta?: Partial<HeadlessFrameMeta>;
}): HeadlessFrame {
  const defaultMeta: HeadlessFrameMeta = {
    inputState: 'idle',
    queueDepth: 0,
    droppedEvents: 0,
    transitionState: 'idle',
    refreshState: 'idle',
    navigationMode: 'pane-focus',
    availablePanes: [],
    activePane: '',
    tabNavBoundary: null,
    renderSafety: 'ok'
  };
  return {
    timestamp: new Date().toISOString(),
    mode: 'headless',
    screen: args.screen,
    title: args.title,
    status: args.status,
    tenantId: args.tenantId,
    motionEnabled: args.motionEnabled,
    motionPhase: args.motionPhase,
    logo: args.logo,
    panels: args.panels,
    meta: {
      ...defaultMeta,
      ...(args.meta ?? {})
    }
  };
}
