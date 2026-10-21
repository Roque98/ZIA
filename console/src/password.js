import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);
const PARAMS = { N: 16384, r: 8, p: 1 };
const KEYLEN = 32;

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEYLEN, PARAMS);
  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password, stored) {
  const parts = String(stored || "").split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = Buffer.from(parts[4], "base64");
  const expected = Buffer.from(parts[5], "base64");
  if (!N || !r || !p || salt.length === 0 || expected.length === 0) return false;
  const actual = await scrypt(password, salt, expected.length, { N, r, p });
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

let dummyHash = null;

/** Iguala el tiempo de un login contra un correo que no existe. */
export async function verifyAgainstDummy(password) {
  if (!dummyHash) dummyHash = await hashPassword(randomBytes(24).toString("hex"));
  await verifyPassword(password, dummyHash);
}
