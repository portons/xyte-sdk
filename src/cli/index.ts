import { createInterface } from 'node:readline/promises';
import { accessSync, constants, existsSync, realpathSync } from 'node:fs';
import { delimiter } from 'node:path';
import path from 'node:path';

import { Command } from 'commander';

import { createXyteClient } from '../client/create-client';
import { getEndpoint, listEndpoints } from '../client/catalog';
import { evaluateReadiness, type ReadinessCheck } from '../config/readiness';
import { createKeychainStore, type KeychainStore } from '../secure/keychain';
import { DEFAULT_SLOT_ID, makeKeyFingerprint, matchesSlotRef } from '../secure/key-slots';
import { FileProfileStore, type ProfileStore } from '../secure/profile-store';
import type { SecretProvider } from '../types/profile';
import { parseJsonObject } from '../utils/json';
import { runTuiApp } from '../tui/app';
import { LLMService } from '../llm/provider';
import type { TuiScreenId } from '../tui/types';

type OutputStream = Pick<typeof process.stdout, 'write'>;
type ErrorStream = Pick<typeof process.stderr, 'write'>;
type OutputFormat = 'json' | 'text';

interface InstallDoctorResult {
  status: 'ok' | 'missing' | 'mismatch';
  commandOnPath: boolean;
  commandPath?: string;
  commandRealPath?: string;
  expectedPath: string;
  expectedRealPath: string;
  sameTarget: boolean;
  suggestions: string[];
}

export interface CliRuntime {
  profileStore?: ProfileStore;
  keychain?: KeychainStore;
  stdout?: OutputStream;
  stderr?: ErrorStream;
  runTui?: typeof runTuiApp;
}

interface SlotView {
  tenantId: string;
  provider: SecretProvider;
  slotId: string;
  name: string;
  fingerprint: string;
  hasSecret: boolean;
  active: boolean;
  lastValidatedAt?: string;
}

function printJson(stream: OutputStream, value: unknown) {
  stream.write(`${JSON.stringify(value, null, 2)}\n`);
}

function parseProvider(value: string): SecretProvider {
  const allowed: SecretProvider[] = [
    'openai',
    'anthropic',
    'openai-compatible',
    'xyte-org',
    'xyte-partner',
    'xyte-device'
  ];

  if (!allowed.includes(value as SecretProvider)) {
    throw new Error(`Invalid provider: ${value}`);
  }

  return value as SecretProvider;
}

function parsePathJson(value: string | undefined): Record<string, string | number> {
  const record = parseJsonObject(value);
  const out: Record<string, string | number> = {};
  for (const [key, item] of Object.entries(record)) {
    if (typeof item === 'string' || typeof item === 'number') {
      out[key] = item;
      continue;
    }
    throw new Error(`Path parameter "${key}" must be string or number.`);
  }
  return out;
}

function parseQueryJson(value: string | undefined): Record<string, string | number | boolean | null | undefined> {
  const record = parseJsonObject(value);
  const out: Record<string, string | number | boolean | null | undefined> = {};
  for (const [key, item] of Object.entries(record)) {
    if (item === null || item === undefined || typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
      out[key] = item as string | number | boolean | null | undefined;
      continue;
    }
    throw new Error(`Query parameter "${key}" must be scalar, null, or undefined.`);
  }
  return out;
}

function requiresWriteGuard(method: string): boolean {
  return !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}

function requiresDestructiveGuard(method: string): boolean {
  return method.toUpperCase() === 'DELETE';
}

function formatReadinessText(readiness: ReadinessCheck): string {
  const lines: string[] = [];
  lines.push(`Readiness: ${readiness.state}`);
  lines.push(`Tenant: ${readiness.tenantId ?? 'none'}`);
  lines.push(`Connectivity: ${readiness.connectionState} (${readiness.connectivity.message})`);
  lines.push('');
  lines.push('Providers:');

  for (const provider of readiness.providers) {
    lines.push(
      `- ${provider.provider}: slots=${provider.slotCount}, active=${provider.activeSlotId ?? 'none'} (${provider.activeSlotName ?? 'n/a'}), hasSecret=${provider.hasActiveSecret}`
    );
  }

  if (readiness.missingItems.length) {
    lines.push('');
    lines.push('Missing items:');
    readiness.missingItems.forEach((item) => lines.push(`- ${item}`));
  }

  if (readiness.recommendedActions.length) {
    lines.push('');
    lines.push('Recommended actions:');
    readiness.recommendedActions.forEach((item) => lines.push(`- ${item}`));
  }

  return `${lines.join('\n')}\n`;
}

