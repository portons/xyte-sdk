import type { KeychainStore } from '../secure/keychain';
import type { ProfileStore } from '../secure/profile-store';
import type { SecretProvider, TenantProfile } from '../types/profile';
import type { XyteClient } from '../types/client';
import { probeConnectivity, type ConnectivityResult } from './connectivity';

export type ReadinessState = 'ready' | 'needs_setup' | 'degraded';

export interface ProviderReadiness {
  provider: SecretProvider;
  slotCount: number;
  activeSlotId?: string;
  activeSlotName?: string;
  hasActiveSecret: boolean;
}

export interface ReadinessCheck {
  state: ReadinessState;
  activeTenant?: TenantProfile;
  tenantId?: string;
  missingItems: string[];
  recommendedActions: string[];
  providers: ProviderReadiness[];
  connectionState: ConnectivityResult['state'];
  connectivity: ConnectivityResult;
}

export interface ReadinessOptions {
  profileStore: ProfileStore;
  keychain: KeychainStore;
  tenantId?: string;
  client?: XyteClient;
  checkConnectivity?: boolean;
}

const XYTE_PROVIDERS: SecretProvider[] = ['xyte-org', 'xyte-partner', 'xyte-device'];
const ALL_PROVIDERS: SecretProvider[] = ['xyte-org', 'xyte-partner', 'xyte-device', 'openai', 'anthropic', 'openai-compatible'];

function defaultConnectivity(): ConnectivityResult {
  return {
    state: 'not_checked',
    message: 'Connectivity not checked.',
    retriable: false
  };
}

function connectionToState(connection: ConnectivityResult): ReadinessState {
  if (connection.state === 'connected' || connection.state === 'not_checked') {
    return 'ready';
  }
  if (connection.state === 'auth_required' || connection.state === 'missing_key') {
    return 'needs_setup';
  }
  return 'degraded';
}

export async function evaluateReadiness(options: ReadinessOptions): Promise<ReadinessCheck> {
  const profile = await options.profileStore.getData();
  const tenantId = options.tenantId ?? profile.activeTenantId;
  const missingItems: string[] = [];
  const recommendedActions: string[] = [];
  const providers: ProviderReadiness[] = [];

  if (!tenantId) {
    missingItems.push('No active tenant is configured.');
    recommendedActions.push('Run "xyte tenant add <tenant-id>" and "xyte tenant use <tenant-id>".');
    return {
      state: 'needs_setup',
      missingItems,
      recommendedActions,
      providers,
      connectionState: 'not_checked',
      connectivity: defaultConnectivity()
    };
  }

  const tenant = await options.profileStore.getTenant(tenantId);
  if (!tenant) {
    missingItems.push(`Active tenant "${tenantId}" does not exist in profile.`);
    recommendedActions.push('Run "xyte tenant add <tenant-id>" and set it active.');
    return {
      state: 'needs_setup',
      tenantId,
      missingItems,
      recommendedActions,
      providers,
      connectionState: 'not_checked',
      connectivity: defaultConnectivity()
    };
  }

  for (const provider of ALL_PROVIDERS) {
    const [slots, active] = await Promise.all([
      options.profileStore.listKeySlots(tenant.id, provider),
      options.profileStore.getActiveKeySlot(tenant.id, provider)
    ]);

    let hasActiveSecret = false;
    let activeSlotId = active?.slotId;
    let activeSlotName = active?.name;
    if (active) {
      hasActiveSecret = Boolean(await options.keychain.getSlotSecret(tenant.id, provider, active.slotId));
    } else {
      const legacyDefault = await options.keychain.getSecret(tenant.id, provider);
      if (legacyDefault) {
        hasActiveSecret = true;
        activeSlotId = 'default';
        activeSlotName = 'Default (legacy)';
      }
    }

    providers.push({
      provider,
      slotCount: slots.length,
      activeSlotId,
      activeSlotName,
      hasActiveSecret
    });
  }

  const hasXyteCredential = providers.some((provider) => XYTE_PROVIDERS.includes(provider.provider) && provider.hasActiveSecret);
  if (!hasXyteCredential) {
    missingItems.push('No active Xyte API key slot is configured (xyte-org / xyte-partner / xyte-device).');
    recommendedActions.push('Run "xyte auth key add --tenant <tenant-id> --provider xyte-org --name primary --key <value> --set-active".');
  }

  let connectivity = defaultConnectivity();
  if (options.client && options.checkConnectivity && hasXyteCredential) {
    connectivity = await probeConnectivity({ client: options.client, tenantId: tenant.id });
    if (connectivity.state === 'auth_required' || connectivity.state === 'missing_key') {
      missingItems.push(`Connectivity check requires updated credentials: ${connectivity.message}`);
      recommendedActions.push('Use "xyte auth key list/use/update" to select or update the active slot.');
    } else if (connectivity.state !== 'connected') {
      recommendedActions.push('Use retry/reconnect actions in TUI or run "xyte config doctor".');
    }
  }

  const baseState: ReadinessState = missingItems.length > 0 ? 'needs_setup' : connectionToState(connectivity);

  return {
    state: baseState,
    activeTenant: tenant,
    tenantId: tenant.id,
    missingItems,
    recommendedActions,
    providers,
    connectionState: connectivity.state,
    connectivity
  };
}
