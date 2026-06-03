# Wireframe — Home

**Ruta**: `/`
**Archivo**: `wireframes/screens/home.md`
**Estado**: Draft

---

## Estructura general de la página

```
┌─────────────────────────────────────────────────────────────┐
│  NAVBAR                                                     │
├─────────────────────────────────────────────────────────────┤
│  HERO                                                       │
├─────────────────────────────────────────────────────────────┤
│  PROPUESTA DE VALOR  (3 pilares)                            │
├─────────────────────────────────────────────────────────────┤
│  SERVICIOS  (grid de 7 tarjetas)                            │
├─────────────────────────────────────────────────────────────┤
│  TRAYECTORIA  (timeline horizontal)                         │
├─────────────────────────────────────────────────────────────┤
│  REGULADORES  (logos/iconos de los 5 ejes normativos)       │
├─────────────────────────────────────────────────────────────┤
│  CTA  (llamada a la acción final)                           │
├─────────────────────────────────────────────────────────────┤
│  FOOTER                                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. NAVBAR

```
┌─────────────────────────────────────────────────────────────┐
│ [LOGO ZIA]    Servicios  Nosotros  Contacto    [BOTÓN CTA]  │
└─────────────────────────────────────────────────────────────┘
```

| Elemento | Contenido | Notas |
|----------|-----------|-------|
| Logo | Logotipo ZIA Integración | Enlaza a `/` |
| Nav links | Servicios · Nosotros · Contacto | Scroll ancla dentro de Home |
| Botón CTA | "Solicitar auditoría" | Color de acento, enlaza a `#contacto` |

**Comportamiento**: sticky al hacer scroll; fondo transparente → sólido al bajar.

---

## 2. HERO

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   [Imagen de fondo: gasolinera moderna / hidrocarburos]    │
│                                          (overlay oscuro)  │
│                                                             │
│   SU ALIADO ESTRATÉGICO                                    │
│   EN EL SECTOR GASOLINERO                                  │
│                                                             │
│   Más de 20 años simplificando el cumplimiento normativo   │
│   para gasolineras en México.                              │
│                                                             │
│   [Solicitar auditoría gratuita]  [Conocer servicios]      │
│                                                             │
│   ──────────────────────────────────────────────────────   │
│   25+  empresas atendidas   |   20+ años   |   5 oficinas  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

| Elemento | Contenido | Tipo |
|----------|-----------|------|
| Headline | "Su aliado estratégico en el sector gasolinero" | H1 |
| Subheadline | "Más de 20 años simplificando el cumplimiento normativo para gasolineras en México." | Párrafo |
| CTA primario | "Solicitar auditoría gratuita" | Botón primario → `#contacto` |
| CTA secundario | "Conocer servicios" | Botón secundario → `#servicios` |
| Stats bar | 3 métricas: empresas · años · oficinas | Fila de números destacados |

**Fuente del copy**: misión del cliente + eslogan del PDF p.1

---

## 3. PROPUESTA DE VALOR (3 pilares)

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   [Icono]    │  │   [Icono]    │  │   [Icono]    │
│              │  │              │  │              │
│  Cumplimiento│  │  Continuidad │  │  Tranquilidad│
│  normativo   │  │  operativa   │  │  legal       │
│  integral    │  │              │  │              │
│              │  │              │  │              │
│  Auditamos,  │  │  Supervisión │  │  Defensa     │
│  gestionamos │  │  técnica y   │  │  jurídica    │
│  y ejecutamos│  │  mantenimiento  especializada  │
└──────────────┘  └──────────────┘  └──────────────┘
```

| Pilar | Título | Descripción corta | Icono sugerido |
|-------|--------|-------------------|----------------|
| 1 | Cumplimiento normativo integral | Auditamos, gestionamos y ejecutamos ante ASEA, CRE, SAT, STPS y Protección Civil | Escudo / check |
| 2 | Continuidad operativa | Supervisión técnica, diagnóstico y mantenimiento preventivo de infraestructura | Engranaje |
| 3 | Tranquilidad legal | Defensoría jurídica especializada en el sector de hidrocarburos | Balanza |

---

## 4. SERVICIOS

Ancla: `#servicios`

```
┌──────────────────────────────────────────────────────────┐
│  Nuestros servicios                                      │
│  Todo lo que su gasolinera necesita en un solo lugar.    │
├────────────┬────────────┬────────────┬────────────────────┤
│ Auditoría  │ Gestoría   │ Fiscal     │ Diagnóstico        │
│ Normativa  │ CRE/ASEA   │ SAT        │ Infraestructura    │
├────────────┼────────────┼────────────┼────────────────────┤
│ Seg. e     │ Equipo     │ Defensoría │                    │
│ Higiene    │ Tecnológico│ Jurídica   │   [Ver todos →]    │
└────────────┴────────────┴────────────┴────────────────────┘
```

Cada tarjeta contiene:
- Icono (placeholder `[ICO]`)
- Título del servicio
- 1 línea descriptiva
- Enlace "Ver más →" (hacia su pantalla dedicada)

