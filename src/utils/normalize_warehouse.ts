import { ApiResponse, Warehouse } from "#BoxTariffs/types/types.js";
import toNumber from "./toNumber.js";



/**
 * Преобразует данные ответа API по складам в массив объектов "Warehouse", приводя числовые поля к "number".
 * @param apiResponse Ответ метода API Wildberries с тарифами по складам.
 * @returns Массив нормализованных складов с актуальной датой и числовыми тарифами.
 */
export async function normalise_warehouse_data(apiResponse: ApiResponse): Promise<Warehouse[]> {
  const { dtNextBox, dtTillMax, warehouseList } = apiResponse.response.data;
  const today = new Date().toISOString().slice(0, 10);

  return warehouseList.map((w) => ({
    date: today,
    warehouseName: w.warehouseName,
    geoName: w.geoName,
    dtNextBox,
    dtTillMax,
    boxDeliveryBase: toNumber(w.boxDeliveryBase) ?? NaN,
    boxDeliveryCoefExpr: toNumber(w.boxDeliveryCoefExpr) ?? NaN,
    boxDeliveryLiter: toNumber(w.boxDeliveryLiter) ?? NaN,
    boxDeliveryMarketplaceBase: toNumber(w.boxDeliveryMarketplaceBase) ?? NaN,
    boxDeliveryMarketplaceCoefExpr: toNumber(w.boxDeliveryMarketplaceCoefExpr) ?? NaN,
    boxDeliveryMarketplaceLiter: toNumber(w.boxDeliveryMarketplaceLiter) ?? NaN,
    boxStorageBase: toNumber(w.boxStorageBase) ?? NaN,
    boxStorageCoefExpr: toNumber(w.boxStorageCoefExpr) ?? NaN,
    boxStorageLiter: toNumber(w.boxStorageLiter) ?? NaN,
  }));
}
