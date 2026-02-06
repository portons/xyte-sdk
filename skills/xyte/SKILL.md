---
name: xyte
description: Operate Xyte multi-tenant fleets through @xyte/sdk CLI/TUI with setup/readiness gating, named API-key slots, headless visual parity, and guarded write actions.
---

# Xyte

## Deterministic Flow First

0. Ensure global CLI wiring:
- `npm run install:global`
- `xyte doctor install --format json`

1. Check readiness:
- `xyte setup status --format json`
- `xyte config doctor --format json`

2. Ensure tenant + named key slots:
- `xyte tenant add <tenant-id> --name "<name>"`
- `xyte tenant use <tenant-id>`
- `xyte auth key add --tenant <tenant-id> --provider xyte-org --name primary --key <value> --set-active`
- `xyte auth key list --tenant <tenant-id> --format json`

3. Discover and call endpoints:
- `xyte list-endpoints`
- `xyte describe-endpoint <endpoint-key>`
- `xyte call <endpoint-key> --tenant <tenant-id>`

## Safety Rules

- Default to read-only actions.
- Use mutations only on explicit user request.
- Always add `--allow-write` for non-read methods.
- For destructive endpoints (`DELETE`), add `--confirm <endpoint-key>`.
- Copilot output is advisory only; never execute writes directly from model text.

## TUI + Headless

Interactive:
- `xyte tui`
- global keys: `u` setup, `g` config, `d/s/v/i/t/p` operational screens.
- pane-focus arrows: `←/→` switch pane, `↑/↓` move/scroll, `Enter` primary pane action.
- setup actions: `a/u/k/p/c/r`.
- config actions: `a/n/u/e/x/c`.
- tickets: `m` draft, `R` resolve, `rr` resolve alias.

Headless for agents:
- `xyte tui --headless --screen setup --format json --once --tenant <tenant-id>`
- `xyte tui --headless --screen dashboard --format json --once --tenant <tenant-id>`
- `xyte tui --headless --screen spaces --format text --follow --interval-ms 2000 --tenant <tenant-id>`

If readiness is incomplete, operational screen requests redirect to setup frames (`meta.redirectedFrom`).
Input pipeline telemetry is exposed in headless metadata (`inputState`, `queueDepth`, `droppedEvents`, `transitionState`, `refreshState`).
Pane navigation telemetry is exposed in headless metadata (`activePane`, `availablePanes`, `navigationMode`).

## Named Slot Commands

- Add: `xyte auth key add --tenant <tenant-id> --provider <provider> --name <name> --key <value> [--set-active]`
- Use: `xyte auth key use --tenant <tenant-id> --provider <provider> --slot <id|name>`
- Rename: `xyte auth key rename --tenant <tenant-id> --provider <provider> --slot <id|name> --name <new-name>`
- Update: `xyte auth key update --tenant <tenant-id> --provider <provider> --slot <id|name> --key <value>`
- Remove: `xyte auth key remove --tenant <tenant-id> --provider <provider> --slot <id|name> --confirm`
- Test: `xyte auth key test --tenant <tenant-id> --provider <provider> --slot <id|name>`

## References

- Endpoint catalog: `references/endpoints.md`
- TUI/headless flows: `references/tui-flows.md`
- CLI launcher: `scripts/run_xyte_cli.sh`
