# Headless JSON Contract

`xyte tui --headless` is machine-only and emits NDJSON (one JSON object per line).

## CLI

```bash
xyte tui --headless \
  --screen <setup|config|dashboard|spaces|devices|incidents|tickets|copilot> \
  --format json \
  [--once|--follow --interval-ms N] \
  [--tenant <id>] \
  [--no-motion]
```

`--format text` is no longer supported in headless mode.

## Setup Gating

If readiness is incomplete and an operational screen is requested, emitted runtime frame is redirected:
- requested: `dashboard` (or other operational screen)
- runtime frame: `screen: "setup"`
- metadata: `meta.redirectedFrom`

## Example: `xyte.headless.frame.v1`

```json
{
  "schemaVersion": "xyte.headless.frame.v1",
  "timestamp": "2026-02-07T18:22:47.129Z",
  "sessionId": "2c17c9b8-9a26-4a5d-b8f4-7302f2cb4d24",
  "sequence": 3,
  "mode": "headless",
  "screen": "dashboard",
  "title": "Dashboard",
  "status": "Dashboard snapshot",
  "tenantId": "acme",
  "motionEnabled": false,
  "motionPhase": 0,
  "logo": "XYTE",
  "panels": [],
  "meta": {
    "readiness": "ready",
    "navigationMode": "pane-focus",
    "tabId": "dashboard",
    "tabOrder": ["setup", "config", "dashboard", "spaces", "devices", "incidents", "tickets", "copilot"],
    "tableFormat": "compact-v1",
    "contract": {
      "frameVersion": "xyte.headless.frame.v1",
      "tableFormat": "compact-v1",
      "navigationMode": "pane-focus"
    }
  }
}
```

## Example: `xyte.inspect.deep-dive.v1`

```json
{
  "schemaVersion": "xyte.inspect.deep-dive.v1",
  "generatedAtUtc": "2026-02-07T18:22:47.129Z",
  "tenantId": "acme",
  "windowHours": 24,
  "summary": [
    "Devices: 68 total, 48 offline (70.6%).",
    "Incidents: 240 total, 10 active (4.2%)."
  ],
  "topOfflineSpaces": [
    { "space": "Overview/New-York/Office", "offlineDevices": 31, "shareOfOfflinePct": 64.6 }
  ],
  "topIncidentDevices": [
    { "device": "Mac Edge Agent", "incidentCount": 145, "activeIncidents": 1 }
  ],
  "activeIncidentAging": [
    { "device": "C930e", "space": "Overview/Taipei", "ageHours": 127, "createdAtUtc": "2026-02-01T07:44:18Z" }
  ],
  "churn24h": {
    "incidents": 51,
    "devices": 3,
    "spaces": 3,
    "bySpace": [
      { "space": "Overview/Tel-Aviv", "incidents": 34 }
    ],
    "byDevice": [
      { "device": "Mac Edge Agent", "incidents": 34 }
    ]
  },
  "ticketPosture": {
    "openTickets": 5,
    "overlappingActiveIncidentDevices": 1,
    "oldestOpenTickets": []
  },
  "dataQuality": {
    "statusMismatches": []
  }
}
```

## Example: `xyte.report.v1`

```json
{
  "schemaVersion": "xyte.report.v1",
  "generatedAtUtc": "2026-02-07T18:22:47.129Z",
  "tenantId": "acme",
  "format": "pdf",
  "outputPath": "/tmp/xyte-findings.pdf",
  "includeSensitive": false
}
```

## Copy/Paste Recipes

```bash
# Headless one-shot snapshot
xyte tui --headless --screen dashboard --format json --once --tenant acme

# Deep-dive JSON for automation
xyte inspect deep-dive --tenant acme --window 24 --format json > /tmp/deep-dive.json

# Branded PDF report (default format)
xyte report generate --tenant acme --input /tmp/deep-dive.json --out /tmp/xyte-findings.pdf
```
