# Config Tooling

Configuration tooling covers tenant profiles, named key slots, active slot routing, and connectivity diagnostics.

## Tenant Commands

```bash
xyte tenant add acme --name "Acme"
xyte tenant use acme
xyte tenant list
xyte tenant remove acme
```

## Named API Key Slots

Add/list/use/rename/update/remove/test:

```bash
xyte auth key add --tenant acme --provider xyte-org --name primary --key "$XYTE_ORG_KEY" --set-active
xyte auth key list --tenant acme --provider xyte-org --format text
xyte auth key use --tenant acme --provider xyte-org --slot primary
xyte auth key rename --tenant acme --provider xyte-org --slot primary --name prod-primary
xyte auth key update --tenant acme --provider xyte-org --slot prod-primary --key "$NEW_KEY"
xyte auth key test --tenant acme --provider xyte-org --slot prod-primary
xyte auth key remove --tenant acme --provider xyte-org --slot prod-primary --confirm
```

Providers:
- Xyte auth: `xyte-org`, `xyte-partner`, `xyte-device`
- LLM auth: `openai`, `anthropic`, `openai-compatible`

## Doctor

Run readiness + connectivity diagnostics:

```bash
xyte config doctor --tenant acme --retry-attempts 3 --retry-backoff-ms 300 --format json
```

## TUI Config Screen

Open with `g`:
- tenant overview
- active tenant slot inventory
- add/rename/use/update/remove slot actions
- connectivity doctor action

## Data Placement

- profile metadata:
  - `~/.config/xyte-sdk/profile.json` (or platform equivalent)
- secrets:
  - OS keychain backend (`security` on macOS, `secret-tool` on Linux)
