// ✅ COMPARTIDO entre admin y tienda
// Sistema unificado de almacenamiento de productos

import { supabase } from './supabase';

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_name: string;
  variant_value: string;
  price_adjustment: number;
  is_active: boolean;
  stock_quantity?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  // ✅ REQUERIDOS (mínimo necesario):
  id: string;
  name: string;
  description: string;
  price: number;

  // ✅ OPCIONALES (todos con '?'):
  category?: string;
  category_id?: string;
  discount_price?: number;
  unit?: string;
  weight?: number;
  min_quantity?: number;
  main_image_url?: string;
  image?: string;
  images?: string[];
  stock?: number;
  reserved_stock?: number;
  is_featured?: boolean;
  is_organic?: boolean;
  is_active?: boolean;
  benefits?: string[];
  rating?: number;
  review_count?: number;
  slug?: string;
  sku?: string;
  created_at?: string;
  updated_at?: string;
  variants?: ProductVariant[];
  hasVariants?: boolean;
  base_price?: number;
}

// Productos por defecto si no hay datos guardados
const DEFAULT_PRODUCTS: Product[] = [];

export const getDefaultProducts = (): Product[] => {
  return DEFAULT_PRODUCTS;
};

// ✅ ÚNICA FUENTE DE VERDAD: productos tus_aguacates.json (217 productos)
const loadProductsFromJSON = async (): Promise<Product[]> => {
  try {
    console.log('📦 Cargando 217 PRODUCTOS desde productos tus_aguacates.json...');

    const response = await fetch('/productos tus_aguacates.json');
    if (!response.ok) {
      throw new Error('No se pudo cargar el JSON de productos');
    }

    const jsonData = await response.json();
    console.log('✅ JSON cargado exitosamente');

    const products: Product[] = [];
    let productId = 1;

    // Procesar cada categoría del JSON
    for (const category of jsonData.categories || []) {
      const categoryName = category.name || 'General';
      console.log(`📦 Procesando categoría: ${categoryName}`);

      // ✅ LEER CADA PRODUCTO TAL CUAL
      for (const product of category.products || []) {
        const productName = product.name || 'Producto sin nombre';
        const description = product.description || '';
        const variants = product.variants || [];

        // Usar el precio de la primera variante o el precio del producto
        const basePrice = variants.length > 0 ? variants[0].price || 0 : (product.price || 0);

        const productEntry: Product = {
          id: `product-${productId}`,
          name: productName,
          description: description,
          price: basePrice,
          category: categoryName,
          image: '',
          is_active: true,
          stock: 100,
          unit: 'unidad',
          min_quantity: 1,
          variants: variants.map((variant: any, index: number) => ({
            id: `${productId}-variant-${index}`,
            product_id: `product-${productId}`,
            variant_name: variant.name || '',
            variant_value: variant.name || '',
            price_adjustment: (variant.price || 0) - basePrice,
            is_active: true,
            created_at: new Date().toISOString()
          })),
          hasVariants: variants.length > 1,
          base_price: basePrice
        };

        products.push(productEntry);
        productId++;
      }
    }

    console.log(`✅ ${products.length} productos cargados exitosamente`);
    return products;

  } catch (error) {
    console.error('❌ Error cargando productos:', error);
    return [];
  }
};


