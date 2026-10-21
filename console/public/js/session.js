const root = document.querySelector(".session");
const csrf = document.querySelector('meta[name="csrf-token"]')?.content || "";
const log = document.getElementById("probe-log");
const status = document.getElementById("session-status");
const startBtn = document.getElementById("start-session");
const endBtn = document.getElementById("end-session");
const openBtn = document.getElementById("open-app");
const frame = document.getElementById("rustdesk-frame");
const body = document.getElementById("viewport-body");

const LABELS = {
  online: "El equipo está en línea en el servidor de IDs.",
  offline: "El ID existe, pero el equipo está desconectado.",
  not_found: "El servidor de IDs no conoce ese ID.",
  timeout: "El servidor de IDs no respondió a tiempo.",
  unreachable: "No hay conexión con el WebSocket de hbbs.",
  unconfigured: "La consola no tiene configurado el servidor RustDesk.",
  key_exchange_required: "hbbs pidió intercambio de llaves antes del punch. El sondeo no completa esa criptografía.",
  license: "El servidor rechazó la solicitud por licencia.",
  closed: "hbbs cerró el canal sin responder.",
  unexpected: "La respuesta no fue un PunchHoleResponse.",
  undecodable: "No se pudo leer la respuesta.",
  error: "El servidor devolvió un error.",
  unknown: "Respuesta sin clasificar.",
};

let remoteId = "";
let socket = null;

function line(text) {
  const item = document.createElement("li");
  item.textContent = text;
  log.append(item);
}

async function post(url, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-csrf-token": csrf,
    },
    body: JSON.stringify(payload || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudo completar.");
  return data;
}

startBtn?.addEventListener("click", async () => {
  startBtn.disabled = true;
  status.textContent = "Abriendo sesión…";
  try {
    const data = await post("/api/sesiones", { device_id: root.dataset.deviceId });
    remoteId = data.session_id;
    const probe = data.probe || {};
    line(LABELS[probe.status] || probe.error || probe.status || "Sin detalle del sondeo.");
    if (probe.relay_server) line(`Relay indicado por hbbs: ${probe.relay_server}`);
    status.textContent = "Sesión abierta. El canal WebSocket sigue vivo hasta que la termines.";
    endBtn.disabled = false;
    openBtn.disabled = false;
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    socket = new WebSocket(`${proto}//${location.host}${data.ws_id}`);
    socket.addEventListener("open", () => line("Canal con el proxy de la consola abierto."));
    socket.addEventListener("close", () => line("Canal cerrado."));
    socket.addEventListener("error", () => line("El canal con el proxy no se pudo abrir."));
    if (frame && root.dataset.webClient === "1") {
      frame.hidden = false;
      body.hidden = true;
    }
  } catch (err) {
    status.textContent = err.message;
    startBtn.disabled = false;
  }
});

openBtn?.addEventListener("click", async () => {
  if (!remoteId) return;
  openBtn.disabled = true;
  try {
    const data = await post(`/api/sesiones/${remoteId}/enlace`, {});
    line("Enlace de la app listo. La contraseña, si había una guardada, va en el enlace y no se muestra aquí.");
    window.location.href = data.url;
  } catch (err) {
    status.textContent = err.message;
  } finally {
    openBtn.disabled = false;
  }
});

async function finish() {
  if (!remoteId) return;
  const id = remoteId;
  remoteId = "";
  try {
    const data = await post(`/api/sesiones/${id}/fin`, {});
    const seconds = Math.max(0, Math.round((data.duration_ms || 0) / 1000));
    status.textContent = `Sesión terminada. Duración registrada: ${seconds} s.`;
  } catch (err) {
    status.textContent = err.message;
  }
  try {
    socket?.close();
  } catch {
    /* si el canal ya se cerró, la fila ya tiene fin */
  }
  endBtn.disabled = true;
  openBtn.disabled = true;
  startBtn.disabled = false;
}

endBtn?.addEventListener("click", () => finish("user_ended"));
window.addEventListener("pagehide", () => {
  if (!remoteId || !csrf) return;
  const body = JSON.stringify({});
  navigator.sendBeacon?.(
    `/api/sesiones/${remoteId}/fin?_csrf=${encodeURIComponent(csrf)}`,
    new Blob([body], { type: "application/json" }),
  );
});
