# Setup Guide

`xyte` now enforces setup readiness for TUI/headless operational views.

## Readiness Rules

Readiness is `ready` when:
1. active tenant exists
2. at least one active Xyte key slot has a stored secret (`xyte-org` or `xyte-partner` or `xyte-device`)

Readiness states:
- `ready`
- `needs_setup`
- `degraded` (transient network/rate/timeout issues)

## Commands

Global install (from repo checkout):

```bash
npm run install:global
xyte --help
```

Read current readiness:

```bash
xyte setup status --format text
xyte setup status --format json
```

Run setup (interactive):

```bash
xyte setup run
```

Run setup (non-interactive):

```bash
xyte setup run \
  --non-interactive \
  --tenant acme \
  --name "Acme" \
  --provider xyte-org \
  --slot-name primary \
  --key "$XYTE_ORG_KEY"
```

Diagnostics:

```bash
xyte config doctor --format text
xyte doctor install --format text
```

## Key Slot Model

- slots are tenant-scoped and provider-scoped
- each provider has one active slot
- slot metadata is stored in profile (`slotId`, `name`, `fingerprint`, validation time)
- slot secrets are stored in OS keychain (never in profile JSON)

## Compatibility

Legacy commands still work:

```bash
xyte auth set-key ...
xyte auth clear-key ...
```

They map to slot `default` and emit deprecation warnings.
