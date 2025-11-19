import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { createSupabaseClient } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

// Helper function to verify admin authentication
async function verifyAdminAuth(request: NextRequest): Promise<{ success: boolean; adminId?: string; error?: string }> {
  try {
    // Get the admin-token cookie from the request
    const token = request.cookies.get('admin-token')?.value;

    console.log('🔍 Products [id] API: Token check:', token ? 'present' : 'missing');

    if (!token) {
      return { success: false, error: 'No autenticado' };
    }

    // Verify the JWT token (MISMO CÓDIGO QUE EN LOGIN Y ME)
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret) as any;
      console.log('🔍 Products [id] API: Token decoded:', { id: decoded.id, email: decoded.email, type: decoded.type });
    } catch (jwtError) {
      console.error('❌ Products [id] API: JWT verification error:', jwtError);
      return { success: false, error: 'Token inválido o expirado' };
    }

    // Check if this is an admin token
    if (decoded.type !== 'admin') {
      console.log('❌ Products [id] API: Token no es de tipo admin');
      return { success: false, error: 'Token no válido para administrador' };
    }

    return { success: true, adminId: decoded.id };

  } catch (error) {
    console.error('❌ Products [id] API: Authentication error:', error);
    return { success: false, error: 'Error de autenticación' };
  }
}

// GET - Get single product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { id } = await params;
    console.log('🔍 API: Fetching single product:', id);

    const supabase = createSupabaseClient();

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
          { status: 404 }
        );
      }

      console.error('❌ API: Error fetching product:', error);
      return NextResponse.json(
        { error: 'Error al cargar el producto' },
        { status: 500 }
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
    });

  } catch (error) {
    console.error('❌ API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Update product by ID
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
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    console.log('📝 API: Updating product:', { id, body });

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
        { status: 404 }
      );
    }

    // Validate data if provided
    if (body.price !== undefined && (typeof body.price !== 'number' || body.price < 0)) {
      return NextResponse.json(
        { error: 'El precio debe ser un número válido' },
        { status: 400 }
      );
    }

    if (body.stock !== undefined && (typeof body.stock !== 'number' || body.stock < 0)) {
      return NextResponse.json(
        { error: 'El stock debe ser un número válido' },
        { status: 400 }
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
          { status: 409 }
        );
      }

      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'La categoría especificada no existe' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Error al actualizar el producto' },
        { status: 500 }
      );
    }

    console.log('✅ API: Product updated successfully:', data);

    return NextResponse.json({
      success: true,
      data,
      message: 'Producto actualizado exitosamente'
    });

  } catch (error) {
    console.error('❌ API: Unexpected error updating product:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
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
        { status: 401 }
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
        { status: 404 }
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
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Error al eliminar el producto' },
        { status: 500 }
      );
    }

    console.log('✅ API: Product deleted successfully:', data);

    return NextResponse.json({
      success: true,
      data,
      message: 'Producto eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ API: Unexpected error deleting product:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}