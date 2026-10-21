import assert from "node:assert/strict";
import http from "node:http";
import { once } from "node:events";
import { after, before, test } from "node:test";
import { Pool } from "pg";
import { WebSocket, WebSocketServer } from "ws";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { migrate } from "../src/migrate.js";
import { encodePunchHoleResponse } from "../src/proto.js";

const databaseUrl = process.env.DATABASE_URL
  || "postgres://zia_console:zia_console@127.0.0.1:5432/zia_console_test";
process.env.DATABASE_URL = databaseUrl;
process.env.ZIA_DEVICE_SECRET = Buffer.alloc(32, 9).toString("base64");
process.env.ZIA_SEED_ADMIN_EMAIL = "admin@zia.test";
process.env.ZIA_SEED_ADMIN_PASSWORD = "admin-pass-test-1";
process.env.ZIA_SEED_ADMIN_NAME = "Admin ZIA";
process.env.ZIA_RUSTDESK_PUBLIC_HOST = "203.0.113.10";
process.env.ZIA_RUSTDESK_KEY = "clave-publica-de-prueba";
process.env.ZIA_COOKIE_SECURE = "0";

let pool;
let server;
let base;
let mock;

function client() {
  const cookies = new Map();
  return {
    cookie(name) {
      return cookies.get(name) || "";
    },
    async fetch(url, options = {}) {
      const headers = new Headers(options.headers || {});
      if (cookies.size) {
        headers.set("cookie", [...cookies].map(([k, v]) => `${k}=${v}`).join("; "));
      }
      const res = await fetch(url, { ...options, headers, redirect: "manual" });
      for (const line of res.headers.getSetCookie?.() || []) {
        const pair = line.split(";")[0];
        const idx = pair.indexOf("=");
        cookies.set(pair.slice(0, idx), decodeURIComponent(pair.slice(idx + 1)));
      }
      return res;
    },
  };
}

function form(fields) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      for (const item of value) body.append(key, item);
    } else if (value != null) {
      body.set(key, String(value));
    }
  }
  return body;
}

function csrfOf(html) {
  return html.match(/name="_csrf" value="([^"]+)"/)?.[1]
    || html.match(/name="csrf-token" content="([^"]+)"/)?.[1]
    || "";
}

async function login(appClient, email, password) {
  return appClient.fetch(`${base}/login`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form({ email, password, next: "/" }),
  });
}

before(async () => {
  pool = new Pool({ connectionString: databaseUrl });
  await pool.query("DROP SCHEMA IF EXISTS public CASCADE");
  await pool.query("CREATE SCHEMA public");
  await pool.query("GRANT ALL ON SCHEMA public TO zia_console");
  await pool.query("GRANT ALL ON SCHEMA public TO public");
  await migrate(pool);

  mock = new WebSocketServer({ port: 0 });
  await once(mock, "listening");
  mock.on("connection", (ws) => {
    ws.on("message", () => {
      ws.send(encodePunchHoleResponse({
        pk: Buffer.from([4, 5, 6]),
        relayServer: "203.0.113.10:21117",
      }));
    });
  });

  const config = loadConfig();
  config.idWsUrl = `ws://127.0.0.1:${mock.address().port}`;
  config.relayWsUrl = config.idWsUrl;
  const { app, attach } = await createApp(pool, config);
  server = http.createServer(app);
  attach(server);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  mock?.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  await pool?.end();
});

