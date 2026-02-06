---
name: xyte
description: Use when the user needs to operate Xyte through the @xyte/sdk CLI or headless TUI frames (setup, tenants, key slots, endpoint calls, incidents/tickets/devices/spaces) with deterministic commands and guarded mutations.
---

# XYTE (CLI + Headless)

Use this skill when tasks involve Xyte operations via `xyte` commands or `xyte tui --headless` output. Prefer deterministic CLI/headless flows over interactive TUI actions.

## Trigger Conditions

Apply this skill when user intent includes any of:
- setup/readiness checks for Xyte access
- tenant/key-slot management
- endpoint discovery and API calls
- fleet inspection via devices/incidents/tickets/spaces
- agent-safe JSON frame consumption from headless mode

## Deterministic Execution Order

1. Install diagnostics
- `xyte doctor install --format json`

2. Readiness/setup checks
- `xyte setup status --format json [--tenant <tenant-id>]`
- `xyte config doctor --format json [--tenant <tenant-id>]`

3. Tenant + key-slot auth
- `xyte tenant add <tenant-id> --name "<name>"`
- `xyte tenant use <tenant-id>`
- `xyte auth key add --tenant <tenant-id> --provider xyte-org --name primary --key <value> --set-active`
- `xyte auth key list --tenant <tenant-id> --format json`

4. Endpoint discovery
- `xyte list-endpoints`
- `xyte describe-endpoint <endpoint-key>`

5. Guarded invocation
- `xyte call <endpoint-key> --tenant <tenant-id> ...`
- add `--allow-write` for non-read endpoints
- add `--confirm <endpoint-key>` for destructive endpoints (`DELETE`)

6. Headless verification
- run one-shot headless snapshots and verify `meta` contract fields before automation loops

## Safety Policy (Mandatory)

- Default to read-only.
- Never run write endpoints unless user explicitly requested mutation.
- Always include write guards in examples:
  - non-read: `--allow-write`
  - delete: `--confirm <endpoint-key>`
- Treat copilot output as advisory only.

## Determinism Rules for Agents

- Always pass `--tenant <tenant-id>` in automation.
- Use `--format json` for machine steps and parse fields directly.
- Prefer one-shot headless (`--once`) for checks; use `--follow` only when continuous monitoring is required.
- For blocked operational screens in headless mode, expect redirect to `setup` with `meta.redirectedFrom`.

## Core Command Recipes

Readiness snapshot:
```bash
xyte setup status --tenant <tenant-id> --format json
```

Endpoint invocation (read):
```bash
xyte call organization.devices.getDevices --tenant <tenant-id>
```

Endpoint invocation (write):
```bash
xyte call organization.commands.sendCommand \
  --tenant <tenant-id> \
  --allow-write \
  --path-json '{"device_id":"<device-id>"}' \
  --body-json '{"name":"reboot"}'
```

Endpoint invocation (delete):
```bash
xyte call organization.commands.cancelCommand \
  --tenant <tenant-id> \
  --allow-write \
  --confirm organization.commands.cancelCommand \
  --path-json '{"device_id":"<device-id>","command_id":"<command-id>"}'
```

Headless one-shot:
```bash
xyte tui --headless --screen setup --format json --once --tenant <tenant-id>
```

## Utility Scripts

- CLI launcher: `scripts/run_xyte_cli.sh`
- endpoint query/filter report: `scripts/endpoint_filters_report.sh`
- headless smoke validation: `scripts/check_headless.sh`

## References (Load As Needed)

- Endpoint + filter/pagination guide: `references/endpoints.md`
- Headless flow recipes + branching: `references/tui-flows.md`
- Headless JSON contract + rendering metadata: `references/headless-contract.md`
