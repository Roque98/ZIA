import assert from "node:assert/strict";
import { test } from "node:test";
import { hashPassword, verifyPassword } from "../src/password.js";
import { decryptSecret, encryptSecret } from "../src/secrets.js";
import { rustdeskDeepLink, serverConfig } from "../src/deep-link.js";
import { csvCell, toCsv } from "../src/audit.js";
import { loginLimited, recordLoginFailure, resetLoginLimits } from "../src/http-util.js";

test("la contraseña de usuario no se guarda en claro", async () => {
  const hash = await hashPassword("una-clave-larga");
  assert.equal(hash.includes("una-clave-larga"), false);
  assert.equal(await verifyPassword("una-clave-larga", hash), true);
  assert.equal(await verifyPassword("otra-clave-larga", hash), false);
  assert.equal(await verifyPassword("una-clave-larga", "basura"), false);
});

test("la contraseña del equipo se cifra y un byte alterado no descifra", () => {
  const key = Buffer.alloc(32, 3);
  const enc = encryptSecret("acceso-estacion", key);
  assert.equal(decryptSecret(enc, key), "acceso-estacion");
  const tampered = Buffer.from(enc.cipher);
  tampered[0] ^= 0xff;
  assert.throws(() => decryptSecret({ nonce: enc.nonce, cipher: tampered }, key));
});

test("el enlace abre la app con contraseña y relay", () => {
  const url = rustdeskDeepLink({ id: "99887766", password: "clave 1", forceRelay: true });
  assert.equal(url, "rustdesk://99887766?password=clave+1&relay=1");
  const cfg = serverConfig({ host: "203.0.113.10", key: "abc" });
  assert.equal(cfg.host, "203.0.113.10");
  assert.equal(cfg.relay, "203.0.113.10");
  assert.equal(cfg.api, "");
});

test("el CSV neutraliza fórmulas", () => {
  assert.equal(csvCell("=cmd"), `"'=cmd"`);
  const csv = toCsv([
    {
      occurred_at: new Date("2026-01-02T03:04:05.000Z"),
      actor_email: "a@b.c",
      action: "login",
      entity_type: "user",
      entity_id: "1",
      ip: "127.0.0.1",
      user_agent: "test",
      detail: { ok: true },
    },
  ]);
  assert.match(csv, /login/);
  assert.match(csv, /2026-01-02T03:04:05.000Z/);
});

test("ocho fallos de login bloquean la IP", () => {
  resetLoginLimits();
  const ip = "198.51.100.8";
  for (let i = 0; i < 7; i += 1) recordLoginFailure(ip, 1_000);
  assert.equal(loginLimited(ip, 1_000), false);
  recordLoginFailure(ip, 1_000);
  assert.equal(loginLimited(ip, 1_000), true);
  assert.equal(loginLimited(ip, 1_000 + 16 * 60 * 1000), false);
  resetLoginLimits();
});
