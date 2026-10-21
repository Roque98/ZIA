import { createHash, randomBytes } from "node:crypto";

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function newToken() {
  return randomBytes(32).toString("base64url");
}

export function readCookie(req, name) {
  const raw = req.headers.cookie || "";
  for (const part of raw.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (key === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return "";
}

export function clientIp(req, trustProxy) {
  if (trustProxy) {
    const xff = req.headers["x-forwarded-for"];
    if (typeof xff === "string" && xff.trim()) {
      return xff.split(",")[0].trim().slice(0, 80);
    }
  }
  return (req.socket?.remoteAddress || "").slice(0, 80);
}

const buckets = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 8;

export function loginLimited(ip, now = Date.now()) {
  const b = buckets.get(ip);
  if (!b) return false;
  if (b.until && b.until > now) return true;
  if (b.until && b.until <= now) buckets.delete(ip);
  return false;
}

export function recordLoginFailure(ip, now = Date.now()) {
  const b = buckets.get(ip) || { fails: 0, until: 0 };
  b.fails += 1;
  if (b.fails >= MAX_FAILS) {
    b.until = now + WINDOW_MS;
    b.fails = 0;
  }
  buckets.set(ip, b);
}

export function recordLoginSuccess(ip) {
  buckets.delete(ip);
}

export function resetLoginLimits() {
  buckets.clear();
}
