# 🚀 CONFIGURACIÓN COMPLETA - Paso a Paso

## 📝 RESUMEN: ¿Qué vas a hacer?

1. ✅ Agregar la service_role key a tu archivo `.env.local`
2. ✅ Ejecutar la migración SQL en Supabase
3. ✅ Probar que el checkout funcione
4. ✅ Verificar que los errores desaparezcan

**Tiempo estimado:** 10-15 minutos

---

## PASO 1: Verificar tu Archivo .env.local Actual

### 1.1. Ubicación del archivo
El archivo `.env.local` está en la raíz de tu proyecto:
```
tus-aguacates/
├── app/
├── components/
├── supabase/
├── .env.local  👈 ESTE ARCHIVO
└── ...
```

### 1.2. Ver contenido actual
Ejecuta este comando en tu terminal:

```bash
cat .env.local
```

Deberías ver algo como esto:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# ... otras variables
```

---

## PASO 2: Agregar la Service Role Key

### 2.1. Abrir el archivo para editar

**Opción A - Con Visual Studio Code:**
```bash
code .env.local
```

**Opción B - Con nano (editor de terminal):**
```bash
nano .env.local
```

**Opción C - Con cualquier editor de texto:**
Abre el archivo `.env.local` con tu editor favorito

### 2.2. Agregar la nueva línea

Al FINAL del archivo, agrega esta línea:

```bash
# Service Role Key (para API routes seguros)
SUPABASE_SERVICE_ROLE_KEY=PEGA_AQUI_LA_KEY_QUE_COPIASTE
```

**EJEMPLO COMPLETO** de cómo debería verse tu `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://gxqkmaaqoehydulksudj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWttYWFxb2VoeWR1bGtzdWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk5OTk5OTksImV4cCI6MjAxNTU3NTk5OX0.ejemplo123456
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWttYWFxb2VoeWR1bGtzdWRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5OTk5OTk5OSwiZXhwIjoyMDE1NTc1OTk5fQ.ejemplo789
```

### 2.3. Guardar el archivo

- **Si usas nano:** Presiona `CTRL + O`, luego `ENTER`, luego `CTRL + X`
- **Si usas VSCode:** Presiona `CTRL + S` (o `CMD + S` en Mac)

### 2.4. Verificar que se guardó correctamente

Ejecuta:
```bash
cat .env.local | grep SERVICE_ROLE
```

Deberías ver:
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (tu key)
```

✅ Si ves la línea con tu key, ¡perfecto! Pasemos al siguiente paso.

---

## PASO 3: Ejecutar la Migración SQL en Supabase

### 3.1. Abrir Supabase Dashboard
1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto "tus-aguacates"

### 3.2. Abrir el SQL Editor
1. En el menú lateral, busca el ícono 📝 que dice "SQL Editor"
2. Haz clic en él

### 3.3. Copiar el contenido de la migración

Ejecuta este comando en tu terminal para ver el archivo:
```bash
cat supabase/migrations/20251211_fix_all_rls_security_issues.sql
```

O ábrelo con tu editor:
```bash
code supabase/migrations/20251211_fix_all_rls_security_issues.sql
```

### 3.4. Pegar y ejecutar en Supabase

1. **Copia TODO el contenido** del archivo (son ~450 líneas)
2. En el SQL Editor de Supabase, pega todo el contenido
3. Haz clic en el botón **"Run"** (Ejecutar) en la esquina inferior derecha
4. **Espera** a que termine (puede tardar 5-10 segundos)

### 3.5. Verificar que no haya errores

Si todo salió bien, verás:
```
Success. No rows returned
```

O un mensaje similar de éxito.

❌ **Si ves errores:**
- Lee el mensaje de error
- Puede ser que algunas tablas ya existan (está bien, la migración usa `IF NOT EXISTS`)
- Si dice "already exists", es normal y seguro

---

## PASO 4: Reiniciar el Servidor de Desarrollo

Las variables de entorno solo se cargan al iniciar el servidor, así que necesitas reiniciarlo:

### 4.1. Detener el servidor
En tu terminal donde corre el servidor, presiona:
```
CTRL + C
```

### 4.2. Iniciar nuevamente
```bash
npm run dev
```

### 4.3. Esperar a que inicie
Verás algo como:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
```

---

## PASO 5: Probar que Todo Funcione

### 5.1. Prueba el Checkout
1. Ve a: http://localhost:3000
2. Agrega productos al carrito
3. Haz clic en "Checkout" o "Finalizar Compra"
4. Llena el formulario con datos de prueba:
   - Nombre: Test Usuario
   - Email: test@example.com
   - Teléfono: +57 300 123 4567
   - Dirección: Calle Test 123
5. Haz clic en "Pagar Contra Entrega"
6. ✅ Debería abrirse WhatsApp con el mensaje del pedido

### 5.2. Verificar en Supabase Dashboard
1. Ve al Dashboard de Supabase
2. Abre "Table Editor" en el menú lateral
3. Selecciona la tabla "guest_orders"
4. ✅ Deberías ver tu pedido de prueba con estado "pendiente_entrega"

### 5.3. Verificar que los errores desaparecieron
1. En Supabase Dashboard, ve a "Project Health" o "Logs"
2. Ve a la pestaña "All" o "Security"
3. ✅ Los 10 errores críticos de RLS deberían haber desaparecido
4. ✅ Ya no debería aparecer "RLS Disabled" en ninguna tabla

---

## ✅ CHECKLIST FINAL

Marca cada item cuando lo completes:

- [ ] ✅ Copié la service_role key de Supabase Dashboard
- [ ] ✅ Agregué `SUPABASE_SERVICE_ROLE_KEY` a mi `.env.local`
- [ ] ✅ Ejecuté la migración SQL en Supabase (sin errores)
- [ ] ✅ Reinicié el servidor con `npm run dev`
- [ ] ✅ Probé el checkout y funciona correctamente
- [ ] ✅ Verifiqué que el pedido se creó en la base de datos
- [ ] ✅ Los errores de seguridad desaparecieron del dashboard

---

## 🆘 PROBLEMAS COMUNES

### Error: "Missing environment variable"
**Causa:** La variable no está configurada correctamente
**Solución:**
1. Verifica que el archivo se llame exactamente `.env.local` (con el punto al inicio)
2. Verifica que la línea sea: `SUPABASE_SERVICE_ROLE_KEY=...` (sin espacios alrededor del `=`)
3. Reinicia el servidor

### Error: "Invalid API key"
**Causa:** Copiaste la key incorrecta
**Solución:**
1. Asegúrate de copiar la **service_role** key, no la anon key
2. Copia la key completa (puede ser muy larga)
3. No debe tener espacios ni saltos de línea

### El checkout no funciona
**Causa:** El servidor no se reinició
**Solución:**
1. Detén el servidor (CTRL + C)
2. Inicia de nuevo (`npm run dev`)
3. Intenta el checkout nuevamente

### Los errores de Supabase no desaparecen
**Causa:** La migración no se ejecutó correctamente
**Solución:**
1. Ve a SQL Editor en Supabase
2. Ejecuta este comando para verificar:
   ```sql
   SELECT tablename FROM pg_tables WHERE schemaname = 'public';
   ```
3. Deberías ver las tablas: coupons, coupon_usage, guest_orders, etc.

---

## 📞 ¿Necesitas Ayuda?

Si tienes algún problema:
1. Copia el mensaje de error completo
2. Dime en qué paso estás
3. Te ayudaré a resolverlo

---

**¡Listo! Una vez que completes todos estos pasos, tu tienda estará completamente segura y funcionando perfectamente.** 🎉
