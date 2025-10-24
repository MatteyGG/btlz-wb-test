// lib/http.ts

type Json = Record<string, unknown>;

export type HttpErrorBody = {
  title?: string;
  detail?: string;
  status?: number;
  statusText?: string;
  code?: string;
  requestId?: string;
  origin?: string;
  timestamp?: string;
  [k: string]: unknown;
};

export class HttpError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly body?: HttpErrorBody;

  constructor(status: number, statusText: string, body?: HttpErrorBody) {
    super(`HTTP ${status} ${statusText}${body?.detail ? ` — ${body.detail}` : ''}`);
    this.name = 'HttpError';
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }
}

export type RetryOptions = {
  /** Макс. попыток (включая первую). */
  attempts?: number;
  /** Базовая задержка (мс) для backoff. */
  baseDelayMs?: number;
  /** Верхняя граница задержки (мс). */
  maxDelayMs?: number;
};

// Загружаем дефолтные значения из env, если есть
const ENV_RETRY: Required<RetryOptions> = {
  attempts: Number(process.env.RETRY_MAX_ATTEMPTS) || 3,
  baseDelayMs: Number(process.env.RETRY_BASE_DELAY_MS) || 400,
  maxDelayMs: Number(process.env.RETRY_MAX_DELAY_MS) || 4000,
};

/**
 * Простой fetch с ретраями только для 429 (Too Many Requests).
 * Уважает заголовок `Retry-After` (секунды).
 *
 * Настройки по умолчанию читаются из env:
 * - RETRY_MAX_ATTEMPTS
 * - RETRY_BASE_DELAY_MS
 * - RETRY_MAX_DELAY_MS
 *
 * @template T Тип ожидаемого JSON.
 * @throws {HttpError} для неуспешных ответов (кроме повторяемых 429).
 */
export async function fetchWithRetry<T = Json>(
  input: RequestInfo | URL,
  init?: RequestInit,
  retry: RetryOptions = {},
): Promise<T> {
  const attempts = Math.max(1, retry.attempts ?? ENV_RETRY.attempts);
  const baseDelay = retry.baseDelayMs ?? ENV_RETRY.baseDelayMs;
  const maxDelay = retry.maxDelayMs ?? ENV_RETRY.maxDelayMs;

  for (let i = 1; i <= attempts; i++) {
    const res = await fetch(input, init);

    if (res.ok) {
      if (res.status === 204) return undefined as unknown as T;
      try {
        return (await res.json()) as T;
      } catch {
        return {} as T;
      }
    }

    let body: HttpErrorBody | undefined;
    try {
      body = (await res.json()) as HttpErrorBody;
    } catch {/* ignore */}

    if (res.status === 429 && i < attempts) {
      const retryAfter = res.headers.get('retry-after');
      const retryAfterMs = retryAfter ? Number(retryAfter) * 1000 : NaN;
      const backoff = Math.min(maxDelay, baseDelay * 2 ** (i - 1));
      const jitter = Math.random() * (backoff * 0.25);
      const delay = Number.isFinite(retryAfterMs) ? retryAfterMs : Math.round(backoff + jitter);
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }

    throw new HttpError(res.status, res.statusText, body);
  }

  throw new Error('fetchWithRetry exhausted without result');
}
