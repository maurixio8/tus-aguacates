/**
 * API Routes para gestión admin de Productos B2B
 * "Tus Aguacates" - Panel de Administración
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/auth-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/admin/b2b/products
 * Obtiene lista de productos B2B con filtros admin y paginación
 */
export async function GET(request: NextRequest) {
  try {
    const adminAccess = await requireAdminRole(request, 'viewer');
    if (adminAccess.response) {
      return adminAccess.response;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener parámetros de query
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const category_id = searchParams.get('category_id');
    const search = searchParams.get('search');
    const is_active = searchParams.get('is_active');
    const is_featured = searchParams.get('is_featured');
    const low_stock = searchParams.get('low_stock'); // Productos con stock < 10
    const sort_by = searchParams.get('sort_by') || 'created_at';
    const sort_order = searchParams.get('sort_order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const page_size = parseInt(searchParams.get('page_size') || '20');

    // Si se pide un producto por ID, retornarlo directamente
    if (id) {
      const { data: product, error } = await supabase
        .from('b2b_products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        return NextResponse.json(
          { success: false, error: { message: error.message, code: 'DB_ERROR' } },
          { status: 500 }
        );
      }

      if (!product) {
        return NextResponse.json(
          { success: false, error: { message: 'Producto no encontrado', code: 'NOT_FOUND' } },
          { status: 404 }
        );
      }

      // Obtener pricing tiers
      const { data: pricingTiers } = await supabase
        .from('b2b_pricing_tiers')
        .select('*')
        .eq('product_id', id)
        .order('min_quantity', { ascending: true });

      // Obtener categoría
      let category = null;
      if (product.category_id) {
        const { data: cat } = await supabase
          .from('b2b_categories')
          .select('*')
          .eq('id', product.category_id)
          .maybeSingle();
        category = cat;
      }

      return NextResponse.json({
        success: true,
        data: { ...product, pricing_tiers: pricingTiers || [], category },
      });
    }

    // Construir query
    let query = supabase
      .from('b2b_products')
      .select('*', { count: 'exact' });

    // Aplicar filtros
    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    if (is_active !== null) {
      query = query.eq('is_active', is_active === 'true');
    }

    if (is_featured !== null) {
      query = query.eq('is_featured', is_featured === 'true');
    }

    if (low_stock === 'true') {
      query = query.lt('stock_quantity', 10);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    // NOTA: Para admin, mostramos TODOS los productos (incluso con deleted_at)
    // El frontend puede mostrar los productos borrados de forma diferente

    // Aplicar ordenamiento
    const column = sort_by as string;
    const order = sort_order === 'asc';

    if (column === 'name' || column === 'created_at' || column === 'base_price' ||
        column === 'stock_quantity' || column === 'sku') {
      query = query.order(column, { ascending: order });
    }

    // Aplicar paginación
    const from = (page - 1) * page_size;
    const to = from + page_size - 1;
    query = query.range(from, to);

    // Ejecutar query
    const { data: products, error, count } = await query;

    if (error) {
      console.error('Error fetching B2B products:', error);
      return NextResponse.json(
        { success: false, error: { message: 'Error al obtener productos', code: 'DB_ERROR' } },
        { status: 500 }
      );
    }

    // Obtener pricing tiers y categorías para todos los productos
    const productIds = products?.map((p: any) => p.id) || [];
    let productsWithRelations = products || [];

    if (productIds.length > 0) {
      const { data: pricingTiers } = await supabase
        .from('b2b_pricing_tiers')
        .select('*')
        .in('product_id', productIds);

      const { data: categories } = await supabase
        .from('b2b_categories')
        .select('*')
        .in('id', products?.map((p: any) => p.category_id).filter(Boolean) || []);

      // Agregar pricing_tiers y category a cada producto
      productsWithRelations = productsWithRelations.map((p: any) => ({
        ...p,
        pricing_tiers: pricingTiers?.filter((pt: any) => pt.product_id === p.id) || [],
        category: categories?.find((c: any) => c.id === p.category_id) || null,
      }));
    }

    // Calcular totalPages
    const total_pages = count ? Math.ceil(count / page_size) : 0;

    return NextResponse.json({
      success: true,
      data: productsWithRelations,
      meta: {
        pagination: {
          total: count || 0,
          page,
          page_size,
          total_pages,
          has_next: page < total_pages,
          has_previous: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error in admin B2B products API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/b2b/products
 * Crea un nuevo producto B2B
 */
export async function POST(request: NextRequest) {
  try {
    const adminAccess = await requireAdminRole(request, 'admin');
    if (adminAccess.response) {
      return adminAccess.response;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await request.json();

    // Validar campos requeridos
    if (!body.sku || !body.name || body.base_price === undefined) {
      return NextResponse.json(
        { success: false, error: { message: 'SKU, nombre y precio base son requeridos', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    // Crear producto
    const { data: product, error } = await supabase
      .from('b2b_products')
      .insert({
        sku: body.sku,
        name: body.name,
        description: body.description || null,
        category_id: body.category_id || null,
        base_price: body.base_price,
        cost_price: body.cost_price || null,
        stock_quantity: body.stock_quantity || 0,
        minimum_order_quantity: body.minimum_order_quantity || 1,
        unit: body.unit || 'unit',
        is_active: body.is_active !== undefined ? body.is_active : true,
        is_featured: body.is_featured || false,
        main_image_url: body.main_image_url || null,
        images: body.images || [],
        specifications: body.specifications || {},
        benefits: body.benefits || [],
        b2c_product_id: body.b2c_product_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating B2B product:', error);
      return NextResponse.json(
        { success: false, error: { message: error.message, code: 'DB_ERROR' } },
        { status: 400 }
      );
    }

    // Crear pricing tiers si se proporcionan
    if (body.pricing_tiers && Array.isArray(body.pricing_tiers) && body.pricing_tiers.length > 0) {
      const tiersToInsert = body.pricing_tiers.map((tier: any) => ({
        product_id: product.id,
        min_quantity: tier.min_quantity,
        max_quantity: tier.max_quantity || null,
        price_per_unit: tier.price_per_unit,
        tier_name: tier.tier_name || `${tier.min_quantity}+ unidades`,
        discount_percentage: tier.discount_percentage || null,
      }));

      const { error: tiersError } = await supabase
        .from('b2b_pricing_tiers')
        .insert(tiersToInsert);

      if (tiersError) {
        console.error('Error creating pricing tiers:', tiersError);
      }
    }

    return NextResponse.json({
      success: true,
      data: product,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in admin B2B products POST API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/b2b/products
 * Actualiza un producto B2B existente
 */
export async function PATCH(request: NextRequest) {
  try {
    const adminAccess = await requireAdminRole(request, 'admin');
    if (adminAccess.response) {
      return adminAccess.response;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: 'ID del producto es requerido', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Campos permitidos para actualizar
    const allowedFields = [
      'sku', 'name', 'description', 'category_id', 'base_price', 'cost_price',
      'stock_quantity', 'minimum_order_quantity', 'unit', 'is_active', 'is_featured',
      'main_image_url', 'images', 'specifications', 'benefits', 'b2c_product_id'
    ];

    const updateData: any = {};
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // Actualizar producto
    const { data: product, error } = await supabase
      .from('b2b_products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating B2B product:', error);
      return NextResponse.json(
        { success: false, error: { message: error.message, code: 'DB_ERROR' } },
        { status: 400 }
      );
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: { message: 'Producto no encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error in admin B2B products PATCH API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/b2b/products
 * Soft delete de un producto B2B
 */
export async function DELETE(request: NextRequest) {
  try {
    const adminAccess = await requireAdminRole(request, 'super_admin');
    if (adminAccess.response) {
      return adminAccess.response;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: 'ID del producto es requerido', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    // Soft delete
    const { data: product, error } = await supabase
      .from('b2b_products')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting B2B product:', error);
      return NextResponse.json(
        { success: false, error: { message: error.message, code: 'DB_ERROR' } },
        { status: 400 }
      );
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: { message: 'Producto no encontrado', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Producto eliminado correctamente' },
    });
  } catch (error) {
    console.error('Error in admin B2B products DELETE API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
