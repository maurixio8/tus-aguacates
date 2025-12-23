# Instrucciones para Ejecutar Políticas RLS en Supabase

## PASO 1: Acceder al Dashboard de Supabase

1. Abre tu navegador web y ve a: https://supabase.com/dashboard/project/gxqkmaaqoehydulksudj/sql
2. Inicia sesión con tus credenciales de Supabase si es necesario

## PASO 2: Ejecutar el Script SQL

1. Copia todo el contenido del archivo `create-wishlist-policies.sql`
2. Pega el contenido en el editor SQL del dashboard de Supabase
3. Haz clic en el botón "Run" o "Ejecutar" para ejecutar el script

## PASO 3: Verificar los Resultados

Después de ejecutar el script, deberías ver los siguientes resultados:

### 1. Verificación de políticas creadas:
Deberías ver una tabla con las siguientes políticas:
- Users can view own wishlist (SELECT)
- Users can insert own wishlist items (INSERT)
- Users can update own wishlist items (UPDATE)
- Users can delete own wishlist items (DELETE)

### 2. Verificación de RLS habilitado:
Deberías ver que la tabla `wishlist` tiene `rowsecurity = true`

### 3. Verificación de estructura de tabla:
Deberías ver las columnas de la tabla wishlist con sus tipos de datos

## PASO 4: Verificación Visual en el Dashboard

1. Ve a la sección "Table Editor" en el dashboard de Supabase
2. Selecciona la tabla `wishlist`
3. Haz clic en la pestaña "RLS Policies" o "Políticas RLS"
4. Deberías ver las 4 políticas creadas correctamente

## PASO 5: Probar el Sistema

Una vez ejecutado el script, puedes probar el sistema de favoritos:

1. Inicia sesión en la aplicación con el usuario de prueba
2. Intenta agregar un producto a favoritos
3. Verifica que no aparezca el error 500
4. Comprueba que el producto se agregue correctamente
5. Ve a la página de favoritos y verifica que aparezca el producto
6. Intenta eliminar el producto de favoritos y confirma que funcione

## Si Encuentras Errores

Si durante la ejecución del script encuentras algún error:

1. Toma una captura de pantalla del mensaje de error
2. Verifica que el script se haya copiado completamente
3. Asegúrate de tener los permisos necesarios para ejecutar comandos DDL
4. Intenta ejecutar el script por partes para identificar el problema

## Notas Importantes

- El script elimina políticas existentes antes de crear las nuevas para evitar conflictos
- Todas las políticas usan `auth.uid()` para asegurar que los usuarios solo puedan acceder a sus propios favoritos
- Las políticas son permisivas (permissive) y no restrictivas
- El script incluye verificaciones automáticas para confirmar que todo se creó correctamente

## Contacto

Si tienes problemas durante la ejecución, no dudes en consultar la documentación de Supabase sobre RLS:
https://supabase.com/docs/guides/auth/row-level-security