/**
 * Enlace que abre la app RustDesk.
 * Formatos que entiende el cliente (flutter/lib/common.dart, urlLinkToCmdArgs):
 *   rustdesk://<id>
 *   rustdesk://<id>?password=...&relay=1
 * relay presente (aunque sea 1) activa --relay: la app no intenta UDP.
 * La clave del servidor NO viaja en este enlace. Hay que configurarla una vez
 * en la app (ID server + Key). rustdesk://config/ solo lo acepta el móvil
 * y solo si el cliente fue compilado con esa opción.
 */
export function rustdeskDeepLink({ id, password = "", forceRelay = true }) {
  const params = new URLSearchParams();
  if (password) params.set("password", password);
  if (forceRelay) params.set("relay", "1");
  const q = params.toString();
  return `rustdesk://${id}${q ? `?${q}` : ""}`;
}

export function serverConfig({ host, key }) {
  return {
    host: host || "",
    relay: host || "",
    key: key || "",
    api: "",
  };
}
