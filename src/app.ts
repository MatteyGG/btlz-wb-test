//Точка входа

import { TariffsModule } from "#BoxTariffs/tariffs.module.js";
import { notify_Error } from "#lib/telegram-notify.js";
import knex, { migrate, seed } from "#postgres/knex.js";

await migrate.latest();
await seed.run();

console.log("All migrations and seeds have been run");

const tariffsModule = new TariffsModule();

async function runSync(): Promise<void> {
  try {
    const result = await tariffsModule.get_and_update_tariffs();
    console.log(result.message);
  } catch (err) {
    console.error('Sync failed', err);
  }
}
//Пока запускаем незамедлительно TODO: К
runSync().catch((err) => notify_Error('Initial sync error', { error: err?.message || String(err) }));