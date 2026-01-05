# 📋 Resumen Ejecutivo: Sesión Tus Aguacates
**Fecha:** 2025-12-20  
**Proyecto:** Tienda Online Tus Aguacates + Agente WhatsApp (Luz)

---

## 🎯 OBJETIVOS PRINCIPALES

### 1. Arreglar Búsqueda de Productos en Agente Luz
- **Problema original:** Cliente preguntaba "¿tienen plátanos?" y no encontraba nada
- **Causa raíz encontrada:** Palabra "podrías" no estaba filtrada, buscaba "podrías plátanos" en vez de "plátanos"
- **Estado:** ✅ CORREGIDO - Archivo `preprocesamiento-v5-integrado.js` actualizado

### 2. Sincronizar Productos entre Tienda y Agente
- **Problema:** Tienda usa Supabase (tabla `products`), Agente usa PostgreSQL local (tabla `productos_tienda`)
- **Descubrimiento:** Champiñones existen en tienda pero NO en BD del agente
- **Solución aprobada:** Conectar n8n directamente a Supabase (una sola fuente de verdad)

### 3. Resolver Límite de Egress en Supabase
- **Problema crítico:** 5.2GB / 5GB de egress consumido (104%)
- **Causa probable:** Imágenes en Supabase Storage
- **Plan aprobado:** Mover imágenes a Cloudinary (gratis)

---

## 🔧 CAMBIOS REALIZADOS

### Archivos Creados
| Archivo | Propósito |
|---------|-----------|
| `n8n-workflows/query-busqueda-supabase.sql` | Query para buscar en tabla `products` de Supabase |
| `n8n-workflows/tool-buscar-productos-supabase.sql` | TOOL para agente que consulta Supabase |
| `n8n-workflows/GUIA-CONECTAR-N8N-SUPABASE.md` | Instrucciones para conectar n8n a Supabase |
| `n8n-workflows/insertar-productos.sql` | SQL regenerado con 345 productos (incluyendo champiñones) |

### Archivos Modificados
| Archivo | Cambio |
|---------|--------|
| `preprocesamiento-v5-integrado.js` | Agregadas palabras ignoradas: podrías, podríamos, pudiera, pueda, puedan, agregame, etc. |

---

## 🖥️ CLIs DISPONIBLES

| CLI | Estado | Versión | Uso |
|-----|--------|---------|-----|
| **Vercel CLI** | ✅ Funcionando | 48.10.4 | `vercel ls`, `vercel deploy` |
| **Supabase CLI** | ⚠️ Requiere login | 2.67.3 | `npx supabase login`, `npx supabase projects list` |

### Comandos probados:
```bash
# Vercel
vercel whoami          # → maurixio8
vercel ls              # Lista deployments

# Supabase (requiere autenticación)
npx supabase login     # Abre navegador para auth
npx supabase projects list
```

---

## 📊 INFORMACIÓN DEL PROYECTO

### Supabase
- **Proyecto:** `mmx-agent-1762450378863`
- **ID:** `gxqkmaaqoehydulksudj`
- **Plan:** FREE
- **Región:** us-east-1
- **Egress:** 5.2GB / 5GB (EXCEDIDO)

### Vercel
- **Proyecto:** `tus-aguacates`
- **Team:** `mauricio-s-projects-2bf4b7a2`
- **URL:** https://tus-aguacates.vercel.app

### n8n
- **URL:** https://dep-n8n.n8ntusaguacates.space
- **Workflow principal:** Agente Luz v4

---

## 🚦 ESTADO ACTUAL

### ✅ Completado
1. Diagnóstico de problema de búsqueda
2. Corrección de filtrado de palabras en preprocesamiento
3. Identificación de desincronización Supabase ↔ PostgreSQL
4. Plan aprobado para conectar n8n a Supabase
5. Archivos SQL creados para nueva conexión

### ⏳ Pendiente
1. **Autenticar Supabase CLI** - `npx supabase login`
2. **Configurar credenciales en n8n** - Agregar conexión a Supabase
3. **Actualizar nodos del agente** - Usar nuevas queries
4. **Mover imágenes a Cloudinary** - Resolver problema de egress
5. **Probar búsqueda con champiñones** - Verificar que funcione

---

## 🎯 PRÓXIMOS PASOS (Nueva Sesión)

### Paso 1: Login en Supabase CLI
```bash
npx supabase login
npx supabase projects list
```

### Paso 2: Obtener credenciales de BD
Dashboard Supabase → Settings → Database → Connection String

### Paso 3: Crear credencial en n8n
- Nombre: "Supabase - Tus Aguacates"
- Host: `db.gxqkmaaqoehydulksudj.supabase.co`
- Port: 5432 o 6543
- Database: postgres
- User: postgres
- SSL: Activado

### Paso 4: Actualizar nodos
1. "3. Búsqueda Automática Productos" → usar `query-busqueda-supabase.sql`
2. "TOOL_BuscarProductos" → usar `tool-buscar-productos-supabase.sql`

### Paso 5: Mover imágenes
- Opción A: Cloudinary (gratis 25GB/mes)
- Opción B: Tu servidor Oracle + nginx

---

## 💡 DECISIONES IMPORTANTES

### 1. NO migrar todo a servidor propio (por ahora)
- **Razón:** Alto riesgo, mucho tiempo, no necesario para resolver egress
- **En su lugar:** Solución gradual por fases

### 2. NO pagar $25/mes por Supabase Pro
- **Razón:** Negocio en números rojos
- **En su lugar:** Optimizar egress moviendo imágenes

### 3. Una sola fuente de verdad para productos
- **Antes:** Supabase (tienda) + PostgreSQL local (agente) = desincronizado
- **Después:** Solo Supabase → n8n consulta directamente

---

## 📁 ARCHIVOS CLAVE

```
n8n-workflows/
├── preprocesamiento-v5-integrado.js    # Pre-procesamiento actualizado
├── query-busqueda-supabase.sql         # Query búsqueda para Supabase
├── tool-buscar-productos-supabase.sql  # Tool fallback para Supabase
├── GUIA-CONECTAR-N8N-SUPABASE.md       # Instrucciones de config
├── insertar-productos.sql              # 345 productos (backup)
└── system-message-agente-v6.md         # System message actualizado
```

---

## ⚠️ NOTAS PARA PRÓXIMA SESIÓN

1. **Supabase CLI necesita login** - El token no persistió
2. **Vercel CLI funciona** - Puedes usarlo libremente
3. **El preprocesamiento actualizado debe copiarse a n8n** - El archivo local está correcto
4. **Las imágenes son la causa del egress** - Prioridad moverlas

---

*Resumen generado: 2025-12-20 20:50*