export const getProducts = async (): Promise<Product[]> => {
  // 1. Cargar datos locales primero (pueden tener UUIDs de Supabase)
  const localProducts = getProductsSync();

  // 2. Si hay productos locales con UUIDs de Supabase, usarlos directamente
  // Esto ocurre despues de syncSupabaseToLocal()
  const hasSupabaseProducts = localProducts.some(p =>
    p.id && !p.id.startsWith('product-') && !p.id.startsWith('prod-')
  );

  if (hasSupabaseProducts && localProducts.length > 0) {
    console.log(`✅ Usando ${localProducts.length} productos de Supabase (UUIDs reales)`);
    return localProducts;
  }

  // 3. Fallback: Cargar catalogo base del JSON (IDs sinteticos)
  const baseProducts = await loadProductsFromJSON();

  // 4. Si hay datos locales sin UUIDs, realizar FUSION INTELIGENTE
  if (localProducts.length > 0 && baseProducts.length > 0) {
    console.log(`🔄 Fusionando: ${baseProducts.length} productos base con actualizaciones locales`);

    // Helper para normalizar nombres
    const normalize = (str: string) => str.trim().toLowerCase();

    const mergedProducts = baseProducts.map(baseProd => {
      // Buscar coincidencia por ID (preferido) o Nombre (fallback robusto)
      const localMatch = localProducts.find(lp => {
        const idMatch = lp.id === baseProd.id;
        const nameMatch = normalize(lp.name) === normalize(baseProd.name);

        // Debug para el primer producto si falla
        if (!idMatch && !nameMatch && baseProd.id === 'product-1') {
          console.log(`🔍 Comparando: '${normalize(baseProd.name)}' (Base) vs '${normalize(lp.name)}' (Local)`);
        }

        return idMatch || nameMatch;
      });

      if (localMatch) {
        // Determinar si el ID local es un UUID real de Supabase (no sintetico)
        const isLocalIdUUID = localMatch.id && !localMatch.id.startsWith('product-') && !localMatch.id.startsWith('prod-');

        // Debug: log cuando usamos UUID de Supabase
        if (isLocalIdUUID && baseProd.id !== localMatch.id) {
          console.log(`🔄 Usando UUID de Supabase para "${baseProd.name}": ${localMatch.id}`);
        }

        // Mantener base pero sobrescribir con datos locales importantes
        return {
          ...baseProd,
          // ✅ CRITICO: Si local tiene UUID de Supabase, usarlo en lugar del ID sintetico
          id: isLocalIdUUID ? localMatch.id : baseProd.id,
          // ✅ CRITICO: Usar la imagen local si existe (prioridad maxima)
          image: localMatch.image || localMatch.main_image_url || baseProd.image,
          main_image_url: localMatch.main_image_url || localMatch.image || baseProd.main_image_url,

          // Actualizar otros campos si cambiaron
          is_active: localMatch.is_active ?? baseProd.is_active,
          price: localMatch.price || baseProd.price,
          description: localMatch.description || baseProd.description,
          // Preservar category_id de Supabase si existe
          category_id: localMatch.category_id || baseProd.category_id,
        };
      }
      return baseProd;
    });

    // Agregar productos COMPLETAMENTE NUEVOS (que no estén en el JSON ni por ID ni por nombre)
    const baseIds = new Set(baseProducts.map(p => p.id));
    const baseNames = new Set(baseProducts.map(p => normalize(p.name)));

    const newLocalProducts = localProducts.filter(lp => {
      const isIdKnown = baseIds.has(lp.id);
      const isNameKnown = baseNames.has(normalize(lp.name));
      // Solo agregar si NO es conocido ni por ID ni por Nombre
      return !isIdKnown && !isNameKnown;
    });

    if (newLocalProducts.length > 0) {
      console.log(`➕ Agregando ${newLocalProducts.length} productos nuevos creados localmente`);
      return [...mergedProducts, ...newLocalProducts];
    }

    return mergedProducts;
  }

  // Fallbacks simples si una fuente falla
  if (baseProducts.length > 0) {
    console.log('⚠️ Usando solo JSON base (sin datos locales)');
    return baseProducts;
  }

  if (localProducts.length > 0) {
    console.log('⚠️ Usando solo LocalStorage (JSON falló)');
    return localProducts;
  }

  console.log('❌ No se pudieron cargar productos de ninguna fuente');
  return DEFAULT_PRODUCTS;
};

// Versión síncrona para el admin que solo lee del localStorage
export const getProductsSync = (): Product[] => {
  if (typeof window === 'undefined') return DEFAULT_PRODUCTS;

  const saved = localStorage.getItem('tus_aguacates_products');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return parsed;
    } catch (e) {
      console.log('⚠️ Error al leer localStorage');
    }
  }

  return DEFAULT_PRODUCTS;
};

export const saveProducts = (products: Product[]): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('tus_aguacates_products', JSON.stringify(products));
    console.log('💾 Productos guardados en localStorage compartido:', products.length);
  } catch (e) {
    console.error('❌ Error al guardar productos en localStorage:', e);
  }
};

export const updateProductImage = (productId: string, imageData: string): Product[] => {
  const products = getProductsSync();
  const updated = products.map(p =>
    p.id === productId ? { ...p, image: imageData } : p
  );
  saveProducts(updated);
  console.log('✅ Imagen actualizada para producto ID:', productId);
  return updated;
};

// ✅ Mapeo de slug a category_id en Supabase
const slugToCategoryId = async (slug: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      console.warn(`⚠️ No se encontró category_id para slug: ${slug}`);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error(`❌ Error obteniendo category_id para ${slug}:`, error);
    return null;
  }
};

