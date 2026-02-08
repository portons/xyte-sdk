---
name: xyte
description: "Use for @xyte/sdk operations: first-run setup, tenant/key auth, guarded endpoint calls, inspect/report generation, JSON-only headless TUI snapshots, and MCP tool serving with schema-validated outputs."
---

# XYTE Skill Router (One-Stop, Agent-Native)

Last updated: 2026-02-08

This skill is the entrypoint for deterministic Xyte operations via `xyte`. It is optimized for low-context agent routing: short policies, exact commands, and references/scripts for deeper procedures.

## Purpose and Trigger Conditions

Use when the request involves any of:
- setup/readiness for Xyte access
- tenant/key-slot management
- endpoint discovery or endpoint invocation
- fleet inspection/deep-dive/reporting
- headless TUI JSON frame consumption
- MCP tool bridge for external agents

## Non-Goals

- Do not use this skill for arbitrary product strategy or generic markdown authoring.
- Do not perform writes by default.
- Do not use headless text output; headless is JSON-only.

## Mandatory Safety Rules

- Default to read-only.
- Require explicit user intent before writes.
- Non-read endpoint calls must include `--allow-write`.
- Destructive endpoint calls must include `--confirm <endpoint-key>`.
- In automation, always pass `--tenant <tenant-id>`.
- Treat copilot output as advisory only.

## Deterministic Execution Order

1. Setup/readiness:
- `xyte doctor install --format json`
- `xyte setup status --tenant <tenant-id> --format json`
- `xyte config doctor --tenant <tenant-id> --format json`

2. Auth/tenant (if missing/incomplete):
- `xyte setup run --non-interactive --tenant <tenant-id> --key <value>`
- `xyte tenant use <tenant-id>`
- `xyte auth key list --tenant <tenant-id> --format json`

3. Endpoint operations:
- `xyte list-endpoints --tenant <tenant-id>`
- `xyte describe-endpoint <endpoint-key>`
- `xyte call <endpoint-key> --tenant <tenant-id> ...`

4. Insights/reports:
- `xyte inspect fleet --tenant <tenant-id> --format json`
- `xyte inspect deep-dive --tenant <tenant-id> --window <hours> --format json`
- `xyte report generate --tenant <tenant-id> --input <deep-dive.json> --out <report.pdf>`

5. Headless and MCP:
- `xyte tui --headless --screen <screen> --format json --once --tenant <tenant-id>`
- `xyte mcp serve`

## Workflow Selector

| Intent | Primary command/script |
| --- | --- |
| First-time onboarding (interactive) | `xyte` |
| Setup non-interactive | `xyte setup run --non-interactive --tenant <tenant-id> --key <value>` |
| Readiness snapshot | `xyte setup status --tenant <tenant-id> --format json` |
| Connectivity diagnostics | `xyte config doctor --tenant <tenant-id> --format json` |
| Read endpoint call + envelope | `xyte call <endpoint-key> --tenant <tenant-id> --output-mode envelope --strict-json` |
| Guarded write endpoint call | `xyte call <endpoint-key> --tenant <tenant-id> --allow-write ...` |
| Guarded delete endpoint call | `xyte call <endpoint-key> --tenant <tenant-id> --allow-write --confirm <endpoint-key> ...` |
| Fleet summary | `xyte inspect fleet --tenant <tenant-id> --format json` |
| Deep-dive analytics | `xyte inspect deep-dive --tenant <tenant-id> --window <hours> --format json` |
| PDF report generation | `xyte report generate --tenant <tenant-id> --input <deep-dive.json> --out <path>.pdf` |
| Headless snapshot (JSON NDJSON) | `xyte tui --headless --screen <screen> --format json --once --tenant <tenant-id>` |
| Continuous headless monitoring | `xyte tui --headless --screen <screen> --format json --follow --interval-ms <ms> --tenant <tenant-id>` |
| MCP tool bridge | `xyte mcp serve` |
| Contract smoke validation | `skills/xyte/scripts/validate_agent_contracts.sh <tenant-id>` |
| Headless contract validation | `skills/xyte/scripts/check_headless.sh <tenant-id>` |

## Minimal Command Recipes

Read call:
```bash
xyte call organization.devices.getDevices --tenant <tenant-id> --output-mode envelope --strict-json
```

