# Instrucciones de Migración - Sistema de Suscripciones

## Resumen

Este documento describe cómo ejecutar la migración para implementar el sistema de suscripciones recurrentes automáticas en Tus Aguacates.

## Tablas a Crear

### 1. `subscriptions`
Almacena la información principal de las suscripciones de clientes:
- Configuración de productos fijos y opcionales
- Frecuencia de entrega (cada 15 días por defecto)
- Dirección y método de pago
- Estado y fechas importantes

### 2. `subscription_deliveries`
Registra cada entrega generada por una suscripción:
- Vincula con el pedido creado
- Estado de procesamiento y pago
- Historial de entregas exitosas y fallidas

### 3. `subscription_modifications`
Mantiene un historial de cambios en las suscripciones:
- Modificaciones de productos, dirección, pago
- Pausas, reanudaciones y cancelaciones
- Auditoría completa de cambios

## Método 1: Ejecutar Script Automático

### Requisitos
- Node.js instalado
- Acceso a las credenciales de Supabase

### Pasos

1. **Navegar al directorio del proyecto**
```bash
cd "tus-aguacates"
```

2. **Ejecutar el script de migración**
```bash
node scripts/run-subscription-migration.js
```

3. **Verificar resultado**
El script mostrará:
```
🚀 Iniciando migración de tabla de suscripciones...
📄 Leyendo archivo de migración...
✅ Migración ejecutada exitosamente
📊 Tablas creadas:
   - subscriptions
   - subscription_deliveries
   - subscription_modifications
🔧 Funciones creadas:
   - calculate_next_delivery_date()
   - create_subscription_delivery()
🛡️ Políticas RLS configuradas para acceso seguro
🎉 Sistema de suscripciones listo para usar!
```

## Método 2: Ejecutar Manualmente en Supabase

### Pasos

1. **Abrir el Editor SQL de Supabase**
   - Iniciar sesión en [supabase.com](https://supabase.com)
   - Seleccionar el proyecto "gxqkmaaqoehydulksudj"
   - Ir a "SQL Editor"

2. **Copiar y pegar el contenido**
   - Abrir el archivo: `supabase/migrations/20251209_create_subscriptions_table.sql`
   - Copiar todo el contenido
   - Pegar en el editor SQL

3. **Ejecutar la migración**
   - Hacer clic en "Run" o presionar Ctrl+Enter
   - Esperar a que se complete la ejecución

4. **Verificar creación de tablas**
   - Ir a "Table Editor"
   - Confirmar que aparecen las nuevas tablas:
     - `subscriptions`
     - `subscription_deliveries`
     - `subscription_modifications`

## Verificación Post-Migración

### 1. Verificar Tablas
```sql
-- Verificar que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%subscription%';
```

### 2. Verificar Políticas RLS
```sql
-- Verificar políticas de seguridad
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename LIKE '%subscription%';
```

### 3. Verificar Funciones
```sql
-- Verificar funciones creadas
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%subscription%' OR routine_name LIKE '%delivery%';
```

## Configuración Adicional

### 1. Índices Optimizados
La migración crea automáticamente los índices necesarios para:
- Búsquedas por usuario
- Consultas de estado
- Fechas de entrega
- Relaciones entre tablas

### 2. Políticas de Seguridad (RLS)
Se configuran políticas para:
- **Usuarios**: Solo ven y gestionan sus propias suscripciones
- **Admins**: Tienen acceso completo para gestión
- **Invitados**: Sin acceso directo (solo a través de autenticación)

### 3. Triggers Automáticos
- **updated_at**: Se actualiza automáticamente en cada modificación
- **create_delivery_on_activation**: Crea entrega al activar suscripción

## Características Implementadas

### 1. Gestión de Productos
- **Productos fijos**: Siempre incluidos en cada entrega
- **Productos opcionales**: El cliente puede modificarlos
- **Snapshot de productos**: Preserva precios y datos al momento de la suscripción

### 2. Control de Entregas
- **Frecuencia configurable**: Por defecto cada 15 días
- **Programación automática**: Calcula próximas fechas
- **Historial completo**: Registro de todas las entregas

### 3. Sistema de Pagos
- **Métodos soportados**: Daviplata y Efectivo
- **Integración con pedidos**: Vincula entregas con órdenes
- **Estado de pago**: Seguimiento completo del proceso

### 4. Notificaciones
- **Configurable**: Email y WhatsApp
- **Anticipadas**: Días antes de cada entrega
- **Automáticas**: Integradas con el sistema existente

## Solución de Problemas

### Error: "Relation already exists"
**Causa**: Las tablas ya existen de una migración anterior
**Solución**: Ejecutar solo las partes faltantes o eliminar y recrear

### Error: "Permission denied"
**Causa**: No tienes permisos de administrador en Supabase
**Solución**: Usar una cuenta con permisos de service_role

### Error: "Function already exists"
**Causa**: Las funciones ya fueron creadas
**Solución**: Usar `CREATE OR REPLACE FUNCTION` en lugar de `CREATE FUNCTION`

## Pruebas Recomendadas

### 1. Crear Suscripción de Prueba
```sql
INSERT INTO subscriptions (
  user_id,
  name,
  frequency_days,
  next_delivery_date,
  address_id,
  payment_method,
  fixed_products,
  estimated_total
) VALUES (
  'test-user-id',
  'Suscripción de Prueba',
  15,
  CURRENT_DATE + 15,
  'test-address-id',
  'daviplata',
  '[{"product_id": "test", "quantity": 1, "unit_price": 10000}]',
  10000
);
```

### 2. Verificar Creación Automática
```sql
-- Verificar que se creó la entrega correspondiente
SELECT * FROM subscription_deliveries 
WHERE subscription_id = 'test-subscription-id';
```

## Soporte

Si encuentras algún problema durante la migración:

1. **Revisa los logs** en la consola de Supabase
2. **Verifica permisos** del usuario que ejecuta la migración
3. **Confirma que no existan** tablas con el mismo nombre
4. **Ejecuta en partes** si hay errores específicos

## Siguiente Paso

Una vez completada la migración, el sistema estará listo para:

1. **Implementar interfaz de configuración** en el checkout
2. **Crear panel de gestión** para clientes
3. **Desarrollar sistema de procesamiento** automático
4. **Configurar notificaciones** automáticas

---

**Importante**: Esta migración es fundamental para el sistema de ingresos recurrentes. Asegúrate de ejecutarla completamente antes de continuar con la implementación de la interfaz de usuario.