export const getProductsByCategory = async (categorySlugOrName: string): Promise<Product[]> => {
  try {
    console.log(`\n🔍 getProductsByCategory: "${categorySlugOrName}"`);

    // Si es "todos", cargar todos los productos
    if (categorySlugOrName === 'todos' || categorySlugOrName === 'Todos') {
      console.log(`📦 Modo "todos": cargando TODOS los productos`);
      const allProducts = await getProducts();
      return allProducts.filter(p => p.is_active !== false);
    }

    // Obtener todos los productos
    const allProducts = await getProducts();
    console.log(`✅ Total de ${allProducts.length} productos cargados`);

    // ✅ Mapeo FLEXIBLE con múltiples variaciones posibles del nombre
    const categoryNameMap: { [key: string]: string[] } = {
      'aguacates': ['🥑 Aguacates', 'Aguacates'],
      'frutas-tropicales': ['🍊🍎 Tropicales', 'Tropicales', 'Frutas Tropicales'],
      'frutos-rojos': ['🍓 Frutos Rojos', 'Frutos Rojos', 'Frutos rojos'],
      'aromaticas': ['🌿 Aromáticas y Zumos', 'Aromáticas y Zumos', 'Aromáticas', 'Hierbas Aromáticas', 'Hierbas'],
      'saludables': ['🍯🥜 SALUDABLES', 'SALUDABLES', 'Saludables'],
      'especias': ['🥗🌱☘️ Especias', 'Especias', 'Especias y Condimentos', 'Especias y Hierbas'],
      'desgranados': ['🌽 Desgranados', 'Desgranados'],
      'gourmet': ['🍅🌽 Gourmet', 'Gourmet']
    };

    // Determinar si es un slug o un nombre
    let targetSlug = categorySlugOrName.toLowerCase();

    // Si tiene guiones, es probablemente un slug (ej: 'frutos-rojos')
    // Si tiene espacios o emojis, es probablemente un nombre (ej: '🍓 Frutos Rojos')
    const isSlug = /^[a-z0-9\-]+$/.test(categorySlugOrName);

    if (!isSlug) {
      // Es un nombre con posibles emojis/espacios
      console.log(`📝 Detectado como NOMBRE (no slug): "${categorySlugOrName}"`);

      // Obtener categorías de Supabase para mapeo
      const { data: supabaseCategories } = await supabase
        .from('categories')
        .select('id, slug, name')
        .eq('is_active', true);

      if (supabaseCategories && supabaseCategories.length > 0) {
        // Limpiar emojis y espacios
        const cleanInput = categorySlugOrName.replace(/[\p{Emoji}]/gu, '').trim().toLowerCase();
        console.log(`  Nombre limpio: "${cleanInput}"`);

        const match = supabaseCategories.find(cat =>
          cat.name.toLowerCase().includes(cleanInput) ||
          cleanInput.includes(cat.name.toLowerCase().replace(/[\p{Emoji}]/gu, '').trim())
        );

        if (match) {
          targetSlug = match.slug;
          console.log(`✅ Encontrado en Supabase: "${match.name}" -> slug: "${targetSlug}"`);
        }
      }
    } else {
      console.log(`✅ Detectado como SLUG: "${categorySlugOrName}"`);
    }

    const possibleCategoryNames = categoryNameMap[targetSlug];

    if (!possibleCategoryNames || possibleCategoryNames.length === 0) {
      console.warn(`⚠️ No se encontró mapeo para slug: "${targetSlug}"`);
      console.warn(`Slugs disponibles: ${Object.keys(categoryNameMap).join(', ')}`);
      return [];
    }

    console.log(`🔎 Buscando productos en categorías: ${possibleCategoryNames.join(', ')}`);

    // ✅ Función helper para limpiar y comparar nombres de categoría
    const cleanCategoryName = (name: string): string => {
      return name
        .replace(/[\p{Emoji}]/gu, '') // Eliminar emojis
        .trim()
        .toLowerCase();
    };

    // Filtrar productos que coincidan con CUALQUIERA de los nombres posibles
    const filteredProducts = allProducts.filter(p => {
      if (!p.category || p.is_active === false) return false;

      const productCategoryClean = cleanCategoryName(p.category);

      // Buscar coincidencia con cualquiera de los nombres posibles
      return possibleCategoryNames.some(catName => {
        const mapCategoryClean = cleanCategoryName(catName);
        // Match exacto o parcial después de limpiar emojis
        return (
          productCategoryClean === mapCategoryClean ||
          productCategoryClean.includes(mapCategoryClean) ||
          mapCategoryClean.includes(productCategoryClean)
        );
      });
    });

    console.log(`✅ ${filteredProducts.length} productos encontrados para "${targetSlug}"\n`);

    return filteredProducts;

  } catch (error) {
    console.error('❌ Error en getProductsByCategory:', error);
    return [];
  }
};

