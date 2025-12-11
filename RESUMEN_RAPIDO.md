# ⚡ RESUMEN RÁPIDO - 3 Pasos Simples

## 🎯 LO QUE TIENES QUE HACER:

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  PASO 1: Obtener la Key                                     │
│  ─────────────────────                                      │
│  1. Ve a: supabase.com/dashboard                            │
│  2. Project Settings → API                                  │
│  3. Copia la "service_role" key                             │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PASO 2: Agregar al .env.local                              │
│  ─────────────────────────────                              │
│  Abre el archivo .env.local y agrega al final:              │
│                                                              │
│  SUPABASE_SERVICE_ROLE_KEY=la_key_que_copiaste              │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PASO 3: Ejecutar SQL en Supabase                           │
│  ──────────────────────────────                             │
│  1. Supabase Dashboard → SQL Editor                         │
│  2. Copia y pega el archivo:                                │
│     supabase/migrations/20251211_fix_all_rls_...sql         │
│  3. Click en "Run"                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 📍 UBICACIÓN DE LOS ARCHIVOS:

```
tus-aguacates/
│
├── .env.local  👈 EDITA ESTE (agregar la key)
│
└── supabase/
    └── migrations/
        └── 20251211_fix_all_rls_security_issues.sql  👈 EJECUTA ESTE
```

## ✅ VERIFICACIÓN RÁPIDA:

```bash
# 1. Verificar que agregaste la key:
cat .env.local | grep SERVICE_ROLE

# 2. Reiniciar servidor:
# Presiona CTRL+C para detener
npm run dev

# 3. Probar checkout:
# Ve a localhost:3000 y haz una compra de prueba
```

## 🎬 ORDEN EXACTO:

```
1. Copiar key de Supabase Dashboard
   ↓
2. Pegar en .env.local
   ↓
3. Ejecutar SQL en Supabase
   ↓
4. Reiniciar servidor (CTRL+C, luego npm run dev)
   ↓
5. Probar checkout
   ↓
6. ✅ ¡Listo!
```

---

## 📚 DOCUMENTACIÓN COMPLETA:

- **Guía Detallada:** `PASOS_CONFIGURACION_COMPLETA.md`
- **Cómo Obtener la Key:** `GUIA_OBTENER_SERVICE_ROLE_KEY.md`
- **Documentación Técnica:** `supabase/migrations/README_RLS_FIX.md`

---

## ❓ ¿Dudas?

Si en cualquier paso tienes dudas:
1. Abre el archivo `PASOS_CONFIGURACION_COMPLETA.md`
2. Lee la sección del paso donde estás
3. Sigue las instrucciones detalladas

**La key que necesitas:**
- Se llama: "service_role"
- La encuentras en: Supabase Dashboard → Settings → API
- Es una clave MUY larga que empieza con: `eyJhbGc...`
- NO es la misma que la "anon" key que ya tienes