| # | Tarjeta | Descripción corta | Enlace |
|---|---------|-------------------|--------|
| 1 | Auditoría de Cumplimiento Normativo | Evaluación integral de riesgos y documentación | `/servicios/auditoria` |
| 2 | Gestoría CRE / ASEA | Trámites, permisos y obligaciones ante reguladores | `/servicios/gestoria` |
| 3 | Servicios Fiscales SAT | Control volumétrico y cumplimiento fiscal | `/servicios/fiscal` |
| 4 | Diagnóstico e Infraestructura | Pruebas de tanques, calidad y mantenimiento | `/servicios/infraestructura` |
| 5 | Seguridad e Higiene Laboral | Cumplimiento STPS y Protección Civil | `/servicios/seguridad` |
| 6 | Equipo Tecnológico | Dispensarios, telemedición, videovigilancia | `/servicios/equipo` |
| 7 | Defensoría Jurídica | Amparo y litigio ante SAT, CRE, ASEA, IMSS | `/servicios/defensoria` |

---

## 5. TRAYECTORIA (timeline)

Ancla: `#nosotros`

```
┌─────────────────────────────────────────────────────────┐
│  Más de 20 años al servicio del sector                  │
│                                                         │
│  2000 ──●────────●──────●──────●───────────●  HOY       │
│         │        │      │      │           │            │
│        TI   Hidro-  Segur. CRE/   Liderazgo             │
│             carburos  e Hig. ASEA  Integral              │
└─────────────────────────────────────────────────────────┘
```

| Año | Hito | Detalle |
|-----|------|---------|
| 2000 | Orígenes en TI | Soporte y asesoría en sistemas de información y redes |
| 2004 | Especialización en Hidrocarburos | Controles volumétricos para gasolineras |
| 2010 | Diversificación en Seguridad | Consultoría en seguridad e higiene, Protección Civil y STPS |
| 2015 | Adaptación Regulatoria | Ampliación del catálogo para CRE y ASEA |
| Hoy | Liderazgo Integral | Auditorías, gestoría, supervisión y defensoría jurídica |

**Componente**: timeline horizontal en desktop, vertical en mobile.

---

## 6. REGULADORES

```
┌──────────────────────────────────────────────────────────┐
│  Operamos ante los principales organismos reguladores    │
│                                                          │
│   [ASEA]   [CRE]   [SAT]   [STPS]   [PROT. CIVIL]      │
└──────────────────────────────────────────────────────────┘
```

Logos/iconos de los 5 organismos con tooltip o etiqueta de nombre. Sin descripción extra — refuerza credibilidad.

---

## 7. CTA FINAL

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   ¿Su gasolinera está en regla?                         │
│                                                          │
│   Solicite una auditoría inicial sin costo.             │
│   Identifique sus riesgos antes de que lo hagan las     │
│   autoridades.                                           │
│                                                          │
│           [ Contactar a un especialista ]               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

| Elemento | Contenido |
|----------|-----------|
| Headline | "¿Su gasolinera está en regla?" |
| Subtext | "Solicite una auditoría inicial sin costo." |
| Botón | "Contactar a un especialista" → `#contacto` / `/contacto` |
| Fondo | Color de acento o imagen de contraste |

---

## 8. FOOTER

```
┌──────────────────────────────────────────────────────────┐
│  [LOGO]  ZIA Integración                                 │
│  www.ziaintegracion.com                                  │
│                                                          │
│  Servicios        Nosotros       Contacto               │
│  · Auditoría      · Misión       · Tijuana              │
│  · Gestoría       · Trayectoria  · Morelia              │
│  · Fiscal         · Equipo       · Chihuahua            │
│  · Defensoría                    · Orizaba              │
│                                                          │
│  © 2026 ZIA Integración · Su aliado estratégico         │
└──────────────────────────────────────────────────────────┘
```

---

## Decisiones de diseño

| Decisión | Razón |
|----------|-------|
| Stats bar en el Hero | Refuerza credibilidad de inmediato (20+ años, oficinas nacionales) |
| 3 pilares antes de servicios | Resume el valor antes de listar el catálogo completo |
| Sección de reguladores | El cliente se enorgullece de operar ante 5 organismos — es diferenciador |
| CTA de auditoría gratuita | Baja la barrera de entrada; alineado con el primer servicio del cliente |
| Timeline en Home (resumen) | Introduce la trayectoria; link a página `/nosotros` para detalle |

---

## Componentes reutilizables identificados

| Componente | Usado en |
|------------|---------|
| `<Navbar>` | Todas las páginas |
| `<ServiceCard>` | Home → Servicios → cada página de servicio |
| `<TimelineItem>` | Home (resumen) → `/nosotros` (completo) |
| `<RegulatorBadge>` | Home → páginas de servicio |
| `<CtaBanner>` | Home + páginas de servicio |
| `<Footer>` | Todas las páginas |

---

## Pantallas relacionadas

- `wireframes/screens/nosotros.md` — trayectoria completa
- `wireframes/screens/servicios.md` — catálogo completo
- `wireframes/screens/contacto.md` — formulario y mapa de oficinas
- `wireframes/flows/user-flow.md` — flujo principal desde Home
