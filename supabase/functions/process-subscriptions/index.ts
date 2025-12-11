// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Subscription {
  id: string;
  user_id: string;
  name: string;
  frequency_days: number;
  status: string;
  next_delivery_date: string;
  address_id: string;
  shipping_address_snapshot: any;
  payment_method: string;
  fixed_products: any[];
  optional_products: any[];
  base_total: number;
  shipping_fee: number;
  estimated_total: number;
  notification_days_before: number;
  email_notifications: boolean;
  whatsapp_notifications: boolean;
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
}

serve(async (req: any) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Solo permitir método POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar que sea una llamada interna o con clave de servicio
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.includes('Bearer')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🚀 Iniciando procesamiento de suscripciones...')

    // Obtener fecha actual
    const today = new Date().toISOString().split('T')[0]
    console.log(`📅 Procesando suscripciones para fecha: ${today}`)

    // 1. Obtener suscripciones activas que necesitan procesamiento
    const { data: subscriptions, error: subscriptionsError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('status', 'active')
      .lte('next_delivery_date', today)

    if (subscriptionsError) {
      console.error('❌ Error obteniendo suscripciones:', subscriptionsError)
      throw subscriptionsError
    }

    console.log(`📊 Found ${subscriptions?.length || 0} subscriptions to process`)

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No subscriptions to process',
          processed: 0,
          date: today
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as any[]
    }

    // 2. Procesar cada suscripción
    for (const subscription of subscriptions as Subscription[]) {
      try {
        console.log(`🔄 Processing subscription: ${subscription.id} - ${subscription.name}`)

        // Verificar si ya existe una entrega para esta fecha
        const { data: existingDelivery } = await supabaseClient
          .from('subscription_deliveries')
          .select('*')
          .eq('subscription_id', subscription.id)
          .eq('delivery_date', subscription.next_delivery_date)
          .single()

        if (existingDelivery) {
          console.log(`⚠️ Delivery already exists for subscription ${subscription.id}`)
          continue
        }

        // Crear entrega
        const { data: delivery, error: deliveryError } = await supabaseClient
          .from('subscription_deliveries')
          .insert({
            subscription_id: subscription.id,
            delivery_date: subscription.next_delivery_date,
            scheduled_date: subscription.next_delivery_date,
            products_snapshot: subscription.fixed_products,
            total_amount: subscription.estimated_total,
            shipping_fee: subscription.shipping_fee,
            status: 'pending'
          })
          .select()
          .single()

        if (deliveryError) {
          console.error(`❌ Error creating delivery for subscription ${subscription.id}:`, deliveryError)
          results.errors.push({
            subscription_id: subscription.id,
            error: deliveryError.message
          })
          results.failed++
          continue
        }

        // Crear pedido en la tabla orders
        const orderData = {
          items: subscription.fixed_products.map((product: any) => ({
            productName: product.product_name,
            productId: product.product_id,
            variantName: product.variant_name || null,
            variantId: product.variant_id || null,
            quantity: product.quantity,
            price: product.unit_price
          })),
          subtotal: subscription.base_total,
          discount: 0,
          shipping: subscription.shipping_fee,
          total: subscription.estimated_total,
          appliedCoupon: null,
          shippingInfo: {
            method: 'standard',
            cost: subscription.shipping_fee
          },
        }

        const { data: order, error: orderError } = await supabaseClient
          .from('orders')
          .insert({
            user_id: subscription.user_id,
            order_data: orderData,
            total_amount: subscription.estimated_total,
            subtotal: subscription.base_total,
            discount_amount: 0,
            shipping_amount: subscription.shipping_fee,
            address_id: subscription.address_id,
            shipping_address: subscription.shipping_address_snapshot,
            payment_method: subscription.payment_method,
            status: 'pendiente',
            payment_status: subscription.payment_method === 'daviplata' ? 'pagado' : 'pendiente',
            subscription_id: subscription.id, // Vincular con la suscripción
          })
          .select()
          .single()

        if (orderError) {
          console.error(`❌ Error creating order for subscription ${subscription.id}:`, orderError)
          results.errors.push({
            subscription_id: subscription.id,
            error: orderError.message
          })
          results.failed++
          continue
        }

        // Actualizar entrega con el ID del pedido
        const { error: updateError } = await supabaseClient
          .from('subscription_deliveries')
          .update({
            order_id: order.id,
            status: 'processing',
            processed_at: new Date().toISOString()
          })
          .eq('id', delivery.id)

        if (updateError) {
          console.error(`❌ Error updating delivery ${delivery.id}:`, updateError)
        }

        // Calcular próxima fecha de entrega
        const nextDeliveryDate = new Date(subscription.next_delivery_date)
        nextDeliveryDate.setDate(nextDeliveryDate.getDate() + subscription.frequency_days)

        // Actualizar suscripción
        const { error: updateSubscriptionError } = await supabaseClient
          .from('subscriptions')
          .update({
            next_delivery_date: nextDeliveryDate.toISOString().split('T')[0],
            last_delivery_date: subscription.next_delivery_date,
            total_deliveries: (subscription.total_deliveries || 0) + 1,
            successful_deliveries: (subscription.successful_deliveries || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id)

        if (updateSubscriptionError) {
          console.error(`❌ Error updating subscription ${subscription.id}:`, updateSubscriptionError)
        }

        // Enviar notificaciones
        await sendNotifications(supabaseClient, subscription, order, delivery)

        console.log(`✅ Successfully processed subscription ${subscription.id}`)
        results.processed++
        results.successful++

      } catch (error) {
        console.error(`❌ Error processing subscription ${subscription.id}:`, error)
        results.errors.push({
          subscription_id: subscription.id,
          error: (error as any).message
        })
        results.failed++
      }
    }

    console.log(`📊 Processing complete: ${results.processed} processed, ${results.successful} successful, ${results.failed} failed`)

    return new Response(
      JSON.stringify({
        message: 'Subscription processing completed',
        date: today,
        ...results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error in process-subscriptions function:', error)
    return new Response(
      JSON.stringify({ error: (error as any).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Función para enviar notificaciones
async function sendNotifications(
  supabaseClient: any,
  subscription: Subscription,
  order: any,
  delivery: any
) {
  try {
    // Obtener información del usuario
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name, preferred_name, email')
      .eq('id', subscription.user_id)
      .single()

    if (!profile) {
      console.error(`❌ Profile not found for user ${subscription.user_id}`)
      return
    }

    const displayName = profile.preferred_name || profile.full_name || 'Cliente'

    // Enviar notificación por email
    if (subscription.email_notifications) {
      await sendEmailNotification(supabaseClient, {
        to: profile.email,
        subject: `Tu pedido recurrente de Tus Aguacates está en camino`,
        template: 'subscription-delivery',
        data: {
          customerName: displayName,
          subscriptionName: subscription.name,
          orderNumber: order.id,
          deliveryDate: subscription.next_delivery_date,
          totalAmount: subscription.estimated_total,
          paymentMethod: subscription.payment_method,
          products: subscription.fixed_products
        }
      })
    }

    // Enviar notificación por WhatsApp
    if (subscription.whatsapp_notifications) {
      await sendWhatsAppNotification(supabaseClient, {
        phoneNumber: subscription.shipping_address_snapshot.phone,
        message: `🥑 *Tus Aguacates - Pedido Recurrente*\n\nHola ${displayName}!\n\nTu suscripción "${subscription.name}" ha sido procesada.\n\n*Pedido:* ${order.id}\n*Fecha de entrega:* ${new Date(subscription.next_delivery_date).toLocaleDateString('es-CO')}\n*Total:* $${subscription.estimated_total.toLocaleString('es-CO')} COP\n\n*Método de pago:* ${subscription.payment_method === 'daviplata' ? 'Daviplata' : 'Efectivo'}\n\n¡Gracias por tu confianza! 🥑`
      })
    }

  } catch (error) {
    console.error('❌ Error sending notifications:', error)
  }
}

// Función para enviar email (placeholder)
async function sendEmailNotification(supabaseClient: any, params: any) {
  // Implementar lógica de envío de email
  console.log(`📧 Sending email to ${params.to}: ${params.subject}`)
  return true
}

// Función para enviar WhatsApp (placeholder)
async function sendWhatsAppNotification(supabaseClient: any, params: any) {
  // Implementar lógica de envío de WhatsApp
  console.log(`📱 Sending WhatsApp to ${params.phoneNumber}: ${params.message}`)
  return true
}