// Mapeo de categorías para URLs
export const categoryToSlug = (category: string): string => {
  const slugs: { [key: string]: string } = {
    'Aguacates': 'aguacates',
    'Frutas': 'frutas',
    'Verduras': 'verduras',
    'Lácteos': 'lacteos',
    'Panadería': 'panaderia'
  };
  return slugs[category] || category.toLowerCase();
};

export const slugToCategory = (slug: string): string => {
  // Mapeo unificado con nombres exactos del JSON de productos
  const categories: { [key: string]: string } = {
    // Categorías principales (coinciden con master.json)
    'aguacates': '🥑 Aguacates',
    'frutas-tropicales': '🍊🍎 Tropicales',
    'frutos-rojos': '🍓 Frutos Rojos',
    'aromaticas': '🌿 Aromáticas y Zumos',
    'saludables': '🍯🥜 SALUDABLES',
    'especias': '🥗🌱☘️ Especias',
    'desgranados': '🌽 Desgranados',
    'gourmet': '🍅🌽 Gourmet',
    // Compatibilidad con URLs antiguas
    'aromaticas-y-zumos': '🌿 Aromáticas y Zumos',
    'tropicales': '🍊🍎 Tropicales'
  };
  return categories[slug] || slug;
};

// 🔧 FUNCION DE SINCRONIZACION
// Sincroniza datos de Supabase a localStorage como unica fuente de verdad
export const syncSupabaseToLocal = async (): Promise<boolean> => {
  try {
    console.log('🔄 Starting Supabase to localStorage sync...');

    // 1. Obtener productos con categoria JOIN (una sola query)
    const { data: supabaseProducts, error } = await supabase
      .from('products')
      .select(`
        *,
        categories:category_id (
          name,
          slug
        )
      `)
      .eq('is_active', true);

    if (error) {
      console.error('❌ Error fetching from Supabase:', error);
      return false;
    }

    console.log(`📊 Found ${supabaseProducts?.length || 0} products in Supabase (with category join)`);

    // 2. Obtener datos actuales de localStorage (sincrono para evitar recursion)
    const localProducts = getProductsSync();
    console.log(`📦 Found ${localProducts.length} products in localStorage`);

    // 3. Mapear y combinar datos
    let mergedProducts: Product[] = [];

    if (supabaseProducts && supabaseProducts.length > 0) {
      // Convertir productos de Supabase al formato local
      const convertedProducts: Product[] = supabaseProducts.map(sp => {
        // Categoria viene del JOIN directo, o fallback a campo category si existe
        const joinedCategory = sp.categories as { name: string; slug: string } | null;
        const resolvedCategory = joinedCategory?.name || sp.category || 'Sin categoria';

        return {
          id: sp.id,
          name: sp.name,
          description: sp.description,
          price: sp.price,
          // Mapear campos importantes
          image: sp.main_image_url || localProducts.find(lp => lp.id === sp.id)?.image || '',
          main_image_url: sp.main_image_url || localProducts.find(lp => lp.id === sp.id)?.image || '',
          category: resolvedCategory,
          category_id: sp.category_id,
          discount_price: sp.discount_price,
          unit: sp.unit,
          weight: sp.weight,
          min_quantity: sp.min_quantity,
          stock: sp.stock,
          reserved_stock: sp.reserved_stock,
          is_featured: sp.is_featured,
          is_organic: sp.is_organic,
          is_active: sp.is_active,
          benefits: sp.benefits,
          rating: sp.rating,
          review_count: sp.review_count,
          slug: sp.slug,
          sku: sp.sku,
          created_at: sp.created_at,
          updated_at: sp.updated_at,
          variants: sp.variants
        };
      });

      // 4. Combinar con productos locales que no están en Supabase
      const supabaseIds = new Set(convertedProducts.map(p => p.id));
      // Helper para normalizar (usamos el mismo criterio que en getProducts)
      const normalize = (str: string) => str ? str.trim().toLowerCase() : '';
      const supabaseNames = new Set(convertedProducts.map(p => normalize(p.name)));

      const localOnly = localProducts.filter(lp => {
        // Excluir si ya existe por ID
        if (supabaseIds.has(lp.id)) return false;

        // Excluir si ya existe por NOMBRE (priorizar la versión de base de datos)
        if (supabaseNames.has(normalize(lp.name))) {
          console.log(`🧹 Limpiando duplicado local: ${lp.name} (ya viene de Supabase)`);
          return false;
        }

        return true;
      });

      mergedProducts = [...convertedProducts, ...localOnly];

      // Log category resolution stats
      const withCategory = convertedProducts.filter(p => p.category).length;
      const withoutCategory = convertedProducts.filter(p => !p.category).length;
      console.log(`📊 Category stats: ${withCategory} with category, ${withoutCategory} without`);
      if (withoutCategory > 0) {
        const sample = convertedProducts.filter(p => !p.category).slice(0, 3);
        console.log(`⚠️ Sample products without category:`, sample.map(p => ({ id: p.id, name: p.name, category_id: p.category_id })));
      }

      console.log(`🔗 Merged: ${convertedProducts.length} from Supabase + ${localOnly.length} local only`);
    } else {
      // Si no hay datos en Supabase, usar solo datos locales
      mergedProducts = localProducts;
      console.log('⚠️ No Supabase data, using localStorage only');
    }

    // 5. Guardar en localStorage
    saveProducts(mergedProducts);

    console.log(`✅ Sync completed: ${mergedProducts.length} total products saved to localStorage`);
    return true;

  } catch (error) {
    console.error('❌ Sync failed:', error);
    return false;
  }
};

