import { Warehouse } from '#BoxTariffs/types/types.js';
import env from '#config/env/env.js';
import { telegram_notify } from '#lib/telegram-notify.js';
import { GoogleAuth } from 'google-auth-library';
import { JSONClient } from 'google-auth-library/build/src/auth/googleauth.js';
import { google, sheets_v4 } from 'googleapis';

/**
 * Сервис для взаимодействия с Google Sheets API: авторизуется с сервисным аккаунтом и обновляет таблицы тарифов.
 * @remarks Использует переменные окружения `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY` и `GSHEETS_IDS`.
 */
export class GsheetsApiService {
  private sheetsClient: sheets_v4.Sheets | null = null;

  private async getClient(): Promise<sheets_v4.Sheets> {
    if (this.sheetsClient) {
      return this.sheetsClient;
    }

    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!clientEmail || !privateKey) {
      throw new Error('Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY in environment');
    }

    // Поддержка base64-формата ключа
    try {
      if (/^[A-Za-z0-9+/=]+\s*$/.test(privateKey) && !privateKey.includes('BEGIN PRIVATE KEY')) {
        const decoded = Buffer.from(privateKey, 'base64').toString('utf8');
        if (decoded.includes('BEGIN PRIVATE KEY')) {
          privateKey = decoded;
        }
      }
    } catch {
      // игнорируем ошибку декодирования
    }
    privateKey = privateKey.replace(/\\n/g, '\n');

    const auth = new GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    await this.verifyAuth(auth);

    this.sheetsClient = google.sheets({ version: 'v4', auth });
    return this.sheetsClient;
  }

  private async verifyAuth(auth: GoogleAuth<JSONClient>): Promise<void> {
    try {
      const client = await auth.getClient();
      const tokenInfo = await client.getAccessToken();
      if (!tokenInfo || !tokenInfo.token) {
        throw new Error('Failed to obtain access token');
      }
      console.info('Google Sheets API auth successful');
    } catch (err) {
      throw new Error(`Google authentication failed: ${(err as Error).message}`);
    }
  }

  private formatDate(iso: string): string {
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}:${hh}`;
  }

  /**
   * Обновляет одну или несколько таблиц (IDs из GSHEETS_IDS).
   * Данные сортируются по ключу из окружения и пишутся
   * в лист `stocks_coefs`, начиная с A1, включая заголовок.
   */
  async update_gsheets_from_database(warehouses: Warehouse[]): Promise<void> {
    const sheets = await this.getClient();

    const idsRaw = process.env.GSHEETS_IDS || '';
    const spreadsheetIds = idsRaw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (spreadsheetIds.length === 0) {
      console.warn('No Google Sheets IDs provided in GSHEETS_IDS; skipping update');
      return;
    }

    // Используем ключ сортировки из env
    const sortKey = env.GSHEET_SORT_KEY as keyof Warehouse;

    const sorted = [...warehouses].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return aVal - bVal;
      }
      // если не число — просто вернуть 0 (нет изменений порядка)
      return 0;
    });

    const header = [
      'Дата (YYYY-MM-DD:HH) snapshot',
      'Название склада',
      'Страна, для РФ — округ',
      'Логистика, первый литр, ₽',
      'Коэффициент Логистика, %. На него умножается стоимость логистики. Уже учтён в тарифах',
      'Логистика, дополнительный литр, ₽',
      'Логистика FBS, первый литр, ₽',
      'Коэффициент FBS, %.',
      'Логистика FBS, дополнительный литр, ₽',
      'Хранение в день, первый литр, ₽',
      'Коэффициент Хранение, %.',
      'Хранение в день, дополнительный литр, ₽',
    ] as const;

    const rows = sorted.map((w) => [
      this.formatDate(w.date),
      w.warehouseName,
      w.geoName,
      w.boxDeliveryBase,
      w.boxDeliveryCoefExpr,
      w.boxDeliveryLiter,
      w.boxDeliveryMarketplaceBase,
      w.boxDeliveryMarketplaceCoefExpr,
      w.boxDeliveryMarketplaceLiter,
      w.boxStorageBase,
      w.boxStorageCoefExpr,
      w.boxStorageLiter,
    ]);

    const values = [header as unknown as string[], ...rows];

    for (const id of spreadsheetIds) {
      try {
        console.info(`Updating sheet ${id} with ${rows.length} rows`);

        // Запись данных
        await sheets.spreadsheets.values.update({
          spreadsheetId: id,
          range: 'stocks_coefs!A1',
          valueInputOption: 'RAW',
          requestBody: { values },
        });

        // Получаем сведения о листах, чтобы найти листId листа «stocks_coefs»
        const meta = await sheets.spreadsheets.get({
          spreadsheetId: id,
        });

        const sheet = meta.data.sheets?.find((s) => s.properties?.title === 'stocks_coefs');
        if (!sheet || sheet.properties?.sheetId === undefined) {
          console.warn(`Sheet "stocks_coefs" not found in spreadsheet ${id}. Skipping auto-resize.`);
          continue;
        }

        const sheetId = sheet.properties.sheetId;

        // Автоматическая подгонка колонок
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: id,
          requestBody: {
            requests: [
              {
                autoResizeDimensions: {
                  dimensions: {
                    sheetId: sheetId,
                    dimension: 'COLUMNS',
                    startIndex: 0,
                    endIndex: header.length,
                  },
                },
              },
            ],
          },
        });
        console.info(`Auto-resize columns completed for sheetId ${sheetId} in spreadsheet ${id}`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await telegram_notify(
          'Google Sheets update error',
          undefined,
          `Spreadsheet ID: ${id} — error: ${message}`
        );
        // Можно либо продолжать на следующий ID либо прерывать — взяты политики продолжения
      }
    }
  }
}