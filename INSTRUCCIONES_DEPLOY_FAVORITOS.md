# Instrucciones de Despliegue - Funcionalidad de Favoritos

## 1. Resumen de los cambios implementados

### Archivos nuevos:
- `lib/wishlist-store.ts` - Store de Zustand para gestionar el estado de favoritos
- `app/api/wishlist/route.ts` - API endpoint para obtener y agregar productos a favoritos
- `app/api/wishlist/[id]/route.ts` - API endpoint para eliminar productos de favoritos
- `app/perfil/favoritos/page.tsx` - Página dedicada para visualizar los productos favoritos

### Archivos modificados:
- `components/product/ProductCard.tsx` - Agregado botón de favoritos con funcionalidad completa
- `components/product/ProductDetailModal.tsx` - Agregado botón de favoritos en el modal de detalles
- `app/cuenta/page.tsx` - Agregada sección de favoritos en el dashboard del usuario
- `lib/supabase.ts` - Actualizado con tipos relacionados (aunque la tabla ya existía)

### Cambios en la base de datos:
- La tabla `wishlist` ya existía en la migración `1762450896_create_cart_and_wishlist.sql`
- Se han configurado las políticas RLS (Row Level Security) para asegurar que los usuarios solo puedan acceder a sus propios favoritos

## 2. Requisitos previos para el despliegue

### Verificaciones necesarias en la base de datos:
1. **Verificar que la tabla wishlist existe**:
   ```sql
   SELECT * FROM information_schema.tables WHERE table_name = 'wishlist';
   ```