function formatSlotListText(slots: SlotView[]): string {
  if (!slots.length) {
    return 'No key slots found.\n';
  }

  const lines: string[] = ['tenant | provider | slotId | name | active | hasSecret | fingerprint | lastValidatedAt'];
  for (const slot of slots) {
    lines.push(
      `${slot.tenantId} | ${slot.provider} | ${slot.slotId} | ${slot.name} | ${slot.active} | ${slot.hasSecret} | ${slot.fingerprint} | ${
        slot.lastValidatedAt ?? 'n/a'
      }`
    );
  }
  return `${lines.join('\n')}\n`;
}

function resolveCommandFromPath(command: string, envPath = process.env.PATH ?? ''): string | undefined {
  const pathEntries = envPath.split(delimiter).filter(Boolean);
  const extensions =
    process.platform === 'win32'
      ? (process.env.PATHEXT ?? '.EXE;.CMD;.BAT;.COM')
          .split(';')
          .filter(Boolean)
          .map((ext) => ext.toLowerCase())
      : [''];

  for (const entry of pathEntries) {
    for (const ext of extensions) {
      const candidate = process.platform === 'win32' ? path.join(entry, `${command}${ext}`) : path.join(entry, command);
      if (!existsSync(candidate)) {
        continue;
      }
      try {
        accessSync(candidate, constants.X_OK);
      } catch {
        continue;
      }
      return candidate;
    }
  }

  return undefined;
}

function getRealPath(value: string): string {
  try {
    return realpathSync(value);
  } catch {
    return path.resolve(value);
  }
}

function runInstallDoctor(): InstallDoctorResult {
  const expectedPath = path.resolve(__dirname, '../../bin/xyte');
  const expectedRealPath = getRealPath(expectedPath);
  const commandPath = resolveCommandFromPath('xyte');
  const commandOnPath = Boolean(commandPath);
  const commandRealPath = commandPath ? getRealPath(commandPath) : undefined;
  const sameTarget = Boolean(commandRealPath && commandRealPath === expectedRealPath);

  const suggestions: string[] = [];
  if (!commandOnPath) {
    suggestions.push('Run: npm run install:global');
    suggestions.push('Then verify from a different directory: xyte --help');
  } else if (!sameTarget) {
    suggestions.push(`xyte currently points to: ${commandPath}`);
    suggestions.push('Relink this repo globally: npm run reinstall:global');
  } else {
    suggestions.push('Global command wiring looks correct.');
  }

  const status: InstallDoctorResult['status'] = !commandOnPath ? 'missing' : sameTarget ? 'ok' : 'mismatch';
  return {
    status,
    commandOnPath,
    commandPath,
    commandRealPath,
    expectedPath,
    expectedRealPath,
    sameTarget,
    suggestions
  };
}

async function promptValue(args: { question: string; initial?: string; stdout: OutputStream }): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });
  try {
    const suffix = args.initial ? ` [${args.initial}]` : '';
    const answer = (await rl.question(`${args.question}${suffix}: `)).trim();
    return answer || args.initial || '';
  } finally {
    rl.close();
  }
}

async function resolveSlotByRef(
  profileStore: ProfileStore,
  tenantId: string,
  provider: SecretProvider,
  slotRef: string
) {
  const slots = await profileStore.listKeySlots(tenantId, provider);
  const slot = slots.find((item) => matchesSlotRef(item, slotRef));
  if (!slot) {
    throw new Error(`Unknown slot "${slotRef}" for provider ${provider} in tenant ${tenantId}.`);
  }
  return slot;
}

async function collectSlotViews(args: {
  profileStore: ProfileStore;
  keychain: KeychainStore;
  tenantId: string;
  provider?: SecretProvider;
}): Promise<SlotView[]> {
  const slots = await args.profileStore.listKeySlots(args.tenantId, args.provider);
  const groupedProviders = new Set(slots.map((slot) => slot.provider));
  const activeByProvider = new Map<SecretProvider, string | undefined>();
  for (const provider of groupedProviders) {
    const active = await args.profileStore.getActiveKeySlot(args.tenantId, provider);
    activeByProvider.set(provider, active?.slotId);
  }

  const views: SlotView[] = [];
  for (const slot of slots) {
    const hasSecret = Boolean(await args.keychain.getSlotSecret(args.tenantId, slot.provider, slot.slotId));
    views.push({
      tenantId: args.tenantId,
      provider: slot.provider,
      slotId: slot.slotId,
      name: slot.name,
      fingerprint: slot.fingerprint,
      hasSecret,
      active: activeByProvider.get(slot.provider) === slot.slotId,
      lastValidatedAt: slot.lastValidatedAt
    });
  }
  return views;
}

