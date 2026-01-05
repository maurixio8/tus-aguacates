# 📸 Guía: Envío de Imágenes de Productos vía WhatsApp

## Resumen
Esta guía explica cómo implementar el envío automático de imágenes de productos cuando el agente Luz menciona un producto en la conversación.

**Costo: $0** - Las imágenes son GRATIS dentro de la ventana de 24h

---

## Paso 1: Actualizar la Query de Búsqueda

Asegúrate de que tu herramienta `TOOL_BuscarProductos` incluya `main_image_url`:

```sql
SELECT 
    id,
    name,
    COALESCE(discount_price, price) as precio,
    description,
    category_id,
    main_image_url  -- ← AÑADIR ESTO
FROM products
WHERE ...
```

---

## Paso 2: Agregar Nodo de Preparación

1. En n8n, después del nodo `🤖 Agente Luz`, añade un nodo **Code**
2. Nombra el nodo: `📸 Preparar Imagen`
3. Copia el código de `nodo-enviar-imagen-ycloud.js`

---

## Paso 3: Agregar Nodo Condicional

Después del nodo `📸 Preparar Imagen`:

1. Añade un nodo **IF**
2. Condición: `{{ $json.tieneImagen }}` igual a `true`
3. Rama TRUE → Enviar imagen primero
4. Rama FALSE → Enviar solo texto

---

## Paso 4: Configurar Nodo de Envío de Imagen

Crea un nodo **HTTP Request** para enviar la imagen:

```
Método: POST
URL: https://api.ycloud.com/v2/whatsapp/messages
Autenticación: YCloud API Key
Body (JSON): {{ $json.payloadImagen }}
```

---

## Paso 5: Conectar al Envío de Texto

Conecta el nodo de imagen al nodo existente de envío de texto.

**Flujo final:**
```
Agente → Preparar Imagen → ¿Tiene Imagen? 
                              ↓ Sí          ↓ No
                         Enviar Imagen → Enviar Texto
```

---

## Formato de Mensaje YCloud para Imagen

```json
{
  "from": "+573042582777",
  "to": "+573001234567",
  "type": "image",
  "image": {
    "link": "https://res.cloudinary.com/...",
    "caption": "🥑 Aguacate Hass Premium\n💰 $24.000"
  }
}
```

---

## Prueba Rápida con cURL

```bash
curl -X POST "https://api.ycloud.com/v2/whatsapp/messages" \
  -H "X-API-Key: TU_YCLOUD_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+573042582777",
    "to": "TU_NUMERO",
    "type": "image",
    "image": {
      "link": "https://res.cloudinary.com/dgpb0gfgt/image/upload/products/aguacate.webp",
      "caption": "🥑 Prueba desde n8n"
    }
  }'
```

---

## Troubleshooting

### La imagen no se envía
- Verifica que la URL de imagen sea HTTPS y pública
- El formato debe ser JPEG, PNG o WebP
- Tamaño máximo: 5MB

### Error 400 de YCloud
- Verifica el formato del JSON
- Asegúrate de que `from` tenga el número de tu WABA

### No detecta el producto
- La respuesta del agente debe mencionar el nombre del producto
- Verifica que `main_image_url` exista en la base de datos

---

**Archivos relacionados:**
- `nodo-enviar-imagen-ycloud.js` - Código del nodo
- `tool-buscar-productos-supabase.sql` - Query actualizada
