# Auditoria Fase 2

Fecha: 2026-03-15
Proyecto: Tus Aguacates
Alcance: seguridad, arquitectura, pruebas, operacion y mantenibilidad

## Resumen ejecutivo

La aplicacion muestra una base de producto real y una ambicion tecnica clara: Next.js moderno, Supabase, rutas separadas por dominio, pruebas con Vitest y Playwright, e integraciones externas ya conectadas. No es un proyecto improvisado.

Sin embargo, la madurez actual sigue limitada por varios riesgos de nivel alto y critico en autenticacion, gestion de sesiones, integraciones publicas y disciplina operativa. Mi conclusion profesional es la siguiente:

- Estado funcional: bueno
- Estado de seguridad: deficiente
- Estado de arquitectura: aceptable, pero con deuda acumulada
- Estado de pruebas: intermedio
- Estado de operacion: fragil

Hoy no recomendaria considerar esta version como "production-grade" hasta cerrar los hallazgos criticos de la capa admin y endurecer los endpoints publicos de integracion.

## Metodologia

Revision estatica dirigida sobre archivos clave del proyecto:

- `package.json`
- `.gitignore`
- `next.config.ts`
- `app/api/auth/admin/*`
- `app/api/webhooks/*`
- `app/api/chef-virtual/*`
- `app/api/health/route.ts`
- `lib/auth-admin.ts`
- `lib/gemini-recipe-service.ts`
- `tests/e2e/admin/*`
- `tests/fixtures/admin.ts`
- `playwright.config.ts`
- `vitest.config.ts`

Nota: no se ejecuto la suite completa de tests en esta fase porque el entorno local de shell devolvio multiples timeouts al intentar leer o correr varias operaciones del repositorio. Las conclusiones se basan en evidencia de codigo y configuracion.

## Hallazgos priorizados

### F2-001 - Acceso admin hardcodeado y secreto JWT por defecto

Severidad: Critica

Evidencia:

- `app/api/auth/admin/login/route.ts:47-71`
- `app/api/auth/admin/me/route.ts:29-33`
- `lib/auth-admin.ts:83-99`
- `lib/auth-admin.ts:151-171`
- `tests/fixtures/admin.ts:7-10`

Descripcion:

La autenticacion admin depende de credenciales embebidas en codigo (`admin@tusaguacates.com`, `admin123` y una segunda clave adicional) y ademas usa un valor por defecto para `JWT_SECRET` si la variable no existe. La libreria compartida de auth repite el patron con un admin temporal (`admin-001`) y fallback hardcodeado.

Impacto:

- Riesgo directo de acceso no autorizado al panel administrativo
- Riesgo de emision o validacion de JWT con una clave predecible
- Normalizacion del anti-patron tambien en pruebas automatizadas

Recomendacion:

- Eliminar de inmediato todo fallback de credenciales y secretos por defecto
- Obligar el fail-fast si `JWT_SECRET` o `SUPABASE_SERVICE_ROLE_KEY` no existen
- Migrar la autenticacion admin a validacion exclusiva contra base de datos o proveedor externo
- Rotar cualquier secreto que haya convivido con este esquema

### F2-002 - Endpoint de sesion admin con confianza excesiva y CORS abierto

Severidad: Alta

Evidencia:

- `app/api/auth/admin/me/route.ts:6-11`
- `app/api/auth/admin/me/route.ts:17-64`

Descripcion:

El endpoint `me` acepta `Access-Control-Allow-Origin: *` y considera suficiente un JWT con claim `type=admin`, sin revalidar contra la base de datos el estado real del usuario. Si el token fue emitido con el secreto fallback, la proteccion efectiva cae todavia mas.

Impacto:

- Exposicion innecesaria del endpoint de sesion
- Riesgo de aceptar tokens validos criptograficamente pero no autorizados operacionalmente
- Dificultad para revocar accesos de forma fiable

Recomendacion:

- Restringir CORS a origenes administrativos concretos
- Revalidar el usuario admin en base de datos en cada lectura sensible
- Alinear el comportamiento de `login`, `me` y `verifyAdminAuth` bajo una sola fuente de verdad

