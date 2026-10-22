import { NextResponse } from 'next/server';
import xss from 'xss';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// =====================================================
// SUPABASE ADMIN CLIENT (Server-side only, lazy init)
// =====================================================

let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient | null {
    if (supabaseAdmin) return supabaseAdmin;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) return null;

    supabaseAdmin = createClient(url, key, {
        auth: { persistSession: false },
    });

    return supabaseAdmin;
}

// =====================================================
// HELPER: Save message to history
// =====================================================

async function saveMessageToHistory(
    sessionId: string | null,
    userId: string | null,
    guestId: string | null,
    role: 'user' | 'assistant',
    content: string,
    metadata: Record<string, unknown> = {},
    cartContext: unknown = null
): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (!supabase || !sessionId) return;

    try {
        await supabase.from('chat_history').insert({
            session_id: sessionId,
            user_id: userId,
            guest_id: userId ? null : guestId,
            role,
            content,
            message_type: 'text',
            metadata,
            cart_context: cartContext,
        });
    } catch (error) {
        console.error('[ChatAPI] Error saving message:', error);
    }
}

// =====================================================
// HELPER: Get user context for RAG
// =====================================================

async function getUserContextForRAG(userId: string | null): Promise<{
    userPreferences: Record<string, unknown> | null;
    recentPurchases: Array<{ id: string; total: number; products: string[] }>;
    recentMessages: Array<{ role: string; content: string }>;
}> {
    const supabase = getSupabaseAdmin();
    if (!supabase || !userId) {
        return { userPreferences: null, recentPurchases: [], recentMessages: [] };
    }

    try {
        // Obtener contexto del usuario
        const { data: contextData } = await supabase
            .from('user_context')
            .select('*')
            .eq('user_id', userId)
            .single();

        // Obtener últimas 3 órdenes con productos
        const { data: ordersData } = await supabase
            .from('orders')
            .select('id, total, created_at, order_items(product_name)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(3);

        // Obtener últimos 5 mensajes del usuario
        const { data: messagesData } = await supabase
            .from('chat_history')
            .select('role, content')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5);

        return {
            userPreferences: contextData || null,
            recentPurchases: (ordersData || []).map((o: any) => ({
                id: o.id,
                total: o.total,
                products: (o.order_items || []).map((i: any) => i.product_name),
            })),
            recentMessages: (messagesData || []).reverse(),
        };
    } catch (error) {
        console.error('[ChatAPI] Error fetching user context:', error);
        return { userPreferences: null, recentPurchases: [], recentMessages: [] };
    }
}

// =====================================================
// POST /api/chat - Main chat endpoint
// =====================================================

export async function POST(req: Request) {
    const body = await req.json();
    const {
        message,
        history,
        userId,
        cartContext,
        sessionId,
        guestId,
        triggerType, // 'proactive' | 'user' | undefined
        pageContext,
    } = body;

    const N8N_WEBHOOK_URL = process.env.N8N_CHAT_WEBHOOK_URL;

    if (!N8N_WEBHOOK_URL) {
        return NextResponse.json({ error: 'Chatbot no configurado' }, { status: 500 });
    }

    try {
        // 📝 Save user message to history (async, don't block)
        if (message && sessionId) {
            saveMessageToHistory(sessionId, userId, guestId, 'user', message, {}, cartContext);
        }

        // 🧠 Get extended context for RAG (if user is authenticated)
        const ragContext = await getUserContextForRAG(userId);

        // ⏱️ Timeout 25s para evitar que Vercel corte la función
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);

        // 📤 Send to n8n with extended payload
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // Core message data
                message,
                history,
                userId,
                cartContext,

                // Session info
                sessionId,
                guestId,
                triggerType,
                pageContext,

                // RAG Context (for personalization)
                ragContext: {
                    userPreferences: ragContext.userPreferences,
                    recentPurchases: ragContext.recentPurchases,
                    recentMessages: ragContext.recentMessages,
                },

                // Metadata
                timestamp: new Date().toISOString(),
                source: 'web',
            }),
            signal: controller.signal,
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
                    item.content = xss(item.content);
                }
            });

            // 📝 Save assistant response to history
            if (sessionId) {
                const textContent = data.timeline
                    .filter((item: any) => item.type === 'text')
                    .map((item: any) => item.content)
                    .join('\n');

                if (textContent) {
                    saveMessageToHistory(
                        sessionId,
                        userId,
                        guestId,
                        'assistant',
                        textContent,
                        { timeline: data.timeline }
                    );
                }
            }
        } else if (data.text) {
            data.text = xss(data.text);

            // 📝 Save legacy format response
            if (sessionId) {
                saveMessageToHistory(sessionId, userId, guestId, 'assistant', data.text);
            }
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Chat Error:', error.message);
        return NextResponse.json(
            { error: 'El mayordomo está ocupado. Intenta de nuevo.' },
            { status: 500 }
        );
    }
}
