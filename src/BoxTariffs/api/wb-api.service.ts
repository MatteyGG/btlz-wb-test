import { ApiResponse } from "#BoxTariffs/types/types.js";

/**
 * Сервис WbApiService обращается к эндпоинту тарифов коробов Wildberries.
 * API требует обязательного параметра date в формате ГГГГ-ММ-ДД; реализация по умолчанию
 * использует переданную функцию "now" для получения текущей даты.
 * Токен (bearer token) должен быть предоставлен через переменную окружения `WB_API_TOKEN`.
 */
export class WbApiService {
  async fetchTariffs(now: () => number = Date.now): Promise<ApiResponse> {
    const date = new Date(now()).toISOString().slice(0, 10);
    const url = `https://common-api.wildberries.ru/api/v1/tariffs/box?date=${date}`;
    const token = process.env.WB_API_TOKEN;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
    if (!response.ok) {
      throw new Error(`WB API error: ${response.status}`);
    }
    return (await response.json()) as ApiResponse;
  }
}