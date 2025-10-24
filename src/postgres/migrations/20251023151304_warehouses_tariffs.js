/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    await knex.schema.createTable("warehouse_rates", (table) => {
        table.increments("id").primary();
        table.date("date").notNullable();
        table.string("warehouse_name").notNullable();
        table.string("geo_name");
        table.decimal("box_delivery_base");
        table.decimal("box_delivery_coef_expr");
        table.decimal("box_delivery_liter");
        table.decimal("box_delivery_marketplace_base");
        table.decimal("box_delivery_marketplace_coef_expr");
        table.decimal("box_delivery_marketplace_liter");
        table.decimal("box_storage_base");
        table.decimal("box_storage_coef_expr");
        table.decimal("box_storage_liter");
        table.timestamps(true, true);
        table.unique(["date", "warehouse_name"]);
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    await knex.schema.dropTableIfExists("warehouse_rates");
}
