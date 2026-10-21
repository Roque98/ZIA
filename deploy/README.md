# Despliegue de ZIA en el VPS

> **2026-10-19: dominio propio.** La landing vive en `https://ziacentro.mx` (Cloudflare, registros A
> `@`, `www`, `console`, `api` → VPS, solo DNS). `www.ziacentro.mx` y `app.ziacentro.com` redirigen 301
> a `https://ziacentro.mx` (el segundo sigue sirviendo `/api/chat/` durante la transición). Las
> secciones de abajo sobre cPanel/`app.ziacentro.com` quedan como historia.


ZIA es un sitio estático. En el VPS convive con `igas-console` y `abt-template` como un
sitio más de nginx: no usa puerto interno, servicio de systemd ni base de datos.

```
GitHub (push a main)                    VPS
  wireframes/bexon/  ──rsync──>  /srv/zia/web/  ──nginx──>  https://ziacentro.mx
```

| | igas-console | zia |
|---|---|---|
| Carpeta | `/srv/igas-console` | `/srv/zia` |
| Qué sirve nginx | Angular + API en `127.0.0.1:5010` | solo archivos estáticos |
| Sitio de nginx | `sites-available/igas-console` | `sites-available/zia` |
| Dominio | `console.igasmorelia.com` | `app.ziacentro.com` |
| Servicio / base de datos | sí | no |

Nada de ZIA toca los archivos, puertos o servicios de las otras aplicaciones.

## Archivos

| Archivo | Dónde va | Qué hace |
|---|---|---|
| `nginx.conf` | `/etc/nginx/sites-available/zia` | Sirve `/srv/zia/web` para `app.ziacentro.com` |
| `setup-servidor.sh` | se ejecuta una vez, como root | Crea `/srv/zia`, instala el sitio de nginx y recarga |
| `../.github/workflows/deploy.yml` | GitHub Actions | Copia `wireframes/bexon/` al VPS en cada push a `main` |

## Puesta en marcha (una vez)

### 1. Preparar el servidor

```bash
scp -r deploy/ root@IP_DEL_VPS:/tmp/zia-deploy
ssh root@IP_DEL_VPS "cd /tmp/zia-deploy && bash setup-servidor.sh"
```

El script valida la configuración completa de nginx antes de recargar; si algo no
cuadra retira su propio sitio y no recarga, así que los demás sitios no se ven afectados.

### 2. Subdominio (cPanel de ziacentro.com)

El sitio vive en el subdominio `app.ziacentro.com`. En **Zone Editor** de cPanel:

| Tipo | Nombre | Valor |
|---|---|---|
| A | `app` | IPv4 del VPS |
| AAAA | `app` | IPv6 del VPS (`ip -6 addr show scope global`) |

