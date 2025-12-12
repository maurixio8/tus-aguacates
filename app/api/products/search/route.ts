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
// HELPER: Generate embedding via OpenAI
// =====================================================

async function generateEmbedding(text: string): Promise<number[] | null> {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
        console.warn('[ProductSearch] OPENAI_API_KEY not configured');
        return null;
    }

    try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'text-embedding-3-small',
                input: text,
                dimensions: 1536,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        return data.data[0].embedding;
    } catch (error) {
        console.error('[ProductSearch] Error generating embedding:', error);
        return null;
    }
}

// =====================================================
// POST /api/products/search - Semantic product search
// =====================================================

export async function POST(req: Request) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { query, category, limit = 5, threshold = 0.7 } = body;

        if (!query) {
            return NextResponse.json({ error: 'query is required' }, { status: 400 });
        }

        // Generate embedding for the search query
        const embedding = await generateEmbedding(query);

        if (!embedding) {
            // Fallback: text-based search if embedding fails
            return fallbackTextSearch(query, category, limit);
        }

        // Vector search using the match_products function
        const { data, error } = await supabase.rpc('match_products', {
            query_embedding: `[${embedding.join(',')}]`,
            match_threshold: threshold,
            match_count: limit,
            filter_category: category || null,
        });

        if (error) throw error;

        // Format results for the frontend
        const products = (data || []).map((item: any) => ({
            id: item.product_id,
            name: item.product_name,
            description: item.product_description,
            category: item.category,
            price: item.price,
            similarity: item.similarity,
            metadata: item.metadata,
            // Generate image URL based on category (fallback)
            image: getProductImage(item.category, item.product_name),
        }));

        return NextResponse.json({
            query,
            results: products,
            count: products.length,
            searchType: 'semantic',
        });
    } catch (error: any) {
        console.error('[ProductSearch] Error:', error);
        return NextResponse.json(
            { error: 'Error searching products' },
            { status: 500 }
        );
    }
}

// =====================================================
// GET /api/products/search?q=xxx - Simple text search
// =====================================================

export async function GET(req: Request) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');
        const category = searchParams.get('category');
        const limit = parseInt(searchParams.get('limit') || '10', 10);

        if (!query) {
            return NextResponse.json({ error: 'q parameter required' }, { status: 400 });
        }

        return fallbackTextSearch(query, category, limit);
    } catch (error: any) {
        console.error('[ProductSearch] Error:', error);
        return NextResponse.json(
            { error: 'Error searching products' },
            { status: 500 }
        );
    }
}

// =====================================================
// HELPERS
// =====================================================

async function fallbackTextSearch(
    query: string,
    category: string | null,
    limit: number
): Promise<NextResponse> {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    try {
        let queryBuilder = supabase
            .from('product_embeddings')
            .select('product_id, product_name, product_description, category, price, metadata')
            .ilike('search_text', `%${query}%`)
            .limit(limit);

        if (category) {
            queryBuilder = queryBuilder.eq('category', category);
        }

        const { data, error } = await queryBuilder;

        if (error) throw error;

        const products = (data || []).map((item: any) => ({
            id: item.product_id,
            name: item.product_name,
            description: item.product_description,
            category: item.category,
            price: item.price,
            metadata: item.metadata,
            image: getProductImage(item.category, item.product_name),
        }));

        return NextResponse.json({
            query,
            results: products,
            count: products.length,
            searchType: 'text',
        });
    } catch (error: any) {
        console.error('[ProductSearch] Fallback search error:', error);
        return NextResponse.json(
            { error: 'Error searching products' },
            { status: 500 }
        );
    }
}

function getProductImage(category: string, productName: string): string {
    // Mapeo inteligente de categorías a imágenes
    const categoryImageMap: Record<string, string> = {
        Aguacates: '/images/products/avatar-aguacate.png',
        Frutas: '/images/products/avatar-frutas.png',
        Verduras: '/images/products/avatar-verduras.png',
        Lácteos: '/images/products/avatar-lacteos.png',
        Carnes: '/images/products/avatar-carnes.png',
        Bebidas: '/images/products/avatar-bebidas.png',
        Combos: '/images/products/avatar-combo.png',
    };

    // Buscar por nombre específico primero
    const nameLower = productName.toLowerCase();
    if (nameLower.includes('aguacate') || nameLower.includes('hass')) {
        return '/images/products/avatar-aguacate.png';
    }
    if (nameLower.includes('combo') || nameLower.includes('mercado')) {
        return '/images/products/avatar-combo.png';
    }

    // Fallback por categoría
    return categoryImageMap[category] || '/images/products/placeholder.png';
}
