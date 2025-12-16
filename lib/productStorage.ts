// ✅ COMPARTIDO entre admin y tienda
// Sistema unificado de almacenamiento de productos

import { supabase } from './supabase';
import type { UnifiedProduct, UnifiedProductVariant } from './types';

// Re-exportar para compatibilidad
export type Product = UnifiedProduct;
export type ProductVariant = UnifiedProductVariant;

// Productos por defecto si no hay datos guardados
const DEFAULT_PRODUCTS: UnifiedProduct[] = [];

export const getDefaultProducts = (): UnifiedProduct[] => {
  return DEFAULT_PRODUCTS;
};

// ✅ ÚNICA FUENTE DE VERDAD: productos tus_aguacates.json (217 productos)
const loadProductsFromJSON = async (): Promise<UnifiedProduct[]> => {
  try {
    console.log('📦 Cargando 217 PRODUCTOS desde productos tus_aguacates.json...');

    let jsonData;

    // Detectar si estamos en servidor (Node.js) o cliente (browser)
    if (typeof window === 'undefined') {
      // Servidor: leer del filesystem usando imports dinámicos
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'public', 'productos tus_aguacates.json');
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      jsonData = JSON.parse(fileContent);
      console.log('✅ JSON cargado desde filesystem (servidor)');
    } else {
      // Cliente: usar fetch
      const response = await fetch('/productos tus_aguacates.json');
      if (!response.ok) {
        throw new Error('No se pudo cargar el JSON de productos');
      }
      jsonData = await response.json();
      console.log('✅ JSON cargado desde fetch (cliente)');
    }

    const products: UnifiedProduct[] = [];
    let productId = 1;

    // No generar URLs de imágenes - dejar que ProductImagePlaceholder maneje los placeholders
    // Las imágenes de productos no existen en Supabase Storage actualmente

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
          image: '', // Dejar vacío para que ProductImagePlaceholder maneje el placeholder
          main_image_url: '', // Dejar vacío para que ProductImagePlaceholder maneje el placeholder
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


export const getProducts = async (): Promise<UnifiedProduct[]> => {
  // 0. Sincronizar con Supabase primero para asegurar datos actualizados
  try {
    // Intentar sincronizar en segundo plano para no bloquear la carga
    syncSupabaseToLocal().catch(err => {
      console.log('⚠️ Error en sincronización automática:', err);
    });
  } catch (error) {
    console.log('⚠️ No se pudo sincronizar con Supabase:', error);
  }

  // 1. Cargar SIEMPRE el catálogo base completo (217+ productos)
  const baseProducts = await loadProductsFromJSON();

  // 2. Cargar datos locales (que pueden tener fotos actualizadas)
  const localProducts = getProductsSync();

  // 3. Si hay datos locales, realizar FUSIÓN INTELIGENTE
  if (localProducts.length > 0 && baseProducts.length > 0) {
    console.log(`🔄 Fusionando: ${baseProducts.length} productos base con actualizaciones locales`);

    // Helper para normalizar nombres
    const normalize = (str: string) => str.trim().toLowerCase();

    const mergedProducts = baseProducts.map(baseProd => {
      // Buscar coincidencia por ID (preferido) o Nombre (fallback robusto)
      const localMatch = localProducts.find(lp => {
        const idMatch = lp.id === baseProd.id;
        const nameMatch = normalize(lp.name) === normalize(baseProd.name);

        // Debug comentado para evitar spam en consola
        // if (!idMatch && !nameMatch && baseProd.id === 'product-1') {
        //   console.log(`🔍 Comparando: '${normalize(baseProd.name)}' (Base) vs '${normalize(lp.name)}' (Local)`);
        // }

        return idMatch || nameMatch;
      });

      if (localMatch) {
        // Mantener base pero sobrescribir con datos locales importantes
        return {
          ...baseProd,
          // ✅ CRÍTICO: Usar la imagen local si existe (prioridad máxima)
          image: localMatch.image || localMatch.main_image_url || baseProd.image,
          main_image_url: localMatch.main_image_url || localMatch.image || baseProd.main_image_url,

          // ✅ IMPORTANTE: Supabase (local) tiene prioridad sobre el JSON base
          is_active: localMatch.is_active !== undefined ? localMatch.is_active : baseProd.is_active,
          price: localMatch.price || baseProd.price,
          // ✅ FIX: Priorizar descripción del JSON base (tiene las descripciones completas)
          // Solo usar la de Supabase si el JSON no tiene descripción
          description: baseProd.description || localMatch.description,
          // Si local tiene UUID y base tiene ID simple, podríamos querer guardar el UUID para futuras referencias,
          // pero por ahora mantenemos el ID base para no romper referencias de UI si usan índices.
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
export const getProductsSync = (): UnifiedProduct[] => {
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

export const saveProducts = (products: UnifiedProduct[]): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('tus_aguacates_products', JSON.stringify(products));
    console.log('💾 Productos guardados en localStorage compartido:', products.length);
  } catch (e) {
    console.error('❌ Error al guardar productos en localStorage:', e);
  }
};

export const updateProductImage = (productId: string, imageData: string): UnifiedProduct[] => {
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

export const getProductsByCategory = async (categorySlugOrName: string): Promise<UnifiedProduct[]> => {
  try {
    console.log(`\n🔍 getProductsByCategory: "${categorySlugOrName}"`);

    // Si es "todos", cargar todos los productos
    if (categorySlugOrName === 'todos' || categorySlugOrName === 'Todos') {
      console.log(`📦 Modo "todos": cargando TODOS los productos`);
      const allProducts = await getProducts();
      return allProducts.filter(p => p.is_active === true);
    }

    // Obtener todos los productos
    const allProducts = await getProducts();
    console.log(`✅ Total de ${allProducts.length} productos cargados`);

    // 🔥 CASO ESPECIAL: Categoría "ofertas-combos" muestra combos y productos con descuento
    if (categorySlugOrName === 'ofertas-combos') {
      console.log(`🔥 Modo "ofertas-combos": buscando combos y productos con descuento`);
      const ofertasProducts = allProducts.filter(p => {
        if (p.is_active === false) return false;

        // Productos con "combo" en el nombre
        const isCombo = p.name.toLowerCase().includes('combo');

        // Productos con precio de descuento
        const hasDiscount = p.discount_price && p.discount_price < p.price;

        return isCombo || hasDiscount;
      });
      console.log(`✅ ${ofertasProducts.length} productos encontrados en ofertas-combos`);
      return ofertasProducts;
    }

    // ✅ Mapeo FLEXIBLE con múltiples variaciones posibles del nombre
    const categoryNameMap: { [key: string]: string[] } = {
      'aguacates': ['🥑 Aguacates', 'Aguacates'],
      'frutas-tropicales': ['🍊🍎 Tropicales', 'Tropicales', 'Frutas Tropicales'],
      'frutos-rojos': ['🍓 Frutos Rojos', 'Frutos Rojos', 'Frutos rojos'],
      'aromaticas': ['🌿 Aromáticas y Zumos', 'Aromáticas y Zumos', 'Aromáticas', 'Hierbas Aromáticas', 'Hierbas'],
      'saludables': ['🍯🥜 SALUDABLES', 'SALUDABLES', 'Saludables'],
      'especias': ['🥗🌱☘️ Especias', 'Especias', 'Especias y Condimentos', 'Especias y Hierbas'],
      'desgranados': ['🌽 Desgranados', 'Desgranados'],
      'gourmet': ['🍅🌽 Gourmet', 'Gourmet'],
      'productos-nuevos': ['✨ PRODUCTOS NUEVOS', 'PRODUCTOS NUEVOS', 'Productos Nuevos', 'Nuevos']
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

// 🔧 FUNCIÓN DE SINCRONIZACIÓN - OPCIÓN B
// Sincroniza datos de Supabase a localStorage como única fuente de verdad
export const syncSupabaseToLocal = async (): Promise<boolean> => {
  try {
    console.log('🔄 Starting Supabase to localStorage sync...');

    // 1. Obtener datos de Supabase (TODOS los productos, no solo activos)
    // ⚠️ IMPORTANTE: Traer todos los productos para sincronizar correctamente los estados is_active
    const { data: supabaseProducts, error } = await supabase
      .from('products')
      .select('*');

    if (error) {
      console.error('❌ Error fetching from Supabase:', error);
      return false;
    }

    console.log(`📊 Found ${supabaseProducts?.length || 0} products in Supabase`);

    // 2. Obtener datos actuales de localStorage
    const localProducts = await getProducts();
    console.log(`📦 Found ${localProducts.length} products in localStorage`);

    // 3. Mapear y combinar datos
    let mergedProducts: UnifiedProduct[] = [];

    if (supabaseProducts && supabaseProducts.length > 0) {
      // Convertir productos de Supabase al formato local
      const convertedProducts: Product[] = supabaseProducts.map(sp => ({
        id: sp.id,
        name: sp.name,
        description: sp.description,
        price: sp.price,
        // Mapear campos importantes
        image: sp.main_image_url || localProducts.find(lp => lp.id === sp.id)?.image || '',
        main_image_url: sp.main_image_url || localProducts.find(lp => lp.id === sp.id)?.image || '',
        category: sp.category || localProducts.find(lp => lp.id === sp.id)?.category,
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
      }));

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

// Función de inicialización que asegura la sincronización
export const initializeProducts = async (): Promise<UnifiedProduct[]> => {
  // Intentar sincronizar primero
  const syncSuccess = await syncSupabaseToLocal();

  if (syncSuccess) {
    console.log('🎉 Products initialized from Supabase sync');
  } else {
    console.log('⚠️ Products initialized from localStorage (fallback)');
  }

  // Retornar productos actualizados (ahora es asíncrono)
  const products = await getProducts();

  // 🔥 Notificar a la UI que hay datos nuevos
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('products-updated'));
    console.log('📢 Evento products-updated enviado');
  }

  return products;
};

// 🚀 FUNCIÓN DE IMPORTACIÓN CSV
export async function importProductsFromCSV(file: File): Promise<UnifiedProduct[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        const products: UnifiedProduct[] = [];

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          const values = lines[i].split(',').map(v => v.trim());
          const product: UnifiedProduct = {
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