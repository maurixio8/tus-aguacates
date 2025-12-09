import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { revalidatePath } from 'next/cache';
// Removed: import { createSupabaseClient } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper para instanciar cliente con Service Role de forma explícita
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

// ... existing code ...


// Configuración CORS para permitir el dashboard
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
    // 1. Verificar header específico
    const headerToken = req.headers.get('x-admin-token');

    // 2. Verificar cookie
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

// GET - Get single product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if request is from same origin (integrated dashboard) or has valid auth
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const isSameOrigin = !origin || origin.includes('tus-aguacates') || referer?.includes('/admin');

    // Only verify auth for cross-origin requests
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
    console.log('🔍 API: Fetching single product:', id);

    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories:category_id (
          id,
          name,
          slug
        )
      `)
      .eq('id', id)
      .single();

    console.log('📊 API: Single product response:', { data: !!data, error });

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Producto no encontrado' },
          { status: 404, headers: corsHeaders }
        );
      }

      console.error('❌ API: Error fetching product:', error);
      return NextResponse.json(
        { error: 'Error al cargar el producto' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Transform data to include category_name
    const product = {
      ...data,
      category_name: data.categories?.name || 'Sin categoría'
    };

    console.log('✅ API: Product fetched successfully');

    return NextResponse.json({
      success: true,
      data: product
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PATCH - Update product by ID (partial update)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if request is from same origin (integrated dashboard) or has valid auth
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const isSameOrigin = !origin || origin.includes('tus-aguacates') || referer?.includes('/admin');

    // Only verify auth for cross-origin requests
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

    console.log('📝 API: PATCH updating product:', { id, body });

    const supabase = getServiceSupabase();

    // First check if product exists
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', id)
      .single();

    if (fetchError || !existingProduct) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Prepare update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Add fields from body
    const allowedFields = [
      'name', 'description', 'category_id', 'price', 'discount_price',
      'unit', 'weight', 'min_quantity', 'main_image_url', 'images',
      'stock', 'is_organic', 'is_featured', 'is_active', 'benefits'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // Perform update - use select() instead of select().single() to avoid PGRST116 if no rows updated
    console.log('💾 API: Executing Supabase update for ID:', id);

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ API: Error updating product:', error);
      return NextResponse.json(
        {
          error: 'Error al actualizar el producto',
          details: error.message,
          code: error.code,
          hint: error.hint
        },
        { status: 500, headers: corsHeaders }
      );
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ API: Update returned no rows. Attempting re-fetch...');

      const { data: refetchedProduct, error: refetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (!refetchError && refetchedProduct) {
        console.log('✅ API: Product found after update (Refetch success). Verifying data match...');

        // Verify if the update actually persisted
        const isMatch = Object.keys(updateData).every(key =>
          key === 'updated_at' || refetchedProduct[key] === updateData[key]
        );

        if (!isMatch) {
          console.error('❌ API: CRITICAL - Update appeared successful but data does not match!', {
            sent: updateData,
            stored: refetchedProduct
          });
        }

        return NextResponse.json({
          success: true,
          data: refetchedProduct,
          message: 'Producto actualizado (verificado por re-consulta)',
          persisted: isMatch
        }, { headers: corsHeaders });
      }

      console.error('❌ API: Product definitely not found after update attempt.');
      return NextResponse.json({
        success: false,
        error: 'No se pudo actualizar el producto (no encontrado en BD)',
        data: null
      }, { status: 404, headers: corsHeaders });
    }

    // Explicit Verification for normal path
    const updatedRow = data[0];
    console.log('✅ API: Product updated successfully via PATCH:', updatedRow);

    // Force cache invalidation
    revalidatePath('/admin/productos');
    revalidatePath('/api/admin/products');

    // Double check specific fields if present
    if (updateData.main_image_url && updatedRow.main_image_url !== updateData.main_image_url) {
      console.error('❌ API: CRITICAL IMAGE MISMATCH - DB returned different URL than sent!', {
        sent: updateData.main_image_url,
        received: updatedRow.main_image_url
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedRow,
      message: 'Producto actualizado exitosamente'
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PUT - Update product by ID (full update)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401, headers: corsHeaders }
      );
    }

    const { id } = await params;
    const body = await request.json();

    console.log('📝 API: Updating product:', { id, body });

    const supabase = getServiceSupabase();

    // First check if product exists
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', id)
      .single();

    if (fetchError || !existingProduct) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Validate data if provided
    if (body.price !== undefined && (typeof body.price !== 'number' || body.price < 0)) {
      return NextResponse.json(
        { error: 'El precio debe ser un número válido' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (body.stock !== undefined && (typeof body.stock !== 'number' || body.stock < 0)) {
      return NextResponse.json(
        { error: 'El stock debe ser un número válido' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Prepare update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Update slug if name changed
    if (body.name && body.name !== existingProduct.name) {
      updateData.slug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
    }

    // Add other fields
    const allowedFields = [
      'name', 'description', 'category_id', 'price', 'discount_price',
      'unit', 'weight', 'min_quantity', 'main_image_url', 'images',
      'stock', 'is_organic', 'is_featured', 'is_active', 'benefits'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    console.log('💾 API: Product update response:', { data, error });

    if (error) {
      console.error('❌ API: Error updating product:', error);

      // Handle specific database errors
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Ya existe un producto con ese SKU o slug' },
          { status: 409, headers: corsHeaders }
        );
      }

      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'La categoría especificada no existe' },
          { status: 400, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        { error: 'Error al actualizar el producto' },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('✅ API: Product updated successfully:', data);

    return NextResponse.json({
      success: true,
      data,
      message: 'Producto actualizado exitosamente'
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ API: Unexpected error updating product:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// DELETE - Delete product by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401, headers: corsHeaders }
      );
    }

    const { id } = await params;
    console.log('🗑️ API: Deleting product:', id);

    const supabase = createSupabaseClient();

    // First check if product exists
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', id)
      .single();

    if (fetchError || !existingProduct) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Delete the product (this will also cascade delete related records if properly configured)
    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .select()
      .single();

    console.log('💾 API: Product delete response:', { data, error });

    if (error) {
      console.error('❌ API: Error deleting product:', error);

      // Handle foreign key constraint errors
      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'No se puede eliminar el producto porque tiene registros relacionados (órdenes, variantes, etc.)' },
          { status: 400, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        { error: 'Error al eliminar el producto' },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('✅ API: Product deleted successfully:', data);

    return NextResponse.json({
      success: true,
      data,
      message: 'Producto eliminado exitosamente'
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ API: Unexpected error deleting product:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}