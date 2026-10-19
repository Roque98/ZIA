#!/usr/bin/env bash
# Prepara el VPS para servir ZIA. Se ejecuta UNA vez, como root, desde esta carpeta:
#
#   scp -r deploy/ root@IP:/tmp/zia-deploy
#   ssh root@IP "cd /tmp/zia-deploy && bash setup-servidor.sh"
#
# Es seguro en el servidor que ya sirve igas-console y abt-template:
#   - no instala ni desinstala paquetes (nginx y rsync ya estan),
#   - solo crea /srv/zia y el sitio 'zia' de nginx,
#   - antes de recargar valida la configuracion COMPLETA (nginx -t); si algo falla,
#     quita su propio sitio y no recarga, de modo que los otros siguen como estaban.
# Se puede volver a correr: no duplica nada.
set -euo pipefail

RAIZ=/srv/zia
USUARIO_DEPLOY=deploy
SITIO=zia

if [ "$(id -u)" -ne 0 ]; then echo "Ejecutar como root."; exit 1; fi
for bin in nginx rsync; do
  command -v "$bin" >/dev/null 2>&1 || { echo "Falta '$bin' en el servidor. Instalarlo antes (apt-get install -y $bin)."; exit 1; }
done
id -u "$USUARIO_DEPLOY" >/dev/null 2>&1 || { echo "No existe el usuario '$USUARIO_DEPLOY' (lo crea el setup de igas-console)."; exit 1; }
[ -f nginx.conf ] || { echo "Ejecutar desde la carpeta deploy/ (no encuentro nginx.conf)."; exit 1; }

echo "1/3  Carpeta $RAIZ/web (la escribe '$USUARIO_DEPLOY', la lee nginx)"
mkdir -p "$RAIZ/web"
chown -R "$USUARIO_DEPLOY:$USUARIO_DEPLOY" "$RAIZ"
chmod 755 "$RAIZ" "$RAIZ/web"
# Pagina provisional hasta el primer despliegue, para poder comprobar el sitio y el certificado.
if [ ! -f "$RAIZ/web/index.html" ]; then
  echo '<!doctype html><meta charset="utf-8"><title>ZIA</title><p>ZIA: sitio en preparaci&oacute;n.</p>' > "$RAIZ/web/index.html"
  chown "$USUARIO_DEPLOY:$USUARIO_DEPLOY" "$RAIZ/web/index.html"
fi

echo "2/3  Sitio nginx '$SITIO'"
cp nginx.conf "/etc/nginx/sites-available/$SITIO"
ln -sf "/etc/nginx/sites-available/$SITIO" "/etc/nginx/sites-enabled/$SITIO"

echo "3/3  Validar y recargar nginx"
if nginx -t; then
  systemctl reload nginx
else
  echo "La configuracion de nginx NO es valida: se retira el sitio '$SITIO' y no se recarga."
  rm -f "/etc/nginx/sites-enabled/$SITIO"
  exit 1
fi

cat <<FIN

Listo. Faltan los pasos manuales (ver deploy/README.md):

 1. Comprobar que app.ziacentro.com resuelve a este servidor (registro A en el
    Zone Editor de cPanel; el dominio principal y el correo no se tocan):
      curl -I http://app.ziacentro.com
 2. Emitir el certificado:
      certbot certonly --webroot -w /var/www/acme --cert-name ziacentro.mx -d ziacentro.mx -d www.ziacentro.mx -d console.ziacentro.mx -d api.ziacentro.mx
 3. Clave SSH de despliegue de ZIA en /home/$USUARIO_DEPLOY/.ssh/authorized_keys
    y los secretos en el repositorio de GitHub.
FIN
