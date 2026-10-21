# ZIA — consola móvil

App de Expo (React Native, TypeScript y Expo Router) para el cliente de **ZIA Integración**: el aliado de las gasolineras en México ante ASEA, CNE, SAT, STPS y Protección Civil.

Esta carpeta es la primera versión. La landing del repositorio no trae consola, modelos ni un servicio de acceso: el único API que existe es el chatbot público de la landing (`/api/chat`). Por eso el acceso y los expedientes de esta app son una **demostración local**, con el contrato listo por si después hay un backend.

## Qué incluye

| Pantalla | Para qué |
| --- | --- |
| Acceso | Entra a la cuenta. Hoy valida contra un usuario de demostración. |
| Inicio | Cumplimiento del grupo, lo que urge y el avance de la gestoría. |
| Estaciones | Cada gasolinera, sus cinco reguladores y los puntos que se inspeccionan (tanques, dispensarios, consola, cámaras, eléctrica, operación). |
| Trámites | Expedientes en curso: revisión, gestoría, espera de la autoridad o listo. |
| Agenda | Vencimientos de pólizas, cédulas, reportes y certificados. |

La interfaz está en español y usa la marca de la landing: tinta `#0c1e21`, verde `#1e8a8a`, oro `#A69140`, rojo `#EC3237` y Mona Sans.

## Requisitos

- Node.js 22 o superior
- [Expo Go](https://expo.dev/go) actualizado a **SDK 58** en el teléfono, o un navegador para la versión web
- Para el APK, una cuenta de [Expo](https://expo.dev)

## Correrla

Desde esta carpeta:

```bash
cd mobile
npm install
npx expo start
```

En la terminal de Expo:

- escanea el QR con Expo Go (Android) o con la cámara (iOS) para abrir el proyecto;
- pulsa `w` para abrirla en el navegador.

La versión web se presenta en una columna de teléfono, centrada, para revisar el mismo diseño.

### Usuario de demostración

El formulario ya trae el correo. La contraseña es:

- Correo: `laura.mendez@demo.zia`
- Contraseña: `zia-demo`

La sesión queda en el dispositivo (SecureStore en el teléfono, `localStorage` en la web). Los expedientes —Grupo Estaciones del Pacífico y sus cuatro estaciones— son ficticios. La franja dorada «Demostración · sin servidor de acceso» lo recuerda dentro de la app. El teléfono de la oficina Centro es el de contacto público de ZIA en Tijuana.

Cualquier otro correo o contraseña se rechaza.

## Si más adelante hay API

Sin configuración, no se llama a ningún servidor. Para usar un backend propio:

```bash
EXPO_PUBLIC_API_URL=https://api.ejemplo.mx npx expo start
```

Contrato esperado, con `Authorization: Bearer <token>` en las lecturas:

- `POST /auth/login` con `{ "email", "password" }` responde `{ "token", "user" }`. `user` incluye `id`, `name`, `email` y, si existen, `firstName`, `role`, `company`, `office`, `phone`.
- `GET /estaciones` y `GET /estaciones/:id`
- `GET /tramites` y `GET /tramites/:id`
- `GET /vencimientos`

Las formas están en `src/types.ts`. Un 401 en el acceso muestra el error; un 404 en un detalle se trata como «no encontrado». El chatbot `/api/chat` de la landing no entra en este contrato: no identifica al cliente ni devuelve expedientes.

## Comprobar el proyecto

```bash
npx tsc --noEmit
npx expo export
```

`expo export` genera el bundle web (SPA) y los bundles nativos en `dist/`. Esa carpeta no se versiona.

## APK de Android con EAS

El perfil `preview` de `eas.json` pide un APK instalable (`android.buildType: apk`), no el AAB de Play Store. El perfil `production` sí genera el app bundle.

Hay que ejecutar EAS **desde `mobile/`**, porque el resto del repositorio no es la app:

```bash
cd mobile
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

La primera vez, EAS pide crear el proyecto en Expo y lo liga a esta app (`slug` `zia`, paquete `mx.ziaintegracion.app`). Al terminar, la CLI da la URL del APK. Ábrela en el teléfono Android e instala el archivo. También puedes bajar el APK y pasarlo con `adb install ruta/al/archivo.apk`.

El perfil `preview` firma el APK para distribución interna. No hace falta Android Studio ni un proyecto `android/` en el repo: EAS lo genera en la nube a partir de `app.json`.

Para un AAB de Play Store:

```bash
eas build -p android --profile production
```

## Estructura

```
mobile/
├── app.json              # nombre, icono, esquema zia://, paquetes nativos
├── eas.json              # preview (APK) y production (AAB)
├── src/app/              # rutas de Expo Router
│   ├── login.tsx
│   └── (app)/            # inicio, estaciones, trámites, agenda
├── src/api.ts            # acceso real si hay EXPO_PUBLIC_API_URL; si no, demo
├── src/data.ts           # expedientes ficticios
└── assets/               # símbolo de ZIA y Mona Sans (OFL, ver assets/fonts/OFL.txt)
```

Mona Sans es la misma familia de la landing y se carga en el arranque con `useFonts`, así que funciona en Expo Go sin un development build.
