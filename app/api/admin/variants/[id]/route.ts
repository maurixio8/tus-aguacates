import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper para instanciar cliente con Service Role
const getServiceSupabase = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            },
            global: {
                headers: {
                    'Cache-Control': 'no-store'
                }
            }
        }
    );
};

// Configuración CORS
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-token',
};

// Manejar solicitudes OPTIONS para CORS
export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, { headers: corsHeaders });
}

// Helper para verificar token de admin
async function verifyAdminAuth(req: NextRequest) {
    try {
        const headerToken = req.headers.get('x-admin-token');
        const cookieToken = req.cookies.get('admin_token')?.value || req.cookies.get('admin-token')?.value;
        const token = headerToken || cookieToken;

        if (!token) {
            return { success: false, error: 'No autorizado' };
        }

        const JWT_SECRET = process.env.JWT_SECRET || 'tus-aguacates-secret-key';
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        if (decoded.type !== 'admin') {
            return { success: false, error: 'Token no válido para administrador' };
        }

        return { success: true, adminId: decoded.id };
    } catch (error) {
        console.error('❌ Error auth:', error);
        return { success: false, error: 'Token inválido' };
    }
}

// GET - Get single variant by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const origin = request.headers.get('origin');
        const referer = request.headers.get('referer');
        const isSameOrigin = !origin || origin.includes('tus-aguacates') || referer?.includes('/admin');

        if (!isSameOrigin) {
            const auth = await verifyAdminAuth(request);
            if (!auth.success) {
                return NextResponse.json(
                    { error: auth.error },
                    { status: 401, headers: corsHeaders }
                );
            }
        }

        const { id } = await params;
        console.log('🔍 API: Fetching variant:', id);

        const supabase = getServiceSupabase();

        const { data, error } = await supabase
            .from('product_variants')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Variante no encontrada' },
                    { status: 404, headers: corsHeaders }
                );
            }

            console.error('❌ API: Error fetching variant:', error);
            return NextResponse.json(
                { error: 'Error al cargar la variante' },
                { status: 500, headers: corsHeaders }
            );
        }

        return NextResponse.json({
            success: true,
            data
        }, { headers: corsHeaders });

    } catch (error) {
        console.error('❌ API: Unexpected error:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders }
        );
    }
}

// PATCH - Update variant by ID
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const origin = request.headers.get('origin');
        const referer = request.headers.get('referer');
        const isSameOrigin = !origin || origin.includes('tus-aguacates') || referer?.includes('/admin');

        if (!isSameOrigin) {
            const auth = await verifyAdminAuth(request);
            if (!auth.success) {
                return NextResponse.json(
                    { error: auth.error },
                    { status: 401, headers: corsHeaders }
                );
            }
        }

        const { id } = await params;
        const body = await request.json();

        console.log('📝 API: PATCH updating variant:', { id, body });

        const supabase = getServiceSupabase();

        // First check if variant exists
        const { data: existingVariant, error: fetchError } = await supabase
            .from('product_variants')
            .select('id, variant_name, variant_value')
            .eq('id', id)
            .single();

        if (fetchError || !existingVariant) {
            console.error('❌ API: Variant not found:', { id, fetchError });
            return NextResponse.json(
                { error: 'Variante no encontrada' },
                { status: 404, headers: corsHeaders }
            );
        }

        // Prepare update object
        const updateData: any = {};

        // Try to add updated_at if the column exists
        try {
            updateData.updated_at = new Date().toISOString();
        } catch (e) {
            // Column might not exist, skip it
            console.log('⚠️ updated_at column might not exist, skipping');
        }

        // Validate and add fields from body
        const allowedFields = [
            'variant_name', 'variant_value', 'price', 'price_adjustment',
            'stock_quantity', 'is_active', 'sku', 'sort_order'
        ];

        // Validate price if provided
        if (body.price !== undefined) {
            if (typeof body.price !== 'number' || body.price < 0) {
                return NextResponse.json(
                    { error: 'El precio debe ser un número válido mayor o igual a 0' },
                    { status: 400, headers: corsHeaders }
                );
            }
            updateData.price = body.price;
        }

        // Validate stock if provided
        if (body.stock_quantity !== undefined) {
            if (typeof body.stock_quantity !== 'number' || body.stock_quantity < 0) {
                return NextResponse.json(
                    { error: 'El stock debe ser un número válido mayor o igual a 0' },
                    { status: 400, headers: corsHeaders }
                );
            }
            updateData.stock_quantity = body.stock_quantity;
        }

        // Add other allowed fields
        allowedFields.forEach(field => {
            if (body[field] !== undefined && !updateData[field]) {
                updateData[field] = body[field];
            }
        });

        console.log('💾 API: Executing Supabase update for variant ID:', id, 'with data:', updateData);

        // Perform update
        const { data, error } = await supabase
            .from('product_variants')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('❌ API: Error updating variant:', error);
            return NextResponse.json(
                {
                    error: 'Error al actualizar la variante',
                    details: error.message,
                    code: error.code
                },
                { status: 500, headers: corsHeaders }
            );
        }

        if (!data) {
            console.error('❌ API: Update returned no data');
            return NextResponse.json({
                success: false,
                error: 'No se pudo actualizar la variante',
                data: null
            }, { status: 500, headers: corsHeaders });
        }

        console.log('✅ API: Variant updated successfully:', {
            id: data.id,
            variant_name: data.variant_name,
            variant_value: data.variant_value,
            price: data.price
        });

        return NextResponse.json({
            success: true,
            data,
            message: 'Variante actualizada exitosamente'
        }, { headers: corsHeaders });

    } catch (error) {
        console.error('❌ API: Unexpected error:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders }
        );
    }
}

// DELETE - Delete variant by ID
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await verifyAdminAuth(request);
        if (!auth.success) {
            return NextResponse.json(
                { error: auth.error },
                { status: 401, headers: corsHeaders }
            );
        }

        const { id } = await params;
        console.log('🗑️ API: Deleting variant:', id);

        const supabase = getServiceSupabase();

        // First check if variant exists
        const { data: existingVariant, error: fetchError } = await supabase
            .from('product_variants')
            .select('id, variant_name')
            .eq('id', id)
            .single();

        if (fetchError || !existingVariant) {
            return NextResponse.json(
                { error: 'Variante no encontrada' },
                { status: 404, headers: corsHeaders }
            );
        }

        // Delete the variant
        const { data, error } = await supabase
            .from('product_variants')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('❌ API: Error deleting variant:', error);
            return NextResponse.json(
                { error: 'Error al eliminar la variante' },
                { status: 500, headers: corsHeaders }
            );
        }

        console.log('✅ API: Variant deleted successfully:', data);

        return NextResponse.json({
            success: true,
            data,
            message: 'Variante eliminada exitosamente'
        }, { headers: corsHeaders });

    } catch (error) {
        console.error('❌ API: Unexpected error deleting variant:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders }
        );
    }
}
