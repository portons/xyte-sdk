# TUI Guide

Launch interactive mode:

```bash
xyte tui
```

## Setup Gate

First-run is setup-gated:
- if readiness is incomplete, startup lands on `Setup`
- operational screens are blocked until readiness is `ready`

Use setup/config screens to complete onboarding without leaving TUI.

## Screens

1. Setup (`u`)
- readiness checklist
- provider slot state
- connectivity status
- actions to add tenant, add key slot, set active slot, run probe

2. Config (`g`)
- tenant table
- key slot table for active tenant
- rename/use/update/remove slot actions
- connectivity doctor trigger

3. Dashboard (`d`)
- KPI counts + provider status + recent incidents/tickets
- explicit connection/retry status reporting

4. Spaces (`s`)
- async spaces list
- selected space detail
- devices-in-space pane with query + fallback filtering

5. Devices (`v`)
- searchable table
- selected device detail

6. Incidents (`i`)
- incident queue
- `x` triage action (advisory output)

7. Tickets (`t`)
- ticket list + detail
- `m` draft replies
- `R` resolve with confirmation token dialog
- `rr` resolve alias (single `r` still refreshes globally)

8. Copilot (`p`)
- free prompt + health summary + command suggestions
- advisory only (no autonomous writes)

## Global Keys

- `←/→` switch to previous/next tab
- `Ctrl+←/→` (or `Shift+←/→`) move pane focus; at pane boundary switch tab
- `↑/↓` move row selection or scroll active pane
- `Enter` run active-pane primary action (for example, spaces drilldown)
- `u` Setup
- `g` Config
- `d` Dashboard
- `s` Spaces
- `v` Devices
- `i` Incidents
- `t` Tickets
- `p` Copilot
- `r` refresh/retry now
- `/` search/filter
- `o` provider/model override (session only)
- `?` help
- `q` quit

## Pane Map (Arrow Navigation)

- `setup`: `providers-table`, `checklist-box`
- `config`: `tenants-table`, `slots-table`, `actions-box`
- `dashboard`: `kpi`, `provider`, `incidents`, `tickets`
- `spaces`: `spaces-table`, `detail-box`, `devices-table`
- `devices`: `devices-table`, `detail-box`
- `incidents`: `incidents-table`, `detail-box`, `triage-box`
- `tickets`: `tickets-table`, `detail-box`, `draft-box`
- `copilot`: `prompt-input`, `provider-box`, `output-box`

## Setup Screen Keys

- `a` add tenant
- `u` set active tenant
- `k` run guided key wizard (provider -> slot -> key -> review -> save)
- `p` set active slot
- `c` connectivity check
- `r` refresh readiness

## Config Screen Keys

- `a` add key slot (guided wizard)
- `n` rename key slot
- `u` set active key slot
- `e` update selected slot key (guided wizard)
- `x` remove slot (confirm required)
- `c` run connectivity doctor

## Table Readability

- compact presentation rows are generated once and shared by interactive + headless outputs
- IDs/fingerprints use middle ellipsis, human text uses end ellipsis
- config slot table stays narrow (`Provider | Slot | Active | Secret`)
- extra metadata (for example full fingerprint) is shown in detail/action panes

## Motion and Theme

- retro console theme with ASCII XYTE startup sequence
- subtle pulse animation in footer/header

Disable motion:

```bash
xyte tui --no-motion
```

or globally:

```bash
export XYTE_TUI_REDUCED_MOTION=1
```

## Input Handling Reliability

- serialized input pipeline avoids overlapping async key handlers
- bounded input queue with oldest-event shedding under flood
- modal prompt/message state suppresses global shortcut handling until closed
- `q` and `Ctrl-C` are treated as critical keys and bypass queueing
- screen refreshes are non-blocking and run through a runtime controller
- stale refresh completions are discarded after screen transitions
- detail rendering uses crash-safe serialization for deep/cyclic payloads
- repeated render failures trip a local fallback mode so UI remains responsive

## Debug Logging

- CLI flags:
  - `xyte tui --debug`
  - `xyte tui --debug --debug-log /tmp/xyte-tui.log`
- environment alternatives:
  - `XYTE_TUI_DEBUG=1`
  - `XYTE_TUI_DEBUG_LOG=/tmp/xyte-tui.log`

Debug log captures:
- enqueue + dispatch key events (prompt keystrokes redacted)
- screen mount/unmount lifecycle
- runtime refresh status transitions (`idle/loading/retrying/error`)
- uncaught exceptions / unhandled rejections with stack traces

## Headless Visual Mode

```bash
xyte tui --headless --screen setup --format json --once
xyte tui --headless --screen dashboard --format json --once
xyte tui --headless --screen spaces --format text --follow --interval-ms 2000
```

- all visual flows are available in headless mode (`setup/config` included)
- if operational screen requested while not ready, output auto-redirects to setup frame
- follow mode includes reconnect/retry metadata
