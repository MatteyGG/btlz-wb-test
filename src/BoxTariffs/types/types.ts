export interface ApiResponse {
  response: {
    data: {
      dtNextBox: string;
      dtTillMax: string;
      warehouseList: Array<{
        warehouseName: string;
        geoName: string;
        boxDeliveryBase: string;
        boxDeliveryCoefExpr: string;
        boxDeliveryLiter: string;
        boxDeliveryMarketplaceBase: string;
        boxDeliveryMarketplaceCoefExpr: string;
        boxDeliveryMarketplaceLiter: string;
        boxStorageBase: string;
        boxStorageCoefExpr: string;
        boxStorageLiter: string;
      }>;
    };
  };
}

export interface Warehouse {
  /** Date (YYYY‑MM‑DD) for which the rates apply */
  date: string;
  /** Name of the warehouse */
  warehouseName: string;
  /** Geographic region or country (e.g. "Центральный федеральный округ") */
  geoName: string;
  /** Date of the next tariff box change */
  dtNextBox: string;
  /** Date of the last tariff box change */
  dtTillMax: string;
  /** Logistics – first litre cost (₽) */
  boxDeliveryBase: number;
  /** Logistics – coefficient (%) */
  boxDeliveryCoefExpr: number;
  /** Logistics – additional litre cost (₽) */
  boxDeliveryLiter: number;
  /** Logistics FBS – first litre cost (₽) */
  boxDeliveryMarketplaceBase: number;
  /** Logistics FBS – coefficient (%) */
  boxDeliveryMarketplaceCoefExpr: number;
  /** Logistics FBS – additional litre cost (₽) */
  boxDeliveryMarketplaceLiter: number;
  /** Storage – first litre cost per day (₽) */
  boxStorageBase: number;
  /** Storage – coefficient (%) */
  boxStorageCoefExpr: number;
  /** Storage – additional litre cost per day (₽) */
  boxStorageLiter: number;
}