async function upsertDefaultSlot(args: {
  profileStore: ProfileStore;
  tenantId: string;
  provider: SecretProvider;
  fingerprint: string;
}) {
  const slots = await args.profileStore.listKeySlots(args.tenantId, args.provider);
  const existing = slots.find((slot) => slot.slotId === DEFAULT_SLOT_ID) ?? slots.find((slot) => slot.name.toLowerCase() === 'default');
  if (!existing) {
    await args.profileStore.addKeySlot(args.tenantId, {
      provider: args.provider,
      name: 'Default',
      slotId: DEFAULT_SLOT_ID,
      fingerprint: args.fingerprint
    });
    return;
  }

  await args.profileStore.updateKeySlot(args.tenantId, args.provider, existing.slotId, {
    fingerprint: args.fingerprint
  });
}

function requireKeyValue(value: string | undefined): string {
  const resolved = value ?? process.env.XYTE_SDK_KEY;
  if (!resolved) {
    throw new Error('Missing key value. Use --key or set XYTE_SDK_KEY environment variable.');
  }
  return resolved;
}

async function runSlotConnectivityTest(args: {
  provider: SecretProvider;
  tenantId: string;
  key: string;
  profileStore: ProfileStore;
}) {
  if (args.provider === 'xyte-org') {
    const client = createXyteClient({
      profileStore: args.profileStore,
      tenantId: args.tenantId,
      auth: { organization: args.key }
    });
    await client.organization.getOrganizationInfo({ tenantId: args.tenantId });
    return {
      strategy: 'organization.getOrganizationInfo',
      ok: true
    };
  }

  if (args.provider === 'xyte-partner') {
    const client = createXyteClient({
      profileStore: args.profileStore,
      tenantId: args.tenantId,
      auth: { partner: args.key }
    });
    await client.partner.getDevices({ tenantId: args.tenantId });
    return {
      strategy: 'partner.getDevices',
      ok: true
    };
  }

  if (args.provider === 'xyte-device') {
    return {
      strategy: 'local-only',
      ok: true,
      note: 'Device-key probe skipped (requires device-specific path context).'
    };
  }

  return {
    strategy: 'local-only',
    ok: true,
    note: 'Provider key presence verified locally.'
  };
}

