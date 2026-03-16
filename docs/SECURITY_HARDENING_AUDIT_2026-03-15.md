# Security Hardening Audit - 2026-03-15

## Scope

Auditoria e implementación de endurecimiento operativo para Next.js + Supabase + panel administrativo.

Focos revisados:

- autenticacion admin
- autorizacion por roles
- sesiones y cookies
- endpoints publicos sensibles
- secretos embebidos
- uso de service role
- CORS
- reset de contrasena
- webhooks y firmas
- endpoints de health y diagnostico

## 1. Hallazgos priorizados

### Criticos

1. Rutas administrativas B2B y varias rutas admin sin autenticacion efectiva.
   - Impacto: lectura y mutacion de datos administrativos sin exigir sesion admin valida.
   - Ejemplos afectados antes del parche: `app/api/admin/b2b/*`, `app/api/admin/customers/route.ts`, `app/api/admin/orders/stats/route.ts`, `app/api/admin/orders/diagnose/route.ts`, `app/api/admin/upload-image/route.ts`, `app/api/admin/convert-image/route.ts`, `app/api/admin/migrate-variants/route.ts`.

2. CORS admin confiaba implicitamente en el `Origin` del request.
   - Impacto: cualquier origen enviado por el cliente podia ser ecoado como permitido en flujos admin.
   - Archivo base: `lib/auth-admin.ts`.

3. Operaciones administrativas con fallback a `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Impacto: configuraciones parciales o degradadas permitian comportamiento inseguro e inconsistente en rutas privilegiadas.
   - Archivos corregidos: `app/api/admin/products/route.ts`, `app/api/admin/products/[id]/route.ts`, `app/api/admin/categories/route.ts`, `app/api/admin/recipe-categories/route.ts`, `app/api/admin/upload-image/route.ts`, `app/api/admin/migrate-variants/route.ts`.

### Altos

4. Endpoints administrativos sensibles protegidos solo por `Referer`.
   - Impacto: bypass trivial desde clientes no confiables.
   - Corregidos: `app/api/admin/upload-image/route.ts`, `app/api/admin/migrate-variants/route.ts`, `app/api/admin/convert-image/route.ts`.

5. Cookie admin con politica menos estricta de la necesaria y logout incompleto.
   - Impacto: superficie CSRF/same-site mayor de la necesaria y limpieza parcial de cookies.
   - Archivo: `lib/auth-admin.ts`, `app/api/auth/admin/logout/route.ts`.

6. Secreto/tokens incrustados en archivos versionados de soporte.
   - Impacto: exposicion operativa y necesidad de rotacion.
   - Corregidos en codigo versionado: `package.json`, `debug-wishlist-404.js`.

### Medios

7. Endpoint de diagnostico administrativo exponia demasiada superficie operativa.
   - Impacto: telemetria de configuracion y capacidad de insertar datos de prueba.
   - Mitigacion aplicada: acceso restringido a `super_admin`.

8. Existen secretos reales en archivos locales `.env*` presentes en el workspace.
   - Impacto: riesgo operativo local y posible rotacion pendiente.
   - Estado: requiere accion humana/operativa; no se alteraron para no romper despliegues activos locales.

9. `app/api/webhooks/bold/route.ts` ya verifica firma, pero la ruta `GET` sigue publicada como endpoint de presencia.
   - Impacto: bajo; recomendable reducir aun mas la respuesta publica si no se usa para verificacion externa.

## 2. Cambios aplicados

### Auth, roles, cookies y CORS

- Se agrego `requireAdminRole()` en `lib/auth-admin.ts` para reutilizar autenticacion y autorizacion por rol.
- Se elimino el echo inseguro del `Origin` entrante en CORS admin.
- Se agrego `Vary: Origin` a respuestas CORS admin.
- La cookie `admin-token` paso a `SameSite=Strict`.
- El logout ahora expira tanto `admin-token` como `admin_token` usando las mismas opciones de cookie del request.

### Endpoints admin blindados

- Se exigio auth/rol en todas las rutas bajo `app/api/admin` que carecian de guardas consistentes.
- Se aplico modelo de permisos:
  - `viewer` para lecturas de admin/B2B/metricas/reportes.
  - `admin` para cambios operativos normales.
  - `super_admin` para borrados, diagnosticos y migraciones/manual maintenance.

### Service role

- Se elimino el fallback a `ANON_KEY` en rutas administrativas con privilegios.
- Las rutas admin ahora fallaran de forma explicita si `SUPABASE_SERVICE_ROLE_KEY` no esta configurada.

### Secretos embebidos

- Se removio el token embebido de deploy en `package.json`.
- Se removio el fallback hardcoded de anon key en `debug-wishlist-404.js`.

## 3. Riesgos residuales

1. Rotacion pendiente de secretos expuestos localmente.
   - Accion requerida: rotar `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, tokens de despliegue y cualquier secreto exportado a `.env*` o proveedores.

