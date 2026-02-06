# `@xyte/sdk`

Production-focused TypeScript SDK + CLI + full-screen TUI for Xyte public APIs, with multi-tenant profiles, named API-key slots, setup gating, and headless visual parity for agents.

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
- Headless scene output for agents (`json` + `text`)
- Pluggable LLM providers (OpenAI, Anthropic, OpenAI-compatible)

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
# Interactive setup
xyte setup run

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
- `k` add key slot + secret
- `p` set active key slot
- `c` connectivity test
- `r` refresh readiness

Config screen actions:
- `a` add slot
- `n` rename slot
- `u` set active slot
- `e` edit key value
- `x` remove slot (confirm dialog)
- `c` run connectivity doctor

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
xyte tui --headless --screen spaces --format text --follow --interval-ms 2000
```

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