// Funcion de inicializacion que asegura la sincronizacion
export const initializeProducts = async (): Promise<Product[]> => {
  // Detectar si hay IDs sinteticos en localStorage (indica datos viejos)
  const localProducts = getProductsSync();
  const hasSyntheticIds = localProducts.some(p =>
    p.id && (p.id.startsWith('product-') || p.id.startsWith('prod-'))
  );

  if (hasSyntheticIds && localProducts.length > 0) {
    console.log('⚠️ [INIT] Detectados IDs sinteticos en localStorage, limpiando para forzar sync...');
    // Limpiar localStorage para forzar sincronizacion fresca
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tus_aguacates_products');
    }
  }

  // Intentar sincronizar con Supabase
  const syncSuccess = await syncSupabaseToLocal();

  if (syncSuccess) {
    console.log('✅ [INIT] Products initialized from Supabase sync');
  } else {
    console.log('⚠️ [INIT] Products initialized from localStorage (fallback)');
  }

  // Retornar productos actualizados
  const products = await getProducts();

  // Verificar que tenemos UUIDs reales
  const hasRealUUIDs = products.some(p =>
    p.id && !p.id.startsWith('product-') && !p.id.startsWith('prod-')
  );

  if (hasRealUUIDs) {
    console.log('✅ [INIT] Productos con UUIDs reales listos:', products.length);
  } else if (products.length > 0) {
    console.warn('⚠️ [INIT] ADVERTENCIA: Productos sin UUIDs de Supabase. Wishlist podria fallar.');
  }

  // Verificar cobertura de categorias
  const withCategory = products.filter(p => p.category).length;
  if (withCategory < products.length) {
    console.warn(`⚠️ [INIT] ${products.length - withCategory} productos sin categoria asignada`);
  } else {
    console.log(`✅ [INIT] Todos los productos (${products.length}) tienen categoria`);
  }

  // Notificar a la UI que hay datos nuevos
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('products-updated'));
  }

  return products;
};

// 🚀 FUNCIÓN DE IMPORTACIÓN CSV
export async function importProductsFromCSV(file: File): Promise<Product[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        const products: Product[] = [];

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          const values = lines[i].split(',').map(v => v.trim());
          const product: Product = {
            id: values[headers.indexOf('id')] || `prod-${Date.now()}-${i}`,
            name: values[headers.indexOf('name')] || 'Producto sin nombre',
            description: values[headers.indexOf('description')] || '',
            price: parseFloat(values[headers.indexOf('price')]) || 0,
            category: values[headers.indexOf('category')] || 'general',
            image: values[headers.indexOf('image')] || '',
            main_image_url: values[headers.indexOf('image')] || '',
            is_active: true
          };

          products.push(product);
        }

        if (products.length === 0) {
          reject('No se encontraron productos en el CSV');
          return;
        }

        localStorage.setItem('tus_aguacates_products', JSON.stringify(products));
        resolve(products);
      } catch (error) {
        reject(`Error al procesar CSV: ${error}`);
      }
    };

    reader.onerror = () => reject('Error leyendo archivo');
    reader.readAsText(file);
  });
}