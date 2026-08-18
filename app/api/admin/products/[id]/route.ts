import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminRole } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Create Supabase client directly to avoid import issues
function getSupabaseClient() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\\n/g, '').replace(/\\r/g, '').trim();
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabaseKey = rawKey.replace(/\\n/g, '').replace(/\\r/g, '').trim();

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey
    });
    throw new Error('Missing Supabase configuration');
  }

  console.log('✅ Supabase client created with URL:', supabaseUrl.substring(0, 30) + '...');

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Configuración CORS para permitir el dashboard
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://admin-dashboard-m9p6qyz27-mauricio-s-projects-2bf4b7a2.vercel.app',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Cookie, Set-Cookie',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

// Manejar solicitudes OPTIONS para CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { headers: corsHeaders });
}

// PATCH - Update existing product
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: productId } = await params;

    // Verify admin authentication
    const adminAccess = await requireAdminRole(request, 'admin', corsHeaders);
    if (adminAccess.response) {
      return adminAccess.response;
    }

    if (!productId) {
      return NextResponse.json(
        { error: 'ID del producto requerido' },
        { status: 400, headers: corsHeaders }
      );
    }

    const body = await request.json();
    console.log('📝 API: Updating product:', { productId, body });

    // Validate that we're not trying to update the ID
    if (body.id && body.id !== productId) {
      return NextResponse.json(
        { error: 'No se puede cambiar el ID del producto' },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = getSupabaseClient();

    // Prepare update payload (exclude ID and auth fields)
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Only include fields that are actually provided
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.discount_price !== undefined) updateData.discount_price = body.discount_price;
    if (body.stock !== undefined) updateData.stock = body.stock;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.is_featured !== undefined) updateData.is_featured = body.is_featured;
    if (body.main_image_url !== undefined) updateData.main_image_url = body.main_image_url;
    if (body.category_id !== undefined) updateData.category_id = body.category_id;
    if (body.available_for !== undefined) updateData.available_for = body.available_for;
    if (body.unit !== undefined) updateData.unit = body.unit;
    if (body.weight !== undefined) updateData.weight = body.weight;
    if (body.min_quantity !== undefined) updateData.min_quantity = body.min_quantity;
    if (body.is_organic !== undefined) updateData.is_organic = body.is_organic;

    console.log('💾 API: Update payload:', updateData);

    // Update the product
    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();

    console.log('💾 API: Update response:', { data, error });

    if (error) {
      console.error('❌ API: Error updating product:', error);

      // Manejar errores específicos de la base de datos
      if (error.code === '42501') {
        return NextResponse.json(
          {
            error: 'Permiso denegado (RLS Violation)',
            details: 'La base de datos denegó la operación. Esto suele ocurrir cuando la SUPABASE_SERVICE_ROLE_KEY es incorrecta.',
            code: error.code
          },
          { status: 403, headers: corsHeaders }
        );
      }

      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Ya existe otro producto con ese SKU o slug' },
          { status: 409, headers: corsHeaders }
        );
      }

      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'La categoría especificada no existe' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Return more detailed error information for debugging
      return NextResponse.json(
        {
          error: 'Error al actualizar el producto',
          details: error.message,
          code: error.code,
          hint: error.hint,
          details_full: JSON.stringify(error)
        },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('✅ API: Product updated successfully:', data);

    // SYNC AUTOMÁTICO DE PRECIO A VARIANTE ÚNICA
    // Cuando se actualiza el precio base del producto (body.price) y el body NO incluye
    // variantes explícitas, pero el producto tiene una SOLA variante activa,
    // sincronizamos esa variante al nuevo precio para que tienda y crear pedido
    // (que leen variant.price) muestren el mismo valor.
    if (body.price !== undefined && !(body.variants && Array.isArray(body.variants))) {
      try {
        const { data: activeVariants } = await supabase
          .from('product_variants')
          .select('id, price')
          .eq('product_id', productId)
          .eq('is_active', true);

        if (activeVariants && activeVariants.length === 1) {
          const solo = activeVariants[0];
          if (solo.price !== Number(body.price)) {
            console.log(`🔄 API: Auto-sync variante única ${productId} → price ${body.price} (antes ${solo.price})`);
            const { error: syncErr } = await supabase
              .from('product_variants')
              .update({ price: Number(body.price), price_adjustment: 0, updated_at: new Date().toISOString() })
              .eq('id', solo.id);
            if (syncErr) {
              console.error('⚠️ API: Error auto-sync variante:', syncErr.message);
            } else {
              console.log('✅ API: Variante única sincronizada al nuevo precio');
            }
          }
        }
      } catch (autoSyncError) {
        console.error('⚠️ API: Error en auto-sync de variante única:', autoSyncError);
      }
    }

    // Sync variants if provided
    if (body.variants && Array.isArray(body.variants)) {
      console.log(`📦 API: Syncing ${body.variants.length} variants for product ${productId}`);

      // 1. Get current variants in DB
      const { data: currentVariants } = await supabase
        .from('product_variants')
        .select('id')
        .eq('product_id', productId);

      const currentIds = currentVariants?.map(v => v.id) || [];
      const incomingIds = body.variants.filter((v: any) => v.id).map((v: any) => v.id);

      // 2. Identify variants to delete (those in DB but NOT in incoming list)
      const toDelete = currentIds.filter(id => !incomingIds.includes(id));
      if (toDelete.length > 0) {
        console.log(`🗑️ API: Deleting ${toDelete.length} variants:`, toDelete);
        await supabase.from('product_variants').delete().in('id', toDelete);
      }

      // 3. Prepare variants for upsert (creation or update)
      const variantsToUpsert = body.variants.map((v: any, index: number) => ({
        ...(v.id ? { id: v.id } : {}),
        product_id: productId,
        variant_name: v.variant_name || 'Presentacion',
        variant_value: v.variant_value || '',
        price: Number(v.price) || body.price || data.price,
        price_adjustment: Number(v.price_adjustment) || 0,
        stock_quantity: Number(v.stock_quantity) || 0,
        is_active: v.is_active !== false,
        sku: v.sku || `${data.sku || 'PRD'}-V${index + 1}-${Date.now().toString(36).toUpperCase()}`,
      }));

      const { error: syncError } = await supabase
        .from('product_variants')
        .upsert(variantsToUpsert);

      if (syncError) {
        console.error('❌ API: Error syncing variants:', syncError);
        return NextResponse.json({
          success: true,
          data,
          warning: 'Producto actualizado pero hubo errores al sincronizar las variantes.',
          syncError: syncError.message
        }, { headers: corsHeaders });
      }

      console.log('✅ API: Variants synced successfully');

      // Fetch full product with variants to return complete response
      const { data: fullProduct } = await supabase
        .from('products')
        .select(`
          *,
          product_variants (*)
        `)
        .eq('id', productId)
        .single();

      if (fullProduct) {
        return NextResponse.json({
          success: true,
          data: fullProduct,
          message: 'Producto y variantes actualizados exitosamente'
        }, { headers: corsHeaders });
      }
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Producto actualizado exitosamente'
    }, { headers: corsHeaders });


  } catch (error) {
    console.error('❌ API: Unexpected error updating product:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// DELETE - Delete a product
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: productId } = await params;

    // Verify admin authentication
    const adminAccess = await requireAdminRole(request, 'super_admin', corsHeaders);
    if (adminAccess.response) {
      return adminAccess.response;
    }

    if (!productId) {
      return NextResponse.json(
        { error: 'ID del producto requerido' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('🗑️ API: Deleting product:', productId);

    const supabase = getSupabaseClient();

    // Delete the product (with CASCADE will handle related records)
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('❌ API: Error deleting product:', error);

      // Handle specific database errors
      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'No se puede eliminar este producto porque tiene registros relacionados' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Return more detailed error information for debugging
      return NextResponse.json(
        {
          error: 'Error al eliminar el producto',
          details: error.message,
          code: error.code,
          hint: error.hint,
          details_full: JSON.stringify(error)
        },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('✅ API: Product deleted successfully:', productId);

    return NextResponse.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ API: Unexpected error deleting product:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
