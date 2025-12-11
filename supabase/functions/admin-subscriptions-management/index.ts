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

    // Verificar que sea un admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Obtener usuario autenticado
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar rol de admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const path = url.pathname
    const method = req.method

    console.log(`🔧 Admin subscriptions request: ${method} ${path}`)

    // GET /admin/subscriptions - Obtener todas las suscripciones
    if (method === 'GET' && path === '/admin/subscriptions') {
      const { data, error } = await supabaseClient
        .from('subscriptions')
        .select(`
          *,
          profiles!inner(full_name, preferred_name, email),
          addresses!inner(label, city, state)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      return new Response(
        JSON.stringify({ subscriptions: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /admin/subscriptions/stats - Obtener estadísticas
    if (method === 'GET' && path === '/admin/subscriptions/stats') {
      // Estadísticas generales
      const { data: totalSubs, error: totalError } = await supabaseClient
        .from('subscriptions')
        .select('id', { count: 'exact' })

      const { data: activeSubs, error: activeError } = await supabaseClient
        .from('subscriptions')
        .select('id', { count: 'exact' })
        .eq('status', 'active')

      const { data: pausedSubs, error: pausedError } = await supabaseClient
        .from('subscriptions')
        .select('id', { count: 'exact' })
        .eq('status', 'paused')

      // Ingresos recurrentes mensuales estimados
      const { data: monthlyRevenue, error: revenueError } = await supabaseClient
        .from('subscriptions')
        .select('estimated_total')
        .eq('status', 'active')

      const estimatedMonthlyRevenue = monthlyRevenue?.reduce((sum: number, sub: any) => 
        sum + (sub.estimated_total * (30 / sub.frequency_days)), 0
      ) || 0

      // Entregas del último mes
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)

      const { data: recentDeliveries, error: deliveriesError } = await supabaseClient
        .from('subscription_deliveries')
        .select('status, total_amount')
        .gte('delivery_date', lastMonth.toISOString().split('T')[0])

      const successfulDeliveries = recentDeliveries?.filter(d => d.status === 'completed').length || 0
      const totalRevenue = recentDeliveries?.reduce((sum: number, d: any) => 
        sum + (d.status === 'completed' ? d.total_amount : 0), 0
      ) || 0

      if (totalError || activeError || pausedError || revenueError || deliveriesError) {
        throw new Error('Error calculating statistics')
      }

      const stats = {
        total: totalSubs?.length || 0,
        active: activeSubs?.length || 0,
        paused: pausedSubs?.length || 0,
        cancelled: (totalSubs?.length || 0) - (activeSubs?.length || 0) - (pausedSubs?.length || 0),
        estimatedMonthlyRevenue,
        recentDeliveries: {
          total: recentDeliveries?.length || 0,
          successful: successfulDeliveries,
          revenue: totalRevenue
        }
      }

      return new Response(
        JSON.stringify({ stats }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /admin/subscriptions/:id/deliveries - Obtener entregas de una suscripción
    if (method === 'GET' && path.match(/^\/admin\/subscriptions\/[^\/]+\/deliveries$/)) {
      const subscriptionId = path.split('/')[3]
      
      const { data, error } = await supabaseClient
        .from('subscription_deliveries')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .order('delivery_date', { ascending: false })

      if (error) throw error

      return new Response(
        JSON.stringify({ deliveries: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PUT /admin/subscriptions/:id/status - Actualizar estado de suscripción
    if (method === 'PUT' && path.match(/^\/admin\/subscriptions\/[^\/]+\/status$/)) {
      const subscriptionId = path.split('/')[3]
      const { status, reason } = await req.json()

      // Obtener estado actual
      const { data: currentSub, error: fetchError } = await supabaseClient
        .from('subscriptions')
        .select('status')
        .eq('id', subscriptionId)
        .single()

      if (fetchError) throw fetchError

      // Actualizar estado
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString()
        updateData.cancellation_reason = reason || 'Cancelado por administrador'
      }

      const { data, error } = await supabaseClient
        .from('subscriptions')
        .update(updateData)
        .eq('id', subscriptionId)
        .select()
        .single()

      if (error) throw error

      // Registrar modificación
      await supabaseClient
        .from('subscription_modifications')
        .insert({
          subscription_id: subscriptionId,
          modification_type: status === 'paused' ? 'pause' : status === 'cancelled' ? 'cancel' : 'resume',
          old_values: { status: currentSub.status },
          new_values: { status },
          modified_by: user.id,
          reason: reason || `Estado cambiado por administrador a ${status}`
        })

      return new Response(
        JSON.stringify({ subscription: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /admin/subscriptions/problematic - Obtener suscripciones problemáticas
    if (method === 'GET' && path === '/admin/subscriptions/problematic') {
      // Suscripciones con entregas fallidas recientes
      const { data: failedDeliveries, error: failedError } = await supabaseClient
        .from('subscription_deliveries')
        .select('subscription_id, error_message, delivery_date')
        .eq('status', 'failed')
        .gte('delivery_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

      const problematicSubscriptionIds = [...new Set(failedDeliveries?.map(d => d.subscription_id) || [])]

      if (problematicSubscriptionIds.length === 0) {
        return new Response(
          JSON.stringify({ subscriptions: [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: problematicSubs, error: subsError } = await supabaseClient
        .from('subscriptions')
        .select(`
          *,
          profiles!inner(full_name, preferred_name, email),
          addresses!inner(label, city, state)
        `)
        .in('id', problematicSubscriptionIds)

      if (failedError || subsError) throw new Error('Error fetching problematic subscriptions')

      // Agregar información de errores
      const subscriptionsWithErrors = problematicSubs?.map(sub => ({
        ...sub,
        recent_failures: failedDeliveries?.filter(d => d.subscription_id === sub.id) || []
      }))

      return new Response(
        JSON.stringify({ subscriptions: subscriptionsWithErrors }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /admin/subscriptions/process-all - Procesar todas las suscripciones pendientes
    if (method === 'POST' && path === '/admin/subscriptions/process-all') {
      // Llamar a la función de procesamiento
      const { data, error } = await supabaseClient.functions.invoke('process-subscriptions')

      if (error) throw error

      return new Response(
        JSON.stringify({ result: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Error in admin-subscriptions-management:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})