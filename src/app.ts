import { TariffsModule } from "#BoxTariffs/tariffs.module.js";
import env from "#config/env/env.js";
import { telegram_notify } from "#lib/telegram-notify.js";
import { migrate, seed } from "#postgres/knex.js";
import cron from "node-cron";

async function bootstrap() {
    await migrate.latest();
    await seed.run();
    console.log("All migrations and seeds have been run");

    const tariffsModule = new TariffsModule();

    // Планируем регулярный запуск синхронизации БД
    const dbTask = cron.schedule(
        env.CRON_DATABASE_SYNC,
        async () => {
            console.log("Scheduled database sync start:", new Date().toISOString());
            try {
                const result = await tariffsModule.get_and_update_database();
                console.log(result.message);
            } catch (err: any) {
                console.error("Scheduled database sync failed:", err);
                telegram_notify("Scheduled database sync error", err?.code ?? err?.status, err?.message ?? String(err));
            }
        },
        { timezone: "Europe/Moscow", noOverlap: true },
    );

    // По ТЗ планируем отдельную очередь для Google Sheets
    const sheetTask = cron.schedule(
        env.CRON_SHEET_SYNC,
        async () => {
            console.log("Scheduled Google Sheets sync start:", new Date().toISOString());
            try {
                const sheetResult = await tariffsModule.get_and_update_gsheet();
                console.log(sheetResult.message);
            } catch (err: any) {
                console.error("Scheduled Google Sheets sync failed:", err);
                telegram_notify("Scheduled Google Sheets sync error", err?.code ?? err?.status, err?.message ?? String(err));
            }
        },
        { timezone: "Europe/Moscow", noOverlap: true },
    );
    console.log("Cron jobs scheduled");
    telegram_notify("Cron jobs scheduled and service started");
}

bootstrap().catch((err) => {
    console.error("Bootstrap failed:", err);
    telegram_notify("Bootstrap error", err?.code ?? err?.status, err?.message ?? String(err));
});
