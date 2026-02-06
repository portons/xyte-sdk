import { promises as fs } from 'node:fs';
import path from 'node:path';

import type {
  EndpointAuthScope,
  EndpointBase,
  EndpointBodyType,
  EndpointNamespace,
  PublicEndpointSpec
} from '../src/types/endpoints';

const repoRoot = path.resolve(__dirname, '..');
const docsRoot =
  process.env.XYTE_SERVER_DOCS_ROOT ??
  path.resolve(repoRoot, '../server/docs/api/Xyte Public/Xyte Platform API - Documentation');
const outputPath = path.resolve(repoRoot, 'src/spec/public-endpoints.json');
const overridesPath = path.resolve(repoRoot, 'src/spec/drift-overrides.json');

type EndpointOverride = Partial<PublicEndpointSpec> & {
  appendNotes?: string[];
};

function toCamelCase(raw: string): string {
  const cleaned = raw
    .replace(/\.[^.]+$/, '')
    .replace(/[()]/g, ' ')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim();

  if (!cleaned) {
    return 'unknown';
  }

  const words = cleaned.split(/\s+/);
  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index === 0) {
        return lower;
      }
      return lower.slice(0, 1).toUpperCase() + lower.slice(1);
    })
    .join('');
}

function toSlug(raw: string): string {
  return raw
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function parseSimpleBlock(content: string, blockName: string): string | undefined {
  const escaped = blockName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = content.match(new RegExp(`^\\s*${escaped}\\s*\\{([\\s\\S]*?)^\\s*\\}`, 'm'));
  return match?.[1];
}

function parseKeyValues(block: string | undefined): Record<string, string> {
  if (!block) {
    return {};
  }

  const out: Record<string, string> = {};
  const lines = block.split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^\s*~?([A-Za-z0-9_\-]+)\s*:\s*(.*)$/);
    if (!match) {
      continue;
    }
    out[match[1]] = match[2].trim();
  }

  return out;
}

function normalizeBodyType(raw: string | undefined): EndpointBodyType {
  if (!raw) {
    return 'none';
  }
  const value = raw.trim().toLowerCase();
  if (value === 'none') {
    return 'none';
  }
  if (value === 'json') {
    return 'json';
  }
  if (value === 'multipartform' || value === 'multipart-form') {
    return 'multipart-form';
  }
  return 'unknown';
}

function normalizeUrl(raw: string): string {
  return raw
    .replace(/\{\{\s*hub_url\s*\}\}/g, 'https://hub.xyte.io')
    .replace(/\{\{\s*entry_url\s*\}\}/g, 'https://entry.xyte.io')
    .replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, ':$1');
}

function parseUrl(urlText: string): { base: EndpointBase; pathTemplate: string; queryParams: string[] } {
  const normalized = normalizeUrl(urlText);
  const hasScheme = /^https?:\/\//.test(normalized);

  if (!hasScheme) {
    throw new Error(`Unsupported URL format: ${urlText}`);
  }

  const parsed = new URL(normalized);
  const base: EndpointBase = parsed.hostname === 'entry.xyte.io' ? 'entry' : 'hub';

  const queryParams = new Set<string>();
  if (parsed.search.length > 1) {
    const rawQuery = parsed.search.slice(1);
    for (const part of rawQuery.split('&')) {
      if (!part) {
        continue;
      }
      const name = part.split('=')[0]?.trim();
      if (!name) {
        continue;
      }
      queryParams.add(name.replace(/^~/, ''));
    }
  }

  return {
    base,
    pathTemplate: parsed.pathname,
    queryParams: [...queryParams]
  };
}

function inferAuthScope(authHeaderValue: string | undefined): EndpointAuthScope {
  const value = (authHeaderValue ?? '').toLowerCase();
  if (!value) {
    return 'none';
  }
  if (value.includes('org_api')) {
    return 'organization';
  }
  if (value.includes('partner_api')) {
    return 'partner';
  }
  if (value.includes('authorization')) {
    return 'device';
  }
  return 'none';
}

function inferNamespace(topDir: string): EndpointNamespace {
  if (topDir === 'Device API') {
    return 'device';
  }
  if (topDir === 'Organization API') {
    return 'organization';
  }
  if (topDir === 'Partner API') {
    return 'partner';
  }
  throw new Error(`Unsupported API namespace directory: ${topDir}`);
}

async function walkFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkFiles(fullPath)));
    } else if (entry.isFile() && fullPath.endsWith('.bru') && !fullPath.endsWith('folder.bru')) {
      out.push(fullPath);
    }
  }

  return out;
}

