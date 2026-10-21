# ZIA — consola móvil

App de Expo (React Native, TypeScript y Expo Router) conectada a la consola real de **ZIA Integración** en `https://api.ziacentro.mx`.

La interfaz está en español y usa la marca de la landing: tinta `#0c1e21`, verde `#1e8a8a`, oro `#A69140`, rojo `#EC3237` y Mona Sans.

## Qué incluye

| Pantalla | De dónde sale |
| --- | --- |
| Acceso | OpenIddict de la consola: código de autorización + PKCE del cliente `IgasConsole_App`, y luego `refresh_token`. |
| Inicio | Contexto de estaciones, operación del día, cuenta y avisos. |
| Estaciones | Tanques, dispensarios, ventas, balance, alarmas y enlace del nodo. |
| Auditorías | Expedientes de control volumétrico. |
| Licencias | Vigencia y conexión de los nodos. Es el equivalente real de una agenda de vencimientos. |

No hay trámites ni vencimientos de pólizas en el API. Esas pantallas de la primera versión se quitaron.

## Requisitos

- Node.js 22 o superior
- Para desarrollo, [Expo Go](https://expo.dev/go) en SDK 58, o un navegador para la vista web
- Una cuenta de `https://console.ziacentro.mx`

## Correrla

```bash
cd mobile
npm install
npx expo start
```

El API por defecto es `https://api.ziacentro.mx`. Para apuntar a otro host:

```bash
EXPO_PUBLIC_API_URL=https://api.ejemplo.mx npx expo start
```

### Acceso

En Android e iOS, «Iniciar sesión» abre el acceso oficial de `api.ziacentro.mx` (la misma página que usa la consola). La contraseña no se teclea en la app: se teclea en ese sitio. Al terminar, el servidor redirige a `https://console.ziacentro.mx` con un código; la app lo intercepta, lo cambia por tokens y no carga la consola web.

Ese cliente público no acepta contraseña directa ni `zia://auth`. Por eso el APK usa el redirect que ya está registrado. La vista web de Expo no puede cerrar ese ciclo y lo dice en pantalla.

La sesión (access token y refresh token) queda en el dispositivo, partida en SecureStore porque un token puede pasar de 2 KB. En la web, si algún día el redirect estuviera permitido, iría a `localStorage`.

Al salir se revoca el token en `/connect/revocat` (es el `revocation_endpoint` que publica el discovery de producción).

## Endpoints

Todas las lecturas van con `Authorization: Bearer`.

- `GET /connect/authorize` y `POST /connect/token`
- `GET /api/abp/application-configuration`
- `GET /api/app/estaciones/contexto`
- `GET /api/app/estaciones/operacion/{organizacionId}`
- `POST /api/app/estaciones/reconocer-alarma/{alarmaId}`
- `GET /api/app/mi-cuenta`
- `GET /api/app/notification`
- `GET /api/app/auditoria-volumetrica` y `GET /api/app/auditoria-volumetrica/{id}`
- `GET /api/app/nodos/panel`

Un 403 en auditorías o licencias muestra que la cuenta no tiene ese permiso, en lugar de inventar datos.

## Comprobar el proyecto

```bash
npx tsc --noEmit
npx expo export
```

## APK de Android

El perfil `preview` de `eas.json` sigue sirviendo para un APK en la nube de EAS:

```bash
cd mobile
npx eas-cli build -p android --profile preview
```

También se puede generar en local, después de instalar JDK 17 y el Android SDK:

```bash
cd mobile
npx expo prebuild -p android
cd android && ./gradlew assembleRelease
```

El keystore de release no se versiona. El APK firmado de esta entrega está fuera del repositorio.

## Cambio que haría falta en el backend

No se desplegó nada. El cliente `IgasConsole_App` rechaza `password` (OpenIddict ID2064), rechaza el device code (ID2056) y responde 400 si `redirect_uri` no es `https://console.ziacentro.mx`. El código de autorización y el refresh sí están permitidos para ese cliente.

Para dejar el WebView y usar Chrome Custom Tabs con `zia://auth`, en el seed de OpenIddict (no está en un repositorio accesible desde aquí) haría falta un cliente público nuevo, por ejemplo `IgasConsole_Mobile`:

- tipo público, sin secreto, con PKCE obligatorio
- redirect `zia://auth`
- grants `authorization_code` y `refresh_token`
- scopes `offline_access` e `IgasConsole`
- sin pantalla de consentimiento, igual que la consola

El código de esta app ya intercambia el código en `/connect/token`; solo cambiaría la URL de autorización y el redirect.

## Estructura

```
mobile/
├── app.json
├── eas.json
├── src/app/                 # login, inicio, estaciones, auditorías, licencias
├── src/api.ts               # cliente del API de producción
├── src/oauth.ts             # URL de autorización y lectura del redirect
└── assets/                  # símbolo de ZIA y Mona Sans (OFL)
```
