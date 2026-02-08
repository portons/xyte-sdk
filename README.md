# `@xyte/sdk`

Production-focused TypeScript SDK + CLI + full-screen TUI for Xyte public APIs, with multi-tenant profiles, named API-key slots, setup gating, and headless visual parity for agents.

> All examples and screenshots in this README are synthetic demo data (no production tenant data).

## Features

- Full public endpoint catalog synced from `../server/docs/api/Xyte Public/...`
- Route drift corrections for known docs/backend mismatches
- SDK namespaces:
  - `client.device.*`
  - `client.organization.*`
  - `client.partner.*`
  - `client.call(endpointKey, args)`
- Multi-tenant profile management
- Named key slots per tenant+provider (`auth key add/list/use/rename/update/remove/test`)
- Strict setup readiness gate in TUI/headless (no first-run empty dashboard)
- Resilient retry/reconnect surfacing in TUI/headless metadata
- Interactive TUI screens:
  - setup, config, dashboard, spaces, devices, incidents, tickets, copilot
- Headless scene output for agents (`json` NDJSON, machine-only)
- Versioned machine contracts for:
  - endpoint call envelope (`xyte.call.envelope.v1`)
  - headless frames (`xyte.headless.frame.v1`)
  - fleet inspect/deep-dive/report outputs
- Deterministic fleet analytics + report generation (`inspect`/`report`)
- MCP stdio server for tool-based agents (`xyte mcp serve`)
- Pluggable LLM providers (OpenAI, Anthropic, OpenAI-compatible)

## Landing Page

- Project landing page: `docs/index.html`
- Open locally in browser:

```bash
open docs/index.html
```

## Visual Tour (Synthetic)

TUI dashboard (synthetic):

![XYTE TUI dashboard synthetic screenshot](docs/media/tui-dashboard-synthetic.png)

Headless runtime frame (synthetic):

![XYTE headless JSON synthetic screenshot](docs/media/headless-frame-synthetic.png)

## End-to-End Usage (Install -> Run -> Operate)

1. Install dependencies and build:

```bash
npm install
npm run build
```

2. Run first-time onboarding (interactive):

```bash
xyte
```

This prompts for:
- XYTE API key
- optional tenant label (default `default`)

3. Verify readiness and connectivity:

```bash
xyte setup status --tenant acme-demo --format json
xyte config doctor --tenant acme-demo --format json
```

4. Inspect fleet and generate report:

```bash
xyte inspect fleet --tenant acme-demo --format json
xyte inspect deep-dive --tenant acme-demo --window 24 --format json > /tmp/deep-dive.json
xyte report generate --tenant acme-demo --input /tmp/deep-dive.json --out /tmp/xyte-findings.pdf
```

5. Run headless mode for agent loops:

```bash
xyte tui --headless --screen dashboard --format json --once --tenant acme-demo
```

6. Start MCP server for tool-use clients:

```bash
xyte mcp serve
```

## Requirements

- Node 18+
- Access to Xyte API keys
- Secure key storage backend:
  - macOS Keychain (default on macOS)
  - Linux `secret-tool`

## Install (local package mode)

```bash
npm install
npm run sync:endpoints
npm run typecheck
npm test
npm run build
```

## Global CLI Install (from this repo)

```bash
npm run install:global
xyte --help
```

If `xyte` is missing from PATH or points to another install:

```bash
xyte doctor install --format text
npm run reinstall:global
```

## First-Run Setup (Recommended)

```bash
# Simplest path: run bare command
xyte

# Read current readiness
xyte setup status --format text

# Connectivity diagnostics
xyte config doctor --format text

# Install diagnostics
xyte doctor install --format text
```

Non-interactive setup example:

```bash
xyte setup run \
  --non-interactive \
  --tenant acme \
  --key "$XYTE_ORG_KEY"
```

Advanced provider/slot setup (optional):

```bash
xyte setup run \
  --advanced \
  --non-interactive \
  --tenant acme \
  --name "Acme" \
  --provider xyte-org \
  --slot-name primary \
  --key "$XYTE_ORG_KEY"
```

## Tenant + Named Key Slots

```bash
# Tenant lifecycle
xyte tenant add acme --name "Acme"
xyte tenant use acme
xyte tenant list

# Add named slots
xyte auth key add --tenant acme --provider xyte-org --name primary --key "$XYTE_ORG_KEY" --set-active
xyte auth key add --tenant acme --provider openai --name gpt-main --key "$OPENAI_API_KEY" --set-active

# Inspect/switch slots
xyte auth key list --tenant acme --format text
xyte auth key use --tenant acme --provider xyte-org --slot primary

# Update/rename/test/remove
xyte auth key update --tenant acme --provider xyte-org --slot primary --key "$NEW_XYTE_KEY"
xyte auth key rename --tenant acme --provider xyte-org --slot primary --name prod-primary
xyte auth key test --tenant acme --provider xyte-org --slot prod-primary
xyte auth key remove --tenant acme --provider xyte-org --slot prod-primary --confirm
```

