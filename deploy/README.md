# Despliegue de ZIA en el VPS

ZIA es un sitio estático. En el VPS convive con `igas-console` y `abt-template` como un
sitio más de nginx: no usa puerto interno, servicio de systemd ni base de datos.

```
GitHub (push a main)                    VPS
  wireframes/bexon/  ──rsync──>  /srv/zia/web/  ──nginx──>  https://ziacentro.com
```

| | igas-console | zia |
|---|---|---|
| Carpeta | `/srv/igas-console` | `/srv/zia` |
| Qué sirve nginx | Angular + API en `127.0.0.1:5010` | solo archivos estáticos |
| Sitio de nginx | `sites-available/igas-console` | `sites-available/zia` |
| Dominio | `console.igasmorelia.com` | `ziacentro.com`, `www.ziacentro.com` |
| Servicio / base de datos | sí | no |

Nada de ZIA toca los archivos, puertos o servicios de las otras aplicaciones.

## Archivos

| Archivo | Dónde va | Qué hace |
|---|---|---|
| `nginx.conf` | `/etc/nginx/sites-available/zia` | Sirve `/srv/zia/web` para `ziacentro.com` |
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

### 2. Apuntar el dominio (cPanel de ziacentro.com)

En **Zone Editor** de cPanel:

| Tipo | Nombre | Valor |
|---|---|---|
| A | `ziacentro.com` | IP del VPS |
| A | `www` | IP del VPS |

- Si `www` existe como CNAME hacia `ziacentro.com`, se puede dejar así.
- **No tocar** los registros `MX`, `mail`, `webmail`, `cpanel` ni los `TXT` (SPF/DKIM): si
  el correo del dominio vive en ese hosting, seguirá funcionando igual.
- Bajar el TTL a 300 antes del cambio hace que se propague en minutos.

Comprobar que ya resuelve al VPS: `nslookup ziacentro.com`.

### 3. Comprobar por HTTP

`http://ziacentro.com` debe mostrar "ZIA: sitio en preparación."

### 4. Certificado TLS

Con el DNS ya apuntando al VPS:

```bash
ssh root@IP_DEL_VPS "certbot --nginx -d ziacentro.com -d www.ziacentro.com"
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
| `VPS_DOMINIO` | `ziacentro.com` |

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
