# Guía de Pruebas - Sistema de Personalización y Direcciones

## Resumen de lo Implementado

Has completado una mejora MASIVA para tu tienda online:

### ✅ Funcionalidades Críticas Implementadas

1. **Sistema de Direcciones** (NUEVO)
   - Gestión completa de múltiples direcciones
   - Dirección por defecto
   - Selector de direcciones en checkout

2. **Checkout para Usuarios Autenticados** (CRÍTICO - Antes estaba bloqueado)
   - Ahora los usuarios registrados PUEDEN completar compras
   - Integración con sistema de direcciones
   - Selección de método de pago

3. **Migración Automática de Pedidos** (NUEVO)
   - Pedidos de invitados se migran automáticamente al crear cuenta

4. **Sistema de Recomendaciones** (NUEVO)
   - Algoritmo basado en historial de compras
   - Recomendaciones personalizadas

5. **Personalización del Home** (NUEVO)
   - Saludo personalizado con nombre del usuario
   - Estadísticas de usuario (pedidos, gasto, categoría favorita)
   - Resumen del último pedido
   - Productos recomendados

## Pasos de Prueba

### Paso 1: Aplicar la Migración SQL

**IMPORTANTE: Antes de probar nada, debes aplicar la migración de base de datos.**

Sigue las instrucciones en `MIGRATION_INSTRUCTIONS.md`:

1. Ve a https://supabase.com/dashboard/project/gxqkmaaqoehydulksudj/sql/new
2. Copia el contenido de `supabase/migrations/20251129_create_addresses_table.sql`
3. Pega y ejecuta
4. Verifica: "Success. No rows returned"

### Paso 2: Iniciar el Servidor

```bash
cd tus-aguacates
npm run dev
```

El sitio debería estar en http://localhost:3000 (o el puerto que se indique).

### Paso 3: Probar Home Page (Usuario No Autenticado)

**URL**: http://localhost:3000

**Debe mostrar:**
- ✅ Hero genérico con "Del Corazón de Colombia a tu Mesa"
- ✅ Botones: "Explorar Productos" y "Crear Cuenta"
- ✅ Beneficios (100% Fresco, Entrega Rápida, Calidad Garantizada)
- ✅ Categorías en scroll horizontal
- ✅ Promociones
- ✅ CTA final

**NO debe mostrar:**
- ❌ Saludo personalizado
- ❌ Estadísticas de usuario
- ❌ Últim pedido
- ❌ Productos recomendados

### Paso 4: Crear Cuenta o Iniciar Sesión

**Opción A: Crear cuenta nueva**
1. Clic en "Crear Cuenta" o ir a /auth/register
2. Completar formulario con:
   - Email: test@example.com (o cualquier email)
   - Contraseña: Al menos 6 caracteres
3. Verificar que te redirige al home

**Opción B: Usar cuenta existente**
1. Ir a /auth/login
2. Ingresar credenciales
3. Verificar redirección al home

### Paso 5: Verificar Home Personalizado

**URL**: http://localhost:3000 (después de login)

**Debe mostrar:**

#### A. Hero Personalizado
- ✅ Saludo según hora: "Buenos días/tardes/noches, [Nombre]"
- ✅ "Bienvenido de vuelta a Tus Aguacates"
- ✅ 3 tarjetas de estadísticas:
  - Total de pedidos realizados
  - Total invertido ($)
  - Categoría favorita (basada en compras)
- ✅ Botones: "Explorar Productos" y "Ver Mi Cuenta"

#### B. Resumen del Último Pedido (si tienes pedidos)
- ✅ Número de pedido (primeros 8 caracteres del ID)
- ✅ Fecha del pedido
- ✅ Total del pedido
- ✅ Estado del pedido con ícono
- ✅ Método de pago
- ✅ Botones: "Ver Detalles" y "Pedir Nuevamente"