**El registro AAAA no es opcional.** Telcel conecta sus celulares solo por IPv6; sin AAAA
tienen que pasar por su traductor a IPv4 y la conexión hacia este VPS expira ("La conexión
ha expirado"), aunque desde wifi o computadora el sitio cargue bien. nginx ya escucha en
`[::]` y el firewall permite IPv6: solo falta publicarla en el DNS. Lo mismo aplica a los
dominios de igas-console.

El dominio principal (`ziacentro.com`, `www`) y los registros de correo (`MX`, `mail`,
`TXT` de SPF/DKIM) **no se tocan**: siguen en el hosting de cPanel.

Comprobar que ya resuelve al VPS: `nslookup app.ziacentro.com`.

### 3. Comprobar por HTTP

`http://app.ziacentro.com` debe mostrar "ZIA: sitio en preparación."

### 4. Certificado TLS

Con el DNS ya apuntando al VPS:

```bash
ssh root@IP_DEL_VPS "certbot certonly --webroot -w /var/www/acme --cert-name ziacentro.mx -d ziacentro.mx -d www.ziacentro.mx -d console.ziacentro.mx -d api.ziacentro.mx"
```

Certbot añade el bloque `listen 443` al sitio `zia` y la redirección de HTTP a HTTPS. La
renovación automática ya está programada en el servidor (la misma que usa igas-console).

### 5. Clave SSH de despliegue

Una clave propia para este repositorio (no reutilizar la de igas-console):

```bash
ssh-keygen -t ed25519 -C "deploy-zia" -f zia_deploy -N ""
# Autorizarla para el usuario de despliegue del VPS:
ssh root@IP_DEL_VPS "cat >> /home/deploy/.ssh/authorized_keys" < zia_deploy.pub
```

### 6. Secretos en GitHub

En el repositorio de ZIA: **Settings → Secrets and variables → Actions → New repository secret**.

| Secreto | Valor |
|---|---|
| `VPS_HOST` | IP del VPS |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | contenido completo de `zia_deploy` (la clave **privada**) |
| `VPS_KNOWN_HOSTS` | salida de `ssh-keyscan -H IP_DEL_VPS` |
| `VPS_DOMINIO` | `ziacentro.mx` |

Después, borrar `zia_deploy` y `zia_deploy.pub` de la computadora o guardarlos en un lugar seguro.

### 7. Primer despliegue

Pestaña **Actions → Deploy a VPS → Run workflow**. A partir de ahí se despliega solo en
cada push a `main` que cambie `wireframes/bexon/`.

Mientras falten los secretos, el workflow termina en verde con el aviso "Faltan secretos
del VPS" y no hace nada.

## Qué se publica

Solo `wireframes/bexon/` (la landing final), sin `_archivo/`. No se publican `docs/`,
`media/`, el selector de propuestas ni el wireframe lo-fi.

## Volver atrás

- **Una versión anterior del sitio**: revertir el commit en `main` y dejar que el workflow
  despliegue, o lanzar el workflow sobre el commit bueno.
- **Quitar ZIA del VPS** sin afectar a lo demás:
  ```bash
  rm /etc/nginx/sites-enabled/zia && nginx -t && systemctl reload nginx
  ```

## Cloudflare delante de *.ziacentro.mx (solo tráfico desde Cloudflare)

ziacentro.mx, www, console y api están proxificados por Cloudflare (SSL Full strict). En el origen:

- `/etc/nginx/conf.d/cloudflare-geo.conf` (generado): `geo $realip_remote_addr $desde_cloudflare` con los rangos oficiales de Cloudflare + 127.0.0.1/::1. Solo define una variable.
- `/etc/nginx/snippets/cloudflare-realip.conf` (generado): `set_real_ip_from` + `real_ip_header CF-Connecting-IP`. Se incluye **solo** en los `server{}` de *.ziacentro.mx, así `$remote_addr`, los logs, `limit_req` y `X-Real-IP`/`X-Forwarded-For` hacia los backends llevan la IP real del visitante.
- `/etc/nginx/snippets/cloudflare-solo.conf` (fijo): `if ($desde_cloudflare = 0) { return 403; }`. Se usa `geo` sobre `$realip_remote_addr` porque `allow/deny` evaluaría la IP ya reescrita por realip (bloquearía a todos).
- Puerto 80 también restringido; el reto HTTP-01 de Let's Encrypt llega por Cloudflare (`certbot renew --dry-run` OK).
- `cf-actualizar-ips` (`/usr/local/sbin`) + `cf-actualizar-ips.timer` (semanal, lunes): descarga ips-v4/ips-v6, valida CIDR, regenera geo+realip, `nginx -t` y recarga solo si pasa (si falla, restaura).
- Los hosts antiguos (api.console.igasmorelia.com, app.ziacentro.com, duckdns) NO pasan por Cloudflare y siguen abiertos.
- fail2ban: los logs muestran la IP real, pero un ban por iptables no frena a un visitante que entra por Cloudflare (la conexión TCP viene de IPs de Cloudflare). Para eso habría que usar reglas/WAF de Cloudflare.

Rollback: quitar las dos líneas `include .../cloudflare-*.conf` de los sitios, `nginx -t && systemctl reload nginx`; `systemctl disable --now cf-actualizar-ips.timer`.

## Consola de escritorios remotos

El módulo está en `console/` (Node 22, PostgreSQL, puerto `5030`). Sustituye AnyDesk
con el RustDesk OSS que ya corre en el VPS y no modifica la landing, `igas-console`
ni los procesos de los puertos 5000, 5010 y 5020. El sitio de nginx va aparte, para
`console.ziacentro.mx`.

La guía de variables, el admin inicial, el ejemplo de nginx y el límite del cliente
web están en `console/README.md`. El ejemplo de sitio es
`console/deploy/nginx-console.conf.example`.

## Cabeceras de seguridad de ziacentro.mx (2026-10-19)

- `deploy/nginx/ziacentro-mx` = copia de `/etc/nginx/sites-available/ziacentro-mx` en el VPS.
- `deploy/nginx/ziacentro-seguridad.conf` = `/etc/nginx/snippets/ziacentro-seguridad.conf`
  (HSTS 1 año, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy y CSP en **solo reporte**).
  Se incluye en el server y en cada `location` con `add_header` propio.
- Respaldo previo: `/root/backups/landing-headers-20261019-165233/ziacentro-mx`.
- Revertir: `cp /root/backups/landing-headers-20261019-165233/ziacentro-mx /etc/nginx/sites-available/ziacentro-mx && nginx -t && systemctl reload nginx`.
- Cuando la CSP no muestre violaciones en consola, se puede pasar a `Content-Security-Policy` (bloqueante).
