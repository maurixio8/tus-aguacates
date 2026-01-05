# Instrucciones: Implementar Envío de Imágenes de Productos

## Resumen
Cuando Luz menciona un producto, también enviará la imagen del producto al cliente.

---

## Cambios Necesarios

### 1. Actualizar el nodo "📤 Preparar Respuesta"

Reemplazar el código actual con el contenido de:
`preparar-respuesta-v2-con-imagenes.js`

Este código:
- Detecta si hay productos encontrados con imagen
- Si hay imagen, retorna 2 mensajes: imagen + texto
- Si no hay imagen, solo retorna el texto

---

### 2. Actualizar el nodo "📱 Enviar WhatsApp YCloud"

El nodo debe poder manejar tanto `type: "text"` como `type: "image"`.

**Cambiar el jsonBody de:**
```json
{
  "from": "{{ $json.from }}",
  "to": "{{ $json.to }}",
  "type": "text",
  "text": {
    "body": "{{ $json.mensaje }}"
  }
}
```

**A:**
```
={{ JSON.stringify($json) }}
```

El nodo de Preparar Respuesta ya formatea el JSON completo, así que solo necesitas enviarlo tal cual.

---

### 3. Agregar main_image_url a la búsqueda de productos

Asegúrate de que el nodo "3. Búsqueda Automática Productos" retorne el campo `main_image_url`.

En la query SQL, verifica que incluya:
```sql
SELECT 
  id,
  name,
  price,
  main_image_url,  -- ← IMPORTANTE
  category_name,
  ...
```

---

## Flujo Resultante

```
Cliente: "Tienen aguacates?"
       ↓
[Búsqueda encuentra Aguacate Hass con imagen de Cloudinary]
       ↓
Preparar Respuesta genera 2 items:
  1. { type: "image", image: { link: "...", caption: "🥑 Aguacate..." } }
  2. { type: "text", text: { body: "¡Sí! Tenemos..." } }
       ↓
Enviar WhatsApp YCloud envía ambos
       ↓
Cliente recibe: [Imagen] + [Texto]
```

---

## Formato de Mensaje de Imagen (YCloud API)

```json
{
  "from": "573042582777",
  "to": "573001234567",
  "type": "image",
  "image": {
    "link": "https://res.cloudinary.com/drahcpo49/image/upload/v1234/productos/aguacate.jpg",
    "caption": "🥑 Aguacate Hass Premium - $12,000"
  }
}
```

---

## Costo
**$0** - Las imágenes son gratis dentro de la ventana de 24 horas.
