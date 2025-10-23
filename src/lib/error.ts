// Базовый «интеграционный» эксепшн с контекстом
export class IntegrationError extends Error {
  readonly code: string;
  readonly context?: Record<string, unknown>;
  constructor(code: string, message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = "IntegrationError";
    this.code = code;
    this.context = context;
  }
}

// Традиционные HTTP/сетевые ошибки
export class HttpError extends IntegrationError {
  readonly status?: number;
  constructor(message: string, status?: number, context?: Record<string, unknown>) {
    super("HTTP_ERROR", message, { status, ...context });
    this.name = "HttpError";
    this.status = status;
  }
}
export class NetworkError extends IntegrationError {
  constructor(message: string, context?: Record<string, unknown>) {
    super("NETWORK_ERROR", message, context);
    this.name = "NetworkError";
  }
}
export class TimeoutError extends IntegrationError {
  constructor(message: string, context?: Record<string, unknown>) {
    super("TIMEOUT", message, context);
    this.name = "TimeoutError";
  }
}

// WB-специфичные (по твоей схеме)
export type WbProblemJson400 = {
  title?: string; detail?: string; origin?: string; requestId?: string;
};
export type WbErrorCommon = {
  title?: string; detail?: string; code?: string; requestId?: string;
  origin?: string; status?: number; statusText?: string; timestamp?: string;
};

export class WbBadRequestError extends IntegrationError {
  readonly wb?: WbProblemJson400;
  constructor(message: string, wb?: WbProblemJson400, context?: Record<string, unknown>) {
    super("WB_400_BAD_REQUEST", message, { wb, ...context });
    this.name = "WbBadRequestError";
    this.wb = wb;
  }
}
export class WbUnauthorizedError extends IntegrationError {
  readonly wb?: WbErrorCommon;
  constructor(message: string, wb?: WbErrorCommon, context?: Record<string, unknown>) {
    super("WB_401_UNAUTHORIZED", message, { wb, ...context });
    this.name = "WbUnauthorizedError";
    this.wb = wb;
  }
}
export class WbTooManyRequestsError extends IntegrationError {
  readonly wb?: WbErrorCommon;
  constructor(message: string, wb?: WbErrorCommon, context?: Record<string, unknown>) {
    super("WB_429_TOO_MANY", message, { wb, ...context });
    this.name = "WbTooManyRequestsError";
    this.wb = wb;
  }
}
