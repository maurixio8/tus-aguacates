# 🔑 GUÍA: Cómo Obtener la Service Role Key de Supabase

## Paso a Paso Visual:

### 1. Abre tu Dashboard de Supabase
   - Ve a: https://supabase.com/dashboard
   - Inicia sesión con tu cuenta

### 2. Selecciona tu Proyecto
   - Busca el proyecto: "tus-aguacates" (o como lo hayas nombrado)
   - Haz clic para abrirlo

### 3. Ve a la Configuración de API
   - En el menú lateral izquierdo, busca el ícono de engranaje ⚙️
   - Haz clic en "Project Settings" (Configuración del Proyecto)
   - En el submenú, haz clic en "API"

### 4. Encuentra la Service Role Key
   En la página de API, verás una tabla con 3 keys:

   ```
   ┌─────────────────────────────────────────────────┐
   │ Project API keys                                 │
   ├─────────────────────────────────────────────────┤
   │                                                  │
   │ 🟢 anon public                                   │
   │    eyJhbGc... (esto es tu anon key)             │
   │    ✅ Ya la tienes configurada                   │
   │                                                  │
   │ 🔵 service_role (⚠️ secret)                     │
   │    eyJhbGc... (esto es lo que necesitas)        │
   │    👈 ESTA ES LA QUE NECESITAS COPIAR           │
   │                                                  │
   └─────────────────────────────────────────────────┘
   ```

### 5. Copiar la Service Role Key
   - Busca la fila que dice: **"service_role"** (puede tener un candado 🔒)
   - Verá un texto largo que empieza con: `eyJhbGc...`
   - A la derecha habrá un botón "Copy" o un icono de copiar 📋
   - HAZ CLIC en ese botón para copiar la key completa
   - ⚠️ Es un texto MUY largo (varios cientos de caracteres)

### 6. Verificación Rápida
   La service_role key:
   - ✅ Empieza con: `eyJhbGc`
   - ✅ Es MUY larga (200-500+ caracteres)
   - ✅ NO tiene espacios
   - ✅ Está marcada como "secret" o tiene un candado 🔒

---

## ⚠️ ADVERTENCIA DE SEGURIDAD

Esta key es MUY poderosa y peligrosa:
- ❌ NO la compartas con nadie
- ❌ NO la subas a GitHub
- ❌ NO la pongas en código del frontend
- ✅ Solo úsala en archivos .env.local (que están en .gitignore)

---

## 🔄 Si No la Encuentras:

Si no ves la service_role key, puede ser que:
1. No tienes permisos de administrador en el proyecto
2. Estás viendo un proyecto antiguo

**Solución:** Haz clic en "Reveal" o "Show" junto a la service_role key para revelarla.
