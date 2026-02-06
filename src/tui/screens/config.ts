import blessed from 'blessed';

import { matchesSlotRef } from '../../secure/key-slots';
import type { SecretProvider } from '../../types/profile';
import {
  clampIndex,
  movePaneWithBoundary,
  moveTableSelection,
  scrollBox,
  setListTableData,
  syncListSelection,
  type SelectionSyncState
} from '../navigation';
import { SCREEN_PANE_CONFIG } from '../panes';
import { sceneFromConfigState } from '../scene';
import { runKeyCreateWizard, runKeyUpdateWizard } from '../key-wizard';
import type { TuiArrowKey, TuiContext, TuiScreen } from '../types';

const PROVIDERS: SecretProvider[] = ['xyte-org', 'xyte-partner', 'xyte-device', 'openai', 'anthropic', 'openai-compatible'];

function parseProvider(value: string): SecretProvider {
  const normalized = value.trim() as SecretProvider;
  if (!PROVIDERS.includes(normalized)) {
    throw new Error(`Invalid provider: ${value}`);
  }
  return normalized;
}

export function createConfigScreen(): TuiScreen {
  let root: blessed.Widgets.BoxElement | undefined;
  let tenantTable: blessed.Widgets.ListTableElement | undefined;
  let slotTable: blessed.Widgets.ListTableElement | undefined;
  let actionBox: blessed.Widgets.BoxElement | undefined;
  let context: TuiContext;
  let doctorStatus = 'not run';
  let selectedTenantIndex = 0;
  let selectedSlotIndex = 0;
  let tenantSelectionSync: SelectionSyncState = {
    syncing: false,
    name: 'config-tenants'
  };
  let slotSelectionSync: SelectionSyncState = {
    syncing: false,
    name: 'config-slots'
  };
  let slotRowsState: Array<{
    provider: SecretProvider;
    slotId: string;
    name: string;
    active: 'yes' | 'no';
    hasSecret: 'yes' | 'no';
    fingerprint: string;
  }> = [];
  const paneConfig = SCREEN_PANE_CONFIG.config;
  let activePane = paneConfig.defaultPane;
  let isMounted = false;

  const focusPane = () => {
    if (activePane === 'tenants-table') {
      tenantTable?.focus();
      return;
    }
    if (activePane === 'slots-table') {
      slotTable?.focus();
      return;
    }
    actionBox?.focus();
  };

  const render = async () => {
    if (!isMounted) {
      return;
    }
    const data = await context.profileStore.getData();
    const activeTenantId = await context.getActiveTenantId();
    if (!isMounted) {
      return;
    }
    const slots = activeTenantId ? await context.profileStore.listKeySlots(activeTenantId) : [];
    const slotsWithSecret = await Promise.all(
      slots.map(async (slot) => ({
        ...slot,
        hasSecret: activeTenantId ? Boolean(await context.keychain.getSlotSecret(activeTenantId, slot.provider, slot.slotId)) : false
      }))
    );

    const activeSlots = new Map<SecretProvider, string | undefined>();
    if (activeTenantId) {
      for (const provider of PROVIDERS) {
        const active = await context.profileStore.getActiveKeySlot(activeTenantId, provider);
        activeSlots.set(provider, active?.slotId);
      }
    }

    slotRowsState = slotsWithSecret.map((slot) => ({
      provider: slot.provider,
      slotId: slot.slotId,
      name: slot.name,
      active: activeSlots.get(slot.provider) === slot.slotId ? 'yes' : 'no',
      hasSecret: slot.hasSecret ? 'yes' : 'no',
      fingerprint: slot.fingerprint
    }));
    selectedSlotIndex = clampIndex(selectedSlotIndex, slotRowsState.length);

    const panels = sceneFromConfigState({
      tenantId: activeTenantId,
      tenantRows: data.tenants.map((tenant) => ({
        id: tenant.id,
        name: tenant.name,
        active: tenant.id === data.activeTenantId ? 'yes' : 'no'
      })),
      slotRows: slotRowsState,
      selectedSlot: slotRowsState[selectedSlotIndex],
      doctorStatus
    });

    const tenantPanel = panels.find((panel) => panel.id === 'config-tenants');
    const slotPanel = panels.find((panel) => panel.id === 'config-slots');
    const actionPanel = panels.find((panel) => panel.id === 'config-actions');

    setListTableData(tenantTable, [
      (tenantPanel?.table?.columns ?? ['ID', 'Name', 'Active']) as [string, string, string],
      ...((tenantPanel?.table?.rows ?? []) as Array<[string, string, string]>)
    ], tenantSelectionSync);
    selectedTenantIndex = clampIndex(selectedTenantIndex, data.tenants.length);
    syncListSelection(tenantTable, selectedTenantIndex, tenantSelectionSync);
    setListTableData(slotTable, [
      (slotPanel?.table?.columns ?? ['Provider', 'Slot', 'Active', 'Secret']) as [string, string, string, string],
      ...((slotPanel?.table?.rows ?? []) as Array<[string, string, string, string]>)
    ], slotSelectionSync);
    syncListSelection(slotTable, selectedSlotIndex, slotSelectionSync);
    actionBox?.setContent((actionPanel?.text?.lines ?? []).join('\n'));
    focusPane();
    context.screen.render();
  };

  return {
    id: 'config',
    title: 'Config',
    mount(parent, ctx) {
      context = ctx;
      tenantSelectionSync = {
        syncing: false,
        name: 'config-tenants',
        onLog: (event, data) => context.debugLog?.(event, data)
      };
      slotSelectionSync = {
        syncing: false,
        name: 'config-slots',
        onLog: (event, data) => context.debugLog?.(event, data)
      };
      isMounted = true;
      root = blessed.box({
        parent,
        width: '100%-2',
        height: '100%-2'
      });

      tenantTable = blessed.listtable({
        parent: root,
        top: 0,
        left: 0,
        width: '40%',
        height: '65%',
        border: 'line',
        label: ' Tenants ',
        keys: false,
        mouse: true,
        style: {
          header: { bold: true, fg: 'black', bg: 'white' },
          cell: { selected: { bg: 'blue' } }
        },
        data: [['ID', 'Name', 'Active']]
      });

      slotTable = blessed.listtable({
        parent: root,
        top: 0,
        left: '40%',
        width: '60%',
        height: '65%',
        border: 'line',
        label: ' Key Slots ',
        keys: false,
        mouse: true,
        style: {
          header: { bold: true, fg: 'black', bg: 'white' },
          cell: { selected: { bg: 'blue' } }
        },
        data: [['Provider', 'Slot', 'Active', 'Secret']]
      });

      actionBox = blessed.box({
        parent: root,
        top: '65%',
        left: 0,
        width: '100%',
        height: '35%',
        border: 'line',
        label: ' Actions ',
        scrollable: true,
        alwaysScroll: true,
        keys: false,
        mouse: true,
        vi: true
      });
      context.debugLog?.('nav.list.nativeKeysDisabled', {
        screen: 'config',
        widgets: ['tenants-table', 'slots-table', 'actions-box']
      });
    },
    unmount() {
      isMounted = false;
      root?.destroy();
      root = undefined;
    },
    async refresh() {
      await render();
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

      if (activePane === 'tenants-table') {
        const data = await context.profileStore.getData();
        const beforeIndex = selectedTenantIndex;
        selectedTenantIndex = moveTableSelection({
          table: tenantTable,
          index: selectedTenantIndex,
          delta,
          totalRows: data.tenants.length,
          selectionSync: tenantSelectionSync
        });
        context.debugLog?.('nav.arrow.updown', {
          screen: 'config',
          pane: activePane,
          beforeIndex,
          afterIndex: selectedTenantIndex,
          delta
        });
        context.screen.render();
        return 'handled';
      }

      if (activePane === 'slots-table') {
        const tenantId = await context.getActiveTenantId();
        const slotCount = tenantId ? (await context.profileStore.listKeySlots(tenantId)).length : 0;
        const beforeIndex = selectedSlotIndex;
        selectedSlotIndex = moveTableSelection({
          table: slotTable,
          index: selectedSlotIndex,
          delta,
          totalRows: slotCount,
          selectionSync: slotSelectionSync
        });
        context.debugLog?.('nav.arrow.updown', {
          screen: 'config',
          pane: activePane,
          beforeIndex,
          afterIndex: selectedSlotIndex,
          delta
        });
        context.screen.render();
        return 'handled';
      }

      scrollBox(actionBox, delta);
      context.screen.render();
      return 'handled';
    },
    async handleKey(ch) {
      try {
        if (ch === 'r') {
          await this.refresh();
          context.setStatus('Config refreshed.');
          return true;
        }

        if (ch === 'c') {
          const readiness = await context.refreshReadiness(true);
          doctorStatus = `${readiness.connectionState}: ${readiness.connectivity.message}`;
          await this.refresh();
          context.setStatus('Connectivity doctor executed.');
          return true;
        }

        const tenantId = await context.getActiveTenantId();
        if (!tenantId && ['a', 'n', 'u', 'e', 'x'].includes(ch ?? '')) {
          context.setStatus('No active tenant. Use setup screen first.');
          return true;
        }

        if (ch === 'a' && tenantId) {
          const selectedSlot = slotRowsState[clampIndex(selectedSlotIndex, slotRowsState.length)];
          const result = await runKeyCreateWizard({
            context,
            tenantId,
            defaultProvider: selectedSlot?.provider ?? 'xyte-org',
            defaultSlotName: 'primary',
            setActiveDefault: true
          });
          if (!isMounted) {
            return true;
          }
          await this.refresh();
          context.setStatus(result.message);
          return true;
        }

        if (ch === 'n' && tenantId) {
          const selectedSlot = slotRowsState[clampIndex(selectedSlotIndex, slotRowsState.length)];
          const provider = parseProvider((await context.prompt('Provider:', selectedSlot?.provider ?? 'xyte-org'))?.trim() || '');
          if (!isMounted) {
            return true;
          }
          const slotRef = (await context.prompt('Slot id or name:', selectedSlot?.slotId ?? selectedSlot?.name ?? ''))?.trim();
          if (!isMounted) {
            return true;
          }
          if (!slotRef) {
            return true;
          }
          const nextName = (await context.prompt('New slot name:', ''))?.trim();
          if (!isMounted) {
            return true;
          }
          if (!nextName) {
            return true;
          }
          await context.profileStore.updateKeySlot(tenantId, provider, slotRef, { name: nextName });
          await this.refresh();
          context.setStatus(`Renamed slot ${slotRef}.`);
          return true;
        }

        if (ch === 'u' && tenantId) {
          const selectedSlot = slotRowsState[clampIndex(selectedSlotIndex, slotRowsState.length)];
          const provider = parseProvider((await context.prompt('Provider:', selectedSlot?.provider ?? 'xyte-org'))?.trim() || '');
          if (!isMounted) {
            return true;
          }
          const slotRef = (await context.prompt('Slot id or name:', selectedSlot?.slotId ?? selectedSlot?.name ?? ''))?.trim();
          if (!isMounted) {
            return true;
          }
          if (!slotRef) {
            return true;
          }
          await context.profileStore.setActiveKeySlot(tenantId, provider, slotRef);
          await this.refresh();
          context.setStatus(`Active slot changed for ${provider}.`);
          return true;
        }

        if (ch === 'e' && tenantId) {
          const selectedSlot = slotRowsState[clampIndex(selectedSlotIndex, slotRowsState.length)];
          let result;
          if (selectedSlot) {
            result = await runKeyUpdateWizard({
              context,
              tenantId,
              provider: selectedSlot.provider,
              slotRef: selectedSlot.slotId,
              promptEditSelected: true,
              setActiveDefault: selectedSlot.active === 'yes'
            });
          } else {
            const provider = parseProvider((await context.prompt('Provider:', 'xyte-org'))?.trim() || '');
            if (!isMounted) {
              return true;
            }
            const slotRef = (await context.prompt('Slot id or name:', ''))?.trim();
            if (!isMounted) {
              return true;
            }
            if (!slotRef) {
              return true;
            }
            result = await runKeyUpdateWizard({
              context,
              tenantId,
              provider,
              slotRef,
              setActiveDefault: true
            });
          }
          if (!isMounted) {
            return true;
          }
          await this.refresh();
          context.setStatus(result.message);
          return true;
        }

        if (ch === 'x' && tenantId) {
          const selectedSlot = slotRowsState[clampIndex(selectedSlotIndex, slotRowsState.length)];
          const provider = parseProvider((await context.prompt('Provider:', selectedSlot?.provider ?? 'xyte-org'))?.trim() || '');
          if (!isMounted) {
            return true;
          }
          const slotRef = (await context.prompt('Slot id or name:', selectedSlot?.slotId ?? selectedSlot?.name ?? ''))?.trim();
          if (!isMounted) {
            return true;
          }
          if (!slotRef) {
            return true;
          }
          const confirmed = await context.confirmWrite(`Remove slot ${slotRef}`, 'remove');
          if (!confirmed) {
            context.setStatus('Remove action canceled.');
            return true;
          }
          const slots = await context.profileStore.listKeySlots(tenantId, provider);
          const slot = slots.find((item) => matchesSlotRef(item, slotRef));
          if (!slot) {
            throw new Error(`Unknown slot "${slotRef}" for ${provider}.`);
          }
          await context.keychain.clearSlotSecret(tenantId, provider, slot.slotId);
          await context.profileStore.removeKeySlot(tenantId, provider, slot.slotId);
          await this.refresh();
          context.setStatus(`Removed slot ${slot.slotId}.`);
          return true;
        }
      } catch (error) {
        context.showError(error);
        return true;
      }

      return false;
    }
  };
}
