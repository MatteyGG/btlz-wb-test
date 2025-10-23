import { ApiResponse } from "#BoxTariffs/types/types.js";

/**
 * WbApiService wraps calls to the Wildberries box tariffs endpoint.  A date
 * parameter is required by the API in YYYY‑MM‑DD format; the default
 * implementation uses the supplied `now` function to generate the current
 * date.  A bearer token must be provided via the `WB_API_TOKEN`
 * environment variable.
 */
export class WbApiService {
  /**
   * Fetch tariffs for a given day.  The `now` function defaults to
   * `Date.now`, allowing callers to override the clock (useful in tests).
   *
   * @param now A function returning the current timestamp in milliseconds.
   */
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