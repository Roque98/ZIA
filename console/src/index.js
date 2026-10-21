import http from "node:http";
import { Pool } from "pg";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { migrate } from "./migrate.js";

const config = loadConfig();
const pool = new Pool({ connectionString: config.databaseUrl });
await migrate(pool);
const { app, attach } = await createApp(pool, config);
const server = http.createServer(app);
attach(server);

server.listen(config.port, "127.0.0.1", () => {
  console.log(`Consola ZIA en http://127.0.0.1:${config.port}`);
  if (!config.publicHost || !config.key) {
    console.warn("Falta ZIA_RUSTDESK_PUBLIC_HOST o ZIA_RUSTDESK_KEY: el enlace a la app irá incompleto.");
  }
});

function shutdown() {
  server.close(() => pool.end());
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
