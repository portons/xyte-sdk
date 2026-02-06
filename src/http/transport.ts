import { setTimeout as delay } from 'node:timers/promises';

import { XyteHttpError } from './errors';

export interface TransportOptions {
  timeoutMs?: number;
  retryAttempts?: number;
  retryBackoffMs?: number;
}

export interface TransportRequest {
  endpointKey?: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string | FormData;
  idempotent?: boolean;
  timeoutMs?: number;
}

function toLowerCaseMap(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key.toLowerCase()] = value;
  });
  return out;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }

  const text = await response.text();
  return text ? { message: text } : undefined;
}

function shouldRetry(error: unknown): boolean {
  if (error instanceof XyteHttpError) {
    return error.status >= 500;
  }
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }
  return error instanceof TypeError;
}

export class HttpTransport {
  private readonly timeoutMs: number;
  private readonly retryAttempts: number;
  private readonly retryBackoffMs: number;

  constructor(options: TransportOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? 15_000;
    this.retryAttempts = options.retryAttempts ?? 2;
    this.retryBackoffMs = options.retryBackoffMs ?? 250;
  }

  async request<T = unknown>(request: TransportRequest): Promise<{ status: number; headers: Record<string, string>; data: T }> {
    const idempotent = request.idempotent ?? ['GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS'].includes(request.method.toUpperCase());
    const attempts = idempotent ? this.retryAttempts + 1 : 1;

    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), request.timeoutMs ?? this.timeoutMs);

      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body,
          signal: controller.signal
        });
        clearTimeout(timeout);

        const parsed = await parseResponseBody(response);
        if (!response.ok) {
          throw new XyteHttpError({
            message: `HTTP ${response.status} ${response.statusText}`,
            status: response.status,
            statusText: response.statusText,
            endpointKey: request.endpointKey,
            details: parsed
          });
        }

        return {
          status: response.status,
          headers: toLowerCaseMap(response.headers),
          data: parsed as T
        };
      } catch (error) {
        clearTimeout(timeout);
        lastError = error;

        if (attempt === attempts || !shouldRetry(error)) {
          throw error;
        }

        await delay(this.retryBackoffMs * attempt);
      }
    }

    throw lastError;
  }
}
