import { ApiResponse } from "#BoxTariffs/types/types.js";
import { fetchWithRetry, HttpError } from "#lib/http.js";
import { telegram_notify } from "#lib/telegram-notify.js";

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Сервис для обращения к эндпоинту тарифов коробов Wildberries.
 *
 * Требования:
 * - Обязательный параметр `date` в формате `ГГГГ-ММ-ДД`.
 * - Токен (bearer) в `process.env.WB_API_TOKEN`.
 * - Ретраим только 429 (внутри fetchWithRetry).
 */
export class WbApiService {
  /**
   * Получить тарифы коробов Wildberries на заданную дату.
   *
   * @param {string} date Дата в формате `ГГГГ-ММ-ДД` (например, "2024-09-30").
   * @returns {Promise<ApiResponse>} Распарсенный JSON от WB API.
   * @throws {Error|HttpError} При валидационной/сетевой/HTTP ошибке.
   *
   * @example
   * const svc = new WbApiService();
   * const data = await svc.fetch_tariffs('2024-09-30');
   */
  async fetch_tariffs(date: string): Promise<ApiResponse> {
    if (!DATE_RX.test(date)) {
      throw new Error(`Invalid date format: "${date}". Expected YYYY-MM-DD`);
    }

    const token = process.env.WB_API_TOKEN;
    if (!token) {
      await telegram_notify('WB API: отсутствует токен');
      throw new Error('WB API token is missing (WB_API_TOKEN)');
    }

    const url = `https://common-api.wildberries.ru/api/v1/tariffs/box?date=${date}`;

    try {
      return await fetchWithRetry<ApiResponse>(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      if (err instanceof HttpError) {
        const b = err.body;
        const parts = [
          b?.title ?? err.statusText,
          b?.detail,
          b?.requestId ? `requestId: ${b.requestId}` : undefined,
          b?.origin ? `origin: ${b.origin}` : undefined,
          b?.code ? `code: ${b.code}` : undefined,
        ].filter(Boolean);
        await telegram_notify('WB API error', err.status, parts.join('\n'));
      } else {
        await telegram_notify('WB API network error', undefined, (err as Error)?.message);
      }
      throw err;
    }
  }
}
