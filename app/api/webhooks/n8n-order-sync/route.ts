import { NextResponse } from 'next/server';

function isTrustedCheckoutRequest(request: Request): boolean {
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const secFetchSite = request.headers.get('sec-fetch-site');

  const sameOrigin = origin === url.origin || (!!referer && referer.startsWith(url.origin));
  const trustedFetchSite =
    !secFetchSite || secFetchSite === 'same-origin' || secFetchSite === 'same-site';

  return sameOrigin && trustedFetchSite;
}

export async function POST(request: Request) {
  try {
    if (!isTrustedCheckoutRequest(request)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Content-Type inválido' },
        { status: 415 }
      );
    }

    const payload = await request.json();
    if (!payload || Array.isArray(payload) || typeof payload !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Payload inválido' },
        { status: 400 }
      );
    }

    const n8nWebhookUrl = process.env.N8N_ORDER_WEBHOOK_URL;
    if (!n8nWebhookUrl) {
      console.warn('⚠️ N8N_ORDER_WEBHOOK_URL no está definida. Saltando sincronización.');
      return NextResponse.json(
        { success: false, message: 'Webhook URL not configured' },
        { status: 503 }
      );
    }

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-by': 'tus-aguacates',
      },
      body: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
        source: 'web_checkout',
      }),
    });

    if (!response.ok) {
      console.error(`❌ Error al enviar a n8n: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { success: false, error: 'No se pudo sincronizar con n8n' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error en webhook proxy de pedidos:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
