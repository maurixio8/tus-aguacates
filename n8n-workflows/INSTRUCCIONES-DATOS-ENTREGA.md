# Instrucciones: Agregar Datos de Entrega al Agente

## Problema
El agente dice "(guardado en sistema)" pero no tiene acceso a los datos reales del cliente (dirección, teléfono).

## Cambios Necesarios en n8n

### 1. Agregar campos al contexto del cliente

En el nodo de **System Message** (plantilla del agente), agregar estas variables:

```
## CONTEXTO DEL CLIENTE
- Nombre: {{ $json.clienteNombre }}
- Teléfono: {{ $json.clienteTelefono }}
- Dirección: {{ $json.clienteDireccion }}
- Estado: {{ $json.clienteEstado }}
- Total pedidos anteriores: {{ $json.clienteTotalPedidos }}
- Carrito actual: {{ JSON.stringify($json.clienteCarrito) }}
```

### 2. Modificar el nodo "Merge Datos + Productos"

Asegurarse de que este nodo incluya los campos del cliente:

```javascript
return {
  json: {
    clienteId: cliente.id,
    clienteNombre: cliente.nombre || '',
    clienteTelefono: cliente.telefono || '',
    clienteDireccion: cliente.direccion || '',  // AGREGAR ESTO
    clienteEstado: cliente.estado_conversacion || 'NUEVO',
    clienteTotalPedidos: cliente.total_pedidos || 0,
    clienteCarrito: cliente.pre_pedido || [],
    // ... otros campos
  }
}
```

### 3. Crear TOOL_GuardarDireccionCliente

Crear un nuevo nodo de Tool con:

**Nombre**: `TOOL_GuardarDireccionCliente`

**Descripción**: `Guarda la dirección de entrega del cliente. Usar cuando el cliente proporciona su dirección. Input: {"direccion": "Calle 123 #45-67, Barrio, Ciudad"}`

**Query SQL**:
```sql
UPDATE clientes 
SET direccion = '{{ $json.direccion }}'
WHERE telefono = '{{ $json.telefono_cliente }}';
```

### 4. Actualizar System Message

Copiar el contenido actualizado de `system-message-agente-v7.md` al nodo del agente.

---

## Flujo Esperado

1. Cliente dice "eso es todo"
2. Luz verifica si `clienteDireccion` tiene valor
3. Si NO tiene dirección → Pregunta: "¿Cuál es tu dirección de entrega?"
4. Cliente responde con dirección
5. Luz usa `TOOL_GuardarDireccionCliente` para guardar
6. Luz muestra resumen CON los datos reales
7. Cliente confirma
