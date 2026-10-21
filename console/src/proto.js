/**
 * Subconjunto del protocolo de rendezvous de RustDesk (hbb.RendezvousMessage).
 * En WebSocket cada frame binario es el protobuf crudo, sin el prefijo de
 * longitud que usa el transporte TCP (BytesCodec de hbb_common).
 *
 * Campo 8 de RendezvousMessage = PunchHoleRequest.
 * Campo 11 = PunchHoleResponse.
 * Campo 25 = KeyExchange.
 */

function encodeVarint(n) {
  const out = [];
  let v = n;
  if (v < 0) throw new Error("varint negativo");
  do {
    let b = v & 0x7f;
    v = Math.floor(v / 128);
    if (v > 0) b |= 0x80;
    out.push(b);
  } while (v > 0);
  return Buffer.from(out);
}

function encodeTag(field, wire) {
  return encodeVarint((field << 3) | wire);
}

function encodeString(field, value) {
  const b = Buffer.from(value, "utf8");
  return Buffer.concat([encodeTag(field, 2), encodeVarint(b.length), b]);
}

function encodeBytes(field, value) {
  const b = Buffer.isBuffer(value) ? value : Buffer.from(value);
  return Buffer.concat([encodeTag(field, 2), encodeVarint(b.length), b]);
}

function encodeVarintField(field, value) {
  return Buffer.concat([encodeTag(field, 0), encodeVarint(value)]);
}

function encodeMessage(field, inner) {
  return Buffer.concat([encodeTag(field, 2), encodeVarint(inner.length), inner]);
}

export function readVarint(buf, offset) {
  let result = 0;
  let mul = 1;
  let i = offset;
  let guard = 0;
  while (i < buf.length && guard < 6) {
    const b = buf[i++];
    result += (b & 0x7f) * mul;
    if ((b & 0x80) === 0) return { value: result, offset: i };
    mul *= 128;
    guard += 1;
  }
  throw new Error("varint truncado");
}

export function parseFields(buf) {
  const fields = [];
  let o = 0;
  const data = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  while (o < data.length) {
    const tag = readVarint(data, o);
    o = tag.offset;
    const field = Math.floor(tag.value / 8);
    const wire = tag.value & 7;
    if (wire === 0) {
      const v = readVarint(data, o);
      o = v.offset;
      fields.push({ field, wire, value: v.value });
    } else if (wire === 2) {
      const len = readVarint(data, o);
      o = len.offset;
      if (o + len.value > data.length) throw new Error("campo truncado");
      fields.push({ field, wire, value: data.subarray(o, o + len.value) });
      o += len.value;
    } else if (wire === 5) {
      o += 4;
    } else if (wire === 1) {
      o += 8;
    } else {
      throw new Error(`wire type no soportado: ${wire}`);
    }
  }
  return fields;
}

const FAILURES = {
  0: "ID_NOT_EXIST",
  2: "OFFLINE",
  3: "LICENSE_MISMATCH",
  4: "LICENSE_OVERUSE",
};

/**
 * PunchHoleRequest dentro de RendezvousMessage.
 * forceRelay pide a hbbs que no intente UDP: un navegador no puede hacer hole punching.
 * licenceKey es la licencia Pro, no la clave pública del servidor.
 */
export function encodePunchHoleRequest({
  id,
  version = "zia-console",
  forceRelay = true,
  licenceKey = "",
}) {
  const parts = [encodeString(1, id)];
  if (licenceKey) parts.push(encodeString(3, licenceKey));
  if (version) parts.push(encodeString(6, version));
  if (forceRelay) parts.push(encodeVarintField(8, 1));
  return encodeMessage(8, Buffer.concat(parts));
}

export function encodePunchHoleResponse({
  pk = Buffer.alloc(0),
  relayServer = "",
  failure = null,
  otherFailure = "",
}) {
  const parts = [];
  if (pk.length) parts.push(encodeBytes(2, pk));
  if (failure != null) parts.push(encodeVarintField(3, failure));
  if (relayServer) parts.push(encodeString(4, relayServer));
  if (otherFailure) parts.push(encodeString(7, otherFailure));
  return encodeMessage(11, Buffer.concat(parts));
}

function textOf(buf) {
  return Buffer.from(buf).toString("utf8");
}

/**
 * Interpreta un frame de hbbs. proto3 no serializa el enum 0, así que
 * ID_NOT_EXIST (valor 0) llega como PunchHoleResponse sin pk ni relay.
 */
export function decodeRendezvous(buf) {
  const top = parseFields(buf);
  const names = top.map((f) => f.field);
  if (names.includes(25)) {
    return { kind: "key_exchange", status: "key_exchange_required", fields: names };
  }
  const punch = top.find((f) => f.field === 11 && f.wire === 2);
  if (!punch) {
    return { kind: "other", status: "unexpected", fields: names };
  }
  const inner = parseFields(punch.value);
  const pk = inner.find((f) => f.field === 2)?.value ?? Buffer.alloc(0);
  const failureField = inner.find((f) => f.field === 3);
  const relayServer = inner.find((f) => f.field === 4)
    ? textOf(inner.find((f) => f.field === 4).value)
    : "";
  const otherFailure = inner.find((f) => f.field === 7)
    ? textOf(inner.find((f) => f.field === 7).value)
    : "";
  const socketAddr = inner.find((f) => f.field === 1)?.value ?? Buffer.alloc(0);
  const failure = failureField ? failureField.value : null;
  const hasPeer = pk.length > 0 || relayServer.length > 0 || socketAddr.length > 0;

  let status = "unknown";
  if (hasPeer) status = "online";
  else if (otherFailure) status = "error";
  else if (failure === 2) status = "offline";
  else if (failure === 3 || failure === 4) status = "license";
  else status = "not_found";

  return {
    kind: "punch_hole_response",
    status,
    failure: failure == null ? null : FAILURES[failure] || String(failure),
    otherFailure,
    relayServer,
    hasPk: pk.length > 0,
  };
}
