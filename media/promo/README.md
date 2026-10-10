# Video promocional ZIA (HyperFrames)

Composición HTML + GSAP de 31 s con narración y música, (1920×1080) renderizada con [HyperFrames](https://github.com/heygen-com/hyperframes) `0.8.77` (versión fijada en `package.json`).

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
## Audio
- **Narración**: ElevenLabs, voz "Eric" (modelo eleven_multilingual_v2), una toma por escena en `assets/audio/voz/`. Generada con cuenta **gratuita**: licencia no comercial y requiere atribución (crédito en la escena final). Para publicar, regenerar con plan de pago (Starter o superior) y, de preferencia, una voz con acento mexicano de la biblioteca (p. ej. "MYS Octavio" o "Joaquín").
- **Música**: "Technology Corporate" de PaulYudin, [Pixabay](https://pixabay.com/music/corporate-technology-corporate-151895/) (Pixabay Content License: uso comercial sin atribución). Arranca en el segundo 13 de la pista para que su entrada fuerte (17.5 s) coincida con el corte a la estación (4.5 s del video).
- **Mezcla**: voz ×2.2; la música baja ~14 dB bajo la voz con una automatización `data-automation` y repunta en la intro y las pausas. Medido: tramos con voz ≈ −15 LUFS, intro ≈ −22 LUFS.
- `wireframes/bexon/assets/video/zia-promo-loop.mp4` es la versión sin audio (1280 px) para el loop del hero.
