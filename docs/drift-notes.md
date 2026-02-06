# Drift Notes

These corrections are intentionally enforced in `src/spec/drift-overrides.json`.

## Route Corrections

1. `organization.commands.getCommands`
- Correct path: `/core/v1/organization/devices/:device_id/commands`
- Bruno docs had stale path without `/devices` segment.

2. `organization.getOrganizationInfo`
- Correct behavior: `GET /core/v1/organization/info` with no request body.

3. `organization.commands.cancelCommand`
- Correct behavior: body not required in SDK signature.

4. File dump endpoint templates
- `device.file-dumps.sendDump` uses dynamic `:mime_type/:filename`.
- `device.file-dumps.appendDumpFile` uses dynamic `:id`.

## Payload Normalization

1. `device.device-info.setCloudSettings`
- SDK helper normalizes payload to `{ property, value }`.
- Single key/value input object is auto-transformed.
