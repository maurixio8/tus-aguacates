// Edge Function para gestión CRUD de productos
Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const productId = url.searchParams.get('id');

    // GET - Listar productos
    if (req.method === 'GET' && !productId) {
      const category = url.searchParams.get('category');
      const status = url.searchParams.get('status');
      const search = url.searchParams.get('search');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;

      let query = `${supabaseUrl}/rest/v1/products?select=*,categories(name,slug)&order=created_at.desc&limit=${limit}&offset=${offset}`;

      if (category) {
        const catResponse = await fetch(
          `${supabaseUrl}/rest/v1/categories?slug=eq.${category}`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          }
        );
        const cats = await catResponse.json();
        if (cats[0]) {
          query += `&category_id=eq.${cats[0].id}`;
        }
      }

      if (status === 'active') {
        query += '&is_active=eq.true';
      } else if (status === 'inactive') {
        query += '&is_active=eq.false';
      }

      if (search) {
        query += `&name=ilike.*${search}*`;
      }

      const response = await fetch(query, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      const products = await response.json();

      // Contar total para paginación
      let countQuery = `${supabaseUrl}/rest/v1/products?select=count`;
      if (category) {
        const catResponse = await fetch(
          `${supabaseUrl}/rest/v1/categories?slug=eq.${category}`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          }
        );
        const cats = await catResponse.json();
        if (cats[0]) {
          countQuery += `&category_id=eq.${cats[0].id}`;
        }
      }
      if (status === 'active') {
        countQuery += '&is_active=eq.true';
      } else if (status === 'inactive') {
        countQuery += '&is_active=eq.false';
      }
      if (search) {
        countQuery += `&name=ilike.*${search}*`;
      }

      const countResponse = await fetch(countQuery, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'count=exact'
        }
      });

      const totalCount = parseInt(countResponse.headers.get('content-range')?.split('/')[1] || '0');

      return new Response(
        JSON.stringify({
          success: true,
          products: products,
          pagination: {
            page: page,
            limit: limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // GET - Obtener producto específico
    if (req.method === 'GET' && productId) {
      const productResponse = await fetch(
        `${supabaseUrl}/rest/v1/products?id=eq.${productId}&select=*,categories(name,slug)`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        }
      );

      const products = await productResponse.json();
      
      if (!products || products.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Producto no encontrado' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      // Obtener variantes
      const variantsResponse = await fetch(
        `${supabaseUrl}/rest/v1/product_variants?product_id=eq.${productId}`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        }
      );

      const variants = await variantsResponse.json();

      return new Response(
        JSON.stringify({
          success: true,
          product: { ...products[0], variants: variants || [] }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // PATCH - Actualizar producto
    if (req.method === 'PATCH' && productId) {
      const updates = await req.json();

      const response = await fetch(
        `${supabaseUrl}/rest/v1/products?id=eq.${productId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            ...updates,
            updated_at: new Date().toISOString()
          })
        }
      );

      const updated = await response.json();

      return new Response(
        JSON.stringify({ success: true, product: updated[0] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // POST - Crear nuevo producto
    if (req.method === 'POST') {
      const newProduct = await req.json();

      const response = await fetch(
        `${supabaseUrl}/rest/v1/products`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(newProduct)
        }
      );

      const created = await response.json();

      return new Response(
        JSON.stringify({ success: true, product: created[0] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
      );
    }

    // DELETE - Eliminar producto (soft delete)
    if (req.method === 'DELETE' && productId) {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/products?id=eq.${productId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ is_active: false })
        }
      );

      return new Response(
        JSON.stringify({ success: true, message: 'Producto desactivado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Acción no válida' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error) {
    console.error('Error en products-crud:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
