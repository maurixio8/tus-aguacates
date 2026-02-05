import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        const n8nWebhookUrl = process.env.N8N_ORDER_WEBHOOK_URL;

        // Si no hay URL configurada, simplemente registramos y continuamos sin fallar
        // esto evita que el flujo del usuario se rompa si n8n no está configurado
        if (!n8nWebhookUrl) {
            console.warn('⚠️ N8N_ORDER_WEBHOOK_URL no está definida. Saltando sincronización.');
            return NextResponse.json({ success: false, message: 'Webhook URL not configured' }, { status: 200 });
        }

        // Enviar a n8n en segundo plano (fire and forget pattern simulado para el cliente)
        // Nota: En Vercel Serverless, es mejor esperar la respuesta para asegurar la ejecución,
        // pero mantenemos el timeout bajo para no bloquear.
        const response = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...payload,
                timestamp: new Date().toISOString(),
                source: 'web_checkout',
            }),
        });

        if (!response.ok) {
            console.error(`❌ Error al enviar a n8n: ${response.status} ${response.statusText}`);
            // No retornamos error al cliente para no interrumpir su experiencia
        } else {
            console.log('✅ Pedido enviado a n8n exitosamente');
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('❌ Error en webhook proxy de pedidos:', error);
        // Siempre devolvemos 200 para no romper el flujo del cliente
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 200 });
    }
}
