import { ApiResponse, Warehouse } from "#BoxTariffs/types/types.js";

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/\u00A0/g, "").replace(/\s+/g, "").replace(",", ".");
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

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
