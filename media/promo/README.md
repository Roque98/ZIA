# Video promocional ZIA (HyperFrames)

Composición HTML + GSAP de 26 s (1920×1080) renderizada con [HyperFrames](https://github.com/heygen-com/hyperframes) `0.8.77` (versión fijada en `package.json`).

1. Símbolo ZIA → 2. Una estación, cinco reguladores (sellos "pendiente") → 3. ZIA lo pone en regla (lista + medidor de cumplimiento) → 4. Mapa con las 5 oficinas → 5. Cierre con logo, eslogan y contacto.

## Requisitos
- Node.js 22+ y FFmpeg en el PATH (`winget install --id Gyan.FFmpeg -e`).

## Comandos
```bash
npm run check    # lint + validación en navegador
npm run render   # genera renders/promo.mp4 (usar -o para otro nombre)
```

La copia que usa el sitio está en `wireframes/bexon/assets/video/zia-promo.mp4`; si se vuelve a renderizar, reemplazarla ahí.
Los assets (`assets/`) son copias de `wireframes/bexon/assets/images/` (símbolo, logo, iconos de reguladores, ilustración y mapa).
El video no lleva audio: falta una pista musical con licencia.
