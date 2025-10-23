import { notify_Error } from "./telegram-notify.js";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RequestCfg = {
  url: string;
  baseURL?: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  timeoutMs?: number;            // таймаут одной попытки (по желанию)
  maxAttempts?: number;          // сколько всего попыток (вкл. первую)
  baseDelayMs?: number;          // старт бэкоффа
  maxDelayMs?: number;           // кап бэкоффа
};

const DEF = {
  timeoutMs: parseInt(process.env.FETCH_TIMEOUT_MS || "8000", 10),
  maxAttempts: parseInt(process.env.RETRY_MAX_ATTEMPTS || "4", 10),
  baseDelayMs: parseInt(process.env.RETRY_BASE_DELAY_MS || "300", 10),
  maxDelayMs: parseInt(process.env.RETRY_MAX_DELAY_MS || "4000", 10),
};

export async function request<T = unknown>(cfg: RequestCfg): Promise<T> {
  const {
    timeoutMs = DEF.timeoutMs,
    maxAttempts = DEF.maxAttempts,
    baseDelayMs = DEF.baseDelayMs,
    maxDelayMs = DEF.maxDelayMs,
  } = cfg;

  const method = (cfg.method || "GET").toUpperCase() as HttpMethod;
  const url = buildUrl(cfg.baseURL, cfg.url, cfg.params);
  const headers: Record<string, string> = { Accept: "application/json", ...(cfg.headers || {}) };
  const body = serializeBody(cfg.body, headers);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);

    try {
      const res = await fetch(url, { method, headers, body, signal: ctrl.signal });
      clearTimeout(timer);

      // успех → пытаемся распарсить JSON, иначе возвращаем undefined
      if (res.ok) return parseJsonResponse<T>(res);

      // 429 — ждём Retry-After (если есть), иначе обычный бэкофф, и пробуем снова
      if (res.status === 429 && attempt < maxAttempts) {
        const ra = parseRetryAfter(res.headers.get("retry-after"));
        await sleep(ra ?? nextDelay(attempt, baseDelayMs, maxDelayMs));
        continue;
      }

      // 5xx — ретрай по бэкоффу
      if (res.status >= 500 && res.status < 600 && attempt < maxAttempts) {
        await sleep(nextDelay(attempt, baseDelayMs, maxDelayMs));
        continue;
      }

      // неуспех без ретрая
      const bodyText = await safeText(res);
      const error = new Error(`HTTP ${res.status} ${method} ${url} :: ${short(bodyText)}`);
      if (attempt === maxAttempts) {
        // уведомим и бросим
        await notify_Error("HTTP request failed", { url, method, status: res.status, attempt, body: short(bodyText) });
      }
      throw error;

    } catch (e: any) {
      clearTimeout(timer);

      // таймаут → ретрай (кроме последней)
      if (e?.name === "AbortError") {
        if (attempt < maxAttempts) { await sleep(nextDelay(attempt, baseDelayMs, maxDelayMs)); continue; }
        await notify_Error("HTTP timeout", { url, method, attempt });
        throw new Error(`Timeout ${method} ${url}`);
      }

      // остальное — сразу наружу
      throw e;
    }
  }

  // теоретически не дойдём
  await notify_Error("HTTP exhausted", { url: cfg.url, method });
  throw new Error(`Exhausted attempts for ${method} ${cfg.url}`);
}

// ---- helpers

function buildUrl(base: string | undefined, path: string, params?: Record<string, any>) {
  const u = new URL(path, base || undefined);
  if (params) for (const [k, v] of Object.entries(params)) if (v != null) u.searchParams.set(k, String(v));
  return u.toString();
}

function serializeBody(body: unknown, headers: Record<string, string>): BodyInit | undefined {
  if (body == null) return undefined;
  if (typeof body === "string" || body instanceof Blob || body instanceof ArrayBuffer || body instanceof FormData) {
    return body as BodyInit;
  }
  if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";
  return JSON.stringify(body);
}

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return await res.json() as T;
  return undefined as unknown as T;
}

function parseRetryAfter(raw: string | null): number | undefined {
  if (!raw) return;
  const sec = parseInt(raw, 10); if (!Number.isNaN(sec)) return sec * 1000;
  const when = Date.parse(raw); const ms = when - Date.now(); return ms > 0 ? ms : undefined;
}

function nextDelay(attempt: number, base: number, cap: number) {
  const exp = Math.min(base * Math.pow(2, attempt - 1), cap);
  const jitter = Math.floor(Math.random() * (exp * 0.2)); // 0..20% для разведения
  return exp - jitter;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function safeText(res: Response) { try { return await res.text(); } catch { return ""; } }
function short(s: string, max = 500) { return s.length > max ? s.slice(0, max) + "…(trunc)" : s; }