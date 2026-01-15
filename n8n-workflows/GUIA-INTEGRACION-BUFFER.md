# 🚀 Guía Rápida: Buffer y Estados

## Solo 3 Pasos

### Paso 1: Ejecutar SQL
En tu PostgreSQL local, ejecuta el contenido de:
```
migracion-estados-buffer.sql
```

Esto crea:
- ✅ Tabla `mensaje_buffer`
- ✅ Tabla `conversion_tracking` 
- ✅ Tabla `transiciones_estado`
- ✅ Estado `PEDIDO_ONLINE` agregado

---

### Paso 2: Importar Workflow de Buffer
1. En n8n, ve a **Workflows** → **Import from File**
2. Selecciona: `workflow-procesar-buffer.json`
3. **⚠️ IMPORTANTE**: Edita el nodo "🔗 Llamar Webhook Principal"
   - Cambia la URL a tu webhook real (la misma del Agente Luz)
4. **Activa el workflow** cuando estés listo para probar

---

### Paso 3: Actualizar Pre-procesamiento
En el workflow **Agente Luz v6**:

1. Abre el nodo **"1. Pre-procesamiento YCloud"**
2. Reemplaza TODO el código con el contenido de:
   ```
   codigo-preprocesamiento-v15.js
   ```
3. Guarda

---

## ⚠️ Nota Importante

El buffer está **desactivado inicialmente** porque el nodo `debeUsarBuffer` siempre retorna `true` pero el workflow de buffer iniciará desactivado.

**Para activarlo:**
1. Activa el workflow "Procesador de Buffer"
2. Todos los mensajes de texto irán al buffer
3. Media, botones y pedidos de plataforma SIEMPRE procesan inmediato

---

## 🧪 Probar

1. Envía 3 mensajes rápidos con prefijo `>`:
   ```
   > Hola
   > Quiero aguacates
   > Los hass
   ```
2. Espera 30 segundos
3. Debe llegar UNA sola respuesta

---

## 🔧 Configuración

| Parámetro | Valor | Dónde cambiarlo |
|-----------|-------|-----------------|
| Timeout buffer | 30 segundos | `codigo-procesar-buffer.js` línea 1 |
| Frecuencia check | 10 segundos | Workflow buffer → Schedule Trigger |

---

## ❌ Rollback

Si algo falla:
1. Desactiva el workflow "Procesador de Buffer"
2. El bot volverá a funcionar como antes (sin buffer)
