# INSTRUCCIÓN PARA TOOL_AnadirAlCarrito

## Descripción de la Herramienta (copiar esto)
```
Añadir producto al carrito. OBLIGATORIO pasar TODOS los parámetros: producto_id, producto_nombre (nombre completo con tamaño si aplica), precio, cantidad, variante_id (0 si no hay), variante_nombre (SIEMPRE incluir el peso/tamaño ej: 500g, 1kg, Bandeja 12 unidades - NO dejar vacío).
```

## Query Replacement (copiar esto)
```
={{ $fromAI('producto_id','ID numérico del producto','number',0) }}
{{ $fromAI('producto_nombre','Nombre completo del producto incluyendo variante','string','') }}
{{ $fromAI('precio','Precio numérico del producto','number',0) }}
{{ $fromAI('cantidad','Cantidad a agregar','number',1) }}
{{ $fromAI('variante_id','ID de la variante (0 si no aplica)','number',0) }}
{{ $fromAI('variante_nombre','Peso o tamaño (ej: 500g, 1kg). NUNCA dejar vacío si hay variantes.','string','') }}
```

---

# SECCIÓN A AGREGAR EN EL SYSTEM MESSAGE DEL AGENTE

Agregar esta sección justo después de "## HERRAMIENTAS DISPONIBLES":

```
## CRITICAL: CÓMO USAR TOOL_AnadirAlCarrito

Cuando agregues un producto AL CARRITO, SIEMPRE debes pasar:

1. **producto_id**: El ID numérico del producto
2. **producto_nombre**: El nombre COMPLETO incluyendo la variante
   - CORRECTO: "Mazorca Baby (500g)"
   - INCORRECTO: "Mazorca Baby"
3. **precio**: El precio de esa variante específica
4. **cantidad**: Cuántas unidades
5. **variante_id**: El ID de la variante (0 si no hay)
6. **variante_nombre**: El peso/tamaño (ej: "500g", "1kg", "Bandeja 12")
   - NUNCA dejes este campo vacío si hay variantes
   - Siempre incluye el peso en gramos o kilos

### EJEMPLO CORRECTO:
Cliente: "Dame 2 mazorcas baby"
```
TOOL_AnadirAlCarrito({
  producto_id: 123,
  producto_nombre: "Mazorca Baby (500g)",
  precio: 8500,
  cantidad: 2,
  variante_id: 456,
  variante_nombre: "500g"
})
```

### EN EL RESUMEN DE PEDIDO:
Siempre mostrar el peso/tamaño:
- CORRECTO: "Mazorca Baby (500g) x2 - $17.000"
- INCORRECTO: "Mazorca Baby x2 - $17.000"
```

---

# PASOS PARA APLICAR EN N8N:

1. Abrir el nodo **TOOL_AnadirAlCarrito**
2. Cambiar la **Tool Description** con el texto de arriba
3. Cambiar el **Query Replacement** con el texto de arriba

4. Abrir el nodo **Agente Luz v4**
5. En el **System Message**, agregar la sección "CRITICAL: CÓMO USAR TOOL_AnadirAlCarrito" después de las herramientas

6. **Guardar** el workflow
7. **Probar** enviando un mensaje pidiendo un producto con variantes
