# Agent API privada para IA

## 1. Objetivo

Este documento define la API privada que permitira a agentes de IA consultar datos de la tienda sin acceder directamente a la base de datos ni reutilizar endpoints de admin.

La meta de esta API es:

- exponer solo lectura en la fase inicial
- entregar respuestas pequenas, estables y faciles de consumir desde n8n
- separar permisos de agente cliente vs agente interno
- reutilizar la logica y modelos que ya existen en la tienda

Estado actual:

- `GET /api/agent/products` ya esta implementado
- `GET /api/agent/orders/active` ya esta implementado
- los demas endpoints de esta especificacion siguen en plan de construccion

## 2. Contexto actual del proyecto

Hoy el proyecto ya tiene estas piezas:

- `app/api/chat/route.ts` envia el chat web a n8n por medio de `N8N_CHAT_WEBHOOK_URL`
- `docs/n8n_integration_guide.md` documenta el contrato web -> n8n
- `app/api/admin/products/route.ts` y `app/api/admin/orders/route.ts` exponen datos operativos protegidos por auth admin
- `app/api/b2b/products/route.ts` y `app/api/b2b/orders/route.ts` exponen datos B2B usando `SUPABASE_SERVICE_ROLE_KEY`
- el workflow real `nuevo asistente` usa tools de datos como `TOOL_BuscarProductos`, `TOOL_ObtenerVariantes` y `TOOL_ConsultarEstadoPedido`

Hoy el agente consulta datos mediante SQL directo dentro de n8n. La Agent API busca reemplazar gradualmente esas consultas por llamadas HTTP controladas.

## 3. Alcance de la v1

La v1 debe ser solo lectura y cubrir estos casos:

1. buscar productos por termino
2. consultar variantes o presentaciones de un producto
3. consultar resumen de pedidos del dia para uso interno

La consulta de estado de pedido por cliente queda documentada como fase posterior porque hoy la fuente de verdad esta repartida entre datos de tienda y flujos conversacionales.

## 4. Arquitectura propuesta

Flujo objetivo:

```text
WhatsApp o Web Chat
  -> n8n / Agente Luz
  -> GET /api/agent/*
  -> Supabase
  -> n8n transforma la respuesta
  -> cliente o equipo interno
```

Principios:

- n8n sigue siendo el cerebro conversacional
- la Agent API solo entrega datos
- el modelo no toca SQL directo
- no se reutilizan endpoints admin como integracion externa

## 5. Autenticacion y permisos

La Agent API usara autenticacion por header:

```http
x-agent-key: <secret>
```

Llaves propuestas:

- `AGENT_CUSTOMER_API_KEY`: para agente que conversa con clientes
- `AGENT_OPS_API_KEY`: para agente interno, copiloto o automatizaciones operativas

Scopes propuestos:

| Key | Scope | Uso |
| --- | --- | --- |
| `AGENT_CUSTOMER_API_KEY` | `catalog:read`, `variants:read` | Buscar productos y presentaciones |
| `AGENT_OPS_API_KEY` | `catalog:read`, `variants:read`, `orders:read` | Operaciones internas y resumen diario |

Reglas:

- nunca exponer estas llaves al frontend
- guardar llaves solo en Vercel y en credenciales seguras de n8n
- rechazar cualquier request sin llave valida
- registrar acceso por endpoint, origen y resultado

## 6. Reglas de seguridad

- solo lectura en v1
- respuestas con minimizacion de datos
- no devolver datos sensibles innecesarios
- aplicar rate limit por llave
- tiempos de respuesta cortos y consistentes
- errores con codigos estables

No se debe exponer:

- `SUPABASE_SERVICE_ROLE_KEY`
- tokens admin
- datos completos de clientes para un agente conversacional
- endpoints de escritura en la misma llave del bot de clientes

## 7. Contrato general de respuestas

Respuesta exitosa:

```json
{
  "success": true,
  "data": []
}
```

