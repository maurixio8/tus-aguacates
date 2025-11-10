# Guía de Activación de Stripe

## Estado Actual
La aplicación está completamente funcional con todas las características implementadas, **excepto el procesamiento de pagos con Stripe**. Actualmente, los pedidos se registran en la base de datos pero los pagos deben coordinarse manualmente.

## ¿Qué Necesitas Para Activar Stripe?

### 1. Credenciales de Stripe
Necesitas obtener las siguientes claves desde tu [Dashboard de Stripe](https://dashboard.stripe.com/apikeys):

- **STRIPE_SECRET_KEY** (sk_test_... o sk_live_...)
  - Esta clave se usa en el backend (Edge Function)
  - ⚠️ NUNCA expongas esta clave en el frontend

- **STRIPE_PUBLISHABLE_KEY** (pk_test_... o pk_live_...)
  - Esta clave se usa en el frontend
  - Es segura para exposición pública

### 2. Configurar Stripe (Modo Test)
1. Crea una cuenta en [Stripe](https://dashboard.stripe.com/register)
2. Activa el modo de prueba
3. Copia tus claves de test (empiezan con `sk_test_` y `pk_test_`)

## Pasos de Activación

### Paso 1: Configurar Variables de Entorno en Supabase

```bash
# Configurar la clave secreta de Stripe
supabase secrets set STRIPE_SECRET_KEY=sk_test_TU_CLAVE_AQUI
```

### Paso 2: Activar el Edge Function

1. Abre el archivo: `supabase/functions/create-payment-intent/index.ts`
2. Localiza la sección comentada (línea ~50):
   ```typescript
   // STRIPE INTEGRATION - DESCOMENTAR CUANDO TENGAS LAS CREDENCIALES
   ```
3. Descomenta todo el bloque de código de Stripe
4. Comenta la sección "SOLUCIÓN TEMPORAL"

### Paso 3: Redesplegar el Edge Function

```bash
cd /workspace/tus-aguacates
supabase functions deploy create-payment-intent
```

### Paso 4: Configurar la Clave Pública en el Frontend

1. Abre el archivo `.env.local`
2. Agrega la variable:
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_TU_CLAVE_AQUI
   ```

### Paso 5: Instalar Stripe en el Frontend

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### Paso 6: Actualizar la Página de Checkout

El código de la página de checkout (`app/checkout/page.tsx`) ya está preparado para Stripe. Necesitas:

1. Importar los componentes de Stripe:
```typescript
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
```

2. Inicializar Stripe:
```typescript
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
```

3. Reemplazar el mensaje temporal por el formulario de pago real con `CardElement`

### Paso 7: Probar la Integración

Usa las tarjetas de prueba de Stripe:
- **Éxito**: 4242 4242 4242 4242
- **Requiere autenticación**: 4000 0025 0000 3155
- **Fallo**: 4000 0000 0000 9995

Fecha de expiración: Cualquier fecha futura
CVC: Cualquier 3 dígitos
Código postal: Cualquier 5 dígitos

## Ejemplo de Código para el Frontend

```typescript
// Crear Payment Intent
async function handlePlaceOrder() {
  setProcessing(true);
  
  try {
    // Llamar al Edge Function
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-payment-intent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          amount: total,
          currency: 'cop',
          cartItems: items.map(item => ({
            product_id: item.id,
            product_name: item.product?.name,
            quantity: item.quantity,
            price: item.product?.discount_price || item.product?.price
          })),
          customerEmail: user?.email,
          shippingAddress: shippingAddress,
          userId: user?.id
        })
      }
    );

    const { data, error } = await response.json();
    
    if (error) {
      throw new Error(error.message);
    }

    // Confirmar pago con Stripe
    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
      data.clientSecret,
      {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: shippingAddress.fullName,
            email: user?.email
          }
        }
      }
    );

    if (stripeError) {
      throw stripeError;
    }

    if (paymentIntent.status === 'succeeded') {
      clearCart();
      router.push(`/checkout/confirmacion?order=${data.orderNumber}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
    setError(error.message);
  } finally {
    setProcessing(false);
  }
}
```

## Webhook de Stripe (Opcional pero Recomendado)

Para producción, configura un webhook para manejar eventos de Stripe:

1. Crea un nuevo Edge Function: `stripe-webhook`
2. Configura el endpoint en Stripe Dashboard
3. Maneja eventos como `payment_intent.succeeded`, `payment_intent.failed`

## Modo Producción

Cuando estés listo para producción:

1. Obtén las claves de producción (sk_live_... y pk_live_...)
2. Actualiza las variables de entorno
3. Redesplega el Edge Function
4. Rebuilda y redesplega el frontend

## Soporte

Si tienes dudas, consulta:
- [Documentación de Stripe](https://stripe.com/docs)
- [Stripe + Supabase Guide](https://supabase.com/partners/integrations/stripe)
- [Stripe Testing](https://stripe.com/docs/testing)

## Checklist de Activación

- [ ] Obtener credenciales de Stripe
- [ ] Configurar STRIPE_SECRET_KEY en Supabase
- [ ] Descomentar código de Stripe en Edge Function
- [ ] Redesplegar Edge Function
- [ ] Configurar NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY en .env.local
- [ ] Instalar paquetes de Stripe en frontend
- [ ] Actualizar página de checkout con Stripe Elements
- [ ] Probar con tarjetas de prueba
- [ ] Configurar webhook (opcional)
- [ ] Probar flujo completo de pago

---

**Nota**: La aplicación funciona completamente sin Stripe. Los usuarios pueden hacer pedidos y estos se registran en la base de datos. Stripe solo es necesario para automatizar el procesamiento de pagos.
