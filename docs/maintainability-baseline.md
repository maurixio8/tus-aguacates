# Maintainability Baseline

Fecha de corte: 2026-03-15

## Diagnóstico corto

El producto vive en este repositorio, pero la base todavía carga varias señales de crecimiento desordenado:

- el `README.md` no describe la arquitectura real ni el flujo operativo
- había validación de TypeScript, pero no un contrato explícito de `typecheck`, `validate` y `validate:ci`
- la configuración de CI/CD no estaba alineada con un gate rápido y seguro
- la carpeta `scripts/` no tenía reglas para distinguir automatización permanente de utilidades puntuales
- existe deuda visible en pruebas: la suite completa es amplia, pero hoy no es un gate confiable para CI

## Riesgos principales

- Ambigüedad operativa: una persona nueva no sabe cuál es la ruta oficial para correr, validar y desplegar.
- Scripts sin gobernanza: alta probabilidad de ejecutar utilidades de datos sin contexto suficiente.
- CI frágil: un pipeline sin baseline claro termina siendo ignorado o desactivado.
- Deuda oculta: hay tests existentes que fallan o tardan demasiado, pero eso no estaba convertido en señal explícita para el equipo.

## Cambios aplicados

- Se agregó `eslint.config.mjs` para que `npm run lint` tenga una configuración reproducible.
- Se agregaron scripts de calidad en `package.json`: `typecheck`, `validate`, `validate:ci` y `test:critical`.
- Se incorporó una prueba mínima estable para la lógica de carrito/checkout en `tests/unit/cart-store-baseline.test.ts`.
- Se agregó `.nvmrc` para alinear Node local con CI.
- Se actualizó la guía de scripts en `scripts/README.md`.
- Se reemplazó el README genérico por documentación del proyecto.
- Se ajustó el workflow de CI/CD para usar gates más claros y trabajar sobre el repo correcto.
- Se dejó `lint` como señal explícita de deuda, pero fuera del gate obligatorio mientras se reduce el backlog histórico.

## Deuda técnica visible

### Alta prioridad

- `tests/unit/shipping-calculation.test.ts` falla contra el comportamiento actual y no puede ser gate de CI todavía.
- La suite `vitest run` completa no está acotada para feedback rápido.
- El build local no quedó verificado de punta a punta en esta intervención porque excedió el tiempo de ejecución disponible.

### Prioridad media

- `scripts/` mezcla migraciones, diagnósticos y mantenimiento sin subcarpetas temáticas.
- Hay archivos de entorno locales versionados en el workspace operativo; conviene revisar cuáles deben existir y cuáles no.
- Falta una decisión explícita sobre la convivencia entre repo productivo y workspace exterior con artefactos/auditorías.

### Prioridad baja

- Nombres y comentarios de tests son heterogéneos.
- Parte de la documentación operativa sigue viviendo en documentos sueltos en vez de una estructura consolidada.

## Plan de limpieza por prioridad

## P0

- Mantener `npm run validate` como puerta mínima antes de merge.
- Corregir o retirar del gate los tests con expectativas obsoletas.
- Ejecutar y estabilizar `npm run build` en CI con variables de entorno controladas.
- Reducir el backlog de lint por dominios, empezando por `app/admin` y `tests/`.

## P1

- Separar `scripts/` en `scripts/ops`, `scripts/migrations` y `scripts/archive`.
- Consolidar documentación técnica en `docs/` con un índice corto.
- Definir owners para áreas críticas: checkout, admin y datos.

## P2

- Reducir el volumen de documentación suelta y mover entregables históricos a un archivo o workspace aparte.
- Revisar suites E2E para quedarnos con smoke tests de negocio y no con pruebas largas de difícil mantenimiento.

## Estándares mínimos propuestos

- Node fijo por `.nvmrc` y misma versión en CI.
- Todo cambio mergeable debe pasar `npm run validate`.
- Toda lógica crítica nueva debe traer al menos una prueba unitaria o de integración pequeña.
- Scripts que toquen datos deben documentar objetivo, riesgo y rollback.
- Toda variable de entorno nueva debe agregarse a `.env.example`.
- Ningún workflow debe depender de defaults implícitos del root si el producto vive en otro lugar.
- `npm run lint` debe tender a cero, pero mientras exista backlog heredado se usa como métrica visible, no como bloqueo binario.
