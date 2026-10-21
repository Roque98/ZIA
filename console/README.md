# Consola ZIA — escritorios remotos

Servicio nuevo para sustituir AnyDesk por el RustDesk OSS que ya corre en el VPS
(`hbbs` + `hbbr`). Este repositorio no tenía consola: es el sitio estático de ZIA.
La consola de IGAS (`/srv/igas-console`, API en `127.0.0.1:5010`) es otro sistema y
no se toca. Este módulo vive en `console/`, usa PostgreSQL y se publica aparte,
detrás de nginx, en el puerto `5030`.

## Qué hace

- Usuarios con contraseña (scrypt) y rol `admin` o `operator`.
- Equipos: ID de RustDesk, nombre, notas, etiquetas, grupos, búsqueda.
- La contraseña de acceso del equipo se guarda con AES-256-GCM. La clave sale de
  `ZIA_DEVICE_SECRET` y no se escribe en la auditoría ni en el HTML.
- Un operador solo ve un equipo si se le asignó a él, a un grupo de personas al que
  pertenece, o si el equipo está en un grupo de equipos asignado a esa persona o a
  ese grupo.
- Auditoría de entradas, fallos, altas y bajas, cambios de permiso y cada sesión
  remota (quién, qué PC, IP, inicio y duración cuando se puede saber). CSV.
- Pantalla de sesión en el navegador: sondeo del servidor de IDs, canal WebSocket
  autenticado hacia hbbs/hbbr y enlace `rustdesk://` para la app.

## Arranque local

Hace falta Node 22 y PostgreSQL 16.

```bash
sudo -u postgres psql -c "CREATE USER zia_console WITH PASSWORD 'elige-una';"
sudo -u postgres psql -c "CREATE DATABASE zia_console OWNER zia_console;"
cd console
cp .env.example .env
# edita .env: DATABASE_URL, los dos secretos y la contraseña del admin inicial
npm install
npm test
npm start
```

La primera vez, si `users` está vacía y existen `ZIA_SEED_ADMIN_EMAIL` y
`ZIA_SEED_ADMIN_PASSWORD`, se crea el administrador. Después conviene quitar
`ZIA_SEED_ADMIN_PASSWORD` del entorno: un reinicio no cambia la clave si ya hay
usuarios. La contraseña inicial debe tener al menos 10 caracteres.

Generar secretos:

```bash
openssl rand -base64 32   # ZIA_DEVICE_SECRET (32 bytes)
openssl rand -hex 32      # ZIA_SESSION_SECRET
```

Las migraciones de `sql/` se aplican al arrancar. Quedan registradas en
`schema_migrations`.

## Variables

| Variable | Uso |
|---|---|
| `DATABASE_URL` | PostgreSQL de la consola |
| `ZIA_DEVICE_SECRET` | Clave AES de las contraseñas de equipo, base64 de 32 bytes |
| `ZIA_SESSION_SECRET` | Reservada; la cookie de sesión ya es un token aleatorio guardado hasheado |
| `ZIA_SEED_ADMIN_EMAIL` | Correo del primer admin, solo si no hay usuarios |
| `ZIA_SEED_ADMIN_PASSWORD` | Contraseña de ese admin |
| `ZIA_SEED_ADMIN_NAME` | Nombre visible, opcional |
| `PORT` o `ZIA_PORT` | Puerto HTTP, default `5030` |
| `ZIA_RUSTDESK_PUBLIC_HOST` | Host que se muestra para configurar la app. En este VPS: `157.173.194.16` |
| `ZIA_RUSTDESK_KEY` | Clave pública de hbbs. La de este servidor: `QVacTkA79hMKrCWcwneZRKcCX4S87c7hmJNPnLEaIfs=` |
| `ZIA_RUSTDESK_ID_WS_URL` | Dónde marca la consola a hbbs. En el VPS: `ws://127.0.0.1:21118` |
| `ZIA_RUSTDESK_RELAY_WS_URL` | Igual para hbbr: `ws://127.0.0.1:21119` |
| `ZIA_TRUST_PROXY` | `1` detrás de nginx, para guardar la IP real |
| `ZIA_COOKIE_SECURE` | `1` cuando el sitio va por HTTPS |
| `ZIA_PUBLIC_URL` | URL pública, por ejemplo `https://console.ziacentro.mx` |
| `ZIA_WEB_CLIENT_DIR` | Carpeta de una build Flutter web de RustDesk, si se compiló |

