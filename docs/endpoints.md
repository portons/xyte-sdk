# Xyte Public Endpoint Catalog

Generated from Bruno docs on 2026-02-06T09:50:18.910Z.

## Device

| Key | Method | Base | Path | Auth | Query Params |
| --- | --- | --- | --- | --- | --- |
| `device.command.getCommand` | GET | hub | `/v1/devices/:device_id/command` | device | - |
| `device.command.getCommandsWithChildren` | GET | hub | `/v1/devices/:device_id/command/pending_commands` | device | - |
| `device.command.updateCommand` | POST | hub | `/v1/devices/:device_id/command` | device | - |
| `device.configuration.getConfig` | GET | hub | `/v1/devices/:device_id/config` | device | - |
| `device.configuration.setConfig` | POST | hub | `/v1/devices/:device_id/config` | device | - |
| `device.device-info.getDeviceInfo` | GET | hub | `/v1/devices/:device_id` | device | - |
| `device.device-info.getSpaceInfo` | GET | hub | `/v1/devices/:device_id/space` | device | - |
| `device.device-info.setCloudSettings` | PUT | hub | `/v1/devices/:device_id/cloud_settings` | device | - |
| `device.device-info.updateDevice` | PUT | hub | `/v1/devices/:device_id` | device | - |
| `device.events.addEvent` | POST | hub | `/v1/devices/:device_id/events` | device | - |
| `device.file-dumps.appendDumpFile` | PUT | hub | `/v1/devices/:device_id/dumps/:id` | device | - |
| `device.file-dumps.sendDump` | POST | hub | `/v1/devices/:device_id/dumps/:mime_type/:filename` | device | - |
| `device.incidents.closeIncident` | DELETE | hub | `/v1/devices/:device_id/incidents/:incident_id` | device | - |
| `device.incidents.closeIncidents` | DELETE | hub | `/v1/devices/:device_id/incidents` | device | - |
| `device.incidents.getIncidents` | GET | hub | `/v1/devices/:device_id/incidents` | device | - |
| `device.incidents.openIncident` | POST | hub | `/v1/devices/:device_id/incidents` | device | - |
| `device.license.getLicense` | GET | hub | `/v1/devices/:device_id/license` | device | - |
| `device.license.updateLicense` | POST | hub | `/v1/devices/:device_id/licenses` | device | - |
| `device.registration.bulkRegisterDevice` | POST | entry | `/v1/devices/bulk_create` | none | - |
| `device.registration.deleteDevice` | DELETE | hub | `/v1/devices/:device_id` | device | - |
| `device.registration.getChildDevices` | GET | hub | `/v1/devices/:device_id/children` | device | - |
| `device.registration.registerChildDevice` | POST | entry | `/v1/devices/:device_id/children` | device | - |
| `device.registration.registerDevice` | POST | entry | `/v1/devices` | none | - |
| `device.remote-files.getFile` | GET | hub | `/v1/devices/:device_id/files/:file_id` | device | - |
| `device.remote-files.getFiles` | GET | hub | `/v1/devices/:device_id/files` | device | - |
| `device.telemetries.sendChildTelemetry` | POST | hub | `/v1/devices/:device_id/children/telemetries` | device | - |
| `device.telemetries.sendMassTelemetry` | POST | hub | `/v1/devices/:device_id/children/telemetries` | device | - |
| `device.telemetries.sendTelemetry` | POST | hub | `/v1/devices/:device_id/telemetry` | device | - |

## Organization

