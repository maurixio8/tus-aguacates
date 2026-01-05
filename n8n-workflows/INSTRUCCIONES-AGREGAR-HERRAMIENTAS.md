# 📋 Instrucciones para Agregar Herramientas en n8n

## Resumen de Archivos Creados

| Archivo | Herramienta | Prioridad |
|---------|-------------|-----------|
| `tool-buscar-productos.sql` | TOOL_BuscarProductos | Alta |
| `tool-escalar-servicio.sql` | TOOL_EscalarServicioCliente | Alta |
| `tool-consultar-pedido.sql` | TOOL_ConsultarEstadoPedido | Media |

---

## Paso a Paso para Agregar Cada Herramienta

### 1. TOOL_BuscarProductos

1. En n8n, abre el workflow del Agente Luz v4
2. Crea un nuevo nodo: **Postgres Tool**
3. Configura:
   - **Nombre**: `TOOL_BuscarProductos`
   - **Description Type**: Manual
   - **Tool Description**: 
     ```
     Herramienta de FALLBACK para buscar productos. Úsala SOLO cuando los productos encontrados automáticamente NO coinciden con lo que pidió el cliente. Input: término de búsqueda del producto.
     ```
   - **Operation**: Execute Query
   - **Query**: (copiar de `tool-buscar-productos.sql`, solo la parte SELECT)
   - **Query Replacement**: 
     ```
     ={{ $fromAI('termino_busqueda','Nombre del producto a buscar','string','aguacate') }}
     ```
4. Conecta la salida del nodo al Agente

---

### 2. TOOL_EscalarServicioCliente

1. Crea un nuevo nodo: **Postgres Tool**
2. Configura:
   - **Nombre**: `TOOL_EscalarServicioCliente`
   - **Tool Description**:
     ```
     Escalar la conversación a servicio al cliente humano. Úsala cuando: cliente molesto, queja, comprobante de pago, problema técnico, o pide hablar con humano. Input: motivo de escalado.
     ```
   - **Query**: (copiar de `tool-escalar-servicio.sql`)
   - **Query Replacement**:
     ```
     ={{ $fromAI('motivo_escalado','Motivo del escalado','string','Cliente solicita hablar con humano') }}
     ```
3. Conecta al Agente

**OPCIONAL**: Agregar nodo adicional para notificar al admin por WhatsApp:
- Después del Postgres Tool, agregar HTTP Request a YCloud
- Enviar mensaje al número del admin con los detalles del escalado

---

### 3. TOOL_ConsultarEstadoPedido

1. Crea un nuevo nodo: **Postgres Tool**
2. Configura:
   - **Nombre**: `TOOL_ConsultarEstadoPedido`
   - **Tool Description**:
     ```
     Consultar el estado del pedido más reciente del cliente. Úsala cuando el cliente pregunte: ¿cuándo llega mi pedido?, ¿ya enviaron?, estado de mi pedido.
     ```
   - **Query**: (copiar de `tool-consultar-pedido.sql`)
   - **Query Replacement**: (no requiere - usa el teléfono del contexto)
3. Conecta al Agente

---

## ⚠️ Importante: Actualizar System Message

Después de agregar las herramientas, copia el contenido de `system-message-agente-v6.md` al System Message del nodo "🤖 Agente Luz v4".

---

## Diagrama de Conexiones

```
                    ┌─────────────────────────────┐
                    │      🤖 Agente Luz v4       │
                    └───────────┬─────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │           │           │           │           │
        ▼           ▼           ▼           ▼           ▼
   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
   │Guardar │  │Añadir  │  │Calcular│  │Cambiar │  │(Nuevas)│
   │Nombre  │  │Carrito │  │Total   │  │Estado  │  │        │
   └────────┘  └────────┘  └────────┘  └────────┘  └────────┘
                                                       │
                        ┌──────────────────────────────┤
                        │              │               │
                        ▼              ▼               ▼
                   ┌────────┐    ┌────────┐    ┌────────┐
                   │Buscar  │    │Escalar │    │Consultar│
                   │Productos│   │Servicio│    │Pedido   │
                   └────────┘    └────────┘    └────────┘
```
