# TUI + Headless Flows

## Interactive Launch

```bash
xyte tui
```

First-run behavior:
- If readiness is incomplete, app opens `Setup` and blocks operational screens.

## Global Keys

- `←/→` cycle active pane
- `↑/↓` move row selection / scroll active pane
- `Enter` run primary action in current pane
- `u` Setup
- `g` Config
- `d` Dashboard
- `s` Spaces
- `v` Devices
- `i` Incidents
- `t` Tickets
- `p` Copilot
- `r` refresh/retry
- `/` search/filter
- `o` provider/model override
- `?` help
- `q` quit

## Install Check

```bash
xyte doctor install --format text
```

## Setup Screen Keys

- `a` add tenant
- `u` set active tenant
- `k` add key slot + secret
- `p` set active slot
- `c` connectivity test
- `r` refresh readiness

## Config Screen Keys

- `a` add key slot
- `n` rename slot
- `u` set active slot
- `e` update key secret
- `x` remove slot (confirmation required)
- `c` run doctor

## Spaces Flow

- open `Spaces` with `s`
- select row and press `Enter` for async drilldown
- `/` to filter spaces
- drilldown includes selected space detail + devices in space pane

## Headless Agent Commands

Setup snapshot:

```bash
xyte tui --headless --screen setup --format json --once --tenant <tenant-id>
```

Operational snapshot (auto-redirects to setup if blocked):

```bash
xyte tui --headless --screen dashboard --format json --once --tenant <tenant-id>
```

Streaming with reconnect metadata:

```bash
xyte tui --headless --screen spaces --format json --follow --interval-ms 2000 --tenant <tenant-id>
```

Inspect input-pipeline telemetry:

```bash
xyte tui --headless --screen setup --format json --once --tenant <tenant-id> \
  | jq '.meta | {inputState, queueDepth, droppedEvents, transitionState, refreshState, activePane, availablePanes, navigationMode}'
```

Text fallback:

```bash
xyte tui --headless --screen config --format text --once --tenant <tenant-id>
```

Deterministic output:

```bash
xyte tui --headless --no-motion ...
```

## Safety Model

- Copilot output is advisory only.
- Interactive ticket resolve uses confirmation token prompt.
- CLI mutation endpoints require `--allow-write`, and destructive calls require `--confirm`.
