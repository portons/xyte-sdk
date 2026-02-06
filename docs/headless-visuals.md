# Headless Visual Schema

`xyte tui --headless` emits deterministic scene frames used by agents and automation.

## CLI

```bash
xyte tui --headless \
  --screen <setup|config|dashboard|spaces|devices|incidents|tickets|copilot> \
  --format <json|text> \
  [--once|--follow --interval-ms N] \
  [--tenant <id>] \
  [--no-motion]
```

## Setup Gating Behavior

If readiness is incomplete and an operational screen is requested, runtime frame redirects to setup:
- requested: `dashboard` (or any operational screen)
- emitted frame: `screen: "setup"`
- metadata includes `meta.redirectedFrom`

## JSON Frame Shape

One JSON object per line:

```json
{
  "timestamp": "2026-02-06T00:00:00.000Z",
  "mode": "headless",
  "screen": "setup",
  "title": "Setup",
  "status": "Setup required",
  "tenantId": "acme",
  "motionEnabled": false,
  "motionPhase": 0,
  "logo": "XYTE",
  "panels": [
    {
      "id": "setup-overview",
      "title": "Setup Readiness",
      "kind": "stats",
      "stats": [
        { "label": "Readiness", "value": "needs_setup" },
        { "label": "Tenant", "value": "acme" },
        { "label": "Connection", "value": "missing_key" }
      ]
    }
  ],
  "meta": {
    "readiness": "needs_setup",
    "connection": {
      "state": "missing_key",
      "message": "Missing API key..."
    },
    "inputState": "idle",
    "queueDepth": 0,
    "droppedEvents": 0,
    "transitionState": "idle",
    "refreshState": "idle",
    "activePane": "providers-table",
    "availablePanes": ["providers-table", "checklist-box"],
    "navigationMode": "pane-focus",
    "tabId": "setup",
    "tabOrder": ["setup", "config", "dashboard", "spaces", "devices", "incidents", "tickets", "copilot"],
    "tabNavBoundary": null,
    "renderSafety": "ok",
    "blocking": true,
    "redirectedFrom": "dashboard"
  }
}
```

## Panel Kinds

- `stats`: key/value metrics
- `table`: column+row tabular data
- `text`: multi-line text

## Meta Contract

`meta` includes standardized diagnostics:
- `readiness`: `ready | needs_setup | degraded`
- `connection`: connectivity object/state/message
- `retry`: attempts/backoff metadata when retries occurred
- `blocking`: whether setup gate currently blocks operational views
- `redirectedFrom`: requested screen when redirected to setup
- `inputState`: `idle | modal | busy`
- `queueDepth`: queued event count
- `droppedEvents`: total dropped events due to queue backpressure
- `transitionState`: `idle | switching`
- `refreshState`: `idle | loading | retrying | error`
- `activePane`: currently active pane id for the screen
- `availablePanes`: ordered pane ids for screen-level arrow navigation
- `navigationMode`: currently `pane-focus`
- `tabId`: currently active tab/screen id
- `tabOrder`: deterministic tab sequence used by arrow-boundary tab navigation
- `tabNavBoundary`: boundary direction (`left|right`) when relevant, otherwise `null`
- `renderSafety`: `ok | truncated`, indicates whether payload previews were truncated for stability

## Startup Frames

Startup frames are emitted before runtime frames:
- `meta.startup = true`
- no operational panels
- useful for detecting initialization boundaries

## Follow Mode and Reconnect

In `--follow`, transient connectivity issues keep streaming:
- runtime frames continue
- reconnect status frames are emitted with retry metadata
- no write/mutation actions are executed in headless mode

## Text Mode

`--format text` renders equivalent frame content with:
- logo
- screen/title/status
- tenant/motion info
- panel sections