Respuesta con error:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid agent key"
  }
}
```

Codigos de error esperados:

- `UNAUTHORIZED`
- `FORBIDDEN`
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

## 8. Endpoints v1

### 8.1 `GET /api/agent/products`

Estado: implementado

Uso:

- buscar productos por nombre, descripcion o SKU
- alimentar respuestas del agente cuando el cliente pregunta por disponibilidad o precio

Query params propuestos:

- `search`: termino de busqueda
- `limit`: numero maximo de resultados, default `5`, maximo `20`
- `active_only`: `true` por defecto

Ejemplo:

```http
GET /api/agent/products?search=aguacate%20hass&limit=5
x-agent-key: <AGENT_CUSTOMER_API_KEY o AGENT_OPS_API_KEY>
```

Respuesta:

```json
{
  "success": true,
  "data": [
    {
      "id": "prod_123",
      "name": "Aguacate Hass",
      "sku": "HASS-001",
      "price": 5500,
      "discount_price": 5000,
      "stock": 42,
      "unit": "kg",
      "is_active": true,
      "category": {
        "id": "cat_1",
        "name": "Aguacates"
      },
      "image": "https://cdn.example.com/hass.jpg",
      "description": "Aguacate hass premium",
      "has_variants": true
    }
  ],
  "meta": {
    "query": "aguacate hass",
    "count": 1
  }
}
```

Notas de implementacion:

- puede reutilizar logica de `app/api/admin/products/route.ts`
- debe devolver una forma mas pequena que la respuesta admin
- no debe incluir relaciones o campos internos innecesarios

### 8.2 `GET /api/agent/products/:id/variants`

Estado: planificado

Uso:

- consultar presentaciones, pesos o precios por variante
- alimentar la tool que hoy hace el trabajo de `TOOL_ObtenerVariantes`

Ejemplo:

```http
GET /api/agent/products/prod_123/variants
x-agent-key: <AGENT_CUSTOMER_API_KEY>
```

Respuesta:

```json
{
  "success": true,
  "product": {
    "id": "prod_123",
    "name": "Aguacate Hass"
  },
  "variants": [
    {
      "id": "var_1",
      "variant_name": "peso",
      "variant_value": "500g",
      "price": 6500,
      "stock_quantity": 18,
      "is_active": true
    },
    {
      "id": "var_2",
      "variant_name": "peso",
      "variant_value": "1kg",
      "price": 12000,
      "stock_quantity": 9,
      "is_active": true
    }
  ]
}
```

Notas de implementacion:

- puede reutilizar el shape de variantes usado por `app/api/admin/products/route.ts`
- debe devolver solo variantes activas por defecto

### 8.3 `GET /api/agent/orders/active`

Estado: implementado

Uso:

- consultar si un cliente tiene un pedido retail activo por telefono
- priorizar el pedido activo mas reciente para usarlo desde n8n o desde el agente conversacional

Query params soportados:

- `phone`: telefono del cliente, obligatorio

Estados considerados como pedido activo:

- `pending`
- `confirmed`
- `processing`
- `shipped`

Origenes consultados:

- tabla `orders` para `registered` y `admin_manual`
- tabla `guest_orders` para `guest`

La respuesta devuelve el pedido normalizado con `order_type`.

Ejemplo:

```http
GET /api/agent/orders/active?phone=573001112233
x-agent-key: <AGENT_CUSTOMER_API_KEY o AGENT_OPS_API_KEY>
```

Respuesta con pedido activo:

```json
{
  "success": true,
  "data": {
    "has_active_order": true,
    "active_orders_count": 1,
    "phone_masked": "***2233",
    "active_statuses": ["pending", "confirmed", "processing", "shipped"],
    "order": {
      "id": "ord_1",
      "order_number": "TA-10045",
      "order_type": "registered",
      "customer_name": "Ana Maria",
      "customer_phone": "573001112233",
      "status": "processing",
      "payment_status": "paid",
      "payment_method": "efectivo",
      "is_paid": true,
      "subtotal": 61500,
      "shipping_fee": 7400,
      "shipping_fee_calculated": true,
      "total": 68900,
      "total_amount": 68900,
      "delivery_address": "Cra 12 # 34-56, Bogota",
      "delivery_notes": "Porteria 2",
      "created_at": "2026-03-28T10:15:00.000Z",
      "updated_at": "2026-03-28T10:30:00.000Z",
      "items_count": 1,
      "order_items": [
        {
          "product_id": "prod_1",
          "variant_id": null,
          "product_name": "Aguacate Hass",
          "variant_name": "1kg",
          "quantity": 1,
          "unit_price": 12000,
          "subtotal": 12000
        }
      ],
      "operational_flags": []
    }
  }
}
```

Respuesta sin pedido activo:

```json
{
  "success": true,
  "data": {
    "has_active_order": false,
    "active_orders_count": 0,
    "phone_masked": "***2233",
    "active_statuses": ["pending", "confirmed", "processing", "shipped"],
    "order": null
  }
}
```

Notas de implementacion:

- busca en `orders` y `guest_orders`
- normaliza a `registered`, `guest` o `admin_manual`
- devuelve direccion, total final guardado, `payment_status` y si el envio ya fue calculado
- devuelve `customer_phone` en el objeto `order` y `phone_masked` en el nivel superior para trazabilidad operativa y privacidad en logs
- en pedidos retail normales, `variant_id` puede venir en `null` porque `order_items` conserva snapshot del producto pero no necesariamente el id de variante

Errores:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing agent key"
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Query param phone is required and must contain at least 10 digits"
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Server configuration error"
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to fetch orders"
  }
}
```

### 8.4 `GET /api/agent/orders/today`

Estado: planificado

Uso:

- resumen operativo del dia
- solo para agente interno o copiloto

Auth requerida:

- `AGENT_OPS_API_KEY`

Ejemplo:

```http
GET /api/agent/orders/today
x-agent-key: <AGENT_OPS_API_KEY>
```

Respuesta:

