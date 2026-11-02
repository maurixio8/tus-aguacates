# Corrección integral del dashboard administrativo

Objetivo: hacer que el dashboard sea consistente para operar pedidos y auditar WhatsApp.

Fases:
1. Corregir Reportes: alinear tipos API/UI, errores visibles y pruebas.
2. Extraer un agregador compartido de conteos/estados para Pedidos, Revisor y Reportes.
3. Agregar búsqueda textual server-side/client-side con paginación segura en Pedidos.
4. Añadir cola operativa visible, sin mutar pedidos: pendientes, próxima ruta, sin pin, ambiguos y fuera de cobertura.
5. Mejorar Clientes con reconciliación no destructiva, duplicados visibles y fuente explicada.
6. Enlazar Auditoría WhatsApp con cliente/pedido y estados de revisión, manteniendo aprobación manual.
7. Ejecutar pruebas, build, revisión, despliegue y verificación autenticada.

Restricciones:
- No tocar workflows n8n, Luz v4, puente ni producción crítica.
- No modificar datos históricos de clientes/pedidos salvo una acción explícita ya autorizada.
- No enviar mensajes reales; WhatsApp solo como draft/manual.
- Mantener teléfonos enmascarados en reportes.
- Verificar cada escritura y cada despliegue.
