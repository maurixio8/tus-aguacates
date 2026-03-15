# Remediacion Fase 2

Fecha: 2026-03-15
Proyecto: Tus Aguacates

## Objetivo

Aplicar correcciones sobre los hallazgos criticos y altos identificados en la auditoria de fase 2, priorizando autenticacion admin, endurecimiento de endpoints publicos, proteccion de pruebas y control de consumo del modulo de Chef Virtual.

## Cambios aplicados

### 1. Autenticacion admin centralizada y sin backdoors

Archivos clave:

- `lib/auth-admin.ts`
- `app/api/auth/admin/login/route.ts`
- `app/api/auth/admin/me/route.ts`
- `app/api/auth/admin-login/route.ts`
- `app/api/auth/admin-signin/route.ts`
- `app/api/admin-auth/route.ts`

Resultado:

- Se eliminaron credenciales hardcodeadas
- Se elimino el uso de secretos JWT por defecto
- Se eliminaron usuarios temporales tipo `admin-001`
- La validacion admin ahora depende de `admin_users` activa y del `JWT_SECRET` real
- Se dejaron rutas legacy como alias hacia el flujo canonico seguro

### 2. Rutas admin unificadas sobre validacion central

Archivos clave:

- `app/api/admin/categories/route.ts`
- `app/api/admin/coupons/route.ts`
- `app/api/admin/coupons/[id]/route.ts`
- `app/api/admin/metrics/route.ts`
- `app/api/admin/orders/route.ts`
- `app/api/admin/products/route.ts`
- `app/api/admin/products/[id]/route.ts`
- `app/api/admin/recipe-categories/route.ts`
- `app/api/admin/reports/route.ts`
- `app/api/admin/variants/[id]/route.ts`

Resultado:

- Se removieron helpers duplicados de auth
- Se removieron bypasses por `same-origin`
- Se removieron verificaciones locales con `JWT_SECRET` fallback
- Las rutas admin ahora consumen una sola fuente de verdad para autenticacion

### 3. Endpoints publicos endurecidos

Archivos clave:

- `app/api/webhooks/n8n-order-sync/route.ts`
- `app/api/webhooks/bold/route.ts`
- `app/api/health/route.ts`
- `app/api/test-connection/route.ts`

Resultado:

- El proxy a n8n ahora exige origen confiable, payload JSON valido y deja de devolver exito falso en fallos
- La firma de Bold se valida con HMAC real en vez de hash manual
- `health` ahora expone solo estado minimo
- `test-connection` deja de revelar metadata sensible en produccion

### 4. Cuotas del Chef Virtual aplicadas en backend

Archivo clave:

- `app/api/chef-virtual/generate/route.ts`

Resultado:

- Se agrego enforcement diario para usuarios autenticados
- Se agrego un limite basico diario para visitantes
- La cuota se valida antes de consumir el servicio externo

### 5. Pruebas endurecidas para no tocar produccion por defecto

Archivos clave:

- `playwright.config.ts`
- `tests/fixtures/admin.ts`
- `tests/helpers/auth-helpers.ts`
- `tests/e2e/admin-b2b-panel.spec.ts`
- `app/admin/login/page.tsx`
- `app/admin/layout.tsx`

Resultado:

- Playwright ya no apunta a produccion por defecto
- Se exige `ALLOW_E2E_AGAINST_PRODUCTION=true` para forzar ese comportamiento
- Las credenciales E2E salen de variables de entorno
- Se eliminaron ayudas visuales con credenciales sensibles en la UI
- Se corrigio la ruta de logout del layout admin

## Verificacion ejecutada

Chequeo realizado:

- `npx tsc -p tsconfig.json --noEmit --pretty false --incremental false`

Resultado:

- Exitoso

## Riesgos residuales

### 1. Estado real de la base de datos

Aunque el codigo ya no usa credenciales hardcodeadas, si la tabla `admin_users` en Supabase todavia conserva una contraseña debil o heredada, eso debe rotarse manualmente.

### 2. Migraciones historicas

Los scripts historicos siguen reflejando una semilla inicial de admin a nivel de hash. Se limpiaron referencias textuales sensibles, pero no se asumio una reescritura agresiva de migraciones historicas ya aplicadas.

### 3. Control de cuota para visitantes

El limite diario para visitantes en Chef Virtual se implemento en memoria del proceso. Es una mejora real para contener abuso, pero no reemplaza una solucion distribuida o persistente.

## Siguiente recomendacion

La siguiente fase deberia enfocarse en dos frentes:

1. Rotacion real de credenciales admin y revison de `admin_users` en Supabase
2. CI de seguridad minima con build, chequeo de tipos y validaciones para impedir que reaparezcan fallbacks o credenciales embebidas