2. **Verificar las políticas RLS**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'wishlist';
   ```

3. **Verificar índices**:
   ```sql
   SELECT * FROM pg_indexes WHERE tablename = 'wishlist';
   ```

### Configuraciones requeridas en Supabase:
1. **Asegurar que las políticas RLS estén activas**:
   - Users can view own wishlist
   - Users can add to own wishlist
   - Users can delete from own wishlist

2. **Verificar que la autenticación esté configurada correctamente**:
   - JWT tokens configurados
   - Proveedores de autenticación activos

### Variables de entorno necesarias:
Las siguientes variables de entorno ya deberían estar configuradas en el proyecto:
- `NEXT_PUBLIC_SUPABASE_URL` - URL de tu proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Clave anónima de Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Clave de servicio de Supabase (para operaciones administrativas)

## 3. Pasos para el despliegue en Vercel

### Comandos específicos para ejecutar:
1. **Instalar dependencias**:
   ```bash
   cd tus-aguacates
   npm install
   ```

2. **Construir el proyecto**:
   ```bash
   npm run build
   ```

3. **Verificar la construcción localmente**:
   ```bash
   npm start
   ```

### Orden de ejecución de los comandos:
1. Primero, asegúrate de que todas las dependencias estén instaladas
2. Ejecuta el comando de construcción
3. Verifica que no haya errores de construcción
4. Despliega en Vercel (ya sea mediante CLI o integración Git)

### Verificaciones posteriores al despliegue:
1. **Verificar que el sitio cargue correctamente**
2. **Probar la autenticación de usuarios**
3. **Verificar que los endpoints de API respondan correctamente**:
   - `GET /api/wishlist`
   - `POST /api/wishlist`
   - `DELETE /api/wishlist/[id]`

## 4. Pasos para el despliegue de funciones de Supabase (si es necesario)

En este caso, **no se requiere desplegar funciones de Supabase** ya que toda la lógica de favoritos se implementa a través de:
- API Routes de Next.js
- Store de Zustand en el cliente
- Operaciones directas a la base de datos a través del cliente de Supabase

## 5. Pruebas post-despliegue

### Lista de pruebas específicas para realizar después del despliegue:

#### Pruebas de autenticación:
1. **Iniciar sesión con un usuario existente**
2. **Crear una nueva cuenta de usuario**
3. **Verificar que el estado de autenticación se mantenga**

#### Pruebas de funcionalidad de favoritos:
1. **Agregar un producto a favoritos**:
   - Desde la página de productos
   - Desde el modal de detalles del producto
   - Verificar que el botón cambie de estado

2. **Ver la lista de favoritos**:
   - Acceder a `/perfil/favoritos`
   - Verificar que los productos agregados aparezcan
   - Verificar el contador de favoritos en `/cuenta`

3. **Eliminar productos de favoritos**:
   - Desde la tarjeta de producto en la lista de favoritos
   - Desde el botón de favoritos en la página de productos
   - Verificar que el producto se elimine correctamente

4. **Pruebas de persistencia**:
   - Cerrar sesión y volver a iniciar
   - Verificar que los favoritos se mantengan
   - Probar en diferentes navegadores/dispositivos

#### Pruebas de casos límite:
1. **Agregar el mismo producto dos veces** (no debería permitir duplicados)
2. **Intentar acceder a favoritos sin estar autenticado** (debería redirigir a login)
3. **Probar con productos que no existen** (debería manejar el error)
4. **Probar con usuarios que no tienen favoritos** (debería mostrar estado vacío)

### Cómo verificar que la funcionalidad de favoritos funciona en producción:
1. **Usar las herramientas de desarrollador del navegador** para verificar:
   - Las llamadas a la API (`/api/wishlist`)
   - Las respuestas y códigos de estado
   - El almacenamiento local del store de Zustand

2. **Revisar la consola de Supabase** para:
   - Verificar las consultas a la base de datos
   - Comprobar que las políticas RLS funcionen correctamente

3. **Probar con diferentes usuarios** para asegurar el aislamiento de datos

## 6. Solución de problemas comunes

### Problemas potenciales y sus soluciones:

#### Problema: Los favoritos no se guardan
**Síntomas**: Al agregar un producto a favoritos, este no aparece en la lista
**Soluciones**:
1. Verificar que el usuario esté autenticado
2. Revisar la consola del navegador para errores de JavaScript
3. Verificar las variables de entorno de Supabase
4. Comprobar que las políticas RLS estén configuradas correctamente

#### Problema: Error de CORS al llamar a la API
**Síntomas**: Error de CORS en la consola del navegador
**Soluciones**:
1. Verificar que los endpoints de API estén configurados correctamente
2. Comprobar que los encabezados de autorización se envíen correctamente
3. Revisar la configuración de CORS en Vercel

#### Problema: Los favoritos no se cargan al iniciar sesión
**Síntomas**: La lista de favoritos aparece vacía aunque el usuario tiene productos guardados
**Soluciones**:
1. Verificar que el store de Zustand se inicialice correctamente
2. Comprobar que la función `loadWishlist` se ejecute al iniciar sesión
3. Revisar la consulta a la base de datos en el endpoint `/api/wishlist`

#### Problema: El contador de favoritos no se actualiza
**Síntomas**: El número de favoritos no coincide con los productos reales
**Soluciones**:
1. Verificar que el store se actualice correctamente después de cada operación
2. Comprobar que la función `getWishlistCount` retorne el valor correcto
3. Revisar la sincronización entre el estado local y la base de datos

### Cómo verificar logs si algo falla:

#### Logs en Vercel:
1. Acceder al dashboard de Vercel
2. Ir a la pestaña "Logs" del proyecto
3. Filtrar por errores o por endpoints específicos (`/api/wishlist`)

#### Logs en Supabase:
1. Acceder al dashboard de Supabase
2. Ir a la sección "Database" > "Logs"
3. Filtrar por consultas a la tabla `wishlist`

#### Logs en el navegador:
1. Abrir las herramientas de desarrollador (F12)
2. Ir a la pestaña "Console"
3. Buscar errores de JavaScript o fallos en las llamadas a la API

## 7. Rollback (si es necesario)

### Pasos para revertir los cambios si algo sale mal:

#### Opción 1: Revertir el código (si el problema está en la aplicación)
1. **Revertir al commit anterior**:
   ```bash
   git log --oneline
   git revert <commit-hash>
   git push origin main
   ```

2. **Forzar un nuevo despliegue en Vercel**:
   - Vercel detectará el cambio y desplegará automáticamente

#### Opción 2: Deshabilitar la funcionalidad (si necesitas una solución rápida)
1. **Comentar o eliminar los componentes de favoritos**:
   - En `ProductCard.tsx`: comentar el botón de favoritos
   - En `ProductDetailModal.tsx`: comentar el botón de favoritos
   - En `app/cuenta/page.tsx`: comentar la sección de favoritos

2. **Redirigir la página de favoritos**:
   - En `app/perfil/favoritos/page.tsx`: agregar una redirección a `/cuenta`

#### Opción 3: Revertir cambios en la base de datos (si es necesario)
1. **Desactivar las políticas RLS** (temporalmente):
   ```sql
   ALTER TABLE wishlist DISABLE ROW LEVEL SECURITY;
   ```

2. **Eliminar la tabla wishlist** (solo como último recurso):
   ```sql
   DROP TABLE IF EXISTS wishlist CASCADE;
   ```

### Verificación después del rollback:
1. **Probar que el sitio funcione sin la funcionalidad de favoritos**
2. **Verificar que el resto de funcionalidades no se vean afectadas**
3. **Comprobar que los usuarios puedan navegar y comprar normalmente**

---

## Notas importantes:

1. **La funcionalidad de favoritos depende completamente de la autenticación de usuarios**
2. **No se requieren migraciones de base de datos adicionales** ya que la tabla ya existía
3. **Toda la lógica se implementa en el cliente y a través de API Routes de Next.js**
4. **El store de Zustand maneja el estado local y la sincronización con la base de datos**
5. **Las políticas RLS aseguran que cada usuario solo pueda acceder a sus propios favoritos**

Si encuentras algún problema durante el despliegue, revisa primero los logs y verifica que todas las variables de entorno estén configuradas correctamente.