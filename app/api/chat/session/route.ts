import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// =====================================================
// SUPABASE ADMIN CLIENT (lazy initialization)
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
// POST /api/chat/session - Create new chat session
// =====================================================

export async function POST(req: Request) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { userId, guestId, initialPage, deviceType, isProactive } = body;

        const { data, error } = await supabase
            .from('chat_sessions')
            .insert({
                user_id: userId || null,
                guest_id: userId ? null : guestId,
                initial_page: initialPage || '/',
                device_type: deviceType || 'unknown',
                is_proactive: isProactive || false,
                metadata: {},
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            sessionId: data.id,
            startedAt: data.started_at,
        });
    } catch (error: any) {
        console.error('[ChatSession] Error creating session:', error);
        return NextResponse.json(
            { error: 'Error creating chat session' },
            { status: 500 }
        );
    }
}

// =====================================================
// GET /api/chat/session?sessionId=xxx - Get session info
// =====================================================

export async function GET(req: Request) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('sessionId');

        if (!sessionId) {
            return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
        }

        // Get session
        const { data: session, error: sessionError } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (sessionError || !session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // Get messages
        const { data: messages } = await supabase
            .from('chat_history')
            .select('id, role, content, message_type, metadata, created_at')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        return NextResponse.json({
            session: {
                id: session.id,
                userId: session.user_id,
                guestId: session.guest_id,
                startedAt: session.started_at,
                endedAt: session.ended_at,
                isProactive: session.is_proactive,
            },
            messages: messages || [],
        });
    } catch (error: any) {
        console.error('[ChatSession] Error fetching session:', error);
        return NextResponse.json(
            { error: 'Error fetching session' },
            { status: 500 }
        );
    }
}

// =====================================================
// PATCH /api/chat/session - End session
// =====================================================

export async function PATCH(req: Request) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { sessionId } = body;

        if (!sessionId) {
            return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('chat_sessions')
            .update({ ended_at: new Date().toISOString() })
            .eq('id', sessionId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[ChatSession] Error ending session:', error);
        return NextResponse.json(
            { error: 'Error ending session' },
            { status: 500 }
        );
    }
}