Legacy wrappers still work (slot `default`) with deprecation warnings:

```bash
xyte auth set-key --tenant acme --provider xyte-org --key "$XYTE_ORG_KEY"
xyte auth clear-key --tenant acme --provider xyte-org
```

## CLI Endpoint Usage

```bash
xyte list-endpoints
xyte describe-endpoint organization.devices.getDevices
xyte call organization.devices.getDevices --tenant acme

# agent-friendly envelope
xyte call organization.devices.getDevices --tenant acme --output-mode envelope
```

Mutation guard example:

```bash
xyte call organization.commands.sendCommand \
  --tenant acme \
  --allow-write \
  --path-json '{"device_id":"DEVICE_ID"}' \
  --body-json '{"name":"reboot"}'
```

Destructive guard example:

```bash
xyte call organization.commands.cancelCommand \
  --tenant acme \
  --allow-write \
  --confirm organization.commands.cancelCommand \
  --path-json '{"device_id":"DEVICE_ID","command_id":"COMMAND_ID"}'
```

## TUI

```bash
xyte tui
```

The app enforces setup gating: if readiness is not complete, you start in `Setup` (`u`) and operational screens are blocked until ready.

Global keys:
- `←/→` switch tabs
- `Ctrl+←/→` (or `Shift+←/→`) move pane focus; at pane boundary switch tabs
- `↑/↓` move selection or scroll active pane
- `Enter` run primary action in active pane
- `u` setup
- `g` config
- `d/s/v/i/t/p` dashboard/spaces/devices/incidents/tickets/copilot
- `r` refresh/retry now
- `/` search/filter
- `o` provider/model override
- `?` help
- `q` quit

Setup screen actions:
- `a` add tenant
- `u` set active tenant
- `k` run guided key wizard (provider -> slot -> secret -> review)
- `p` set active key slot
- `c` connectivity test
- `r` refresh readiness

Config screen actions:
- `a` add slot (guided wizard)
- `n` rename slot
- `u` set active slot
- `e` update selected slot key (guided wizard)
- `x` remove slot (confirm dialog)
- `c` run connectivity doctor

Readability updates:
- compact table layout with consistent spacing and safer column widths
- middle ellipsis for IDs/hashes, end ellipsis for names/subjects/paths
- full details stay available in detail panes (with safe preview truncation when needed)

Ticket actions:
- `m` draft reply suggestions
- `R` resolve selected ticket
- `rr` resolve selected ticket (single `r` remains global refresh)

Input loop reliability:
- key events are serialized (single in-flight handler)
- global shortcuts are suppressed while modal prompts/messages are active
- bounded key queue with backpressure/drop counters (exposed in headless metadata)

Responsiveness guarantees:
- screen refreshes run in non-blocking background runtime (no blocking network awaits in key dispatch path)
- stale refresh completions are discarded after screen transitions
- runtime refresh state is surfaced in footer/headless metadata (`idle/loading/retrying/error`)

Incidents stability notes:
- malformed incident payloads are normalized defensively before render/triage
- triage output falls back safely when optional fields are missing
- incidents table/detail/triage panes fully support arrow navigation
- deep/cyclic payload previews are rendered through safe serialization (truncated when needed)

TUI debugging:
- run with explicit log path:
  - `xyte tui --debug --debug-log /tmp/xyte-tui.log`
- or enable via env:
  - `XYTE_TUI_DEBUG=1 xyte tui`
  - `XYTE_TUI_DEBUG_LOG=/tmp/xyte-tui.log xyte tui`
- logs include:
  - key enqueue/dispatch events (secrets redacted while prompt is active)
  - screen mount/unmount and runtime refresh state transitions
  - unhandled rejection/exception traces

Motion controls:
- per run: `xyte tui --no-motion`
- global: `XYTE_TUI_REDUCED_MOTION=1`

## Headless Mode (Agent-Friendly)

```bash
# one-shot setup frame
xyte tui --headless --screen setup --format json --once

# operational request; auto-redirects to setup if readiness is incomplete
xyte tui --headless --screen dashboard --format json --once

# streaming mode with reconnect metadata
xyte tui --headless --screen spaces --format json --follow --interval-ms 2000
```

