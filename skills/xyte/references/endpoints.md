# Endpoint Usage Reference

## Discovery

- `xyte list-endpoints`
- `xyte describe-endpoint <key>`

## Generic Invocation Pattern

```bash
xyte call <key> \
  --tenant <tenant-id> \
  --path-json '{"id":"..."}' \
  --query-json '{"page":1}' \
  --body-json '{"field":"value"}'
```

## Safety Flags

- Any non-read endpoint must include `--allow-write`.
- `DELETE` endpoints must include `--confirm <endpoint-key>`.

## Common Endpoint Keys

Organization:
- `organization.devices.getDevices`
- `organization.devices.getDevice`
- `organization.incidents.getIncidents`
- `organization.tickets.getTickets`
- `organization.commands.sendCommand`

Partner:
- `partner.devices.getDevices`
- `partner.devices.getDeviceInfo`
- `partner.tickets.getTickets`

Device:
- `device.device-info.getDeviceInfo`
- `device.telemetries.sendTelemetry`
- `device.device-info.setCloudSettings`

## Multi-tenant Guidance

- Every tenant keeps separate credentials in keychain.
- Always pass `--tenant <id>` for deterministic behavior when automating.
- Use `xyte tenant use <id>` to update active tenant for interactive sessions.
