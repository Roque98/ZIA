import { WebSocket, WebSocketServer } from "ws";

/**
 * Proxy autenticado hacia hbbs (:21118, ruta /ws/id) y hbbr (:21119, ruta /ws/relay).
 * El navegador no habla con esos puertos: habla con la consola, y la consola
 * reenvía los frames binarios. Al cerrarse el canal se puede conocer la duración.
 */
export function attachRustDeskProxy(server, { paths }) {
  const wss = new WebSocketServer({ noServer: true });
  server.on("upgrade", (req, socket, head) => {
    const host = req.headers.host || "localhost";
    let url;
    try {
      url = new URL(req.url || "/", `http://${host}`);
    } catch {
      socket.destroy();
      return;
    }
    const route = paths[url.pathname];
    if (!route) {
      socket.write("HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n");
      socket.destroy();
      return;
    }
    Promise.resolve(route.authorize(req, url))
      .then((auth) => {
        if (!auth?.ok) {
          socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
          socket.destroy();
          return;
        }
        wss.handleUpgrade(req, socket, head, (client) => {
          bridge(client, route.target, auth.onClose);
        });
      })
      .catch(() => {
        socket.destroy();
      });
  });
}

function bridge(client, target, onClose) {
  const pending = [];
  let upstream;
  let closed = false;
  const finish = (reason) => {
    if (closed) return;
    closed = true;
    try {
      client.close();
    } catch {
      /* ignore */
    }
    try {
      upstream?.close();
    } catch {
      /* ignore */
    }
    if (onClose) Promise.resolve(onClose(reason)).catch(() => {});
  };

  try {
    upstream = new WebSocket(target);
  } catch (err) {
    finish("upstream_error");
    return;
  }
  upstream.on("open", () => {
    for (const frame of pending) upstream.send(frame);
    pending.length = 0;
  });
  upstream.on("message", (data, isBinary) => {
    if (client.readyState === WebSocket.OPEN) client.send(data, { binary: isBinary });
  });
  upstream.on("error", () => finish("upstream_error"));
  upstream.on("close", () => finish("upstream_closed"));

  client.on("message", (data, isBinary) => {
    if (upstream.readyState === WebSocket.OPEN) upstream.send(data, { binary: isBinary });
    else if (upstream.readyState === WebSocket.CONNECTING) pending.push(data);
  });
  client.on("error", () => finish("client_error"));
  client.on("close", () => finish("client_closed"));
}