| Key | Method | Base | Path | Auth | Query Params |
| --- | --- | --- | --- | --- | --- |
| `organization.commands.cancelCommand` | DELETE | hub | `/core/v1/organization/devices/:device_id/commands/:command_id` | organization | - |
| `organization.commands.getCommands` | GET | hub | `/core/v1/organization/devices/:device_id/commands` | organization | - |
| `organization.commands.sendCommand` | POST | hub | `/core/v1/organization/devices/:device_id/commands` | organization | - |
| `organization.devices.claimDevice` | POST | hub | `/core/v1/organization/devices/claim` | organization | - |
| `organization.devices.deleteDevice` | DELETE | hub | `/core/v1/organization/devices/:device_id` | organization | - |
| `organization.devices.getDevice` | GET | hub | `/core/v1/organization/devices/:device_id` | organization | - |
| `organization.devices.getDevices` | GET | hub | `/core/v1/organization/devices` | organization | - |
| `organization.devices.getHistories` | GET | hub | `/core/v1/organization/devices/histories` | organization | status, from, to, device_id, space_id, name |
| `organization.devices.updateDevice` | PATCH | hub | `/core/v1/organization/devices/:device_id` | organization | - |
| `organization.getOrganizationInfo` | GET | hub | `/core/v1/organization/info` | organization | - |
| `organization.incidents.getIncidents` | GET | hub | `/core/v1/organization/incidents` | organization | - |
| `organization.spaces.createSpace` | POST | hub | `/core/v1/organization/spaces` | organization | - |
| `organization.spaces.deleteSpace` | DELETE | hub | `/core/v1/organization/spaces/:space_id` | organization | - |
| `organization.spaces.findOrCreateSpace` | POST | hub | `/core/v1/organization/spaces/find_or_create` | organization | - |
| `organization.spaces.getSpace` | GET | hub | `/core/v1/organization/spaces/:space_id` | organization | - |
| `organization.spaces.getSpaces` | GET | hub | `/core/v1/organization/spaces` | organization | page, per_page, id, parent_id, name, path_includes, space_type, created_before, created_after |
| `organization.spaces.updateSpace` | PUT | hub | `/core/v1/organization/spaces/:space_id` | organization | - |
| `organization.tickets.getTicket` | GET | hub | `/core/v1/organization/tickets/:ticket_id` | organization | - |
| `organization.tickets.getTickets` | GET | hub | `/core/v1/organization/tickets` | organization | - |
| `organization.tickets.markResolved` | POST | hub | `/core/v1/organization/tickets/:ticket_id/resolved` | organization | - |
| `organization.tickets.sendMessage` | POST | hub | `/core/v1/organization/tickets/:ticket_id/message` | organization | - |
| `organization.tickets.updateTicket` | PUT | hub | `/core/v1/organization/tickets/:ticket_id` | organization | - |

## Partner

| Key | Method | Base | Path | Auth | Query Params |
| --- | --- | --- | --- | --- | --- |
| `partner.devices.deleteDevice` | DELETE | hub | `/core/v1/partner/devices/:device_id` | partner | - |
| `partner.devices.getCommands` | GET | hub | `/core/v1/partner/devices/:device_id/commands` | partner | - |
| `partner.devices.getConfiguration` | GET | hub | `/core/v1/partner/devices/:device_id/config` | partner | - |
| `partner.devices.getDeviceInfo` | GET | hub | `/core/v1/partner/devices/:device_id` | partner | - |
| `partner.devices.getDevices` | GET | hub | `/core/v1/partner/devices` | partner | - |
| `partner.devices.getStateHistory` | GET | hub | `/core/v1/partner/devices/:device_id/history` | partner | - |
| `partner.devices.getStateHistoryMultiDevices` | GET | hub | `/core/v1/partner/devices/histories` | partner | - |
| `partner.devices.getTelemetries` | GET | hub | `/core/v1/partner/devices/:device_id/telemetries` | partner | - |
| `partner.tickets.addComment` | POST | hub | `/core/v1/partner/tickets/:ticket_id/message` | partner | - |
| `partner.tickets.closeTicket` | POST | hub | `/core/v1/partner/tickets/:ticket_id/resolved` | partner | - |
| `partner.tickets.getTicket` | GET | hub | `/core/v1/partner/tickets/:ticket_id` | partner | - |
| `partner.tickets.getTickets` | GET | hub | `/core/v1/partner/tickets` | partner | - |
| `partner.tickets.updateTicket` | PUT | hub | `/core/v1/partner/tickets/:ticket_id` | partner | - |

