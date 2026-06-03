# ZIA — Claude Code Instructions

## Proyecto
ZIA es un sistema de integración de datos diseñado para unificar y procesar información de múltiples fuentes. Este repo contiene el wireframe y la arquitectura frontend.

## Estructura de carpetas
```
zia/
├── _client/          # Documentos del cliente (privados, no modificar)
├── .claude/          # Configuración y utilidades de Claude Code
├── docs/             # Documentación técnica y de producto
│   └── client-brief.md   # Resumen extraído del briefing del cliente
├── src/
│   ├── components/   # Componentes UI reutilizables
│   ├── pages/        # Páginas del wireframe
│   └── assets/       # Recursos estáticos
│       ├── icons/
│       └── images/
└── wireframes/
    ├── flows/        # Diagramas de flujo de usuario
    └── screens/      # Pantallas individuales
```

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
- Leer `docs/client-brief.md` antes de diseñar cualquier pantalla nueva
- Los wireframes van en `wireframes/screens/` como archivos `.md` (descripción textual) o imágenes
- Los flujos de usuario van en `wireframes/flows/`
- No modificar nada dentro de `_client/` — son documentos fuente del cliente
- El PDF del cliente es la fuente de verdad; `docs/client-brief.md` es su representación consultable
