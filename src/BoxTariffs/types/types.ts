export interface ApiResponse {
  response: {
    data: {
      /** Дата начала следующего тарифа  */
      dtNextBox: string;
      /** Дата окончания последнего установленного тарифа */
      dtTillMax: string;
      /** Тарифы для коробов, сгруппированные по складам */
      warehouseList: Array<{
        /** Название склада */
        warehouseName: string;
        /** Страна, для РФ — округ */
        geoName: string;
        /** Логистика, первый литр, ₽ */
        boxDeliveryBase: string;
        /** Коэффициент Логистика, %. На него умножается стоимость логистики. Уже учтён в тарифах  */
        boxDeliveryCoefExpr: string;
        /** Логистика, дополнительный литр, ₽ */
        boxDeliveryLiter: string;
        /** Логистика FBS, первый литр, ₽  */
        boxDeliveryMarketplaceBase: string;
        /** Коэффициент FBS, %. На него умножается стоимость логистики FBS. Уже учтён в тарифах */
        boxDeliveryMarketplaceCoefExpr: string;
        /** Логистика FBS, дополнительный литр, ₽  */
        boxDeliveryMarketplaceLiter: string;
        /** Хранение в день, первый литр, ₽ */
        boxStorageBase: string;
        /** Коэффициент Хранение, %. На него умножается стоимость хранения в день. Уже учтён в тарифах  */
        boxStorageCoefExpr: string;
        /** Хранение в день, дополнительный литр, ₽ */
        boxStorageLiter: string;
      }>;
    };
  };
}

export interface Warehouse {
  /** Дата (YYYY‑MM‑DD) snapshot'a */
  date: string;
  /** Название склада */
  warehouseName: string;
  /** Страна, для РФ — округ */
  geoName: string;
   /** Логистика, первый литр, ₽ */
  boxDeliveryBase: number;
   /** Коэффициент Логистика, %. На него умножается стоимость логистики. Уже учтён в тарифах  */
  boxDeliveryCoefExpr: number;
  /** Логистика, дополнительный литр, ₽ */
  boxDeliveryLiter: number;
 /** Логистика FBS, первый литр, ₽  */
  boxDeliveryMarketplaceBase: number;
  /** Коэффициент FBS, %. На него умножается стоимость логистики FBS. Уже учтён в тарифах */
  boxDeliveryMarketplaceCoefExpr: number;
  /** Логистика FBS, дополнительный литр, ₽ */
  boxDeliveryMarketplaceLiter: number;
  /** Хранение в день, первый литр, ₽*/
  boxStorageBase: number;
  /** Коэффициент Хранение, %. На него умножается стоимость хранения в день. Уже учтён в тарифах */
  boxStorageCoefExpr: number;
  /** Хранение в день, дополнительный литр, ₽ */
  boxStorageLiter: number;
}