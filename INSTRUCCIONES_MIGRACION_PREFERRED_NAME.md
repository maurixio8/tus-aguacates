# Instrucciones para Ejecutar Migración de Preferred Name

## Objetivo
Agregar el campo `preferred_name` a la tabla `profiles` para permitir saludos personalizados en Tus Aguacates.

## Pasos para Ejecutar la Migración

### Opción 1: Panel de Supabase (Recomendado)

1. **Ir al panel de Supabase**
   - Abre https://supabase.com/dashboard
   - Inicia sesión con tus credenciales
   - Selecciona el proyecto "Tus Aguacates"

2. **Navegar al Editor SQL**
   - En el menú lateral, haz clic en "SQL Editor"
   - Se abrirá una interfaz para ejecutar consultas SQL

3. **Ejecutar la migración**
   - Copia y pega el siguiente código SQL en el editor:
   ```sql
   -- ============================================================================
   -- Add preferred_name field to profiles table
   -- Purpose: Enable personalized greetings using preferred names
   -- ============================================================================

   -- Add preferred_name column to profiles table
   ALTER TABLE profiles 
   ADD COLUMN IF NOT EXISTS preferred_name VARCHAR(100);

   -- Add comment for documentation
   COMMENT ON COLUMN profiles.preferred_name IS 'Nombre preferido del cliente para saludos personalizados. Si está disponible, se usa优先 sobre full_name para los saludos.';

   -- Create index for better performance (optional but recommended)
   CREATE INDEX IF NOT EXISTS idx_profiles_preferred_name ON profiles(preferred_name) WHERE preferred_name IS NOT NULL;

   -- Success message
   SELECT 'Campo preferred_name agregado exitosamente a la tabla profiles' as status;
   ```

4. **Ejecutar la consulta**
   - Haz clic en el botón "Run" o presiona Ctrl+Enter
   - Deberías ver un mensaje de éxito

### Opción 2: Usar el archivo de migración

1. **Localizar el archivo**
   - El archivo de migración está en: `supabase/migrations/20251209_add_preferred_name_to_profiles.sql`

2. **Ejecutar el contenido**
   - Abre el archivo y copia todo el contenido SQL
   - Pégalo en el SQL Editor del panel de Supabase
   - Ejecuta la consulta

## Verificación

Para verificar que la migración se ejecutó correctamente:

1. **Verificar la estructura de la tabla**
   ```sql
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'profiles' 
   AND table_schema = 'public'
   ORDER BY ordinal_position;
   ```

2. **Verificar que el campo existe**
   ```sql
   SELECT preferred_name FROM profiles LIMIT 1;
   ```

## Cambios Implementados

Una vez ejecutada la migración, los siguientes cambios estarán disponibles:

### 1. **Nueva utilidad de saludos** (`lib/greetings.ts`)
- `getTimeBasedGreeting()`: Saludos contextuales según hora del día
- `getDisplayName()`: Lógica de fallback inteligente para nombres
- `getPersonalizedGreeting()`: Saludos personalizados completos
- `getHeaderGreeting()`: Saludos simples para header
- `getDashboardGreeting()`: Saludos completos para dashboard
- `getMessageGreeting()`: Saludos para mensajes/emails

### 2. **Prioridad de nombres (fallback inteligente)**
1. `preferred_name` (si está disponible)
2. `full_name` (si está disponible)
3. Primer nombre del email (como último recurso)

### 3. **Saludos contextuales según hora**
- **Buenos días**: 6:00 - 12:00
- **Buenas tardes**: 12:00 - 18:00
- **Buenas noches**: 18:00 - 6:00

### 4. **Componentes actualizados**
- **Header**: Muestra saludo personalizado en el header
- **PersonalizedHero**: Saludos contextuales en el dashboard
- **Página de cuenta**: Permite editar preferred_name
- **ChatBot**: Usa saludos personalizados
- **Checkout**: Saludos personalizados en proceso de compra

### 5. **Formulario de perfil**
- Los usuarios pueden configurar su `preferred_name`
- Se muestra tanto el nombre preferido como el completo
- Instrucciones claras sobre el propósito de cada campo

## Pruebas

Después de ejecutar la migración:

1. **Inicia sesión** en la aplicación
2. **Ve a tu perfil** y configura un `preferred_name`
3. **Verifica los saludos** en:
   - Header del sitio
   - Dashboard/Página principal
   - ChatBot
   - Página de checkout

## Notas Técnicas

- El campo `preferred_name` es opcional (nullable)
- Longitud máxima: 100 caracteres
- Índice creado para mejor rendimiento
- Compatible con sistema existente de Supabase
- No afecta funcionalidades existentes

## Soporte

Si encuentras algún problema durante la migración:

1. Verifica que tienes los permisos necesarios en Supabase
2. Confirma que estás en el proyecto correcto
3. Revisa la sintaxis SQL antes de ejecutar
4. Los logs de errores están disponibles en la consola del navegador

---

**Importante**: Esta migración es segura y no afecta datos existentes. El campo `preferred_name` es completamente opcional y no interfiere con el funcionamiento actual del sistema.