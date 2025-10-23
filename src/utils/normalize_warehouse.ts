import { ApiResponse, Warehouse } from "#BoxTariffs/types/types.js";

export async function normalise_warehouse_data(apiResponse: ApiResponse): Promise<Warehouse[]> {
    const { dtNextBox, dtTillMax, warehouseList } = apiResponse.response.data;
    const today = new Date().toISOString().slice(0, 10);
    return warehouseList.map((w) => ({
        date: today,
        warehouseName: w.warehouseName,
        geoName: w.geoName,
        dtNextBox,
        dtTillMax,
        boxDeliveryBase: parseFloat(w.boxDeliveryBase),
        boxDeliveryCoefExpr: parseFloat(w.boxDeliveryCoefExpr),
        boxDeliveryLiter: parseFloat(w.boxDeliveryLiter),
        boxDeliveryMarketplaceBase: parseFloat(w.boxDeliveryMarketplaceBase),
        boxDeliveryMarketplaceCoefExpr: parseFloat(w.boxDeliveryMarketplaceCoefExpr),
        boxDeliveryMarketplaceLiter: parseFloat(w.boxDeliveryMarketplaceLiter),
        boxStorageBase: parseFloat(w.boxStorageBase),
        boxStorageCoefExpr: parseFloat(w.boxStorageCoefExpr),
        boxStorageLiter: parseFloat(w.boxStorageLiter),
    }));
}
