# Scripts del proyecto

Esta carpeta mezcla automatizaciones permanentes, utilidades operativas y scripts puntuales de datos. Para evitar que siga creciendo sin criterio, se adopta esta clasificación:

## Permanentes

Mantener como comandos versionados del proyecto. Deben tener nombre estable, ser idempotentes cuando aplique y estar referenciados desde `package.json` o desde documentación operativa.

Ejemplos actuales:

- `analyze-bundle.js`
- `update-image-cache.js`
- `validate-whatsapp-config.js`
- `verify-ci-cd-setup.js`

## Operativos

Se usan bajo demanda por alguien del equipo para mantenimiento, migraciones o soporte. Deben documentar precondiciones, impacto y rollback antes de ejecutarse en producción.

Ejemplos actuales:

- `run-migration.js`
- `run-payment-migration.js`
- `reset-admin-password.js`
- `deploy-whatsapp.js`

## Temporales o experimentales

Si un script solo sirve para una investigación, un fix único o una carga puntual, no debe quedarse indefinidamente como si fuera parte del producto. La regla es:

1. moverlo a una carpeta de archivo fuera del flujo normal, o
2. eliminarlo después de documentar el resultado.

Señales de alerta:

- nombres con `debug`, `fix`, `test-insert`, `investigate`, `migrate-*` sin contexto
- scripts `.sql` sin README asociado
- múltiples variantes que hacen casi lo mismo

## Convención mínima

- Agregar al inicio propósito, inputs, riesgos y si es reversible.
- Evitar nombres ambiguos como `run.js`, `debug.js` o `fix-final.js`.
- Si el script toca datos productivos, registrar también el comando exacto en una guía de operación.
- Si un script deja de usarse, archivarlo o borrarlo en la misma tarea que lo reemplaza.
