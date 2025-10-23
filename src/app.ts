//Точка входа

import knex, { migrate, seed } from "#postgres/knex.js";
import { fetchWB } from "#BoxTariffs/api/wb-api.service.js";

await migrate.latest();
await seed.run();

console.log("All migrations and seeds have been run");

fetchWB().then(result => {
  console.log(result);
});