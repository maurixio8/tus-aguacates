import { NextResponse } from 'next/server';
import DOMPurify from 'isomorphic-dompurify';

export async function POST(req: Request) {
    const body = await req.json();
    const { message, history, userId, cartContext } = body;

    const N8N_WEBHOOK_URL = process.env.N8N_CHAT_WEBHOOK_URL;

    if (!N8N_WEBHOOK_URL) {
        return NextResponse.json({ error: 'Chatbot no configurado' }, { status: 500 });
    }

    try {
        // ⏱️ Timeout 25s para evitar que Vercel corte la función abruptamente
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);

        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                history,
                userId,
                cartContext
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`n8n error: ${response.status}`);
        }

        const data = await response.json();

        // 🛡️ SECURITY: Sanitize Timeline Content (XSS Prevention)
        if (data.timeline && Array.isArray(data.timeline)) {
            data.timeline.forEach((item: any) => {
                if (item.type === 'text' && item.content) {
                    item.content = DOMPurify.sanitize(item.content);
                }
            });
        } else if (data.text) {
            data.text = DOMPurify.sanitize(data.text);
        }

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Chat Error:', error.message); // Log genérico
        return NextResponse.json(
            { error: 'El mayordomo está ocupado. Intenta de nuevo.' },
            { status: 500 }
        );
    }
}
