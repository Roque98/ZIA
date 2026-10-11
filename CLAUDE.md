# ZIA — Claude Code Instructions

## Proyecto
ZIA es un sistema de integración de datos diseñado para unificar y procesar información de múltiples fuentes. Este repo contiene el wireframe y la arquitectura frontend del sitio web de presentación.

## Estructura de carpetas
```
zia/
├── _client/                    # Documentos del cliente (privados, no modificar)
│   ├── Documento ZIA INTEGRACION.pdf
│   └── LOGO ZIA 1A.png
├── .claude/                    # Configuración y utilidades de Claude Code
├── docs/                       # Documentación técnica y de producto
│   ├── client-brief.md         # Resumen extraído del briefing del cliente
│   ├── ux-review-2026-06-04.md # Revisión UX del wireframe
│   └── Bexon HTML Template/    # Template de referencia original (no modificar)
│       ├── Documentation/
│       └── Template/           # HTML/CSS/JS fuente del template Bexon
├── src/                        # Área reservada para implementación futura
│   ├── components/
│   ├── pages/
│   └── assets/
│       ├── icons/
│       └── images/
├── wireframes/
│   ├── index.html              # Selector de propuestas de diseño
│   ├── flows/                  # Diagramas de flujo de usuario
│   ├── screens/                # Propuesta 01: wireframe lo-fi HTML/CSS
│   │   ├── index.html          # Landing lo-fi de una sola página (misma estructura que Bexon)
│   │   ├── _archivo/           # Versión v1.5 de 4 páginas, solo referencia
│   │   ├── wireframe.css
│   │   ├── wireframe.js
│   │   └── assets/
│   └── bexon/                  # Propuesta 02: landing hi-fi sobre template Bexon
│       ├── index.html          # Landing única (sin menú): hero con video, estación, proceso (escena fija: la estación se pone en regla), nosotros, cobertura, formulario
│       ├── _archivo/           # Versión v1.5 de 4 páginas (home, servicios, nosotros, contacto), solo referencia
│       └── assets/             # Assets locales: template Bexon + css/zia.css, css/landing.css, js/zia.js, js/landing.js, images/zia/, video/
├── media/
│   └── promo/                  # Video promocional (HyperFrames): composición, voz ElevenLabs y música
├── elevenlabs/                 # API key local de ElevenLabs — ignorada por git, nunca versionar
└── index.html                  # Punto de entrada al selector de propuestas
```

## Stack de wireframes
- **Propuesta 01 (`wireframes/screens/`)** — HTML + CSS propio (`wireframe.css`) sin dependencias externas; lo-fi.
- **Propuesta 02 (`wireframes/bexon/`)** — Template Bexon (Bootstrap 5 + GSAP + Swiper + jQuery). Los assets están copiados localmente en `wireframes/bexon/assets/` para evitar depender de rutas relativas del template original. Es una **landing de una sola página** (`index.html`, sin menú); los estilos y scripts propios viven en `assets/css/zia.css` + `landing.css` y `assets/js/zia.js` + `landing.js`. Las 4 páginas anteriores están en `_archivo/`.

## Gitflow
- `main` — producción estable
- `develop` — integración continua
- `feature/<nombre>` — nuevas funcionalidades
- `release/<version>` — preparación de releases
- `hotfix/<nombre>` — correcciones urgentes en main

Siempre hacer merge de feature → develop con `--no-ff`.

## Convenciones de commits
Usar Conventional Commits:
- `feat(scope): descripción` — nueva funcionalidad
- `fix(scope): descripción` — corrección de bug
- `docs(scope): descripción` — cambios en documentación
- `refactor(scope): descripción` — refactor sin cambio funcional
- `chore(scope): descripción` — tareas de mantenimiento

## Reglas de trabajo
- Leer `docs/client-brief.md` antes de diseñar cualquier pantalla nueva.
- Cualquier nueva sección va en ambas landings (`wireframes/screens/index.html` y `wireframes/bexon/index.html`) salvo indicación contraria.
- Los flujos de usuario van en `wireframes/flows/`.
- No modificar nada dentro de `_client/` ni dentro de `docs/Bexon HTML Template/` — son documentos fuente de referencia.
- El PDF del cliente es la fuente de verdad; `docs/client-brief.md` es su representación consultable.
- Al modificar la propuesta Bexon, los assets se referencian con ruta relativa `./assets/` (no apuntar a `docs/`).