### F2-003 - Proxy publico hacia n8n sin autenticacion ni firma

Severidad: Alta

Evidencia:

- `app/api/webhooks/n8n-order-sync/route.ts:3-28`
- `app/api/webhooks/n8n-order-sync/route.ts:37-41`

Descripcion:

La ruta acepta cualquier `POST`, lo reenvia a n8n y devuelve `200` incluso cuando falla. No hay firma, token compartido, allowlist ni validacion estructural fuerte del payload.

Impacto:

- Posibilidad de inyectar eventos falsos hacia automatizaciones
- Spam operativo o consumo innecesario de flujos externos
- Ocultamiento de fallos reales porque la API responde exito aparente

Recomendacion:

- Exigir una firma HMAC o un token server-to-server
- Validar el esquema del payload antes del reenvio
- Responder error cuando falle la integracion, o al menos registrar un incidente observable

### F2-004 - Verificacion de firma en webhook de Bold probablemente incorrecta

Severidad: Alta

Evidencia:

- `app/api/webhooks/bold/route.ts:14-18`
- `app/api/webhooks/bold/route.ts:30-35`

Descripcion:

El comentario del archivo indica HMAC-SHA256, pero la implementacion usa `createHash('sha256')` y concatena `secret + payload`. Eso no equivale a una HMAC estandar y sugiere que la validacion de firmas puede ser incorrecta.

Impacto:

- Riesgo de rechazar webhooks legitimos
- Riesgo de aceptar firmas que no siguen el esquema esperado
- Impacto directo sobre confirmacion de pagos y consistencia de pedidos

Recomendacion:

- Confirmar el esquema oficial de firma de Bold
- Implementar `createHmac('sha256', secret).update(payload).digest(...)` si esa es la especificacion correcta
- Agregar tests unitarios con payload firmado valido e invalido

### F2-005 - Los limites del Chef Virtual no se hacen cumplir antes del consumo

Severidad: Alta

Evidencia:

- `app/api/chef-virtual/generate/route.ts:74-87`
- `app/api/chef-virtual/limits/route.ts:13-30`
- `lib/gemini-recipe-service.ts:208-225`

Descripcion:

Existe una API para consultar limites y un servicio con funciones `getUserRecipeLimits` y `canUserGenerateRecipe`, pero ambas estan sin implementar realmente. La generacion ocurre antes de cualquier chequeo fuerte de cuota.

Impacto:

- Riesgo de consumo ilimitado de la API externa
- Riesgo de costo no controlado
- Inconsistencia entre lo que el frontend cree y lo que el backend realmente aplica

Recomendacion:

- Mover la verificacion de cuota al inicio de `POST /api/chef-virtual/generate`
- Implementar limites reales por usuario y por visitante
- Registrar consumo atomico para evitar carreras o abuso concurrente

### F2-006 - La suite E2E apunta por defecto a produccion y ejecuta CRUD real

Severidad: Alta

Evidencia:

- `playwright.config.ts:20-23`
- `tests/helpers/auth-helpers.ts:43-47`
- `tests/e2e/admin/products/products-crud.spec.ts:134-165`
- `tests/e2e/admin/products/products-crud.spec.ts:214-270`

Descripcion:

Playwright usa por defecto `https://tus-aguacates.vercel.app` como `baseURL`, mientras los tests admin realizan creacion, actualizacion y eliminacion de productos reales. Ademas, el login de pruebas usa las mismas credenciales hardcodeadas del backend.

Impacto:

- Riesgo de mutar datos de produccion al correr pruebas localmente o desde CI mal configurado
- Riesgo de dependencia operacional en credenciales embebidas
- Dificultad para separar calidad de software y actividad productiva real

Recomendacion:

- Cambiar el default a entorno local o staging
- Hacer obligatorio `BASE_URL` en E2E fuera de local
- Separar credenciales de testing de las credenciales operativas

### F2-007 - Endpoint de health expone postura del entorno

Severidad: Media

Evidencia:

- `app/api/health/route.ts:3-17`

Descripcion:

El healthcheck publica si existen `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, el `NODE_ENV` y una marca fija de despliegue.

Impacto:

- Filtracion de metadata util para reconocimiento
- Poco valor para usuarios externos

Recomendacion:

- Reducir el healthcheck a estado minimo (`ok`, timestamp, version)
- Reservar informacion operacional ampliada para endpoints internos o protegidos

### F2-008 - Configuracion de frontend avanzada pero fragil

Severidad: Media

Evidencia:

- `next.config.ts:60-65`
- `next.config.ts:91-124`
- `package.json`

Descripcion:

La configuracion mezcla optimizaciones experimentales, reglas de Turbopack y customizacion de Webpack. Ademas, se referencia `@svgr/webpack` sin evidencia clara de declaracion en dependencias inspeccionadas.

Impacto:

- Riesgo de builds inconsistentes entre local, CI y produccion
- Mayor costo de mantenimiento al migrar versiones de Next.js

Recomendacion:

- Simplificar configuracion a un solo camino de build
- Declarar explicitamente toda dependencia usada por loaders
- Agregar smoke build en CI

## Fortalezas detectadas

- Stack actual y vigente: Next.js 16, React 19, Supabase, Vitest, Playwright
- Existe estructura real de pruebas por capas (`unit`, `integration`, `e2e`, `smoke`)
- `.gitignore` protege correctamente los archivos `.env*`
- La aplicacion ya esta organizada por dominios funcionales y no como un solo archivo monolitico
- Hay intencion de observabilidad y documentacion, lo cual acelera remediacion si se ordena bien

## Evaluacion por dominio

### Seguridad

Madurez estimada: 2.5/10

Comentario:

La mayor debilidad del proyecto hoy esta aqui. El panel admin y ciertas integraciones publicas tienen atajos que comprometen confianza operativa.

### Arquitectura

Madurez estimada: 6/10

Comentario:

La separacion por carpetas y dominios existe, pero varias capas mezclan responsabilidades y acumulan deuda temporal que ya deberia haberse retirado.

### Pruebas

Madurez estimada: 5/10

Comentario:

Hay cantidad y estructura, pero falta asegurar que las pruebas validen restricciones de seguridad y no dependan de produccion ni de credenciales embebidas.

### Operacion y mantenibilidad

Madurez estimada: 4/10

Comentario:

El proyecto carga demasiados artefactos operativos, scripts auxiliares, reportes y rutas especiales. Eso complica la gobernanza y hace mas dificil diferenciar lo esencial de lo temporal.

## Plan de remediacion recomendado

### En las proximas 24 horas

1. Eliminar credenciales hardcodeadas y secretos JWT por defecto
2. Desactivar o proteger rutas administrativas con fallback temporal
3. Bloquear el proxy publico a n8n hasta que tenga autenticacion server-to-server
4. Cambiar Playwright para que nunca apunte a produccion por defecto

### En la proxima semana

1. Unificar el flujo de autenticacion admin en una sola implementacion
2. Corregir la validacion criptografica del webhook de Bold
3. Implementar enforcement real de cuotas para Chef Virtual
4. Endurecer healthcheck y rutas de diagnostico o prueba
5. Agregar pruebas unitarias de seguridad para auth y webhooks

### En los proximos 30 dias

1. Separar claramente codigo de producto, scripts operativos y reportes
2. Crear politica de entornos: local, staging, produccion
3. Agregar CI con build, tests y chequeos minimos de seguridad
4. Reducir duplicacion entre rutas admin, helpers y librerias de auth

## Riesgos residuales y notas

- No se revisaron todas las rutas API una por una; el riesgo real total puede ser mayor
- La superficie operativa del repositorio es amplia y contiene muchos artefactos auxiliares fuera de la app principal
- Esta auditoria no corrige el codigo; documenta el estado y prioriza las siguientes acciones

## Recomendacion final

La prioridad correcta no es agregar mas funcionalidades ahora mismo. La prioridad correcta es cerrar seguridad admin, sanear integraciones publicas y volver confiable el entorno de pruebas. Si se hace eso primero, el proyecto queda mucho mejor posicionado para crecer sin arrastrar deuda critica.
