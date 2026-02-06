import { promises as fs } from 'node:fs';
import path from 'node:path';

import type { PublicEndpointSpec } from '../src/types/endpoints';

const repoRoot = path.resolve(__dirname, '..');
const endpointsPath = path.resolve(repoRoot, 'src/spec/public-endpoints.json');
const serverRoot = path.resolve(repoRoot, '../server');

const requiredPathChecks: Array<{ key: string; expectedPath: string }> = [
  {
    key: 'organization.commands.getCommands',
    expectedPath: '/core/v1/organization/devices/:device_id/commands'
  },
  {
    key: 'organization.getOrganizationInfo',
    expectedPath: '/core/v1/organization/info'
  },
  {
    key: 'organization.commands.cancelCommand',
    expectedPath: '/core/v1/organization/devices/:device_id/commands/:command_id'
  }
];

async function walkFiles(rootDir: string, matcher: (fullPath: string) => boolean): Promise<string[]> {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  const out: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkFiles(fullPath, matcher)));
      continue;
    }
    if (entry.isFile() && matcher(fullPath)) {
      out.push(fullPath);
    }
  }

  return out;
}

function endpointRegex(pathTemplate: string): RegExp {
  const escaped = pathTemplate
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/:[a-zA-Z0-9_]+/g, '[^/"\\s]+');
  return new RegExp(escaped);
}

async function main() {
  const endpoints = JSON.parse(await fs.readFile(endpointsPath, 'utf8')) as PublicEndpointSpec[];
  const routeFile = await fs.readFile(path.join(serverRoot, 'config/routes.rb'), 'utf8');

  const specFiles = await walkFiles(path.join(serverRoot, 'spec/unit/controllers'), (filePath) => filePath.endsWith('_spec.rb'));
  const specsText = (
    await Promise.all(
      specFiles.map(async (filePath) => {
        const content = await fs.readFile(filePath, 'utf8');
        return `\n# ${filePath}\n${content}`;
      })
    )
  ).join('\n');

  const corpus = `${routeFile}\n${specsText}`;

  const warnings: string[] = [];
  for (const endpoint of endpoints) {
    const regex = endpointRegex(endpoint.pathTemplate);
    if (!regex.test(corpus)) {
      warnings.push(`${endpoint.key} (${endpoint.pathTemplate}) not found in route/spec corpus`);
    }
  }

  let failures = 0;
  for (const check of requiredPathChecks) {
    const endpoint = endpoints.find((item) => item.key === check.key);
    if (!endpoint) {
      console.error(`Missing required endpoint key: ${check.key}`);
      failures += 1;
      continue;
    }

    if (endpoint.pathTemplate !== check.expectedPath) {
      console.error(
        `Critical path mismatch for ${check.key}: expected ${check.expectedPath}, actual ${endpoint.pathTemplate}`
      );
      failures += 1;
    }
  }

  if (warnings.length) {
    console.log(`Route coverage warnings (${warnings.length}):`);
    for (const warning of warnings.slice(0, 20)) {
      console.log(`- ${warning}`);
    }
    if (warnings.length > 20) {
      console.log(`- ... ${warnings.length - 20} more`);
    }
  }

  if (failures > 0) {
    process.exit(1);
  }

  console.log(`Validated critical route overrides and scanned ${endpoints.length} endpoint path patterns.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
