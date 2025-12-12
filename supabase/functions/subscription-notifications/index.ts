// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Verificar autorización
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔔 Iniciando envío de notificaciones de suscripciones...')

    // Obtener fecha actual y fecha de notificación (días antes)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const notificationDate = tomorrow.toISOString().split('T')[0]

    console.log(`📅 Enviando notificaciones para fecha: ${notificationDate}`)

    // 1. Obtener suscripciones que necesitan notificación
    const { data: subscriptions, error: subscriptionsError } = await supabaseClient
      .from('subscriptions')
      .select(`
        *,
        profiles!inner(full_name, preferred_name, email),
        addresses!inner(label, full_name, phone, street_address, city, state)
      `)
      .eq('status', 'active')
      .eq('next_delivery_date', notificationDate)
      .eq('email_notifications', true)

    if (subscriptionsError) {
      console.error('❌ Error obteniendo suscripciones:', subscriptionsError)
      throw subscriptionsError
    }

    console.log(`📊 Found ${subscriptions?.length || 0} subscriptions to notify`)

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No subscriptions to notify',
          notified: 0,
          date: notificationDate
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results = {
      processed: 0,
      email_sent: 0,
      whatsapp_sent: 0,
      errors: [] as any[]
    }

    // 2. Enviar notificaciones para cada suscripción
    for (const subscription of subscriptions) {
      try {
        console.log(`🔄 Processing notifications for subscription: ${subscription.id} - ${subscription.name}`)

        // Verificar si ya se envió notificación
        const { data: existingNotification } = await supabaseClient
          .from('subscription_deliveries')
          .select('notification_sent')
          .eq('subscription_id', subscription.id)
          .eq('delivery_date', subscription.next_delivery_date)
          .single()

        if (existingNotification?.notification_sent) {
          console.log(`⚠️ Notification already sent for subscription ${subscription.id}`)
          continue
        }

        const displayName = subscription.profiles?.preferred_name || 
                         subscription.profiles?.full_name || 
                         'Cliente'

        // Preparar datos del email
        const emailData = {
          customerName: displayName,
          subscriptionName: subscription.name,
          deliveryDate: subscription.next_delivery_date,
          totalAmount: subscription.estimated_total,
          paymentMethod: subscription.payment_method,
          products: subscription.fixed_products,
          address: subscription.addresses,
          frequencyDays: subscription.frequency_days,
          notificationDaysBefore: subscription.notification_days_before
        }

        // Enviar email
        if (subscription.email_notifications) {
          const emailSent = await sendEmailNotification(supabaseClient, {
            to: subscription.profiles?.email,
            subject: `Tu entrega de Tus Aguacates está próxima`,
            template: 'subscription-reminder',
            data: emailData
          })

          if (emailSent) {
            results.email_sent++
            console.log(`✅ Email sent for subscription ${subscription.id}`)
          } else {
            results.errors.push({
              subscription_id: subscription.id,
              error: 'Failed to send email'
            })
          }
        }

        // Enviar WhatsApp
        if (subscription.whatsapp_notifications) {
          const whatsappSent = await sendWhatsAppNotification(supabaseClient, {
            phoneNumber: subscription.addresses?.phone,
            message: buildWhatsAppMessage(emailData)
          })

          if (whatsappSent) {
            results.whatsapp_sent++
            console.log(`✅ WhatsApp sent for subscription ${subscription.id}`)
          } else {
            results.errors.push({
              subscription_id: subscription.id,
              error: 'Failed to send WhatsApp'
            })
          }
        }

        // Marcar notificación como enviada
        const { error: updateError } = await supabaseClient
          .from('subscription_deliveries')
          .update({
            notification_sent: true,
            notification_sent_at: new Date().toISOString()
          })
          .eq('subscription_id', subscription.id)
          .eq('delivery_date', subscription.next_delivery_date)

        if (updateError) {
          console.error(`❌ Error updating notification status for subscription ${subscription.id}:`, updateError)
        }

        results.processed++

      } catch (error) {
        console.error(`❌ Error processing notifications for subscription ${subscription.id}:`, error)
        results.errors.push({
          subscription_id: subscription.id,
          error: (error as any).message
        })
      }
    }

    console.log(`📊 Notification sending complete: ${results.processed} processed, ${results.email_sent} emails, ${results.whatsapp_sent} WhatsApp`)

    return new Response(
      JSON.stringify({
        message: 'Subscription notifications completed',
        date: notificationDate,
        ...results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Error in subscription-notifications function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Función para construir mensaje de WhatsApp
function buildWhatsAppMessage(data: any): string {
  const deliveryDate = new Date(data.deliveryDate)
  const formattedDate = deliveryDate.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  let message = `🥑 *Tus Aguacates - Recordatorio de Entrega*\n\n`
  message += `Hola ${data.customerName}!\n\n`
  message += `Tu suscripción "${data.subscriptionName}" será entregada pronto.\n\n`
  message += `📅 *Fecha de entrega:* ${formattedDate}\n`
  message += `💰 *Total estimado:* $${data.totalAmount.toLocaleString('es-CO')} COP\n`
  message += `💳 *Método de pago:* ${data.paymentMethod === 'daviplata' ? 'Daviplata' : 'Efectivo'}\n\n`

  if (data.products && data.products.length > 0) {
    message += `📦 *Productos en esta entrega:*\n`
    data.products.forEach((product: any, index: number) => {
      message += `${index + 1}. ${product.product_name} (${product.quantity}x)\n`
    })
    message += `\n`
  }

  message += `📍 *Dirección:* ${data.address?.label}\n`
  message += `${data.address?.street_address}, ${data.address?.city}\n\n`

  message += `🔔 *Este recordatorio se envía ${data.notificationDaysBefore} días antes de la entrega*\n\n`
  message += `¿Necesitas modificar tu pedido? Contáctanos antes de la fecha de entrega.\n\n`
  message += `¡Gracias por tu confianza! 🥑`

  return message
}

// Función para enviar email (integración con servicio de email)
async function sendEmailNotification(supabaseClient: any, params: any): Promise<boolean> {
  try {
    console.log(`📧 Sending email to ${params.to}: ${params.subject}`)
    
    // Aquí iría la integración con un servicio de email como:
    // - SendGrid
    // - AWS SES
    // - Resend
    // - Supabase Auth emails (si está configurado)
    
    // Por ahora, simulamos el envío
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Registrar email enviado en la base de datos (opcional)
    await supabaseClient
      .from('email_logs')
      .insert({
        to: params.to,
        subject: params.subject,
        template: params.template,
        status: 'sent',
        sent_at: new Date().toISOString()
      })

    return true
  } catch (error) {
    console.error('❌ Error sending email:', error)
    return false
  }
}

// Función para enviar WhatsApp (integración con servicio de WhatsApp)
async function sendWhatsAppNotification(supabaseClient: any, params: any): Promise<boolean> {
  try {
    console.log(`📱 Sending WhatsApp to ${params.phoneNumber}`)
    
    // Aquí iría la integración con un servicio de WhatsApp como:
    // - Twilio WhatsApp
    // - Meta WhatsApp Business API
    // - WATI
    // - NovoChat
    
    // Por ahora, simulamos el envío
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Registrar WhatsApp enviado en la base de datos (opcional)
    await supabaseClient
      .from('whatsapp_logs')
      .insert({
        phone_number: params.phoneNumber,
        message: params.message,
        status: 'sent',
        sent_at: new Date().toISOString()
      })

    return true
  } catch (error) {
    console.error('❌ Error sending WhatsApp:', error)
    return false
  }
}