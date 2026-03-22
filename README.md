# Tus Aguacates

Aplicación ecommerce construida con Next.js, Supabase y un conjunto de automatizaciones operativas para catálogo, pagos, WhatsApp y administración.

## Mapa rápido del repositorio

- `app/`: rutas, páginas y endpoints del producto
- `components/`: UI reutilizable
- `lib/`: lógica compartida, stores y utilidades
- `tests/`: unit, integration, smoke y e2e
- `scripts/`: utilidades operativas y de mantenimiento
- `supabase/`: funciones y assets asociados a backend/serverless
- `docs/`: documentación técnica y operativa viva

## Arranque local

1. Usar Node `20` (`.nvmrc`).
2. Copiar `.env.example` a `.env.local`.
3. Instalar dependencias con `npm ci`.
4. Levantar la app con `npm run dev`.

## Comandos oficiales

- `npm run dev`: desarrollo local
- `npm run lint`: lint del repo
- `npm run typecheck`: validación TypeScript
- `npm run test:critical`: baseline rápida de checkout/carrito
- `npm run test:run`: suite Vitest completa
- `npm run test:e2e`: suite Playwright
- `npm run build`: build de producción
- `npm run validate`: gate mínimo local antes de merge
- `npm run validate:ci`: gate completo pensado para CI
- `npm run lint`: diagnóstico visible de deuda de estilo/tipos no bloqueante por ahora

## Entornos

- Desarrollo local: `.env.local`
- Referencia contractual de variables: `.env.example`
- CI: variables inyectadas por GitHub Actions
- Producción: variables configuradas en Vercel y Supabase

Toda variable nueva debe registrarse en `.env.example`.

## Calidad y mantenibilidad

- La base mínima actual de calidad está documentada en `docs/maintainability-baseline.md`.
- Los scripts del proyecto se clasifican en `scripts/README.md`.
- Los cambios que afecten checkout, autenticación, catálogo o administración deben dejar al menos una prueba pequeña y reproducible.
- `lint` queda disponible como radar de deuda, pero el gate obligatorio actual es `validate` hasta reducir el backlog heredado.