#### C. Productos Recomendados (si tienes historial)
- ✅ Título: "Recomendados para ti"
- ✅ Subtítulo: "Basado en tus compras anteriores"
- ✅ Grid de productos (hasta 6)
- ✅ Cada producto con imagen, precio, rating
- ✅ Botón "Agregar al Carrito"
- ✅ Botón "Ver Todos los Productos" al final

### Paso 6: Verificar Header Personalizado

**En cualquier página (estando autenticado):**

- ✅ El ícono de usuario debe mostrar: "Hola, [TuNombre]"
- ✅ El nombre se extrae del email (parte antes del @)
- ✅ Primera letra en mayúscula

### Paso 7: Probar Gestión de Direcciones

**URL**: http://localhost:3000/cuenta

**Debe tener una sección "Mis Direcciones" con:**

#### A. Lista de Direcciones (si tienes alguna)
- ✅ Cada dirección muestra:
  - Etiqueta (Casa, Trabajo, etc.)
  - Nombre completo
  - Dirección completa
  - Teléfono
  - Badge "Por defecto" en la dirección default
- ✅ Botones: "Editar" y "Eliminar" por dirección
- ✅ Opción "Hacer por defecto"

#### B. Agregar Nueva Dirección
1. Clic en "Agregar Nueva Dirección"
2. Formulario debe tener:
   - Etiqueta (Casa, Trabajo, Oficina, Otro)
   - Nombre completo *
   - Teléfono *
   - Dirección *
   - Ciudad *
   - Departamento (default: Cundinamarca)
   - Código Postal
   - Información adicional
   - Checkbox "Hacer dirección por defecto"
3. Completar y guardar
4. Verificar que aparece en la lista

#### C. Editar Dirección
1. Clic en "Editar" en cualquier dirección
2. Modificar campos
3. Guardar
4. Verificar cambios

#### D. Eliminar Dirección
1. Clic en "Eliminar"
2. Confirmar
3. Verificar que desaparece

### Paso 8: Probar Checkout Autenticado (CRÍTICO)

**ANTES esta funcionalidad estaba BLOQUEADA. Ahora debe funcionar.**

#### A. Agregar Productos al Carrito
1. Ir a /productos o /tienda
2. Agregar 1-2 productos al carrito
3. Abrir el carrito (ícono en header)
4. Verificar productos

#### B. Ir al Checkout
1. Clic en "Proceder al Pago" en el carrito
2. Deberías ver: **AuthenticatedCheckoutForm** (NO el mensaje "en desarrollo")

#### C. Paso 1 - Seleccionar Dirección
**Debe mostrar:**
- ✅ Lista de tus direcciones guardadas con radio buttons
- ✅ Dirección por defecto pre-seleccionada
- ✅ Opción "Agregar nueva dirección" con formulario expandible
- ✅ Botón "Continuar" para pasar al siguiente paso

**Prueba:**
1. Seleccionar una dirección
2. Clic en "Continuar"

#### D. Paso 2 - Método de Pago
**Debe mostrar:**
- ✅ Resumen del pedido (productos, cantidades, precios)
- ✅ Dirección de entrega seleccionada
- ✅ Opciones de pago:
  - Daviplata
  - Efectivo contra entrega
- ✅ Instrucciones según método seleccionado
- ✅ Total a pagar
- ✅ Botón "Confirmar Pedido"

**Prueba:**
1. Seleccionar "Daviplata"
   - Debe mostrar número de teléfono e instrucciones
2. Seleccionar "Efectivo"
   - Debe mostrar instrucciones diferentes
3. Clic en "Confirmar Pedido"
4. Verificar que el pedido se crea exitosamente
5. Deberías ser redirigido a la página de éxito o cuenta

### Paso 9: Probar Migración de Pedidos de Invitado

**Este es un escenario especial:**

#### A. Crear Pedido como Invitado
1. Cerrar sesión
2. Agregar productos al carrito
3. Ir a checkout
4. Completar como invitado con un email (ej: migration-test@example.com)
5. Confirmar pedido
6. Anotar el número de pedido

