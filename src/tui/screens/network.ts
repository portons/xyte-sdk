import blessed from 'blessed';

import {
  clampIndex,
  movePaneWithBoundary,
  moveTableSelection,
  setListTableData,
  scrollBox,
  shouldIgnoreSelectEvent,
  syncListSelection,
  type SelectionSyncState
} from '../navigation';
import { SCREEN_PANE_CONFIG } from '../panes';
import type { TuiArrowKey, TuiContext, TuiPaneId, TuiScreen } from '../types';
import { runDiscoveryScan } from '../../discovery/manager';
import type { DiscoveredDevice, ScanMode } from '../../discovery/types';
import { sceneFromNetworkState } from '../scene';

export function createNetworkScreen(): TuiScreen {
  let root: blessed.Widgets.BoxElement | undefined;
  let table: blessed.Widgets.ListTableElement | undefined;
  let detail: blessed.Widgets.BoxElement | undefined;
  let context: TuiContext;
  let devices: DiscoveredDevice[] = [];
  let filtered: DiscoveredDevice[] = [];
  let searchText = '';
  let selectedIndex = 0;
  let scanMode: ScanMode = 'quick';
  let scanning = false;
  let durationMs: number | undefined;
  let selectedDevice: DiscoveredDevice | undefined;
  let selectionSync: SelectionSyncState = {
    syncing: false,
    name: 'network-table'
  };
  const paneConfig = SCREEN_PANE_CONFIG.network;
  let activePane: TuiPaneId = paneConfig.defaultPane;
  let isMounted = false;

  const focusPane = () => {
    if (activePane === 'network-table') {
      table?.focus();
      return;
    }
    detail?.focus();
  };

  const applyFilter = () => {
    if (!isMounted) {
      return;
    }

    if (!searchText) {
      filtered = devices;
    } else {
      const needle = searchText.toLowerCase();
      filtered = devices.filter((d) => {
        const text = [d.ip, d.name, d.hostname, d.manufacturer, d.model, d.category].filter(Boolean).join(' ').toLowerCase();
        return text.includes(needle);
      });
    }
    selectedIndex = clampIndex(selectedIndex, filtered.length);

    const panels = sceneFromNetworkState({
      devices: filtered,
      selectedIndex,
      searchText,
      scanMode,
      scanning,
      durationMs
    });

    const tablePanel = panels.find((p) => p.id === 'network-table');
    const detailPanel = panels.find((p) => p.id === 'network-detail');

    setListTableData(
      table,
      [
        (tablePanel?.table?.columns ?? ['IP', 'Name', 'Category', 'Manufacturer']) as string[],
        ...((tablePanel?.table?.rows ?? []) as Array<string[]>)
      ],
      selectionSync
    );
    detail?.setContent((detailPanel?.text?.lines ?? ["Press 'n' for quick scan or 'f' for full scan."]).join('\n'));

    syncListSelection(table, selectedIndex, selectionSync);
    focusPane();
    context.screen.render();
  };

  const runScan = async (mode: ScanMode) => {
    if (scanning || !isMounted) {
      return;
    }
    scanMode = mode;
    scanning = true;
    durationMs = undefined;
    context.setStatus(`Running ${mode} network scan...`);
    applyFilter();

    try {
      const result = await runDiscoveryScan({ mode });
      if (!isMounted) {
        return;
      }
      devices = result.devices;
      durationMs = result.summary.durationMs;
      context.setStatus(`Scan complete: ${devices.length} device${devices.length !== 1 ? 's' : ''} found in ${(durationMs / 1000).toFixed(1)}s`);
    } catch (error) {
      if (!isMounted) {
        return;
      }
      context.showError(error);
    } finally {
      scanning = false;
    }
    applyFilter();
  };

  return {
    id: 'network',
    title: 'Network',
    mount(parent, ctx) {
      context = ctx;
      selectionSync = {
        syncing: false,
        name: 'network-table',
        onLog: (event, data) => context.debugLog?.(event, data)
      };
      isMounted = true;
      root = blessed.box({
        parent,
        width: '100%-2',
        height: '100%-2',
        top: 0,
        left: 0
      });

      table = blessed.listtable({
        parent: root,
        top: 0,
        left: 0,
        width: '100%',
        height: '60%',
        border: 'line',
        label: ' Network Devices ',
        keys: false,
        mouse: true,
        data: [['IP', 'Name', 'Category', 'Manufacturer']],
        style: {
          header: { bold: true, fg: 'black', bg: 'white' },
          cell: { selected: { bg: 'blue' } }
        }
      });

      detail = blessed.box({
        parent: root,
        top: '60%',
        left: 0,
        width: '100%',
        height: '40%',
        border: 'line',
        label: ' Device Detail ',
        scrollable: true,
        alwaysScroll: true,
        keys: false,
        mouse: true,
        vi: true,
        content: "Press 'n' for quick scan or 'f' for full scan."
      });

      table.on('select item', (_item, index) => {
        if (shouldIgnoreSelectEvent(selectionSync)) {
          return;
        }
        selectedIndex = Math.max(0, index - 1);
        applyFilter();
      });
    },
    unmount() {
      isMounted = false;
      root?.destroy();
      root = undefined;
    },
    async refresh() {
      if (!context || !isMounted) {
        return;
      }
      await runScan(scanMode);
    },
    focus() {
      focusPane();
    },
    getActivePane() {
      return activePane;
    },
    getAvailablePanes() {
      return paneConfig.panes;
    },
    async handleArrow(key: TuiArrowKey) {
      if (key === 'left' || key === 'right') {
        const next = movePaneWithBoundary(paneConfig.panes, activePane, key);
        if (next.boundary) {
          return 'boundary';
        }
        activePane = next.pane;
        focusPane();
        context.setStatus(`Pane: ${activePane}`);
        return 'handled';
      }

      const delta = key === 'up' ? -1 : key === 'down' ? 1 : 0;
      if (!delta) {
        return 'unhandled';
      }

      if (activePane === 'network-table') {
        selectedIndex = moveTableSelection({
          table,
          index: selectedIndex,
          delta,
          totalRows: filtered.length,
          selectionSync
        });
        applyFilter();
        return 'handled';
      }

      scrollBox(detail, delta);
      context.screen.render();
      return 'handled';
    },
    async handleKey(ch, key) {
      if (ch === 'n') {
        void runScan('quick');
        return true;
      }

      if (ch === 'f') {
        void runScan('full');
        return true;
      }

      if (key.name === 'slash' || ch === '/') {
        const value = await context.prompt('Filter devices (empty clears):', searchText);
        if (!isMounted) {
          return true;
        }
        if (value !== undefined) {
          searchText = value.trim();
          selectedIndex = 0;
          applyFilter();
        }
        return true;
      }

      if (key.name === 'enter') {
        if (filtered.length > 0) {
          selectedDevice = filtered[selectedIndex];
          context.setStatus(`Selected: ${selectedDevice?.ip ?? 'none'} (${selectedDevice?.name ?? 'unknown'})`);
        }
        return true;
      }

      return false;
    }
  };
}
