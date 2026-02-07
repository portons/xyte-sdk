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
- fleet insights, deep-dive analytics, or report generation for operations reviews
- MCP tool server usage for external agent orchestration

## Deterministic Execution Order

1. First-run onboarding (preferred)
- `xyte` (TTY wizard: asks XYTE API key + optional tenant label, then opens dashboard)
- non-interactive: `xyte setup run --non-interactive --tenant <tenant-id> --key <value>`

2. Install diagnostics
- `xyte doctor install --format json`

3. Readiness/setup checks
- `xyte setup status --format json [--tenant <tenant-id>]`
- `xyte config doctor --format json [--tenant <tenant-id>]`

4. Tenant + key-slot auth
- `xyte tenant add <tenant-id> --name "<name>"`
- `xyte tenant use <tenant-id>`
- `xyte auth key add --tenant <tenant-id> --provider xyte-org --name primary --key <value> --set-active`
- `xyte auth key list --tenant <tenant-id> --format json`

5. Endpoint discovery
- `xyte list-endpoints`
- `xyte describe-endpoint <endpoint-key>`

6. Guarded invocation
- `xyte call <endpoint-key> --tenant <tenant-id> ...`
- add `--allow-write` for non-read endpoints
- add `--confirm <endpoint-key>` for destructive endpoints (`DELETE`)

7. Headless verification
- run one-shot headless snapshots and verify `meta` contract fields before automation loops

8. Inspect + reporting
- `xyte inspect fleet --tenant <tenant-id> --format json|ascii`
- `xyte inspect deep-dive --tenant <tenant-id> --window 24 --format json|ascii|markdown`
- `xyte report generate --tenant <tenant-id> --input <deep-dive.json> --out <path> [--format pdf|markdown]`

9. MCP server (agent tool bridge)
- `xyte mcp serve`

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
- Prefer `xyte call --output-mode envelope` for agent loops that need request/guard/retry metadata.
- Headless mode is JSON-only; always pass `--format json`.
- Prefer one-shot headless (`--once`) for checks; use `--follow` only when continuous monitoring is required.
- For blocked operational screens in headless mode, expect redirect to `setup` with `meta.redirectedFrom`.

## Core Command Recipes

Readiness snapshot:
```bash
xyte setup status --tenant <tenant-id> --format json
```

Endpoint invocation (read):
```bash
xyte call organization.devices.getDevices --tenant <tenant-id> --output-mode envelope
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

Headless one-shot (JSON only):
```bash
xyte tui --headless --screen setup --format json --once --tenant <tenant-id>
```

Fleet summary:
```bash
xyte inspect fleet --tenant <tenant-id> --format json
```

Deep dive:
```bash
xyte inspect deep-dive --tenant <tenant-id> --window 24 --format markdown
```

Report generation:
```bash
xyte report generate \
  --tenant <tenant-id> \
  --input /tmp/deep-dive.json \
  --out /tmp/xyte-findings.pdf \
  --format pdf
```

MCP server:
```bash
xyte mcp serve
```

## Persona Playbooks

### MSP Daily Fleet Check
1. `xyte setup status --tenant <tenant-id> --format json`
2. `xyte inspect fleet --tenant <tenant-id> --format ascii`
3. `xyte inspect deep-dive --tenant <tenant-id> --window 24 --format json > /tmp/deep-dive.json`
4. `xyte report generate --tenant <tenant-id> --input /tmp/deep-dive.json --out /tmp/msp-daily.md --format markdown`

Acceptance checks:
- Fleet output includes `schemaVersion = xyte.inspect.fleet.v1`
- Deep-dive output includes `schemaVersion = xyte.inspect.deep-dive.v1`
- Report output includes `schemaVersion = xyte.report.v1`

### Manufacturer Incident Concentration
1. `xyte inspect deep-dive --tenant <tenant-id> --window 72 --format json`
2. Review `topIncidentDevices`, `churn24h.byDevice`, `dataQuality.statusMismatches`
3. For risky devices, use guarded command preview:
   - `xyte describe-endpoint organization.commands.sendCommand`
   - `xyte call organization.commands.sendCommand --tenant <tenant-id> --allow-write --path-json '{"device_id":"<id>"}' --body-json '{"name":"reboot"}' --output-mode envelope`

Acceptance checks:
- Non-read calls include `--allow-write`
- Envelope output captures `guard`, `response.retryCount`, and any `error`

### Service Desk Triage
1. `xyte inspect deep-dive --tenant <tenant-id> --window 24 --format markdown`
2. Correlate `ticketPosture.oldestOpenTickets` with `activeIncidentAging`
3. Generate sanitized report:
   - `xyte report generate --tenant <tenant-id> --input /tmp/deep-dive.json --out /tmp/helpdesk-summary.pdf --format pdf`

Acceptance checks:
- Default report masks raw IDs unless `--include-sensitive` is passed
- Report generation returns `schemaVersion = xyte.report.v1`

## Utility Scripts

- CLI launcher: `scripts/run_xyte_cli.sh`
- endpoint query/filter report: `scripts/endpoint_filters_report.sh`
- headless smoke validation: `scripts/check_headless.sh`
- full contract validation: `scripts/validate_agent_contracts.sh <tenant-id>`
- JSON schema validator helper: `scripts/validate_with_schema.js <schema.json> <data.json>`

## References (Load As Needed)

- Endpoint + filter/pagination guide: `references/endpoints.md`
- Headless flow recipes + branching: `references/tui-flows.md`
- Headless JSON contract + rendering metadata: `references/headless-contract.md`
