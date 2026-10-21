import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/** Cifra la contraseña de acceso de un equipo. La clave vive solo en el entorno. */
export function encryptSecret(plain, key) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  const body = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { nonce, cipher: Buffer.concat([body, tag]) };
}

export function decryptSecret({ nonce, cipher }, key) {
  if (!nonce || !cipher || cipher.length < 17) {
    throw new Error("Secreto incompleto.");
  }
  const tag = cipher.subarray(cipher.length - 16);
  const data = cipher.subarray(0, cipher.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", key, nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