2. Error de TypeScript preexistente fuera del parche de seguridad.
   - Archivo reportado por `npx tsc --noEmit`: `app/admin/pedidos/page.tsx`
   - Error: incompatibilidad de tipo `order_type` entre dos tipos `Order`.
   - No bloquea el analisis de seguridad, pero impide un typecheck limpio global.

3. Hay archivos modificados por trabajo previo/no relacionado en el workspace.
   - No fueron revertidos.
   - Revisar antes de commit/deploy para separar cambios funcionales de cambios de seguridad.

4. Las variables `ADMIN_ALLOWED_ORIGINS`, `JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` y `BOLD_SIGNING_SECRET` deben validarse en produccion.

## 4. Validacion post-deploy

### Checklist funcional y de seguridad

- [ ] Login admin exitoso desde origen permitido.
- [ ] Login admin rechazado desde origen no permitido.
- [ ] `GET /api/auth/admin/me` devuelve 401 sin cookie y 200 con cookie valida.
- [ ] Usuario `viewer` puede consultar metricas/listados pero no mutar ni borrar.
- [ ] Usuario `admin` puede mutar datos operativos pero no ejecutar deletes criticos ni diagnosticos `super_admin`.
- [ ] Usuario `super_admin` puede acceder a diagnosticos y eliminaciones criticas.
- [ ] `POST /api/admin/upload-image` falla sin cookie admin valida.
- [ ] `POST /api/admin/convert-image` falla sin cookie admin valida.
- [ ] `POST /api/admin/migrate-variants` y `GET /api/admin/orders/diagnose` fallan para roles menores a `super_admin`.
- [ ] `POST /api/webhooks/bold` rechaza payload sin firma o con firma invalida.
- [ ] `GET /api/test-connection` responde 404 en produccion.
- [ ] `GET /api/health` sigue respondiendo solo estado minimo.

### Chequeos reproducibles

1. Verificar typecheck global:
   - `npx tsc --noEmit`
   - Resultado actual esperado: falla por un error preexistente en `app/admin/pedidos/page.tsx`.

2. Confirmar que no quedaron rutas admin sin guardas:
   - buscar `app/api/admin/**/*.ts` y validar uso de `verifyAdminAuth` o `requireAdminRole`.

3. Confirmar que no quedan fallbacks a `NEXT_PUBLIC_SUPABASE_ANON_KEY` en admin:
   - buscar `app/api/admin` por `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

4. Confirmar que no quedan controles por `Referer` en admin:
   - buscar `app/api/admin` por `referer`.

## Files touched by this hardening pass

- `lib/auth-admin.ts`
- `app/api/auth/admin/logout/route.ts`
- `app/api/admin/upload-image/route.ts`
- `app/api/admin/convert-image/route.ts`
- `app/api/admin/migrate-variants/route.ts`
- `app/api/admin/customers/route.ts`
- `app/api/admin/orders/stats/route.ts`
- `app/api/admin/orders/diagnose/route.ts`
- `app/api/admin/orders/[id]/route.ts`
- `app/api/admin/products/route.ts`
- `app/api/admin/products/[id]/route.ts`
- `app/api/admin/categories/route.ts`
- `app/api/admin/recipe-categories/route.ts`
- `app/api/admin/b2b/banner-messages/route.ts`
- `app/api/admin/b2b/categories/route.ts`
- `app/api/admin/b2b/companies/route.ts`
- `app/api/admin/b2b/companies/[id]/route.ts`
- `app/api/admin/b2b/coupons/route.ts`
- `app/api/admin/b2b/metrics/route.ts`
- `app/api/admin/b2b/orders/route.ts`
- `app/api/admin/b2b/orders/[id]/route.ts`
- `app/api/admin/b2b/products/route.ts`
- `app/api/admin/b2b/reports/route.ts`
- `app/api/admin/b2b/slides/route.ts`
- `package.json`
- `debug-wishlist-404.js`
