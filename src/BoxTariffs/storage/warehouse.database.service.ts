import { Warehouse } from "#BoxTariffs/types/types.js";
import knex from "#postgres/knex.js";

/**
 * WarehouseStorageService persists tariff data into PostgreSQL and
 * exposes methods for retrieving the latest snapshot for a given day.
 * Data is stored in the `warehouse_rates` table; see the migration
 * file in `migrations/` for details.  Inserts use
 * `onConflict(...).merge()` to implement upsert semantics【11089416715722†L934-L940】.
 */
export class WarehouseStorageService {
  /**
   * Insert or update a list of warehouses.  For each entry the
   * combination of `date` and `warehouse_name` must be unique.  If a
   * conflict is detected the existing row is updated with the new
   * values.  This method runs insert/merge sequentially for
   * simplicity; it could be batched for better performance.
   */
  async save_warehouses(warehouses: Warehouse[]): Promise<void> {
    for (const warehouse of warehouses) {
      const row = {
        date: warehouse.date,
        warehouse_name: warehouse.warehouseName,
        geo_name: warehouse.geoName,
        dt_next_box: warehouse.dtNextBox,
        dt_till_max: warehouse.dtTillMax,
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
   * Retrieve all warehouse rates for the current day (today) sorted by
   * coefficient ascending.  Consumers can pass an explicit date
   * parameter to fetch a different day (ISO date string).
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