```json
{
  "success": true,
  "summary": {
    "date": "2026-03-27",
    "total_orders": 18,
    "total_sales": 742000,
    "pending": 4,
    "processing": 7,
    "shipped": 5,
    "delivered": 2,
    "cancelled": 0
  },
  "orders": [
    {
      "id": "ord_1",
      "order_number": "TA-10045",
      "created_at": "2026-03-27T10:15:00.000Z",
      "status": "processing",
      "payment_status": "paid",
      "total_amount": 68900,
      "customer_name": "Ana Maria",
      "customer_phone_masked": "***2233",
      "order_type": "guest",
      "items_count": 3,
      "operational_flags": []
    }
  ]
}
```

Notas de implementacion:

- puede reutilizar normalizacion de estados desde `lib/orders/operational.ts`
- debe mezclar `orders` y `guest_orders`, igual que la vista admin
- no debe devolver telefonos completos ni datos no necesarios para lectura operacional

## 9. Endpoint fase 2

### 9.1 `GET /api/agent/customer-order-status`

Estado: planificado

Este endpoint no debe implementarse en la primera entrega sin definir antes la fuente de verdad.

Problema actual:

- el workflow conversacional usa estado del cliente y memoria en Postgres
- la tienda web usa `orders` y `guest_orders` en Supabase

Antes de construirlo hay que decidir si el estado de pedido para clientes se resolvera con:

1. Supabase como fuente principal
2. Postgres conversacional como fuente principal
3. una vista unificada

Contrato tentativo:

```http
GET /api/agent/customer-order-status?phone=573001112233
x-agent-key: <AGENT_OPS_API_KEY>
```

Respuesta tentativa:

```json
{
  "success": true,
  "customer": {
    "phone_masked": "***2233"
  },
  "latest_order": {
    "id": "ord_1",
    "order_number": "TA-10045",
    "status": "shipped",
    "payment_status": "paid",
    "created_at": "2026-03-27T10:15:00.000Z",
    "total_amount": 68900
  },
  "message_for_agent": "El pedido ya va en camino."
}
```

## 10. Integracion con n8n y Agente Luz

Mapeo propuesto de tools actuales a la nueva API:

| Tool actual | Estado actual | Reemplazo propuesto |
| --- | --- | --- |
| `TOOL_BuscarProductos` | SQL directo a Postgres | `GET /api/agent/products` |
| `TOOL_ObtenerVariantes` | SQL directo a Postgres | `GET /api/agent/products/:id/variants` |
| `TOOL_ConsultarEstadoPedido` | SQL directo a Postgres | `GET /api/agent/orders/active?phone=...` |

Patron recomendado en n8n:

1. detectar intencion del cliente
2. llamar el endpoint HTTP correspondiente
3. transformar la respuesta en texto, opciones o productos
4. responder por WhatsApp o por timeline web

Ejemplo conceptual en n8n:

```text
Cliente pregunta por producto
  -> TOOL o HTTP Request en n8n
  -> GET /api/agent/products?search=hass
  -> n8n recibe JSON
  -> agente responde con texto y opciones
```

## 11. Ejemplos de uso desde n8n

### Buscar productos

```http
GET https://tus-aguacates.vercel.app/api/agent/products?search=hass&limit=5
x-agent-key: {{ $credentials.agentApiKey }}
```

### Consultar variantes

```http
GET https://tus-aguacates.vercel.app/api/agent/products/{{ $json.productId }}/variants
x-agent-key: {{ $credentials.agentApiKey }}
```

### Consultar pedidos del dia

```http
GET https://tus-aguacates.vercel.app/api/agent/orders/today
x-agent-key: {{ $credentials.agentOpsApiKey }}
```

## 12. Lineamientos de implementacion

- ubicar las rutas bajo `app/api/agent/`
- centralizar validacion de `x-agent-key` en helper dedicado
- separar llaves y permisos por tipo de agente
- reutilizar funciones de acceso a datos ya existentes cuando sea posible
- mantener respuestas pequenas para no penalizar latencia en conversaciones
- registrar errores con codigo y contexto tecnico suficiente para soporte

## 13. Orden recomendado de construccion

1. `GET /api/agent/products`
2. `GET /api/agent/orders/active`
3. `GET /api/agent/products/:id/variants`
4. `GET /api/agent/orders/today`
5. documentar credenciales y configuracion de n8n
6. migrar tools de n8n a HTTP
7. definir estrategia de `customer-order-status`

## 14. Fuera de alcance en esta fase

- escritura de pedidos
- cambios de estado desde el bot de clientes
- acceso directo del modelo a base de datos
- reutilizar endpoints admin como contrato externo
- exponer llaves o secretos al frontend

## 15. Resultado esperado al final de la v1

Al finalizar la v1, el proyecto debe tener:

- una Agent API privada de solo lectura en Vercel
- n8n consumiendo esa API para catalogo, consulta de pedido activo y variantes
- separacion clara entre acceso de cliente y acceso interno
- una base segura para luego unificar consulta de estado de pedidos
