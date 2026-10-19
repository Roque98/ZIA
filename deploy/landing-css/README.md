# base.min.css de la landing

`wireframes/bexon/assets/css/base.min.css` es bootstrap + bexon-icons + main + venobox del
template **purgados** con PurgeCSS contra `index.html`, `aviso-privacidad.html` y el JS de ZIA
(~1 MB → ~58 KB). Si se agregan clases del template al HTML, regenerarlo:

    cd /tmp && npm i purgecss@6 csso@5 && NODE_PATH=/tmp/node_modules node /ruta/al/repo/deploy/landing-css/build.js

y subir el `?v=` en los `<link>` de ambas páginas.