export function createCli(runtime: CliRuntime = {}): Command {
  const stdout = runtime.stdout ?? process.stdout;
  const stderr = runtime.stderr ?? process.stderr;
  const profileStore = runtime.profileStore ?? new FileProfileStore();
  const runTui = runtime.runTui ?? runTuiApp;

  let keychainPromise: Promise<KeychainStore> | undefined;
  const getKeychain = async () => {
    if (runtime.keychain) {
      return runtime.keychain;
    }
    if (!keychainPromise) {
      keychainPromise = createKeychainStore();
    }
    return keychainPromise;
  };

  const withClient = async (tenantId?: string, retry?: { attempts?: number; backoffMs?: number }) => {
    const keychain = await getKeychain();
    return createXyteClient({
      profileStore,
      keychain,
      tenantId,
      retryAttempts: retry?.attempts,
      retryBackoffMs: retry?.backoffMs
    });
  };

  const program = new Command();
  program.name('xyte').description('Xyte SDK CLI + TUI').version('0.1.0');

  const doctor = program.command('doctor').description('Runtime diagnostics');

  doctor
    .command('install')
    .description('Check global xyte command wiring')
    .option('--format <format>', 'json|text', 'json')
    .action((options: { format?: OutputFormat }) => {
      const report = runInstallDoctor();
      if ((options.format ?? 'json') === 'text') {
        stdout.write(
          [
            `Status: ${report.status}`,
            `Command on PATH: ${report.commandOnPath}`,
            `Command path: ${report.commandPath ?? 'not found'}`,
            `Command real path: ${report.commandRealPath ?? 'n/a'}`,
            `Expected path: ${report.expectedPath}`,
            `Expected real path: ${report.expectedRealPath}`,
            `Same target: ${report.sameTarget}`,
            '',
            'Suggestions:',
            ...report.suggestions.map((item) => `- ${item}`)
          ].join('\n') + '\n'
        );
        return;
      }
      printJson(stdout, report);
    });

  program
    .command('list-endpoints')
    .description('List endpoint keys')
    .option('--tenant <tenantId>', 'Filter endpoints available for tenant credentials')
    .action(async (options: { tenant?: string }) => {
      if (options.tenant) {
        const client = await withClient(options.tenant);
        printJson(stdout, await client.listTenantEndpoints(options.tenant));
        return;
      }
      printJson(stdout, listEndpoints());
    });

  program
    .command('describe-endpoint')
    .argument('<key>', 'Endpoint key')
    .description('Describe endpoint metadata')
    .action((key: string) => {
      printJson(stdout, getEndpoint(key));
    });

  program
    .command('call')
    .argument('<key>', 'Endpoint key')
    .description('Call endpoint by key')
    .option('--tenant <tenantId>', 'Tenant id')
    .option('--path-json <json>', 'Path params JSON object')
    .option('--query-json <json>', 'Query params JSON object')
    .option('--body-json <json>', 'Body JSON object')
    .option('--allow-write', 'Allow mutation endpoint invocation')
    .option('--confirm <token>', 'Confirm token required for destructive operations')
    .action(async (key: string, options: Record<string, unknown>) => {
      const endpoint = getEndpoint(key);
      const method = endpoint.method.toUpperCase();

      if (requiresWriteGuard(method) && options.allowWrite !== true) {
        throw new Error(`Endpoint ${key} is a write operation (${method}). Re-run with --allow-write.`);
      }

      if (requiresDestructiveGuard(method) && options.confirm !== key) {
        throw new Error(`Endpoint ${key} is destructive. Re-run with --confirm ${key}.`);
      }

      const client = await withClient((options.tenant as string | undefined) ?? undefined);
      const result = await client.call(key, {
        tenantId: options.tenant as string | undefined,
        path: parsePathJson(options.pathJson as string | undefined),
        query: parseQueryJson(options.queryJson as string | undefined),
        body: options.bodyJson ? JSON.parse(String(options.bodyJson)) : undefined
      });

      printJson(stdout, result);
    });

  const tenant = program.command('tenant').description('Manage tenant profiles');

  tenant
    .command('add')
    .argument('<tenantId>', 'Tenant id')
    .description('Create or update a tenant profile')
    .option('--name <name>', 'Display name')
    .option('--hub-url <url>', 'Hub API base URL')
    .option('--entry-url <url>', 'Entry API base URL')
    .option('--openai-compatible-url <url>', 'OpenAI-compatible base URL')
    .action(async (tenantId: string, options: Record<string, string | undefined>) => {
      const tenantProfile = await profileStore.upsertTenant({
        id: tenantId,
        name: options.name,
        hubBaseUrl: options.hubUrl,
        entryBaseUrl: options.entryUrl,
        openaiCompatibleBaseUrl: options.openaiCompatibleUrl
      });
      printJson(stdout, tenantProfile);
    });

  tenant
    .command('list')
    .description('List tenants')
    .action(async () => {
      const data = await profileStore.getData();
      printJson(stdout, {
        activeTenantId: data.activeTenantId,
        tenants: data.tenants
      });
    });

  tenant
    .command('use')
    .argument('<tenantId>', 'Tenant id to set active')
    .description('Set active tenant')
    .action(async (tenantId: string) => {
      await profileStore.setActiveTenant(tenantId);
      stdout.write(`Active tenant set to ${tenantId}\n`);
    });

  tenant
    .command('remove')
    .argument('<tenantId>', 'Tenant id')
    .description('Remove tenant profile')
    .action(async (tenantId: string) => {
      await profileStore.removeTenant(tenantId);
      stdout.write(`Removed tenant ${tenantId}\n`);
    });

  const profile = program.command('profile').description('Manage profile settings');

  profile
    .command('set-default')
    .requiredOption('--tenant <tenantId>', 'Tenant id')
    .description('Set active default tenant')
    .action(async (options: { tenant: string }) => {
      await profileStore.setActiveTenant(options.tenant);
      stdout.write(`Default tenant set to ${options.tenant}\n`);
    });

  const llm = profile.command('llm').description('Manage LLM profile settings');

  llm
    .command('set-provider')
    .requiredOption('--provider <provider>', 'openai|anthropic|openai-compatible')
    .option('--tenant <tenantId>', 'Optional tenant-scoped override')
    .action(async (options: { provider: 'openai' | 'anthropic' | 'openai-compatible'; tenant?: string }) => {
      if (options.tenant) {
        await profileStore.setTenantLLM(options.tenant, { provider: options.provider });
        stdout.write(`Tenant ${options.tenant} provider set to ${options.provider}\n`);
        return;
      }

      await profileStore.setGlobalLLM({ provider: options.provider });
      stdout.write(`Global provider set to ${options.provider}\n`);
    });

  llm
    .command('set-model')
    .requiredOption('--model <model>', 'Model name')
    .option('--tenant <tenantId>', 'Optional tenant-scoped override')
    .action(async (options: { model: string; tenant?: string }) => {
      if (options.tenant) {
        await profileStore.setTenantLLM(options.tenant, { model: options.model });
        stdout.write(`Tenant ${options.tenant} model set to ${options.model}\n`);
        return;
      }

      await profileStore.setGlobalLLM({ model: options.model });
      stdout.write(`Global model set to ${options.model}\n`);
    });

  const auth = program.command('auth').description('Manage API keys in OS keychain');
  const authKey = auth.command('key').description('Manage named key slots');

  authKey
    .command('add')
    .requiredOption('--tenant <tenantId>', 'Tenant id')
    .requiredOption('--provider <provider>', 'openai|anthropic|openai-compatible|xyte-org|xyte-partner|xyte-device')
    .requiredOption('--name <name>', 'Slot display name')
    .option('--slot-id <slotId>', 'Optional explicit slot id')
    .option('--key <value>', 'API key value')
    .option('--set-active', 'Set as active slot for provider')
    .action(async (options: { tenant: string; provider: string; name: string; slotId?: string; key?: string; setActive?: boolean }) => {
      const provider = parseProvider(options.provider);
      const value = requireKeyValue(options.key);
      await profileStore.upsertTenant({ id: options.tenant });
      const keychain = await getKeychain();

      const slot = await profileStore.addKeySlot(options.tenant, {
        provider,
        name: options.name,
        slotId: options.slotId,
        fingerprint: makeKeyFingerprint(value)
      });

      await keychain.setSlotSecret(options.tenant, provider, slot.slotId, value);
      if (options.setActive) {
        await profileStore.setActiveKeySlot(options.tenant, provider, slot.slotId);
      }

      printJson(stdout, {
        tenantId: options.tenant,
        provider,
        slot
      });
    });

  authKey
    .command('list')
    .requiredOption('--tenant <tenantId>', 'Tenant id')
    .option('--provider <provider>', 'Optional provider filter')
    .option('--format <format>', 'json|text', 'json')
    .action(async (options: { tenant: string; provider?: string; format?: OutputFormat }) => {
      const keychain = await getKeychain();
      const provider = options.provider ? parseProvider(options.provider) : undefined;
      const slots = await collectSlotViews({
        profileStore,
        keychain,
        tenantId: options.tenant,
        provider
      });

      if ((options.format ?? 'json') === 'text') {
        stdout.write(formatSlotListText(slots));
        return;
      }

      printJson(stdout, {
        tenantId: options.tenant,
        slots
      });
    });

  authKey
    .command('use')
    .requiredOption('--tenant <tenantId>', 'Tenant id')
    .requiredOption('--provider <provider>', 'Provider')
    .requiredOption('--slot <slotRef>', 'Slot id or name')
    .action(async (options: { tenant: string; provider: string; slot: string }) => {
      const provider = parseProvider(options.provider);
      const slot = await profileStore.setActiveKeySlot(options.tenant, provider, options.slot);
      printJson(stdout, {
        tenantId: options.tenant,
        provider,
        activeSlot: slot
      });
    });

  authKey
    .command('rename')
    .requiredOption('--tenant <tenantId>', 'Tenant id')
    .requiredOption('--provider <provider>', 'Provider')
    .requiredOption('--slot <slotRef>', 'Slot id or name')
    .requiredOption('--name <name>', 'New slot name')
    .action(async (options: { tenant: string; provider: string; slot: string; name: string }) => {
      const provider = parseProvider(options.provider);
      const updated = await profileStore.updateKeySlot(options.tenant, provider, options.slot, {
        name: options.name
      });
      printJson(stdout, {
        tenantId: options.tenant,
        provider,
        slot: updated
      });
    });

  authKey
    .command('update')
    .requiredOption('--tenant <tenantId>', 'Tenant id')
    .requiredOption('--provider <provider>', 'Provider')
    .requiredOption('--slot <slotRef>', 'Slot id or name')
    .option('--key <value>', 'API key value')
    .action(async (options: { tenant: string; provider: string; slot: string; key?: string }) => {
      const provider = parseProvider(options.provider);
      const slot = await resolveSlotByRef(profileStore, options.tenant, provider, options.slot);
      const value = requireKeyValue(options.key);
      const keychain = await getKeychain();

      await keychain.setSlotSecret(options.tenant, provider, slot.slotId, value);
      const updated = await profileStore.updateKeySlot(options.tenant, provider, slot.slotId, {
        fingerprint: makeKeyFingerprint(value)
      });

      printJson(stdout, {
        tenantId: options.tenant,
        provider,
        slot: updated
      });
    });

  authKey
    .command('remove')
    .requiredOption('--tenant <tenantId>', 'Tenant id')
    .requiredOption('--provider <provider>', 'Provider')
    .requiredOption('--slot <slotRef>', 'Slot id or name')
    .option('--confirm', 'Confirm removal')
    .action(async (options: { tenant: string; provider: string; slot: string; confirm?: boolean }) => {
      if (!options.confirm) {
        throw new Error('Key slot removal is destructive. Re-run with --confirm.');
      }
      const provider = parseProvider(options.provider);
      const slot = await resolveSlotByRef(profileStore, options.tenant, provider, options.slot);
      const keychain = await getKeychain();

      await keychain.clearSlotSecret(options.tenant, provider, slot.slotId);
      await profileStore.removeKeySlot(options.tenant, provider, slot.slotId);
      printJson(stdout, {
        tenantId: options.tenant,
        provider,
        removedSlotId: slot.slotId
      });
    });

  authKey
    .command('test')
    .requiredOption('--tenant <tenantId>', 'Tenant id')
    .requiredOption('--provider <provider>', 'Provider')
    .requiredOption('--slot <slotRef>', 'Slot id or name')
    .action(async (options: { tenant: string; provider: string; slot: string }) => {
      const provider = parseProvider(options.provider);
      const slot = await resolveSlotByRef(profileStore, options.tenant, provider, options.slot);
      const keychain = await getKeychain();
      const secret = await keychain.getSlotSecret(options.tenant, provider, slot.slotId);

      if (!secret) {
        throw new Error(`No secret found for slot "${slot.slotId}" (${provider}) in tenant ${options.tenant}.`);
      }

      const probe = await runSlotConnectivityTest({
        provider,
        tenantId: options.tenant,
        key: secret,
        profileStore
      });

      const validatedAt = new Date().toISOString();
      const updated = await profileStore.updateKeySlot(options.tenant, provider, slot.slotId, {
        lastValidatedAt: validatedAt
      });

      printJson(stdout, {
        tenantId: options.tenant,
        provider,
        slot: updated,
        probe
      });
    });

  auth
    .command('set-key')
    .requiredOption('--provider <provider>', 'openai|anthropic|openai-compatible|xyte-org|xyte-partner|xyte-device')
    .requiredOption('--tenant <tenantId>', 'Tenant id')
    .option('--key <value>', 'API key value')
    .action(async (options: { provider: string; tenant: string; key?: string }) => {
      const provider = parseProvider(options.provider);
      const keychain = await getKeychain();
      const value = requireKeyValue(options.key);

      await profileStore.upsertTenant({ id: options.tenant });
      await upsertDefaultSlot({
        profileStore,
        tenantId: options.tenant,
        provider,
        fingerprint: makeKeyFingerprint(value)
      });
      await keychain.setSlotSecret(options.tenant, provider, DEFAULT_SLOT_ID, value);
      const slots = await profileStore.listKeySlots(options.tenant, provider);
      const defaultSlot = slots.find((slot) => slot.slotId === DEFAULT_SLOT_ID) ?? slots.find((slot) => slot.name.toLowerCase() === 'default');
      if (defaultSlot) {
        await profileStore.setActiveKeySlot(options.tenant, provider, defaultSlot.slotId);
      }

      stderr.write('Warning: "auth set-key" is deprecated. Use "auth key add/use/update" for named slots.\n');
      stdout.write(`Stored key for ${provider} in tenant ${options.tenant} (slot ${DEFAULT_SLOT_ID})\n`);
    });

  auth
    .command('clear-key')
    .requiredOption('--provider <provider>', 'openai|anthropic|openai-compatible|xyte-org|xyte-partner|xyte-device')
    .requiredOption('--tenant <tenantId>', 'Tenant id')
    .action(async (options: { provider: string; tenant: string }) => {
      const provider = parseProvider(options.provider);
      const keychain = await getKeychain();
      await keychain.clearSlotSecret(options.tenant, provider, DEFAULT_SLOT_ID);
      stderr.write('Warning: "auth clear-key" is deprecated. Use "auth key remove" for named slots.\n');
      stdout.write(`Cleared key for ${provider} in tenant ${options.tenant} (slot ${DEFAULT_SLOT_ID})\n`);
    });

  const setup = program.command('setup').description('Run setup and readiness checks');

  setup
    .command('status')
    .description('Show setup/readiness status')
    .option('--tenant <tenantId>', 'Tenant id override')
    .option('--format <format>', 'json|text', 'json')
    .action(async (options: { tenant?: string; format?: OutputFormat }) => {
      const keychain = await getKeychain();
      const client = await withClient(options.tenant);
      const readiness = await evaluateReadiness({
        profileStore,
        keychain,
        tenantId: options.tenant,
        client,
        checkConnectivity: true
      });

      if ((options.format ?? 'json') === 'text') {
        stdout.write(formatReadinessText(readiness));
        return;
      }
      printJson(stdout, readiness);
    });

  setup
    .command('run')
    .description('Run setup flow')
    .option('--tenant <tenantId>', 'Tenant id')
    .option('--name <name>', 'Tenant display name')
    .option('--provider <provider>', 'Primary provider for key setup')
    .option('--slot-name <name>', 'Key slot name', 'primary')
    .option('--key <value>', 'API key value')
    .option('--set-active', 'Set slot active (default true in setup flow)')
    .option('--non-interactive', 'Disable prompts and require needed options')
    .option('--format <format>', 'json|text', 'json')
    .action(
      async (options: {
        tenant?: string;
        name?: string;
        provider?: string;
        slotName?: string;
        key?: string;
        setActive?: boolean;
        nonInteractive?: boolean;
        format?: OutputFormat;
      }) => {
        let tenantId = options.tenant;
        let tenantName = options.name;
        let provider = options.provider ? parseProvider(options.provider) : undefined;
        let slotName = options.slotName ?? 'primary';
        let keyValue = options.key ?? process.env.XYTE_SDK_KEY;

        if (!options.nonInteractive) {
          if (!process.stdin.isTTY) {
            throw new Error('Interactive setup requires a TTY. Use --non-interactive with explicit flags.');
          }
          tenantId = tenantId || (await promptValue({ question: 'Tenant id', stdout }));
          tenantName = tenantName || (await promptValue({ question: 'Tenant display name', initial: tenantId, stdout }));
          const providerAnswer = provider || parseProvider(await promptValue({ question: 'Provider', initial: 'xyte-org', stdout }));
          provider = providerAnswer;
          slotName = await promptValue({ question: 'Slot name', initial: slotName, stdout });
          keyValue = keyValue || (await promptValue({ question: 'API key', stdout }));
        }

        if (!tenantId) {
          throw new Error('Missing tenant id. Provide --tenant (or run interactive setup).');
        }
        if (!provider) {
          throw new Error('Missing provider. Provide --provider (or run interactive setup).');
        }
        if (!keyValue) {
          throw new Error('Missing API key. Provide --key/XYTE_SDK_KEY (or run interactive setup).');
        }

        await profileStore.upsertTenant({
          id: tenantId,
          name: tenantName
        });
        await profileStore.setActiveTenant(tenantId);
        const keychain = await getKeychain();

        let slot;
        try {
          slot = await profileStore.addKeySlot(tenantId, {
            provider,
            name: slotName,
            fingerprint: makeKeyFingerprint(keyValue)
          });
        } catch (error) {
          const knownSlots = await profileStore.listKeySlots(tenantId, provider);
          const existing = knownSlots.find((item) => item.name.toLowerCase() === slotName.toLowerCase());
          if (!existing) {
            throw error;
          }
          slot = await profileStore.updateKeySlot(tenantId, provider, existing.slotId, {
            fingerprint: makeKeyFingerprint(keyValue)
          });
        }
        await keychain.setSlotSecret(tenantId, provider, slot.slotId, keyValue);

        if (options.setActive !== false) {
          await profileStore.setActiveKeySlot(tenantId, provider, slot.slotId);
        }

        const client = await withClient(tenantId);
        const readiness = await evaluateReadiness({
          profileStore,
          keychain,
          tenantId,
          client,
          checkConnectivity: true
        });

        if ((options.format ?? 'json') === 'text') {
          stdout.write(formatReadinessText(readiness));
          return;
        }

        printJson(stdout, {
          tenantId,
          provider,
          slot,
          readiness
        });
      }
    );

  const config = program.command('config').description('Configuration and diagnostics');

  config
    .command('doctor')
    .description('Run connectivity and readiness diagnostics')
    .option('--tenant <tenantId>', 'Tenant id override')
    .option('--retry-attempts <n>', 'Retry attempts for HTTP transport', '2')
    .option('--retry-backoff-ms <n>', 'Retry backoff (ms) for HTTP transport', '250')
    .option('--format <format>', 'json|text', 'json')
    .action(async (options: { tenant?: string; retryAttempts?: string; retryBackoffMs?: string; format?: OutputFormat }) => {
      const retryAttempts = Number.parseInt(options.retryAttempts ?? '2', 10);
      const retryBackoffMs = Number.parseInt(options.retryBackoffMs ?? '250', 10);
      const keychain = await getKeychain();
      const client = await withClient(options.tenant, {
        attempts: Number.isFinite(retryAttempts) ? retryAttempts : 2,
        backoffMs: Number.isFinite(retryBackoffMs) ? retryBackoffMs : 250
      });

      const readiness = await evaluateReadiness({
        profileStore,
        keychain,
        tenantId: options.tenant,
        client,
        checkConnectivity: true
      });

      if ((options.format ?? 'json') === 'text') {
        stdout.write(formatReadinessText(readiness));
        return;
      }

      printJson(stdout, {
        retryAttempts,
        retryBackoffMs,
        readiness
      });
    });

  program
    .command('tui')
    .description('Launch the full-screen TUI')
    .option('--headless', 'Run headless visual mode for agents')
    .option('--screen <screen>', 'setup|config|dashboard|spaces|devices|incidents|tickets|copilot', 'dashboard')
    .option('--format <format>', 'json|text', 'json')
    .option('--once', 'Render one frame and exit (default behavior)')
    .option('--follow', 'Continuously stream frames')
    .option('--interval-ms <ms>', 'Polling interval for --follow', '2000')
    .option('--tenant <tenantId>', 'Tenant id override')
    .option('--no-motion', 'Disable motion and animation effects')
    .option('--debug', 'Enable TUI debug logging')
    .option('--debug-log <path>', 'Write TUI debug logs to this file')
    .action(async (options: {
      headless?: boolean;
      screen?: string;
      format?: string;
      once?: boolean;
      follow?: boolean;
      intervalMs?: string;
      tenant?: string;
      motion?: boolean;
      debug?: boolean;
      debugLog?: string;
    }) => {
      const keychain = await getKeychain();
      const client = createXyteClient({ profileStore, keychain });
      const llmService = new LLMService({ profileStore, keychain });

      const allowedScreens: TuiScreenId[] = ['setup', 'config', 'dashboard', 'spaces', 'devices', 'incidents', 'tickets', 'copilot'];
      const screen = (options.screen ?? 'dashboard') as TuiScreenId;
      if (!allowedScreens.includes(screen)) {
        throw new Error(`Invalid screen: ${options.screen}`);
      }

      const format = options.format ?? 'json';
      if (!['json', 'text'].includes(format)) {
        throw new Error(`Invalid format: ${options.format}`);
      }

      const follow = options.once ? false : Boolean(options.follow);
      const intervalMs = Number.parseInt(options.intervalMs ?? '2000', 10);
      const motionEnabled = options.motion === false ? false : undefined;

      await runTui({
        client,
        llm: llmService,
        profileStore,
        keychain,
        initialScreen: screen,
        headless: Boolean(options.headless),
        format: format as OutputFormat,
        motionEnabled,
        follow,
        intervalMs: Number.isFinite(intervalMs) ? intervalMs : 2000,
        tenantId: options.tenant,
        output: stdout,
        debug: options.debug,
        debugLogPath: options.debugLog
      });
    });

  program.exitOverride((error) => {
    if (error.code === 'commander.helpDisplayed') {
      return;
    }
    throw error;
  });

  program.configureOutput({
    writeErr: (text: string) => {
      stderr.write(text);
    }
  });

  return program;
}

export async function runCli(argv = process.argv, runtime: CliRuntime = {}): Promise<void> {
  const program = createCli(runtime);
  await program.parseAsync(argv);
}
