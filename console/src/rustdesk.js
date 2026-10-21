import { WebSocket } from "ws";
import { decodeRendezvous, encodePunchHoleRequest } from "./proto.js";

/**
 * Conecta al WebSocket de hbbs (21118) y manda un PunchHoleRequest.
 * No completa el intercambio de llaves ni decodifica video: solo clasifica
 * la respuesta del servidor de IDs.
 */
export function probePeer({ url, id, timeoutMs = 4000 }) {
  return new Promise((resolve) => {
    if (!url) {
      resolve({
        ok: false,
        status: "unconfigured",
        error: "Falta ZIA_RUSTDESK_ID_WS_URL o ZIA_RUSTDESK_PUBLIC_HOST.",
      });
      return;
    }
    let settled = false;
    let ws;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        ws?.close();
      } catch {
        /* ya cerrado */
      }
      resolve(result);
    };
    const timer = setTimeout(() => {
      finish({ ok: false, status: "timeout", error: "El servidor de IDs no respondió a tiempo." });
    }, timeoutMs);

    try {
      ws = new WebSocket(url);
    } catch (err) {
      finish({ ok: false, status: "unreachable", error: err.message });
      return;
    }
    ws.on("error", (err) => {
      finish({ ok: false, status: "unreachable", error: err.message });
    });
    ws.on("open", () => {
      ws.send(encodePunchHoleRequest({ id, forceRelay: true }));
    });
    ws.on("message", (data, isBinary) => {
      const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
      if (!isBinary && buf[0] === 0x7b) {
        finish({ ok: false, status: "unexpected", error: "El servidor contestó texto, no protobuf." });
        return;
      }
      try {
        const decoded = decodeRendezvous(buf);
        finish({ ok: decoded.status === "online", ...decoded });
      } catch (err) {
        finish({ ok: false, status: "undecodable", error: err.message });
      }
    });
    ws.on("close", () => {
      finish({ ok: false, status: "closed", error: "hbbs cerró el WebSocket sin responder." });
    });
  });
}
