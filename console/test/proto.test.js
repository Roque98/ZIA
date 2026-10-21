import assert from "node:assert/strict";
import { test } from "node:test";
import {
  decodeRendezvous,
  encodePunchHoleRequest,
  encodePunchHoleResponse,
} from "../src/proto.js";

test("PunchHoleRequest mínimo coincide con el wire format", () => {
  const buf = encodePunchHoleRequest({ id: "123456789", version: "", forceRelay: false });
  assert.deepEqual(
    [...buf],
    [0x42, 0x0b, 0x0a, 0x09, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39],
  );
});

test("clasifica la respuesta de hbbs", () => {
  const online = decodeRendezvous(
    encodePunchHoleResponse({ pk: Buffer.from([1, 2]), relayServer: "10.0.0.1:21117" }),
  );
  assert.equal(online.status, "online");
  assert.equal(online.relayServer, "10.0.0.1:21117");
  assert.equal(online.hasPk, true);

  const offline = decodeRendezvous(encodePunchHoleResponse({ failure: 2 }));
  assert.equal(offline.status, "offline");
  assert.equal(offline.failure, "OFFLINE");

  const missing = decodeRendezvous(encodePunchHoleResponse({ failure: 0 }));
  assert.equal(missing.status, "not_found");

  const omitted = decodeRendezvous(encodePunchHoleResponse({}));
  assert.equal(omitted.status, "not_found");
});
