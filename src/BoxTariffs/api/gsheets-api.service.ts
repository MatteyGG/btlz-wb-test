// GsheetsApiService.ts
import { Warehouse } from '#BoxTariffs/types/types.js';
import { google, sheets_v4 } from 'googleapis';

/**
 * Доступ к Google Sheets через сервис-аккаунт.
 * Требуются переменные окружения:
 *  - GOOGLE_CLIENT_EMAIL
 *  - GOOGLE_PRIVATE_KEY  (c \n или в base64)
 *  - GSHEETS_IDS         (через запятую)
 */
export class GsheetsApiService {
  private sheetsClient: sheets_v4.Sheets | null = null;

  private async getClient(): Promise<sheets_v4.Sheets> {
    if (this.sheetsClient) return this.sheetsClient;

    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!clientEmail || !privateKey) {
      throw new Error('Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY in environment');
    }

    // Поддержка двух распространённых форматов хранения ключа:
    // 1) со строковыми "\n"; 2) base64-кодированный JSON-ключ.
    try {
      // Если переменная выглядит как base64 — попробуем декодировать.
      if (/^[A-Za-z0-9+/=]+\s*$/.test(privateKey) && !privateKey.includes('BEGIN PRIVATE KEY')) {
        const decoded = Buffer.from(privateKey, 'base64').toString('utf8');
        // Если после декодирования там действительно PEM — используем его.
        if (decoded.includes('BEGIN PRIVATE KEY')) {
          privateKey = decoded;
        }
      }
    } catch {
      // игнорируем и продолжаем со строкой как есть
    }
    // Если остались экранированные \n — превращаем в реальные переводы строки.
    privateKey = privateKey.replace(/\\n/g, '\n');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheetsClient = google.sheets({ version: 'v4', auth });
    return this.sheetsClient;
  }

  /**
   * Обновляет одну или несколько таблиц (IDs из GSHEETS_IDS).
   * Данные сортируются по boxDeliveryCoefExpr по возрастанию и пишутся
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

    // Сортировка по коэффициенту
    const sorted = [...warehouses].sort((a, b) => a.boxDeliveryCoefExpr - b.boxDeliveryCoefExpr);

    // Заголовки и строки
    const header = [
      'date',
      'warehouseName',
      'geoName',
      'boxDeliveryBase',
      'boxDeliveryCoefExpr',
      'boxDeliveryLiter',
      'boxDeliveryMarketplaceBase',
      'boxDeliveryMarketplaceCoefExpr',
      'boxDeliveryMarketplaceLiter',
      'boxStorageBase',
      'boxStorageCoefExpr',
      'boxStorageLiter',
      'dtNextBox',
      'dtTillMax',
    ] as const;

    const rows = sorted.map((w) => [
      w.date,
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
      w.dtNextBox,
      w.dtTillMax,
    ]);

    const values = [header as unknown as string[], ...rows];

    // Записываем во все указанные таблицы
    for (const id of spreadsheetIds) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: id,
        range: 'stocks_coefs!A1',
        valueInputOption: 'RAW',
        requestBody: { values },
      });
    }
  }
}
