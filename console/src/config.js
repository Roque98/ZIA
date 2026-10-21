import { randomBytes } from "node:crypto";

function flag(value, fallback = false) {
  if (value == null || value === "") return fallback;
  return value === "1" || value === "true" || value === "yes";
}

function port(value, fallback) {
  const n = Number(value ?? fallback);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    throw new Error(`Puerto inválido: ${value}`);
  }
  return n;
}

export function decodeKey(b64) {
  if (!b64) return null;
  const buf = Buffer.from(b64, "base64");
  if (buf.length !== 32) {
    throw new Error(
      "ZIA_DEVICE_SECRET debe ser 32 bytes en base64 (openssl rand -base64 32).",
    );
  }
  return buf;
}

/**
 * Configuración solo por variables de entorno. Los valores de RustDesk
 * (host público y clave) no tienen default de producción: hay que ponerlos.
 */
export function loadConfig(env = process.env) {
  const publicHost = (env.ZIA_RUSTDESK_PUBLIC_HOST || "").trim();
  const key = (env.ZIA_RUSTDESK_KEY || "").trim();
  const databaseUrl = env.DATABASE_URL || "";
  if (!databaseUrl) {
    throw new Error("Falta DATABASE_URL.");
  }

  const wsIdPort = port(env.ZIA_RUSTDESK_WS_ID_PORT, 21118);
  const wsRelayPort = port(env.ZIA_RUSTDESK_WS_RELAY_PORT, 21119);
  const idWsUrl =
    (env.ZIA_RUSTDESK_ID_WS_URL || "").trim() ||
    (publicHost ? `ws://${publicHost}:${wsIdPort}` : "");
  const relayWsUrl =
    (env.ZIA_RUSTDESK_RELAY_WS_URL || "").trim() ||
    (publicHost ? `ws://${publicHost}:${wsRelayPort}` : "");

  const deviceSecret = decodeKey(env.ZIA_DEVICE_SECRET);
  if (!deviceSecret) {
    throw new Error("Falta ZIA_DEVICE_SECRET.");
  }

  return {
    databaseUrl,
    port: port(env.PORT || env.ZIA_PORT, 5030),
    sessionSecret: env.ZIA_SESSION_SECRET || randomBytes(32).toString("hex"),
    deviceSecret,
    publicHost,
    key,
    idWsUrl,
    relayWsUrl,
    publicUrl: (env.ZIA_PUBLIC_URL || "").replace(/\/$/, ""),
    trustProxy: flag(env.ZIA_TRUST_PROXY, false),
    cookieSecure: flag(env.ZIA_COOKIE_SECURE, false),
    seedEmail: (env.ZIA_SEED_ADMIN_EMAIL || "").trim().toLowerCase(),
    seedPassword: env.ZIA_SEED_ADMIN_PASSWORD || "",
    seedName: (env.ZIA_SEED_ADMIN_NAME || "Administrador").trim(),
    webClientDir: (env.ZIA_WEB_CLIENT_DIR || "").trim(),
    sessionHours: 12,
  };
}
