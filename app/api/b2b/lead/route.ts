/**
 * API Route: B2B Lead Capture
 * "Tus Aguacates" - E-commerce Platform
 *
 * Recibe leads del formulario B2B y los almacena.
 * Notifica via Telegram/webhook si está configurado.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar campos requeridos
    const { empresa, nombre, telefono, email, tipo, mensaje } = body;
    if (!empresa || !nombre || !telefono) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: empresa, nombre, teléfono' },
        { status: 400 }
      );
    }

    const leadData = {
      empresa,
      nombre,
      telefono,
      email: email || '',
      tipo: tipo || 'cotizar', // 'cotizar' | 'llamada'
      mensaje: mensaje || '',
      fecha: new Date().toISOString(),
    };

    // 1. Intentar almacenar en Supabase
    let storedInDb = false;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { error } = await supabase.from('b2b_leads').insert({
          company_name: leadData.empresa,
          contact_name: leadData.nombre,
          phone: leadData.telefono,
          email: leadData.email,
          lead_type: leadData.tipo,
          message: leadData.mensaje,
          source: 'web_form',
        });

        if (!error) {
          storedInDb = true;
        } else {
          console.warn('[B2B Lead] Error guardando en Supabase:', error.message);
        }
      } catch (dbErr) {
        console.warn('[B2B Lead] Error de conexión Supabase:', dbErr);
      }
    }

    // 2. Notificar via n8n webhook si está configurado
    const webhookUrl = process.env.N8N_B2B_LEAD_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...leadData,
            type: 'b2b_lead',
            stored: storedInDb,
          }),
          signal: AbortSignal.timeout(5000),
        });
      } catch (webhookErr) {
        console.warn('[B2B Lead] Error notificando webhook:', webhookErr);
      }
    }

    // 3. También intentar enviar directo a n8n webhook genérico
    // (fallback si la webhook específica no está configurada)
    if (!webhookUrl) {
      try {
        const n8nBase = process.env.N8N_BASE_URL || 'https://n8n.tusaguacates.com';
        await fetch(`${n8nBase}/webhook/b2b-lead`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadData),
          signal: AbortSignal.timeout(3000),
        });
      } catch {
        // Silencioso — el webhook puede no existir aún
      }
    }

    return NextResponse.json({
      success: true,
      data: { stored: storedInDb, tipo: leadData.tipo },
      message: 'Recibimos tu solicitud. Te contactaremos pronto.',
    });
  } catch (error) {
    console.error('[B2B Lead] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
