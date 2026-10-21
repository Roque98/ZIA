# Lista para la primera subida a Google Play

Paquete `mx.ziaintegracion.app`, versionCode **1**, versionName **0.1.0**. El AAB está firmado con la llave de carga ya generada. Play App Signing debe quedar activado: Google custodia la llave de la app y esta llave solo sirve para subir. No suba el keystore ni su contraseña a Play ni al repositorio.

El AAB declara **targetSdk 36** (Android 16). Desde el 31 de agosto de 2026, Google Play exige ese nivel para apps nuevas. minSdk 24.

La política pública de la app, en el repo, es `wireframes/bexon/privacidad/index.html`. Cuando se publique el sitio, la URL será **https://ziacentro.mx/privacidad/**. Esta preparación no despliega el sitio: hay que publicar la landing antes de enviar la ficha a revisión, porque Play abre esa URL.

## Ficha (español de México)

Copiar los textos de `listing.es-MX.md`.

| Campo | Archivo |
| --- | --- |
| Ícono 512×512 PNG | `mobile/store/icon-512.png` |
| Gráfico de funciones 1024×500 PNG | `mobile/store/feature-1024x500.png` |
| Capturas de teléfono | `mobile/store/screenshots/` |

Las capturas de estaciones, auditorías y licencias usan cifras de ejemplo (Grupo Ejemplo, permisos `PL/000/EXP/ES/…`). No hay sesión de un cliente real: no tenemos credenciales de producción. La app que va en el AAB no incluye ese modo de ejemplo.

Categoría sugerida: **Empresas** (o Productividad). No es un juego. Correo de contacto de la ficha: `contacto@ziaintegracion.com`. Sitio: `https://ziacentro.mx/`.

## Seguridad de los datos

Responda según lo que la app hace hoy. No hay anuncios, no hay SDK de analítica y no se vende información.

| Pregunta | Respuesta |
| --- | --- |
| ¿La app recoge o comparte datos de usuario? | Sí, recoge. No comparte con terceros. |
| ¿Los datos se cifran en tránsito? | Sí. Todo va por HTTPS a `api.ziacentro.mx`. |
| ¿El usuario puede pedir que se borren? | Sí. «Salir» revoca el token en el teléfono. La cuenta y los datos de la consola se atienden en la consola o por `contacto@ziaintegracion.com`. La app no da de alta usuarios. |
| ¿Se recopilan datos para publicidad? | No. |
| Nombre | Sí. Lo devuelve la cuenta de la consola. Finalidad: funcionalidad de la app y gestión de la cuenta. No se comparte. |
| Correo o nombre de usuario | Sí. Igual que el nombre. |
| Identificadores publicitarios u otros IDs de dispositivo | No. |
| Ubicación | No. |
| Información financiera de una tarjeta o compra dentro de la app | No. La app no cobra. |
| Otra información financiera | Sí, si Play pregunta por los importes y litros de la estación: son cifras operativas de la organización del usuario, consultadas en su consola, solo para mostrarlas. No se comparten ni se usan para crédito o publicidad. |
| Mensajes, contactos, fotos, audio, archivos personales | No. |
| Actividad en la app (interacciones) | Opcional. La única escritura es reconocer una alarma. Si el formulario lo exige, márquela como funcionalidad de la app, no compartida. |
| Información de la app (diagnósticos, fallos) | No la recoge esta app. |
| Datos sensibles | No. |

En «¿Se comparten datos?»: **No**. El servidor `api.ziacentro.mx` es de ZIA, no un tercero. No hay transferencia a redes de anuncios ni a corredores de datos.

Permisos del AAB que conviene declarar así si Play los lista: Internet (necesario), vibración (no recoge datos). Se quitaron del manifiesto de release el permiso de dibujar sobre otras apps y el de almacenamiento. `USE_BIOMETRIC` / `USE_FINGERPRINT` pueden aparecer porque el token se guarda con el almacén seguro del sistema: la app **no lee huellas ni datos biométricos**. Si Play pregunta, responda que no se recopilan.

## Clasificación de contenido (cuestionario IARC)

| Tema | Respuesta |
| --- | --- |
| Violencia, miedo, sexualidad, lenguaje, apuestas, drogas | Ninguno. El combustible de la estación no es contenido sobre sustancias controladas. |
| El usuario se comunica con otros usuarios, comparte ubicación o publica contenido | No. |
| Compras digitales | No. |
| Resultado esperado | Para todos / PEGI 3. No es una app para niños ni del programa Familias. |

## Público objetivo

- Grupos de edad: **solo 18 años o más**.
- No está diseñada para atraer a menores. No marque «diseñada para niños» ni el programa Familias.
- Es una herramienta de trabajo para quien administra estaciones.

## Acceso de la app (revisores de Play)

Toda la funcionalidad útil está detrás del acceso. En Play Console, «Acceso de la app»: **el acceso está restringido** y hay que dar instrucciones.

Play no puede entrar sin una cuenta de `console.ziacentro.mx`. Esta preparación **no crea esa cuenta**. Antes de enviar a revisión:

1. Cree un usuario de prueba en la consola, con acceso a una organización marcada como demostración si existe, y con al menos una estación.
2. **Desactive la verificación en dos pasos** de ese usuario, o el revisor se quedará en la página de ZIA sin poder continuar. La app no pide un código propio: usa la página de acceso del API.
3. En las instrucciones (en español está bien) escriba algo equivalente a:
   - Abrir la app.
   - Pulsar «Iniciar sesión».
   - En la página de ZIA (`api.ziacentro.mx`), usar el correo y la contraseña de prueba que se indican aquí.
   - Recorrer Inicio, Estaciones, el detalle de una estación, Auditorías y Licencias.
4. Pegue el usuario y la contraseña en el formulario de Play. No los ponga en el repositorio ni en la ficha pública.
5. Si el rol de prueba no ve auditorías o licencias, la app muestra «sin acceso». Para la revisión, dé un rol que sí las vea, o explique en las instrucciones que esas dos pantallas dependen del permiso.

Nombre de usuario, contraseña y, si aplica, cualquier otro paso: todos van en ese formulario de Play, no en la descripción de la tienda.

## Prueba obligatoria en cuentas personales nuevas

Si la cuenta de Play Console es **personal y se creó después del 13 de noviembre de 2023**, Producción permanece cerrada hasta completar esto (ayuda de Play: «App testing requirements for new personal developer accounts»):

- Una prueba **cerrada** (la interna no cuenta; la abierta no está disponible todavía).
- Al menos **12 testers** que hayan aceptado la invitación (no basta con anotar el correo).
- Esos 12 tienen que llevar **14 días seguidos** dentro de la prueba en el momento de solicitar acceso a producción.
- Después: Panel → Solicitar acceso a producción, y responder el formulario sobre la prueba y la app. La revisión suele tardar unos siete días y puede pedir más uso real si los testers no abrieron la app.

Una cuenta de **organización**, o una personal anterior a esa fecha, no entra en esa regla. Conviene confirmar el tipo de cuenta en el propio Play Console: una cuenta recién comprada casi siempre es personal y posterior a 2023, así que el primer envío realista es a la pista de prueba cerrada, no a producción.

El AAB de esta entrega se puede subir a la prueba interna (opcional, para el equipo) y a la prueba cerrada. No hace falta otro versionCode mientras no se publique otro artefacto con el mismo 1.
