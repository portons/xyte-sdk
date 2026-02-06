import { promises as fs } from 'node:fs';
import path from 'node:path';

import type { PublicEndpointSpec } from '../src/types/endpoints';

const repoRoot = path.resolve(__dirname, '..');
const endpointsPath = path.resolve(repoRoot, 'src/spec/public-endpoints.json');
const docsPath = path.resolve(repoRoot, 'docs/endpoints.md');

function titleCase(value: string): string {
  return value
    .split(/[-.]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

async function main() {
  const raw = await fs.readFile(endpointsPath, 'utf8');
  const endpoints = JSON.parse(raw) as PublicEndpointSpec[];

  const byNamespace = new Map<string, PublicEndpointSpec[]>();
  for (const endpoint of endpoints) {
    if (!byNamespace.has(endpoint.namespace)) {
      byNamespace.set(endpoint.namespace, []);
    }
    byNamespace.get(endpoint.namespace)?.push(endpoint);
  }

  const chunks: string[] = [];
  chunks.push('# Xyte Public Endpoint Catalog');
  chunks.push('');
  chunks.push(`Generated from Bruno docs on ${new Date().toISOString()}.`);
  chunks.push('');

  for (const [namespace, items] of [...byNamespace.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    chunks.push(`## ${titleCase(namespace)}`);
    chunks.push('');
    chunks.push('| Key | Method | Base | Path | Auth | Query Params |');
    chunks.push('| --- | --- | --- | --- | --- | --- |');

    for (const endpoint of items.sort((a, b) => a.key.localeCompare(b.key))) {
      chunks.push(
        `| \`${endpoint.key}\` | ${endpoint.method} | ${endpoint.base} | \`${endpoint.pathTemplate}\` | ${endpoint.authScope} | ${endpoint.queryParams.join(', ') || '-'} |`
      );
    }

    chunks.push('');
  }

  await fs.mkdir(path.dirname(docsPath), { recursive: true });
  await fs.writeFile(docsPath, `${chunks.join('\n')}\n`, 'utf8');
  console.log(`Wrote ${docsPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