Write call (guarded):
```bash
xyte call organization.commands.sendCommand \
  --tenant <tenant-id> \
  --allow-write \
  --path-json '{"device_id":"<device-id>"}' \
  --body-json '{"name":"reboot"}'
```

Delete call (guarded):
```bash
xyte call organization.commands.cancelCommand \
  --tenant <tenant-id> \
  --allow-write \
  --confirm organization.commands.cancelCommand \
  --path-json '{"device_id":"<device-id>","command_id":"<command-id>"}'
```

Headless:
```bash
xyte tui --headless --screen dashboard --format json --once --tenant <tenant-id>
```

Inspect + report:
```bash
xyte inspect deep-dive --tenant <tenant-id> --window 24 --format json > /tmp/deep-dive.json
xyte report generate --tenant <tenant-id> --input /tmp/deep-dive.json --out /tmp/xyte-findings.pdf
```

## Contract IDs and Schemas

Schema/version IDs:
- call envelope: `xyte.call.envelope.v1`
- headless frame: `xyte.headless.frame.v1`
- inspect fleet: `xyte.inspect.fleet.v1`
- inspect deep dive: `xyte.inspect.deep-dive.v1`
- report metadata: `xyte.report.v1`

Canonical schemas:
- `/Users/porton/Projects/xyte-sdk/docs/schemas/call-envelope.v1.schema.json`
- `/Users/porton/Projects/xyte-sdk/docs/schemas/headless-frame.v1.schema.json`
- `/Users/porton/Projects/xyte-sdk/docs/schemas/inspect-fleet.v1.schema.json`
- `/Users/porton/Projects/xyte-sdk/docs/schemas/inspect-deep-dive.v1.schema.json`
- `/Users/porton/Projects/xyte-sdk/docs/schemas/report.v1.schema.json`

## MCP Tool Surface (Current)

Current tool names:
- `xyte_setup_status`
- `xyte_config_doctor`
- `xyte_list_endpoints`
- `xyte_describe_endpoint`
- `xyte_call`
- `xyte_inspect_fleet`
- `xyte_report_generate`

Guard semantics in MCP mirror CLI:
- write endpoints require `allow_write: true`
- destructive endpoints require matching `confirm`

## Validation Commands

Run full contract checks:
```bash
skills/xyte/scripts/validate_agent_contracts.sh <tenant-id>
```

Validate headless frames only:
```bash
skills/xyte/scripts/check_headless.sh <tenant-id>
```

Validate any payload against schema:
```bash
node skills/xyte/scripts/validate_with_schema.js <schema.json> <data.json>
```

## Troubleshooting Entrypoints

- First-run/setup issues:
  - `xyte`
  - `xyte setup run --non-interactive --tenant <tenant-id> --key <value>`
- Readiness/connectivity:
  - `xyte setup status --tenant <tenant-id> --format json`
  - `xyte config doctor --tenant <tenant-id> --format json`
- TUI crash diagnostics:
```bash
XYTE_TUI_DEBUG=1 XYTE_TUI_DEBUG_LOG=/tmp/xyte-tui-debug.log xyte tui --tenant <tenant-id>
```
- Headless errors:
  - ensure `--headless --format json` (no text format in headless)
  - parse NDJSON and use the last runtime frame (`meta.startup != true`)

## Utility Scripts

- `/Users/porton/Projects/xyte-sdk/skills/xyte/scripts/run_xyte_cli.sh`
- `/Users/porton/Projects/xyte-sdk/skills/xyte/scripts/check_headless.sh`
- `/Users/porton/Projects/xyte-sdk/skills/xyte/scripts/validate_agent_contracts.sh`
- `/Users/porton/Projects/xyte-sdk/skills/xyte/scripts/validate_with_schema.js`

## References (Load As Needed)

- `/Users/porton/Projects/xyte-sdk/skills/xyte/references/endpoints.md`
- `/Users/porton/Projects/xyte-sdk/skills/xyte/references/tui-flows.md`
- `/Users/porton/Projects/xyte-sdk/skills/xyte/references/headless-contract.md`

## Notes for Agents

- Keep this file short in-context; use references for deep procedures.
- Prefer scripts over ad hoc manual validation flows.
- Keep tenant explicit in automation (`--tenant <tenant-id>`).
