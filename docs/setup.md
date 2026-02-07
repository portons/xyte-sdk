# Setup Guide

`xyte` now prioritizes a simple first-run path:

1. install
2. run `xyte`
3. paste XYTE API key
4. see dashboard data

## Quick Start

```bash
npm run install:global
xyte
```

What bare `xyte` does:
- checks readiness
- if already ready: opens dashboard
- if not ready: asks for XYTE API key and optional tenant label (default `default`), validates connectivity, then opens dashboard

## Non-Interactive Environments

If setup is missing and no TTY is available, `xyte` exits with a one-line remediation:

```bash
xyte setup run --non-interactive --tenant default --key "$XYTE_SDK_KEY"
```

## Setup Commands

Simplified setup (default):

```bash
xyte setup run
xyte setup run --non-interactive --tenant acme --key "$XYTE_ORG_KEY"
```

Advanced setup (provider/slot controls):

```bash
xyte setup run --advanced
xyte setup run \
  --advanced \
  --non-interactive \
  --tenant acme \
  --name "Acme" \
  --provider xyte-org \
  --slot-name primary \
  --key "$XYTE_ORG_KEY"
```

Readiness and diagnostics:

```bash
xyte setup status --format text
xyte setup status --format json
xyte config doctor --format text
xyte doctor install --format text
```

## Data Structure Examples

Call envelope (`xyte.call.envelope.v1`):

```json
{
  "schemaVersion": "xyte.call.envelope.v1",
  "requestId": "8fcf4f58-9f76-4dcb-bf6a-117a78f00ed3",
  "timestamp": "2026-02-07T18:22:47.129Z",
  "tenantId": "acme",
  "endpointKey": "organization.devices.getDevices",
  "method": "GET",
  "guard": {
    "allowWrite": false,
    "confirm": null,
    "destructive": false
  },
  "request": {
    "path": {},
    "query": {},
    "body": null
  },
  "response": {
    "status": 200,
    "durationMs": 238,
    "retryCount": 0,
    "data": {
      "items": []
    }
  },
  "error": null
}
```

Inspect fleet (`xyte.inspect.fleet.v1`):

```json
{
  "schemaVersion": "xyte.inspect.fleet.v1",
  "generatedAtUtc": "2026-02-07T18:22:47.129Z",
  "tenantId": "acme",
  "totals": {
    "devices": 68,
    "spaces": 133,
    "incidents": 240,
    "tickets": 5
  },
  "highlights": {
    "offlineDevices": 48,
    "offlinePct": 70.6,
    "activeIncidents": 10,
    "activeIncidentPct": 4.2,
    "openTickets": 5
  }
}
```
