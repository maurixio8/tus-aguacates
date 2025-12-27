# Diagnóstico Completo del Sistema de Wishlist (Favoritos)

## Fecha: 12 de Diciembre de 2024

## Resumen Ejecutivo

Después de un análisis exhaustivo del sistema de gestión de favoritos (wishlist) en la tienda Next.js/Supabase, he identificado 5 posibles causas principales para los errores reportados. A continuación se detalla el diagnóstico completo y las soluciones recomendadas.

---

## 🚨 Posibles Causas Identificadas

### 1. **Problemas de Autenticación en el Contexto del Servidor**

#### **Síntomas:**
- Error 404 en `/api/wishlist`
- Múltiples intentos fallidos con rollback automático
- Error de React #418 (minificado)

#### **Diagnóstico:**
El problema más probable está en la forma en que se maneja la autenticación entre el cliente y el servidor:

```typescript
// En /lib/wishlist-store.ts línea 61-66
const token = await getAuthToken();
if (!token) {
  console.log('❌ [WISHLIST-STORE] No auth token available');
  set({ error: 'No hay sesión activa', isLoading: false });
  return;
}
```

**Problema:** La función `getAuthToken()` utiliza `supabase.auth.getSession()` que puede no estar disponible en el contexto del servidor o cuando la sesión ha expirado.

#### **Solución Recomendada:**
```typescript
// Mejorar la función getAuthToken en /lib/wishlist-store.ts
async function getAuthToken(): Promise<string | null> {
  try {
    // Primero intentar obtener la sesión actual
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      return session.access_token;
    }
    
    // Si no hay sesión, intentar refrescar el token
    const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
    
    return refreshedSession?.access_token || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}
```

---

### 2. **Configuración de RLS (Row Level Security) en Supabase**

#### **Síntomas:**
- Error 406 en consultas a Supabase para órdenes
- Fallos al agregar productos a favoritos

#### **Diagnóstico:**
Las políticas RLS en la tabla `wishlist` están configuradas correctamente, pero puede haber un problema con el contexto de autenticación:

```sql
-- En supabase/migrations/1762450896_create_cart_and_wishlist.sql
CREATE POLICY "Users can view own wishlist" ON wishlist
  FOR SELECT USING (auth.uid() = user_id);
```

**Problema:** Cuando se utiliza `supabase.auth.getUser(token)` en el servidor, el contexto de RLS puede no reconocer correctamente `auth.uid()`.

#### **Solución Recomendada:**
```typescript
// En /app/api/wishlist/route.ts modificar la verificación de autenticación
const { data: { user }, error: authError } = await supabase.auth.getUser(token);

if (authError || !user) {
  console.error('❌ [WISHLIST-API] Auth error:', authError);
  return NextResponse.json(
    { error: 'Token inválido' },
    { status: 401 }
  );
}

// Agregar contexto de RLS explícito
const supabaseWithAuth = supabase;
await supabaseWithAuth.auth.setSession({
  access_token: token,
  refresh_token: '' // No disponible en el servidor
});
```

---

### 3. **Problemas con la Configuración de Vercel**

#### **Síntomas:**
- Error 404 específico en `/api/wishlist`
- Problemas con postMessage en chext_driver.js

#### **Diagnóstico:**
Aunque el archivo [`vercel.json`](tus-aguacates/vercel.json:7-15) tiene configurados los rewrites para wishlist, puede haber un conflicto con la configuración de Next.js:

```json
"rewrites": [
  {
    "source": "/api/wishlist",
    "destination": "/api/wishlist"
  },
  {
    "source": "/api/wishlist/:path*",
    "destination": "/api/wishlist/:path*"
  }
]
```

**Problema:** Los rewrites son redundantes y pueden causar conflictos con el enrutamiento nativo de Next.js.

#### **Solución Recomendada:**
```json
// Simplificar vercel.json eliminando rewrites innecesarios
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "cleanUrls": false,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
        { "key": "Access-Control-Allow-Headers", "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Cookie, Set-Cookie" }
      ]
    }
  ]
}
```

---

### 4. **Problemas con el Manejo de Estados en el Store**

#### **Síntomas:**
- Múltiples intentos fallidos de agregar productos con rollback automático
- Inconsistencia en el estado de la wishlist

#### **Diagnóstico:**
El store de wishlist utiliza actualizaciones optimistas que pueden fallar si hay problemas de sincronización:

```typescript
// En /lib/wishlist-store.ts líneas 132-145
const tempItem: WishlistItem = {
  id: `temp-${Date.now()}`,
  user_id: userId,
  product_id: product.id,
  product,
  created_at: new Date().toISOString()
};

set(state => ({
  items: [tempItem, ...state.items],
  error: null
}));
```

**Problema:** Las actualizaciones optimistas pueden causar inconsistencias si hay múltiples solicitudes simultáneas o problemas de red.

#### **Solución Recomendada:**
```typescript
// Mejorar el manejo de errores y estados en addToWishlist
addToWishlist: async (product: Product, userId: string) => {
  // Evitar múltiples clics simultáneos
  if (get().isLoading) {
    console.log('⚠️ [WISHLIST-STORE] Operation already in progress');
    return false;
  }

  set({ isLoading: true, error: null });

  try {
    // Verificar si ya está en wishlist antes de la actualización optimista
    if (get().isInWishlist(product.id)) {
      console.log('⚠️ [WISHLIST-STORE] Product already in wishlist:', product.id);
      set({ isLoading: false });
      return true;
    }

    // Resto del código...
  } catch (error) {
    // Mejor manejo de errores
    set({ 
      error: error instanceof Error ? error.message : 'Error al agregar a favoritos',
      isLoading: false 
    });
    return false;
  }
}
```

