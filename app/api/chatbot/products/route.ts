import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// =====================================================
// SUPABASE CLIENT (lazy initialization)
// =====================================================

let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
    if (supabaseClient) return supabaseClient;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) return null;

    supabaseClient = createClient(url, key, {
        auth: { persistSession: false },
    });

    return supabaseClient;
}

// =====================================================
// TIPOS
// =====================================================

interface ChatProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    discount_price?: number;
    image: string;
    category: string;
    unit: string;
    stock: number;
    is_available: boolean;
}

// =====================================================
// POST /api/chatbot/products - Búsqueda para el Mayordomo
// =====================================================

export async function POST(req: Request) {
    const supabase = getSupabase();

    if (!supabase) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const {
            query,           // Texto de búsqueda (ej: "aguacates", "frutas rojas")
            category,        // Filtrar por categoría específica
            limit = 5,       // Máximo productos a retornar
            minPrice,        // Precio mínimo
            maxPrice,        // Precio máximo
            onlyAvailable = true, // Solo productos con stock
        } = body;

        // Construir query base
        let queryBuilder = supabase
            .from('products')
            .select(`
                id,
                name,
                description,
                price,
                discount_price,
                main_image_url,
                unit,
                stock,
                is_active,
                category:categories(name)
            `)
            .eq('is_active', true);

        // Filtro por disponibilidad
        if (onlyAvailable) {
            queryBuilder = queryBuilder.gt('stock', 0);
        }

        // Filtro por categoría
        if (category) {
            // Buscar por nombre de categoría (case insensitive)
            const { data: categoryData } = await supabase
                .from('categories')
                .select('id')
                .ilike('name', `%${category}%`)
                .limit(1)
                .single();

            if (categoryData) {
                queryBuilder = queryBuilder.eq('category_id', categoryData.id);
            }
        }

        // Filtro por precio
        if (minPrice !== undefined) {
            queryBuilder = queryBuilder.gte('price', minPrice);
        }
        if (maxPrice !== undefined) {
            queryBuilder = queryBuilder.lte('price', maxPrice);
        }

        // Búsqueda por texto
        if (query) {
            // Búsqueda en nombre y descripción
            queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
        }

        // Ordenar por relevancia (featured primero, luego por nombre)
        queryBuilder = queryBuilder
            .order('is_featured', { ascending: false })
            .order('name', { ascending: true })
            .limit(limit);

        const { data, error } = await queryBuilder;

        if (error) throw error;

        // Formatear productos para el chatbot
        const products: ChatProduct[] = (data || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            price: p.discount_price || p.price,
            original_price: p.discount_price ? p.price : undefined,
            image: p.main_image_url || '/images/products/placeholder.png',
            category: p.category?.name || 'General',
            unit: p.unit || 'unidad',
            stock: p.stock,
            is_available: p.stock > 0 && p.is_active,
        }));

        // Generar mensaje contextual
        let contextMessage = '';
        if (products.length === 0) {
            contextMessage = query
                ? `No encontré productos que coincidan con "${query}". ¿Quieres ver nuestras categorías?`
                : 'No hay productos disponibles en este momento.';
        } else if (query) {
            contextMessage = `Encontré ${products.length} producto${products.length > 1 ? 's' : ''} relacionado${products.length > 1 ? 's' : ''} con "${query}":`;
        } else if (category) {
            contextMessage = `Aquí tienes ${products.length} producto${products.length > 1 ? 's' : ''} de ${category}:`;
        }

        return NextResponse.json({
            success: true,
            products,
            count: products.length,
            query: query || null,
            category: category || null,
            contextMessage,
        });
    } catch (error: any) {
        console.error('[ChatbotProducts] Error:', error);
        return NextResponse.json(
            { error: 'Error buscando productos', details: error.message },
            { status: 500 }
        );
    }
}

// =====================================================
// GET /api/chatbot/products/categories - Listar categorías
// =====================================================

export async function GET(req: Request) {
    const supabase = getSupabase();

    if (!supabase) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get('action');

        // Acción: listar categorías
        if (action === 'categories') {
            const { data, error } = await supabase
                .from('categories')
                .select('id, name, description, image_url')
                .eq('is_active', true)
                .order('sort_order', { ascending: true });

            if (error) throw error;

            return NextResponse.json({
                success: true,
                categories: data || [],
                count: data?.length || 0,
            });
        }

        // Acción: obtener producto por ID
        const productId = searchParams.get('id');
        if (productId) {
            const { data, error } = await supabase
                .from('products')
                .select(`
                    id,
                    name,
                    description,
                    price,
                    discount_price,
                    main_image_url,
                    images,
                    unit,
                    stock,
                    is_active,
                    benefits,
                    category:categories(name)
                `)
                .eq('id', productId)
                .single();

            if (error) throw error;

            return NextResponse.json({
                success: true,
                product: data ? {
                    id: data.id,
                    name: data.name,
                    description: data.description,
                    price: data.discount_price || data.price,
                    original_price: data.discount_price ? data.price : undefined,
                    image: data.main_image_url || '/images/products/placeholder.png',
                    images: data.images || [],
                    category: data.category?.name || 'General',
                    unit: data.unit,
                    stock: data.stock,
                    is_available: data.stock > 0 && data.is_active,
                    benefits: data.benefits || [],
                } : null,
            });
        }

        // Acción por defecto: productos destacados
        const { data, error } = await supabase
            .from('products')
            .select(`
                id,
                name,
                description,
                price,
                discount_price,
                main_image_url,
                unit,
                stock,
                category:categories(name)
            `)
            .eq('is_active', true)
            .eq('is_featured', true)
            .gt('stock', 0)
            .limit(5);

        if (error) throw error;

        const products = (data || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            price: p.discount_price || p.price,
            image: p.main_image_url || '/images/products/placeholder.png',
            category: p.category?.name || 'General',
            unit: p.unit,
            stock: p.stock,
        }));

        return NextResponse.json({
            success: true,
            products,
            count: products.length,
            contextMessage: 'Estos son nuestros productos destacados:',
        });
    } catch (error: any) {
        console.error('[ChatbotProducts] Error:', error);
        return NextResponse.json(
            { error: 'Error obteniendo productos', details: error.message },
            { status: 500 }
        );
    }
}
