# LLM Provider Configuration

## Supported Providers

- `openai` (Responses API)
- `anthropic` (Messages API)
- `openai-compatible` (for local or gateway-compatible endpoints)

## Secret Storage

Provider API keys are stored per tenant in OS keychain:

- `xyte auth key add --tenant <id> --provider openai --name gpt-main --key <value> --set-active`
- `xyte auth key add --tenant <id> --provider anthropic --name claude-main --key <value> --set-active`
- `xyte auth key add --tenant <id> --provider openai-compatible --name local-llm --key <value> --set-active`

## Provider Defaults

Global defaults:

```bash
xyte profile llm set-provider --provider openai
xyte profile llm set-model --model gpt-4.1-mini
```

Tenant overrides:

```bash
xyte profile llm set-provider --tenant acme --provider anthropic
xyte profile llm set-model --tenant acme --model claude-3-5-haiku-latest
```

## OpenAI-compatible / Local LLM

Set tenant endpoint:

```bash
xyte tenant add acme --openai-compatible-url http://localhost:11434
```

Then run copilot flows using provider override in CLI profile or TUI `o` shortcut.

List and switch provider key slots:

```bash
xyte auth key list --tenant acme --provider openai --format text
xyte auth key use --tenant acme --provider openai --slot gpt-main
```

## Safety Model

- LLM outputs are advisory.
- Mutations require explicit user action through guarded CLI/TUI paths.