Si no se definen las URL de WebSocket, se arman con el host público y los puertos
`21118` y `21119`. En el VPS es mejor apuntarlas a `127.0.0.1` para no salir y volver
por la IP pública.

## Despliegue en el VPS, sin tocar lo que ya corre

No hace falta abrir nada nuevo hacia internet salvo el sitio de nginx. No reiniciar
hbbs, hbbr, PostgreSQL de otras apps ni los procesos de los puertos 5000, 5010 y 5020.
La consola usa su propia base (`zia_console`) y el puerto `5030`.

1. Instalar Node 22 si no está (`node --version`).
2. Crear el rol y la base en el PostgreSQL local, como arriba.
3. Copiar `console/` a `/srv/zia-console` (no dentro de `/srv/zia` ni de `/srv/igas-console`).
4. Poner el `.env` en `/srv/zia-console/.env`, con permisos `600`.
5. `npm install --omit=dev` en esa carpeta.
6. Unidad de systemd, por ejemplo `/etc/systemd/system/zia-console.service`:

```ini
[Unit]
Description=Consola ZIA de escritorios remotos
After=network.target postgresql.service

[Service]
WorkingDirectory=/srv/zia-console
EnvironmentFile=/srv/zia-console/.env
ExecStart=/usr/bin/node src/index.js
Restart=on-failure
User=zia-console
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

7. Sitio nuevo de nginx, sin editar los de `zia` ni `igas-console`. Un ejemplo está en
   `deploy/nginx-console.conf.example`. Comprueba con `nginx -t` antes de recargar.
8. Certificado: el de `ziacentro.mx` ya puede incluir `console.ziacentro.mx`. Si falta
   el nombre, ampliar el certificado existente; no hace falta otro virtual host en el
   puerto de las otras apps.
9. `systemctl enable --now zia-console` y entrar a `https://console.ziacentro.mx`.

El proxy de WebSocket de la consola (`/ws/id` y `/ws/relay`) exige una sesión de un
usuario que tenga ese equipo abierto. nginx debe enviar esas rutas a `127.0.0.1:5030`,
no directo a `21118`/`21119`: si no, el navegador se salta los permisos.

hbbs confía en `X-Real-IP` / `X-Forwarded-For` de quien llegue a `21118` y `21119`.
Conviene que esos puertos solo los alcance nginx o la consola en localhost, no internet.
Eso es un cambio de firewall: no está aplicado por este repositorio.

`ZIA_TRUST_PROXY=1` hace que la auditoría use la primera IP de `X-Forwarded-For`.
En `*.ziacentro.mx` nginx ya reescribe esa cabecera con la IP del visitante cuando
el tráfico entra por Cloudflare. No actives `trust proxy` si el puerto 5030 queda
abierto al público.

## Cliente web: qué hay y qué falta

RustDesk Server OSS no trae cliente web ni API de usuarios. Eso es de la versión Pro.
El cliente web de código abierto está en el repositorio `rustdesk/rustdesk`: una build
Flutter (hoy Flutter 3.44, con los parches de `.github/patches/`) más módulos
TypeScript (`connection.ts`, `websock.ts`) que hablan el protobuf de RustDesk por
WebSocket. El navegador no puede abrir TCP/UDP, así que esa build solo usa el relay:
hbbs en `21118` y hbbr en `21119`. Con un dominio, el cliente pide `wss://host/ws/id`
y `wss://host/ws/relay`. La documentación de build está en
<https://rustdesk.com/docs/en/dev/build/web/>. Hace falta además el códec VP9
(`web_deps`) que el propio proyecto descarga aparte. No hay un artefacto oficial
estable que se pueda vender con esta consola, y compilarlo aquí no es reproducible
sin Flutter, los parches y ese códec.