function parseBodyExample(content: string): string | undefined {
  const match = content.match(/^\s*body:(json|multipart-form|text)\s*\{([\s\S]*?)^\s*\}/m);
  if (!match) {
    return undefined;
  }
  return match[2].trim();
}

function parseEndpoint(filePath: string, content: string): PublicEndpointSpec | null {
  const rel = path.relative(docsRoot, filePath);
  const relParts = rel.split(path.sep);

  if (relParts.length < 2) {
    return null;
  }

  const namespace = inferNamespace(relParts[0]);
  const groupPath = relParts.length > 2 ? relParts.slice(1, -1).map(toSlug).filter(Boolean).join('.') : 'general';
  const fileName = relParts[relParts.length - 1];

  const methodMatch = content.match(/^\s*(get|post|put|patch|delete)\s*\{([\s\S]*?)^\s*\}/m);
  if (!methodMatch) {
    return null;
  }

  const method = methodMatch[1].toUpperCase() as PublicEndpointSpec['method'];
  const methodBlock = methodMatch[2];

  const urlMatch = methodBlock.match(/^\s*url:\s*(.+)$/m);
  if (!urlMatch) {
    throw new Error(`Missing URL in ${filePath}`);
  }

  const bodyType = normalizeBodyType(methodBlock.match(/^\s*body:\s*(.+)$/m)?.[1]);
  const parsedUrl = parseUrl(urlMatch[1].trim());
  const pathParamsBlock = parseKeyValues(parseSimpleBlock(content, 'params:path'));
  const queryParamsBlock = parseKeyValues(parseSimpleBlock(content, 'params:query'));
  const headers = parseKeyValues(parseSimpleBlock(content, 'headers'));

  const pathParams = new Set<string>(Object.keys(pathParamsBlock));
  for (const match of parsedUrl.pathTemplate.matchAll(/:([a-zA-Z0-9_]+)/g)) {
    pathParams.add(match[1]);
  }

  const queryParams = new Set<string>(parsedUrl.queryParams);
  for (const key of Object.keys(queryParamsBlock)) {
    queryParams.add(key.replace(/^~/, ''));
  }

  const title = content.match(/^\s*meta\s*\{[\s\S]*?^\s*name:\s*(.+)$/m)?.[1]?.trim() ?? fileName.replace(/\.bru$/, '');
  const action = toCamelCase(fileName);
  const key = groupPath === 'general' ? `${namespace}.${action}` : `${namespace}.${groupPath}.${action}`;

  return {
    key,
    namespace,
    group: groupPath,
    action,
    title,
    method,
    base: parsedUrl.base,
    pathTemplate: parsedUrl.pathTemplate,
    pathParams: [...pathParams],
    queryParams: [...queryParams],
    authScope: inferAuthScope(headers.Authorization),
    bodyType,
    hasBody: bodyType !== 'none',
    sourceFile: rel,
    bodyExample: parseBodyExample(content)
  };
}

function applyOverrides(endpoints: PublicEndpointSpec[], overrides: Record<string, EndpointOverride>): PublicEndpointSpec[] {
  return endpoints.map((endpoint) => {
    const override = overrides[endpoint.key];
    if (!override) {
      return endpoint;
    }

    const { appendNotes = [], ...overrideFields } = override;
    const merged: PublicEndpointSpec = {
      ...endpoint,
      ...overrideFields,
      notes: [...(endpoint.notes ?? []), ...appendNotes]
    };

    if (!merged.pathParams.length) {
      for (const match of merged.pathTemplate.matchAll(/:([a-zA-Z0-9_]+)/g)) {
        merged.pathParams.push(match[1]);
      }
      merged.pathParams = [...new Set(merged.pathParams)];
    }

    return merged;
  });
}

async function main() {
  const files = await walkFiles(docsRoot);
  const endpoints: PublicEndpointSpec[] = [];

  for (const filePath of files) {
    const content = await fs.readFile(filePath, 'utf8');
    const endpoint = parseEndpoint(filePath, content);
    if (endpoint) {
      endpoints.push(endpoint);
    }
  }

  endpoints.sort((a, b) => a.key.localeCompare(b.key));

  let overrides: Record<string, EndpointOverride> = {};
  try {
    const rawOverrides = await fs.readFile(overridesPath, 'utf8');
    overrides = JSON.parse(rawOverrides) as Record<string, EndpointOverride>;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  const withOverrides = applyOverrides(endpoints, overrides);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(withOverrides, null, 2)}\n`, 'utf8');

  console.log(`Synced ${withOverrides.length} endpoints from ${docsRoot}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