Headless JSON frames now include:
- `schemaVersion` (`xyte.headless.frame.v1`)
- `sessionId` (stable per run)
- `sequence` (monotonic per stream)
- `meta.contract` (contract metadata)

Canonical schemas are under `docs/schemas/`.
`--format text` is not supported in headless mode.

## Fleet Insights and Reports

```bash
# compact fleet health summary
xyte inspect fleet --tenant acme --format ascii

# deep-dive analytics
xyte inspect deep-dive --tenant acme --window 24 --format json > /tmp/deep-dive.json

# generate markdown or pdf report
xyte report generate --tenant acme --input /tmp/deep-dive.json --out /tmp/xyte-report.pdf
```

Default output is a branded human-readable PDF (sanitized by default). Use `--format markdown` for text output and `--include-sensitive` to opt in full IDs.

## Machine Structure Examples

Call envelope (`xyte.call.envelope.v1`):

```json
{
  "schemaVersion": "xyte.call.envelope.v1",
  "requestId": "8fcf4f58-9f76-4dcb-bf6a-117a78f00ed3",
  "tenantId": "acme",
  "endpointKey": "organization.devices.getDevices",
  "method": "GET",
  "response": { "status": 200, "durationMs": 238, "retryCount": 0, "data": { "items": [] } },
  "error": null
}
```

Headless frame (`xyte.headless.frame.v1`):

```json
{
  "schemaVersion": "xyte.headless.frame.v1",
  "sessionId": "2c17c9b8-9a26-4a5d-b8f4-7302f2cb4d24",
  "sequence": 3,
  "screen": "dashboard",
  "meta": { "contract": { "frameVersion": "xyte.headless.frame.v1" } }
}
```

Fleet inspect (`xyte.inspect.fleet.v1`):

```json
{
  "schemaVersion": "xyte.inspect.fleet.v1",
  "tenantId": "acme",
  "totals": { "devices": 68, "spaces": 133, "incidents": 240, "tickets": 5 },
  "highlights": { "offlineDevices": 48, "offlinePct": 70.6, "activeIncidents": 10, "activeIncidentPct": 4.2, "openTickets": 5 }
}
```

Deep dive (`xyte.inspect.deep-dive.v1`):

```json
{
  "schemaVersion": "xyte.inspect.deep-dive.v1",
  "tenantId": "acme",
  "windowHours": 24,
  "summary": ["Devices: 68 total, 48 offline (70.6%)."],
  "topIncidentDevices": [{ "device": "Mac Edge Agent", "incidentCount": 145, "activeIncidents": 1 }]
}
```

Report metadata (`xyte.report.v1`):

```json
{
  "schemaVersion": "xyte.report.v1",
  "tenantId": "acme",
  "format": "pdf",
  "outputPath": "/tmp/xyte-findings.pdf",
  "includeSensitive": false
}
```

## MCP Server

```bash
xyte mcp serve
```

Exposed tools:
- `xyte_setup_status`
- `xyte_config_doctor`
- `xyte_list_endpoints`
- `xyte_describe_endpoint`
- `xyte_call`
- `xyte_inspect_fleet`
- `xyte_report_generate`

## LLM Provider Configuration

```bash
# global defaults
xyte profile llm set-provider --provider openai
xyte profile llm set-model --model gpt-4.1-mini

# tenant overrides
xyte profile llm set-provider --tenant acme --provider anthropic
xyte profile llm set-model --tenant acme --model claude-3-5-haiku-latest
```

OpenAI-compatible endpoint per tenant:

```bash
xyte tenant add acme --openai-compatible-url http://localhost:11434
xyte auth key add --tenant acme --provider openai-compatible --name local-ollama --key "$LOCAL_GATEWAY_KEY" --set-active
```

## SDK Usage

```ts
import { createXyteClient } from '@xyte/sdk';

const client = createXyteClient();
const devices = await client.organization.getDevices({ tenantId: 'acme' });
const tickets = await client.call('partner.tickets.getTickets', { tenantId: 'acme' });
```

## Skill Package

Skill files are in `skills/xyte`:
- `SKILL.md`
- `agents/openai.yaml`
- `references/endpoints.md`
- `references/tui-flows.md`
- `scripts/run_xyte_cli.sh`

## Development Scripts

- `npm run sync:endpoints`
- `npm run docs:endpoints`
- `npm run validate:routes`
- `npm run install:global`
- `npm run uninstall:global`
- `npm run reinstall:global`
- `npm run typecheck`
- `npm test`
- `npm run build`
