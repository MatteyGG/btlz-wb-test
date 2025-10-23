import { Warehouse } from "#BoxTariffs/types/types.js";
import knex from "#postgres/knex.js";

/**
 * Сервис WarehouseStorageService сохраняет данные о тарифах в PostgreSQL и
 * предоставляет методы для получения последнего snapshot'a данных за указанный день.
 * Данные хранятся в таблице `warehouse_rates`.
 */
export class WarehouseStorageService {
  /**
   * Вставляет или обновляет список складов / warehouses. Для каждой записи комбинация
   * `date` и `warehouse_name` должна быть уникальной. При обнаружении конфликта
   * существующая строка обновляется новыми значениями. Метод выполняет
   * вставку/объединение последовательно для простоты; можно группировать
   * для повышения производительности.
   */
  async save_warehouses(warehouses: Warehouse[]): Promise<void> {
    for (const warehouse of warehouses) {
      const row = {
        date: warehouse.date,
        warehouse_name: warehouse.warehouseName,
        geo_name: warehouse.geoName,
        box_delivery_base: warehouse.boxDeliveryBase,
        box_delivery_coef_expr: warehouse.boxDeliveryCoefExpr,
        box_delivery_liter: warehouse.boxDeliveryLiter,
        box_delivery_marketplace_base: warehouse.boxDeliveryMarketplaceBase,
        box_delivery_marketplace_coef_expr: warehouse.boxDeliveryMarketplaceCoefExpr,
        box_delivery_marketplace_liter: warehouse.boxDeliveryMarketplaceLiter,
        box_storage_base: warehouse.boxStorageBase,
        box_storage_coef_expr: warehouse.boxStorageCoefExpr,
        box_storage_liter: warehouse.boxStorageLiter,
      };
      await knex('warehouse_rates')
        .insert(row)
        .onConflict(['date', 'warehouse_name'])
        .merge(row);
    }
  }

  /**
   * Получает все тарифы складов за текущий день (сегодня) с сортировкой по
   * коэффициенту по возрастанию. Возможно передать date.
   */
  async get_latest_warehouses(date?: string): Promise<Warehouse[]> {
    const targetDate = date || new Date().toISOString().slice(0, 10);
    const rows = await knex('warehouse_rates')
      .where({ date: targetDate })
      .orderBy('box_delivery_coef_expr', 'asc');
    return rows.map((row: any) => ({
      date: row.date,
      warehouseName: row.warehouse_name,
      geoName: row.geo_name,
      dtNextBox: row.dt_next_box,
      dtTillMax: row.dt_till_max,
      boxDeliveryBase: Number(row.box_delivery_base),
      boxDeliveryCoefExpr: Number(row.box_delivery_coef_expr),
      boxDeliveryLiter: Number(row.box_delivery_liter),
      boxDeliveryMarketplaceBase: Number(row.box_delivery_marketplace_base),
      boxDeliveryMarketplaceCoefExpr: Number(row.box_delivery_marketplace_coef_expr),
      boxDeliveryMarketplaceLiter: Number(row.box_delivery_marketplace_liter),
      boxStorageBase: Number(row.box_storage_base),
      boxStorageCoefExpr: Number(row.box_storage_coef_expr),
      boxStorageLiter: Number(row.box_storage_liter),
    }));
  }
}