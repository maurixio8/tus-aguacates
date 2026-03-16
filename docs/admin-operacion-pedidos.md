# Operacion Admin Pedidos

## 1. Mapa de flujos operativos

### Pedido de cliente registrado
1. Cliente autenticado crea pedido desde storefront.
2. El backend guarda la orden en `orders` y los items en `order_items`.
3. Admin consulta `/admin/pedidos`, donde la API unifica cliente, items, estado y pago.
4. Operacion confirma, prepara, despacha y entrega desde el panel.

### Pedido de cliente invitado
1. Cliente sin cuenta crea pedido.
2. El backend guarda la orden en `guest_orders` y los items dentro de `order_data.items`.
3. Admin consulta `/admin/pedidos`, donde la API mapea `guest_orders` al mismo contrato visual del panel.
4. Si el cliente luego se registra, existe un flujo de migracion hacia `orders`.

### Pedido creado manualmente desde dashboard
1. Operacion crea el pedido en `/admin/crear-pedido`.
2. El backend lo guarda en `orders` con `user_id = null`.
3. Operativamente se trata como `admin_manual`, aunque persista en la misma tabla de `orders`.
4. Desde `/admin/pedidos` se edita, cambia de estado y se usa para despacho/atencion.

### Lista de compras y despacho
1. El panel consolida items desde `order_items` o `order_data.items`.
2. Se muestra variante, cantidad, subtotal y resumen financiero.
3. Despacho usa direccion, telefono, notas y total para ejecutar entrega.

## 2. Inconsistencias detectadas

- El sistema ya diferenciaba `registered`, `guest` y `admin_manual` en backend, pero la UI solo tipaba dos orígenes.
- Habia estados y pagos en ingles y espanol sin una normalizacion compartida, lo que podia romper filtros, badges o conteos.
- En creacion manual se mezclaba la nota operativa de entrega con el cobro del domicilio dentro de `delivery_notes`.
- Al editar pedidos normales, el backend recalculaba total pero no persistia `shipping_fee`, dejando diferencias entre backend y UI.
- La normalizacion de pedidos en `/api/admin/orders` tenia codigo duplicado e inalcanzable, lo que hacia mas ambiguo el contrato real.
- Los pedidos sin nombre, telefono, direccion o items no quedaban marcados de forma visible para operacion.

## 3. Cambios funcionales aplicados

- Se creo `lib/orders/operational.ts` como contrato compartido para:
  - normalizar estados de pedido
  - normalizar estados de pago
  - etiquetar origen operativo
  - marcar alertas operativas basicas
- `/api/admin/orders` ahora:
  - normaliza estados y pagos antes de entregar datos al admin
  - expone alertas operativas por pedido
  - conserva `delivery_notes` de invitados cuando existe en `order_data`
  - acepta `shipping_fee` explicito en pedidos manuales
  - persiste `shipping_fee` cuando se editan pedidos de `orders`
- `/api/admin/orders/stats` usa la misma normalizacion de estados para evitar conteos inconsistentes.
- `/admin/crear-pedido` separa las notas de entrega del cobro del domicilio.
- `/admin/pedidos` ahora muestra mejor el origen del pedido y alerta cuando faltan datos operativos clave.

## 4. Recomendaciones para fase siguiente

- Persistir una bitacora de cambios por pedido: estado anterior, estado nuevo, usuario admin y timestamp.
- Separar formalmente `delivery_notes`, `internal_notes` y `shipping_fee` en todo el dominio, incluidos invitados.
- Unificar edicion de pedidos invitados y registrados para que ambos persistan notas y resumen financiero con el mismo esquema.
- Agregar pruebas de contrato para el admin:
  - pedido registrado
  - invitado
  - manual
  - con variantes
  - con edicion posterior
- Mostrar en el panel un bloque de “listo para despacho” que valide nombre, telefono, direccion, items y total antes de despachar.
