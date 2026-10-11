# TikTok + Composio — pantalla real de publicación

> Plan de implementación para revisión de TikTok y primera publicación pública después de aprobación.

Objetivo: construir una pantalla móvil-first, visible en tusaguacates.com, que permita conectar una cuenta TikTok, seleccionar un video, editar el copy, consultar las opciones reales del creador, publicar mediante Composio y mostrar el estado verificable del publish_id.

Arquitectura: agregar una ruta pública separada del checkout y del admin, con una interfaz tipo Creator Studio de Tus Aguacates. El navegador nunca recibirá Client Secret, Composio API key ni tokens TikTok. Las llamadas a Composio ocurrirán en Route Handlers server-side usando una Auth Config y un user_id estable. La primera versión usará el video aprobado de Mesa Sana solo para la demo, pero el flujo quedará preparado para seleccionar otros archivos aprobados.

Restricciones:
- La publicación pública real dependerá de la aprobación de TikTok Content Posting API.
- En Sandbox se demostrará SELF_ONLY; no se debe fingir una publicación pública.
- La pantalla debe mostrar consentimiento, cuenta, copy, privacidad, toggles y estado final.
- No tocar checkout, Luz v4, WhatsApp ni el panel administrativo.

## Fase 0 — Decisiones y fuentes de verdad

1. Confirmar la ruta pública: propuesta `/tiktok`.
2. Confirmar que la fuente de videos será inicialmente un manifiesto controlado de assets aprobados, no una carpeta completa ni videos sin auditoría.
3. Confirmar el user_id de Composio para la cuenta Tusaguacates.com y conservarlo solo en servidor/configuración.
4. Mantener `ac_JAq-ChNh63-W` como Auth Config del Sandbox hasta crear la configuración Production aprobada.

## Fase 1 — Página móvil para grabación

Crear una pantalla sin sidebar y sin flujo de compra:
- Encabezado Tus Aguacates + “Publicar en TikTok”.
- Paso 1: Conectar TikTok.
- Paso 2: Seleccionar video.
- Paso 3: Revisar copy y portada.
- Paso 4: Privacidad y opciones.
- Paso 5: Publicar y verificar.

La pantalla debe funcionar bien en un celular vertical, con botones de mínimo 44 px, estados claros, contraste alto y textos reales en HTML. Debe tener un modo de demo visible para que el video de revisión muestre el flujo sin depender de una sesión invisible.

Archivos previstos:
- Crear `app/(main)/tiktok/page.tsx` o una ruta pública equivalente después de inspeccionar el layout real.
- Crear `components/tiktok/TikTokPublisher.tsx`.
- Crear `components/tiktok/TikTokStepShell.tsx`.
- Crear `components/tiktok/TikTokVideoPreview.tsx`.
- Crear `components/tiktok/TikTokPublishStatus.tsx`.
- Crear `lib/tiktok/demo-assets.ts`.

## Fase 2 — Integración server-side Composio

Crear endpoints protegidos por configuración server-side:
- `app/api/tiktok/connect/route.ts`: genera el enlace OAuth de Composio para el user_id estable.
- `app/api/tiktok/creator-info/route.ts`: consulta `TIKTOK_QUERY_CREATOR_INFO` y devuelve únicamente datos necesarios para UI.
- `app/api/tiktok/publish/route.ts`: valida asset, copy, privacidad y flags antes de llamar a `TIKTOK_UPLOAD_VIDEO`.
- `app/api/tiktok/status/[publishId]/route.ts`: consulta `TIKTOK_FETCH_PUBLISH_STATUS`.

Reglas:
- Usar la conexión ACTIVE real; no depender de la conexión Playground accidentalmente.
- Nunca devolver tokens, Client Secret, API keys ni URLs OAuth con state/code al navegador.
- Validar que el archivo esté en la lista aprobada y conservar hash.
- Usar `SELF_ONLY` en Sandbox.
- En Production, permitir `PUBLIC_TO_EVERYONE` solo cuando una bandera de configuración indique que TikTok aprobó la app.
- Usar `brand_organic_toggle=true` para contenido propio de Tus Aguacates y `brand_content_toggle=false` salvo que exista patrocinio de un tercero.
- No permitir publicación doble ni reintentos automáticos sin consultar primero el estado.

## Fase 3 — Flujo de contenido

Para la primera demo usar:
- Asset: `mesa_sana-20260626-0001_fixed.mp4`.
- Caption aprobado por Mao.
- Portada alrededor del segundo 4.
- Video vertical H.264/AAC, 43 segundos, 8,09 MB.

La UI debe mostrar:
- Preview del video.
- Nombre del archivo y duración.
- Caption editable.
- Selector de privacidad basado en `creator_info`.
- Toggles de comentarios, duetos y stitches.
- Indicador de contenido orgánico de la marca.
- Aviso de Sandbox: “La prueba quedará visible solo para la cuenta autorizada”.

## Fase 4 — Demo para TikTok

Grabar desde el celular, en 60–120 segundos como recomendación operativa:
1. Abrir `https://www.tusaguacates.com/tiktok`.
2. Mostrar la marca y el título de la pantalla.
3. Conectar TikTok o mostrar la conexión ya autorizada.
4. Seleccionar el video.
5. Mostrar preview, copy, portada y opciones.
6. Mostrar consulta de creator info y nickname Tusaguacates.com.
7. Seleccionar SELF_ONLY en Sandbox.
8. Pulsar publicar.
9. Mostrar el estado de carga.
10. Mostrar el estado final y el publish_id parcialmente oculto si contiene información innecesaria.
11. Abrir TikTok y mostrar el resultado privado.

No grabar Client Secret, API key, cookies, códigos OAuth ni datos de otros usuarios.

## Fase 5 — Production y auditoría

1. Importar la configuración validada del Sandbox al Draft de Production.
2. Revisar que Products tenga solo Login Kit y Content Posting API.
3. Revisar `video.upload` y `video.publish`.
4. Completar la explicación de productos/scopes.
5. Subir el demo real.
6. Enviar a revisión.
7. Después de aprobación, actualizar la configuración server-side y reconectar si TikTok invalida el grant anterior.
8. Probar primero una publicación pública aprobada con el mismo asset o uno nuevo autorizado.
9. Leer de vuelta el estado y registrar el resultado.

## Criterios de aceptación

- La ruta carga correctamente en celular real.
- El flujo no expone secretos.
- Creator info se consulta antes de publicar.
- Solo aparecen opciones de privacidad válidas para la cuenta.
- El asset y el hash coinciden con el video aprobado.
- Sandbox publica SELF_ONLY o devuelve un error real claramente visible.
- El estado se consulta con `publish_id`; no se declara éxito por un simple clic.
- La pantalla sirve como evidencia de integración real, no como mock.
- Typecheck, tests críticos, build y verificación browser pasan antes de desplegar.
- La publicación pública se intenta solo después de aprobación de TikTok.

## Orden de ejecución recomendado

1. Construir y probar la pantalla sin publicar.
2. Conectar los endpoints de lectura.
3. Probar creator info en el celular.
4. Conectar el publish Sandbox SELF_ONLY.
5. Grabar el demo.
6. Completar Production review.
7. Hacer prueba pública después de aprobación.