#### B. Crear Cuenta con el Mismo Email
1. Ir a /auth/register
2. Registrarse con el MISMO email usado como invitado
3. Completar registro

#### C. Verificar Migración Automática
1. Ir a /cuenta
2. En "Mis Pedidos" debería aparecer el pedido que hiciste como invitado
3. El pedido debe tener una nota o indicador de que fue migrado

### Paso 10: Verificar Algoritmo de Recomendaciones

**Requiere historial de compras:**

1. Crear al menos 2-3 pedidos con productos de diferentes categorías
2. Ir al home (autenticado)
3. Verificar sección "Recomendados para ti"

**El algoritmo debe:**
- ✅ NO mostrar productos que ya compraste
- ✅ Priorizar productos de categorías que compras frecuentemente
- ✅ Mostrar productos destacados
- ✅ Mostrar productos con descuento
- ✅ Mostrar productos con alto rating
- ✅ Ordenar por puntuación (mejor primero)

## Checklist Final

Marca cada item después de probarlo:

### Funcionalidad
- [ ] Home genérico para usuarios no autenticados funciona
- [ ] Registro de usuarios funciona
- [ ] Login de usuarios funciona
- [ ] Home personalizado muestra saludo y nombre
- [ ] Estadísticas de usuario se muestran correctamente
- [ ] Último pedido se muestra (si existe)
- [ ] Productos recomendados se muestran (si existe historial)
- [ ] Header muestra "Hola, [Nombre]"
- [ ] Gestión de direcciones (CRUD) funciona
- [ ] Dirección por defecto se marca correctamente
- [ ] Checkout autenticado funciona (ANTES BLOQUEADO)
- [ ] Selección de dirección en checkout funciona
- [ ] Creación de pedido autenticado funciona
- [ ] Migración de pedidos de invitado funciona
- [ ] Algoritmo de recomendaciones muestra productos relevantes

### Base de Datos
- [ ] Migración SQL aplicada sin errores
- [ ] Tabla `addresses` existe
- [ ] Tabla `orders` tiene columnas `address_id` y `shipping_address`
- [ ] Políticas RLS funcionan (usuarios solo ven sus datos)

### UX/UI
- [ ] Diseño coherente con el resto del sitio
- [ ] Colores y fuentes consistentes
- [ ] Botones y enlaces funcionan
- [ ] Animaciones y transiciones suaves
- [ ] Responsive (funciona en móvil y desktop)

## Problemas Comunes

### "Error al cargar estadísticas"
- Verifica que la migración SQL se aplicó correctamente
- Revisa la consola del navegador para errores específicos

### "No se muestran productos recomendados"
- Es normal si no tienes historial de compras
- Crea al menos 1-2 pedidos primero

### "Checkout sigue bloqueado"
- Verifica que estás autenticado
- Borra caché del navegador (Ctrl+Shift+R)
- Verifica que no hay errores en consola

### "Direcciones no se guardan"
- Verifica que aplicaste la migración SQL
- Revisa permisos RLS en Supabase

## Próximos Pasos Opcionales

Funcionalidades que podrías agregar en el futuro:

1. **Email de confirmación** al crear cuenta
2. **Notificaciones push** para actualizaciones de pedidos
3. **Sistema de puntos/lealtad** para clientes frecuentes
4. **Favoritos/Lista de deseos** (ya tienes el ícono de corazón)
5. **Compartir productos** en redes sociales
6. **Reviews/Calificaciones** de productos
7. **Cupones de descuento** personalizados
8. **Suscripciones** para entregas recurrentes

---

**¿Encontraste algún problema?** Revisa:
- Consola del navegador (F12 → Console)
- Network tab para errores de API
- Supabase Dashboard → Table Editor para verificar datos
- Supabase Dashboard → Logs para errores del backend

**Todo funciona bien?** ¡Excelente! Has implementado un sistema de personalización completo y profesional para tu tienda. 🎉
