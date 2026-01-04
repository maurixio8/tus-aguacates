# 🖼️ Guía: Migración de Imágenes a Cloudinary

## Resumen
Este script migra automáticamente las imágenes de productos y categorías desde Supabase Storage hacia Cloudinary.

---

## Paso 1: Configurar API Secret

Abre el archivo `migrate-images-to-cloudinary.js` y busca esta línea:

```javascript
api_secret: process.env.CLOUDINARY_API_SECRET || 'PEGA_TU_API_SECRET_AQUI'
```

Reemplaza `PEGA_TU_API_SECRET_AQUI` con tu API Secret real de Cloudinary.

---

## Paso 2: Instalar dependencias

```bash
cd "c:\Users\Usuario\Documents\proyecto tienda\tus-aguacates"
npm install cloudinary
```

---

## Paso 3: Ejecutar migración

```bash
cd n8n-workflows
node migrate-images-to-cloudinary.js
```

---

## Qué hace el script

1. ✅ Lee todos los productos de Supabase
2. ✅ Lee todas las categorías de Supabase
3. ✅ Sube cada imagen a Cloudinary (carpeta `tus-aguacates/products/` y `tus-aguacates/categories/`)
4. ✅ Actualiza las URLs en Supabase para que apunten a Cloudinary
5. ✅ Muestra un resumen al final

---

## Después de migrar

1. **Verifica** que las imágenes cargan en tu sitio
2. **Monitorea** el egress de Supabase (debería bajar drásticamente)
3. **Opcional**: Elimina las imágenes viejas de Supabase Storage para liberar espacio
