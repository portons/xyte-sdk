import { describe, expect, it, vi } from 'vitest';

import { createCli } from '../src/cli/index';
import { MemoryKeychain } from '../src/secure/keychain';
import { MemoryProfileStore } from './support/memory-profile-store';

describe('cli integration', () => {
  it('allows read-only calls without --allow-write', async () => {
    const profileStore = new MemoryProfileStore();
    await profileStore.upsertTenant({ id: 'acme' });
    await profileStore.setActiveTenant('acme');

    const keychain = new MemoryKeychain();
    await keychain.setSecret('acme', 'xyte-device', 'device-key');

    const stdout = { write: vi.fn() };
    const stderr = { write: vi.fn() };

    const program = createCli({ profileStore, keychain, stdout, stderr });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ result: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      )
    );

    await program.parseAsync([
      'node',
      'xyte',
      'call',
      'device.registration.getChildDevices',
      '--tenant',
      'acme',
      '--path-json',
      '{"device_id":"dev-1"}'
    ]);

    expect(stdout.write).toHaveBeenCalled();
  });

  it('blocks write calls without --allow-write', async () => {
    const profileStore = new MemoryProfileStore();
    const keychain = new MemoryKeychain();

    const program = createCli({ profileStore, keychain, stdout: { write: vi.fn() }, stderr: { write: vi.fn() } });

    await expect(
      program.parseAsync(['node', 'xyte', 'call', 'organization.commands.sendCommand'])
    ).rejects.toThrow('--allow-write');
  });

  it('requires --confirm for destructive calls', async () => {
    const profileStore = new MemoryProfileStore();
    const keychain = new MemoryKeychain();

    const program = createCli({ profileStore, keychain, stdout: { write: vi.fn() }, stderr: { write: vi.fn() } });

    await expect(
      program.parseAsync(['node', 'xyte', 'call', 'organization.commands.cancelCommand', '--allow-write'])
    ).rejects.toThrow('--confirm organization.commands.cancelCommand');
  });

  it('passes headless tui options through cli command', async () => {
    const profileStore = new MemoryProfileStore();
    const keychain = new MemoryKeychain();
    const runTui = vi.fn().mockResolvedValue(undefined);

    const program = createCli({
      profileStore,
      keychain,
      runTui,
      stdout: { write: vi.fn() },
      stderr: { write: vi.fn() }
    });

    await program.parseAsync([
      'node',
      'xyte',
      'tui',
      '--headless',
      '--screen',
      'spaces',
      '--format',
      'json',
      '--once',
      '--tenant',
      'acme',
      '--no-motion',
      '--debug',
      '--debug-log',
      '/tmp/xyte-debug-test.log'
    ]);

    expect(runTui).toHaveBeenCalledTimes(1);
    const args = runTui.mock.calls[0][0];
    expect(args.headless).toBe(true);
    expect(args.initialScreen).toBe('spaces');
    expect(args.format).toBe('json');
    expect(args.follow).toBe(false);
    expect(args.motionEnabled).toBe(false);
    expect(args.tenantId).toBe('acme');
    expect(args.debug).toBe(true);
    expect(args.debugLogPath).toBe('/tmp/xyte-debug-test.log');
  });

  it('does not force motion setting when --no-motion is omitted', async () => {
    const profileStore = new MemoryProfileStore();
    const keychain = new MemoryKeychain();
    const runTui = vi.fn().mockResolvedValue(undefined);

    const program = createCli({
      profileStore,
      keychain,
      runTui,
      stdout: { write: vi.fn() },
      stderr: { write: vi.fn() }
    });

    await program.parseAsync([
      'node',
      'xyte',
      'tui',
      '--headless',
      '--screen',
      'dashboard',
      '--format',
      'json',
      '--once'
    ]);

    expect(runTui).toHaveBeenCalledTimes(1);
    const args = runTui.mock.calls[0][0];
    expect(args.headless).toBe(true);
    expect(args.motionEnabled).toBeUndefined();
  });

  it('prints setup status in json format', async () => {
    const profileStore = new MemoryProfileStore();
    const keychain = new MemoryKeychain();
    const stdout = { write: vi.fn() };
    const stderr = { write: vi.fn() };

    const program = createCli({ profileStore, keychain, stdout, stderr });
    await program.parseAsync(['node', 'xyte', 'setup', 'status', '--format', 'json']);

    const output = stdout.write.mock.calls.map((call) => String(call[0])).join('');
    const parsed = JSON.parse(output);
    expect(parsed.state).toBe('needs_setup');
  });

  it('supports named auth key lifecycle basics', async () => {
    const profileStore = new MemoryProfileStore();
    await profileStore.upsertTenant({ id: 'acme' });
    await profileStore.setActiveTenant('acme');
    const keychain = new MemoryKeychain();
    const stdout = { write: vi.fn() };
    const stderr = { write: vi.fn() };

    const program = createCli({ profileStore, keychain, stdout, stderr });
    await program.parseAsync([
      'node',
      'xyte',
      'auth',
      'key',
      'add',
      '--tenant',
      'acme',
      '--provider',
      'xyte-org',
      '--name',
      'primary',
      '--key',
      'org-key'
    ]);

    stdout.write.mockClear();
    await program.parseAsync([
      'node',
      'xyte',
      'auth',
      'key',
      'list',
      '--tenant',
      'acme',
      '--provider',
      'xyte-org',
      '--format',
      'json'
    ]);

    const output = stdout.write.mock.calls.map((call) => String(call[0])).join('');
    const parsed = JSON.parse(output);
    expect(parsed.slots.length).toBe(1);
    expect(parsed.slots[0].hasSecret).toBe(true);
  });

  it('reports install diagnostics', async () => {
    const profileStore = new MemoryProfileStore();
    const keychain = new MemoryKeychain();
    const stdout = { write: vi.fn() };
    const stderr = { write: vi.fn() };
    const program = createCli({ profileStore, keychain, stdout, stderr });

    await program.parseAsync(['node', 'xyte', 'doctor', 'install', '--format', 'json']);

    const output = stdout.write.mock.calls.map((call) => String(call[0])).join('');
    const parsed = JSON.parse(output);
    expect(['ok', 'missing', 'mismatch']).toContain(parsed.status);
    expect(parsed.expectedPath).toContain('bin/xyte');
  });
});