test("login, permisos, sesión, auditoría y proxy", async () => {
  const bad = await login(client(), "admin@zia.test", "no-es-la-clave");
  assert.equal(bad.status, 401);

  const admin = client();
  assert.equal((await login(admin, "admin@zia.test", "admin-pass-test-1")).status, 302);
  const homeHtml = await (await admin.fetch(`${base}/`)).text();
  const csrf = csrfOf(homeHtml);
  assert.ok(csrf);

  async function post(path, fields, pageCsrf = csrf) {
    const res = await admin.fetch(`${base}${path}`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form({ _csrf: pageCsrf, ...fields }),
    });
    return res;
  }

  assert.equal((await post("/usuarios", {
    display_name: "Operador Norte",
    email: "operador@zia.test",
    password: "operador-pass-1",
    role: "operator",
    active: "1",
  })).status, 302);

  const people = await (await admin.fetch(`${base}/usuarios`)).text();
  const operatorId = people.split("operador@zia.test")[0].match(/action="\/usuarios\/([0-9a-f-]{36})"/g)?.at(-1)?.match(/([0-9a-f-]{36})/)?.[1];
  assert.ok(operatorId);

  assert.equal((await post("/grupos-usuario", {
    name: "Turno norte",
    description: "Operadores del norte",
    member_ids: operatorId,
  }, csrfOf(people))).status, 302);

  const usersPage = await (await admin.fetch(`${base}/usuarios`)).text();
  const userGroupId = usersPage.match(/action="\/grupos-usuario\/([0-9a-f-]{36})"/)?.[1];
  assert.ok(userGroupId);

  assert.equal((await post("/grupos", { name: "Por persona", description: "Acceso directo al grupo" })).status, 302);
  assert.equal((await post("/grupos", { name: "Por turno", description: "Acceso por grupo de personas" })).status, 302);
  const groupsHtml = await (await admin.fetch(`${base}/grupos`)).text();
  const groupIds = [...groupsHtml.matchAll(/href="\/grupos\/([0-9a-f-]{36})"/g)].map((m) => m[1]);
  assert.equal(groupIds.length, 2);

  async function addDevice(fields) {
    const page = await (await admin.fetch(`${base}/equipos/nuevo`)).text();
    const res = await post("/equipos", fields, csrfOf(page));
    assert.equal(res.status, 302, await res.text());
    return res.headers.get("location").match(/([0-9a-f-]{36})/)?.[1];
  }

  const secret = "clave-de-estacion";
  const directId = await addDevice({
    name: "Caja directa",
    rustdesk_id: "11112222",
    notes: "Mostrador",
    tags: "tijuana, caja",
    access_password: secret,
    user_ids: operatorId,
  });
  const byUserGroup = await addDevice({
    name: "Caja de turno",
    rustdesk_id: "22223333",
    tags: "tijuana",
    user_group_ids: userGroupId,
  });
  const inGroupA = await addDevice({
    name: "Caja del grupo A",
    rustdesk_id: "33334444",
  });
  const inGroupB = await addDevice({
    name: "Caja del grupo B",
    rustdesk_id: "44445555",
    group_ids: groupIds[1],
  });
  const hiddenId = await addDevice({
    name: "Caja oculta",
    rustdesk_id: "55556666",
    notes: "no-asignada",
  });

  async function saveGroup(groupId, fields) {
    const html = await (await admin.fetch(`${base}/grupos/${groupId}`)).text();
    const res = await post(`/grupos/${groupId}`, fields, csrfOf(html));
    assert.equal(res.status, 302, await res.text());
  }
  await saveGroup(groupIds[0], {
    name: "Por persona",
    description: "Acceso directo al grupo",
    device_ids: inGroupA,
    user_ids: operatorId,
  });
  await saveGroup(groupIds[1], {
    name: "Por turno",
    description: "Acceso por grupo de personas",
    device_ids: inGroupB,
    user_group_ids: userGroupId,
  });

  const formHtml = await (await admin.fetch(`${base}/equipos/${directId}`)).text();
  assert.equal(formHtml.includes(secret), false);
  assert.match(formHtml, /Hay una contraseña guardada/);

  const operator = client();
  assert.equal((await login(operator, "operador@zia.test", "operador-pass-1")).status, 302);
  const opHome = await (await operator.fetch(`${base}/`)).text();
  assert.match(opHome, /Caja directa/);
  assert.match(opHome, /Caja de turno/);
  assert.match(opHome, /Caja del grupo A/);
  assert.match(opHome, /Caja del grupo B/);
  assert.equal(opHome.includes("Caja oculta"), false);

  const opCsrf = csrfOf(opHome);
  const denied = await operator.fetch(`${base}/equipos`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form({ _csrf: opCsrf, name: "X", rustdesk_id: "99990000" }),
  });
  assert.equal(denied.status, 403);
  assert.equal((await operator.fetch(`${base}/auditoria`)).status, 403);
  assert.equal((await operator.fetch(`${base}/sesion/${hiddenId}`)).status, 404);

  const filtered = await (await admin.fetch(`${base}/?q=directa&etiqueta=tijuana`)).text();
  assert.match(filtered, /Caja directa/);
  assert.equal(filtered.includes("Caja oculta"), false);

  const started = await operator.fetch(`${base}/api/sesiones`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-csrf-token": opCsrf },
    body: JSON.stringify({ device_id: directId }),
  });
  const startedBody = await started.json();
  assert.equal(started.status, 200, JSON.stringify(startedBody));
  assert.equal(startedBody.probe.status, "online");
  assert.equal(startedBody.probe.relay_server, "203.0.113.10:21117");

  const link = await (await operator.fetch(`${base}/api/sesiones/${startedBody.session_id}/enlace`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-csrf-token": opCsrf },
    body: "{}",
  })).json();
  assert.equal(link.url, "rustdesk://11112222?password=clave-de-estacion&relay=1");
  assert.equal(link.config.host, "203.0.113.10");
  assert.equal(link.config.key, "clave-publica-de-prueba");

  const sessionPage = await (await operator.fetch(`${base}/sesion/${directId}`)).text();
  assert.match(sessionPage, /Sesión desde el navegador/);
  assert.match(sessionPage, /Abrir en la app RustDesk/);
  assert.equal(sessionPage.includes(secret), false);

  await new Promise((resolve, reject) => {
    const ws = new WebSocket(`${base.replace("http", "ws")}${startedBody.ws_id}`, {
      headers: { cookie: `zia_session=${operator.cookie("zia_session")}` },
    });
    const timer = setTimeout(() => reject(new Error("el proxy no respondió")), 4000);
    ws.on("open", () => ws.send(Buffer.from([1, 2, 3])));
    ws.on("message", () => {
      clearTimeout(timer);
      ws.close();
      resolve();
    });
    ws.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });

  const ended = await operator.fetch(`${base}/api/sesiones/${startedBody.session_id}/fin`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-csrf-token": opCsrf },
    body: "{}",
  });
  const endedBody = await ended.json();
  assert.equal(ended.status, 200, JSON.stringify(endedBody));
  assert.equal(typeof endedBody.duration_ms, "number");

  const csv = await (await admin.fetch(`${base}/auditoria.csv`)).text();
  assert.match(csv, /login_failed/);
  assert.match(csv, /permission_grant/);
  assert.match(csv, /session_start/);
  assert.match(csv, /session_deeplink/);
  assert.match(csv, /session_end/);
  assert.equal(csv.includes(secret), false);
  assert.ok(byUserGroup && inGroupB);

  await new Promise((resolve, reject) => {
    const ws = new WebSocket(`${base.replace("http", "ws")}/ws/id?sid=${startedBody.session_id}`);
    ws.on("unexpected-response", (_req, res) => {
      assert.equal(res.statusCode, 401);
      resolve();
    });
    ws.on("open", () => reject(new Error("el proxy aceptó un socket anónimo")));
    ws.on("error", () => {});
  });
});