---

### 5. **Problemas con la Sincronización de Sesión**

#### **Síntomas:**
- Error 404 intermitente
- Problemas con postMessage en chext_driver.js
- Sesiones que expiran inesperadamente

#### **Diagnóstico:**
El contexto de autenticación puede perderse entre el cliente y el servidor, especialmente en producción:

```typescript
// En /lib/auth-context.tsx líneas 36-41
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (_event, session) => {
    setUser(session?.user || null);
  }
);
```

**Problema:** El listener de auth state changes no maneja adecuadamente la persistencia de la sesión en el servidor.

#### **Solución Recomendada:**
```typescript
// Mejorar el manejo de sesión en /lib/auth-context.tsx
useEffect(() => {
  async function loadUser() {
    setLoading(true);
    try {
      // Intentar obtener sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
      } else {
        // Si no hay sesión, intentar refrescar
        const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
        setUser(refreshedSession?.user || null);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }
  
  loadUser();

  // Configurar listener con mejor manejo
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id);
      setUser(session?.user || null);
      
      // Si el token se refresca, actualizar el store
      if (event === 'TOKEN_REFRESHED' && session) {
        // Actualizar stores que dependen de la sesión
        useWishlistStore.getState().loadWishlist(session.user.id);
      }
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

---

## 🔧 Soluciones Priorizadas

### **Prioridad 1: Corregir Autenticación en API Routes**

1. **Mejorar la función `getAuthToken()`** para manejar refresh tokens
2. **Agregar contexto RLS explícito** en las API routes
3. **Implementar retry logic** para solicitudes fallidas

### **Prioridad 2: Optimizar Configuración de Despliegue**

1. **Simplificar vercel.json** eliminando rewrites innecesarios
2. **Verificar configuración de CORS** en producción
3. **Asegurar que las variables de entorno** estén correctamente configuradas

### **Prioridad 3: Mejorar Manejo de Estados**

1. **Agregar protección contra múltiples clics** en el store
2. **Implementar mejor manejo de errores** con rollback adecuado
3. **Agregar indicadores de carga** para mejor UX

---

## 📊 Plan de Validación

### **Paso 1: Diagnóstico Inmediato**
```bash
# Verificar que las API routes estén accesibles
curl -X GET "http://localhost:3000/api/wishlist" \
  -H "Authorization: Bearer TU_TOKEN"

# Verificar logs del servidor
npm run dev
```

### **Paso 2: Pruebas de Autenticación**
```javascript
// Probar la función getAuthToken
const token = await getAuthToken();
console.log('Token disponible:', !!token);

// Probar refresh de sesión
const { data } = await supabase.auth.refreshSession();
console.log('Sesión refrescada:', !!data.session);
```

### **Paso 3: Validación de Flujo Completo**
1. Iniciar sesión como usuario
2. Intentar agregar producto a favoritos
3. Verificar que aparezca en `/perfil/favoritos`
4. Eliminar producto de favoritos
5. Verificar que se elimine correctamente

---

## 🚨 Logs para Monitoreo

### **Logs Clave a Observar:**
```
🔍 [WISHLIST-API] GET request received at:
🔐 [WISHLIST-API] Auth header present:
🔑 [WISHLIST-API] Verifying token...
✅ [WISHLIST-API] User authenticated:
📊 [WISHLIST-API] Fetching wishlist for user:
```

### **Logs de Error Críticos:**
```
❌ [WISHLIST-API] No valid authorization header
❌ [WISHLIST-API] Auth error:
❌ [WISHLIST-API] Error fetching wishlist:
❌ [WISHLIST-STORE] No auth token available
```

---

## 📋 Checklist de Implementación

### **Autenticación:**
- [ ] Mejorar función `getAuthToken()` con refresh tokens
- [ ] Agregar contexto RLS explícito en API routes
- [ ] Implementar retry logic para solicitudes fallidas
- [ ] Mejorar manejo de sesión en auth-context

### **Configuración:**
- [ ] Simplificar vercel.json eliminando rewrites innecesarios
- [ ] Verificar variables de entorno en producción
- [ ] Configurar headers CORS adecuadamente
- [ ] Testear despliegue en entorno de staging

### **Store y Estados:**
- [ ] Agregar protección contra múltiples clics
- [ ] Implementar mejor manejo de errores
- [ ] Agregar indicadores de carga
- [ ] Optimizar actualizaciones optimistas

### **Testing:**
- [ ] Probar flujo completo de wishlist
- [ ] Verificar manejo de errores de red
- [ ] Testear con múltiples usuarios simultáneos
- [ ] Validar en diferentes navegadores

---

## 🎯 Conclusión

Los problemas con la wishlist parecen estar relacionados principalmente con:

1. **Manejo de autenticación** entre cliente y servidor
2. **Configuración de RLS** en Supabase
3. **Sincronización de sesión** en producción

Las soluciones propuestas abordan estas causas raíz y deberían resolver los errores 404, los problemas de rollback y los errores de React reportados.

**Recomendación:** Implementar las soluciones en orden de prioridad, comenzando por la corrección de autenticación en las API routes.