Esta pantalla hace lo que sí se puede cerrar sin esa build:

1. Comprueba el permiso y abre una fila en `remote_sessions` y en la auditoría.
2. Se conecta al WebSocket de hbbs y manda un `PunchHoleRequest` (con `force_relay`,
   porque un navegador no hace hole punching). Clasifica la respuesta: en línea,
   desconectado, ID desconocido, o que el servidor pidió `KeyExchange` antes del punch.
   Ese intercambio de llaves (la clave pública del servidor) no está reimplementado:
   si hbbs lo exige, el sondeo lo dice y se detiene.
3. Mantiene un proxy WebSocket autenticado. Al cerrarse el canal, o al pulsar
   Terminar, guarda la duración.
4. Ofrece `rustdesk://<id>?password=…&relay=1`. Ese esquema lo entiende la app
   (véase `urlLinkToCmdArgs` en el cliente). La contraseña viaja en el enlace y no
   se imprime en la página. La app tiene que tener ya el servidor de ID y la clave;
   `rustdesk://config/…` solo lo acepta el móvil y solo si el cliente se compiló con
   esa opción. En la misma pantalla está el JSON para pegar en Ajustes → Red.

Si más adelante compilas el cliente Flutter, apunta `ZIA_WEB_CLIENT_DIR` a la carpeta
que contiene `index.html`. La pantalla de sesión lo monta en `/cliente-rustdesk/` y
lo muestra en el recuadro. Hay que configurar dentro de esa build el host
`console.ziacentro.mx` (para que use `/ws/id` y `/ws/relay`) y forzar `wss`. Aun así,
hbbs devuelve la dirección de relay que tenga configurada: si anuncia la IP pública
y el puerto `21119`, el cliente oficial se saldrá del proxy de la consola. Hacer que
anuncie el dominio es un cambio en el servicio hbbs y no forma parte de este
despliegue.

## Qué quedó probado y qué pide una prueba en el VPS

Probado aquí, sin conectar a `157.173.194.16`:

- Migración, alta del admin, login y login fallido, roles.
- Alta, edición, búsqueda y borrado de equipos. La contraseña no sale en el HTML
  ni en el CSV. Un cambio de un byte del cifrado no descifra.
- Los cuatro caminos de acceso (persona, grupo de personas, grupo de equipos por
  persona, grupo de equipos por grupo de personas). Un operador no ve el resto,
  no entra a auditoría y no puede crear equipos.
- Sesión: el sondeo contra un hbbs falso habla el protobuf de verdad y el proxy
  reenvía frames. La auditoría registra inicio, enlace, fin y duración. El CSV
  no contiene la contraseña.
- `npm test`.

Hace falta probarlo en el VPS, con un PC que ya esté registrado en ese hbbs:

- Que el hbbs real conteste el `PunchHoleRequest` en claro por el puerto `21118`.
  Puede, en cambio, exigir primero `KeyExchange`. El sondeo lo mostrará; no hay
  que darlo por bueno hasta verlo.
- Que el enlace `rustdesk://` abra la app ya apuntando a este servidor y entre
  al equipo. La duración de esa sesión en la app solo se cierra en la consola
  cuando alguien pulsa Terminar: la app nativa no avisa a esta consola.
- nginx, la cookie `Secure`, la IP real detrás de Cloudflare y que `/ws/id` no
  quede publicado directo a hbbs.
- Una build Flutter del cliente web, si se quiere ver el escritorio dentro del
  navegador. Esta entrega no lo muestra: no decodifica video.
