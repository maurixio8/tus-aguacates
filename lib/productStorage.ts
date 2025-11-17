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

// Función para cargar productos DIRECTAMENTE desde el JSON real - LEER TAL CUAL
const loadProductsFromJSON = async (): Promise<Product[]> => {
  try {
    console.log('🔄 Cargando productos tal cual desde JSON real...');

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

      // ✅ LEER CADA PRODUCTO TAL CUAL - UNO POR UNO
      for (const product of category.products || []) {
        const productName = product.name || 'Producto sin nombre';
        const description = product.description || '';
        const variants = product.variants || [];

        // ✅ ENFOQUE SIMPLE: Leer el producto exactamente como está en el JSON
        // Usar el precio de la primera variante o el precio del producto si no hay variantes
        const basePrice = variants.length > 0 ? variants[0].price || 0 : (product.price || 0);

        const productEntry: Product = {
          id: `product-${productId}`,
          name: productName, // ✅ Nombre EXACTO del JSON
          description: description,
          price: basePrice,
          category: categoryName,
          image: '',
          is_active: true,
          stock: 100,
          unit: 'unidad',
          min_quantity: 1,
          // ✅ Variantes tal cual del JSON
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

    console.log(`✅ ${products.length} productos cargados tal cual desde JSON`);
    return products;

  } catch (error) {
    console.error('❌ Error cargando productos desde JSON:', error);
    return [];
  }
};

// Función para cargar TODOS los productos del JSON MASTER recategorizado
const loadAllProductsFromMaster = async (): Promise<Product[]> => {
  try {
    console.log('🔄 Cargando TODOS los productos recategorizados desde JSON MASTER...');

    const response = await fetch('/productos-master.json');
    if (!response.ok) {
      throw new Error('No se pudo cargar el JSON MASTER de productos');
    }

    const jsonData = await response.json();
    console.log('✅ JSON MASTER cargado exitosamente');

    const products: Product[] = [];
    let productId = 1;

    // Procesar TODAS las categorías del JSON MASTER
    for (const category of jsonData.categories || []) {
      const categoryName = category.name || 'General';
      console.log(`📦 Procesando categoría: ${categoryName}`);

      // ✅ LEER CADA PRODUCTO TAL CUAL - SIN MODIFICAR NOMBRES
      for (const product of category.products || []) {
        const productName = product.name || 'Producto sin nombre'; // ✅ NOMBRE EXACTO con emojis
        const description = product.description || '';
        const variants = product.variants || [];

        // ✅ USAR PRECIO EXACTO del JSON
        const basePrice = variants.length > 0 ? variants[0].price || 0 : (product.price || 0);

        const productEntry: Product = {
          id: `product-${productId}`,
          name: productName, // ✅ NOMBRE EXACTO Y COMPLETO del dashboard
          description: description,
          price: basePrice,
          category: categoryName,
          image: '',
          is_active: true,
          stock: 100,
          unit: 'unidad',
          min_quantity: 1,
          // ✅ Variantes exactas con nombres y precios del dashboard
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

    console.log(`✅ ${products.length} productos RECATEGORIZADOS cargados con NOMBRES EXACTOS`);
    return products;

  } catch (error) {
    console.error('❌ Error cargando productos recategorizados desde JSON MASTER:', error);
    return [];
  }
};

// Función para cargar productos del JSON LIMPIO (nombres exactos y precios correctos)
const loadFruitsFromJSON = async (): Promise<Product[]> => {
  try {
    console.log('🔄 Cargando productos TROPICALES desde JSON LIMPIO...');

    const response = await fetch('/productos-tropicales-limpios.json');
    if (!response.ok) {
      throw new Error('No se pudo cargar el JSON LIMPIO de productos');
    }

    const jsonData = await response.json();
    console.log('✅ JSON LIMPIO cargado exitosamente');

    const products: Product[] = [];
    let productId = 1;

    // Buscar la categoría "Tropicales" del JSON LIMPIO
    const tropicalesCategory = jsonData.categories?.find((cat: any) =>
      cat.name === 'Tropicales'
    );

    if (!tropicalesCategory) {
      console.error('❌ No se encontró la categoría "Tropicales" en el JSON LIMPIO');
      return [];
    }

    console.log(`📦 Procesando categoría: ${tropicalesCategory.name}`);

    // ✅ LEER CADA PRODUCTO TAL CUAL - SIN MODIFICAR NOMBRES
    for (const product of tropicalesCategory.products || []) {
      const productName = product.name || 'Producto sin nombre'; // ✅ NOMBRE EXACTO: "🍎 Manzana roja Bandeja"
      const description = product.description || '';
      const variants = product.variants || [];

      // ✅ USAR PRECIO EXACTO del JSON
      const basePrice = variants.length > 0 ? variants[0].price || 0 : (product.price || 0);

      const productEntry: Product = {
        id: `product-${productId}`,
        name: productName, // ✅ NOMBRE EXACTO Y COMPLETO del dashboard
        description: description,
        price: basePrice,
        category: 'Tropicales',
        image: '',
        is_active: true,
        stock: 100,
        unit: 'unidad',
        min_quantity: 1,
        // ✅ Variantes exactas con nombres y precios del dashboard
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

    console.log(`✅ ${products.length} productos TROPICALES cargados con NOMBRES EXACTOS`);
    return products;

  } catch (error) {
    console.error('❌ Error cargando productos TROPICALES desde JSON LIMPIO:', error);
    return [];
  }
};

export const getProducts = async (): Promise<Product[]> => {
  if (typeof window === 'undefined') return DEFAULT_PRODUCTS;

  // ✅ CARGAR TODOS LOS PRODUCTOS RECATEGORIZADOS DEL JSON MASTER
  console.log('📦 Cargando productos recategorizados desde JSON MASTER...');

  // Limpiar localStorage completamente
  localStorage.removeItem('tus_aguacates_products');

  // Cargar TODOS los productos del JSON master con categorías correctas
  const allProducts = await loadAllProductsFromMaster();

  if (allProducts.length > 0) {
    console.log(`✅ ${allProducts.length} productos recategorizados cargados desde JSON MASTER`);
    return allProducts;
  }

  // Si falla la carga, retornar vacío
  console.log('❌ Error crítico: No se pudieron cargar productos del JSON MASTER');
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

export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  const allProducts = await getProducts();
  if (category === 'todos' || category === 'Todos') {
    return allProducts.filter(p => p.is_active !== false).map(product => ({
      ...product,
      main_image_url: product.image || product.main_image_url
    }));
  }
  return allProducts.filter(p =>
    p.category === category && p.is_active !== false
  ).map(product => ({
    ...product,
    main_image_url: product.image || product.main_image_url
  }));
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
  // Mapeo unificado sin emojis (para consistencia)
  const categories: { [key: string]: string } = {
    'aguacates': '🥑 Aguacates',
    'frutas-tropicales': '🍊🍎 Tropicales',
    'frutos-rojos': '🍓 Frutos Rojos',
    'verduras': '🥬 Verduras',
    'aromaticas': '🌿 Aromáticas y Zumos',
    'saludables': '🍯🥜 SALUDABLES',
    'especias': '🌶️ Especias',
    'combos': '🎁 Combos',
    // Mantener compatibilidad con URLs antiguas
    'aromaticas-y-zumos': '🌿 Aromáticas y Zumos',
    'tropicales': '🍊🍎 Tropicales',
    'desgranados': '🌽 Desgranados',
    'gourmet': '🍅🌽 Gourmet'
  };
  return categories[slug] || slug;
};

// 🔧 FUNCIÓN DE SINCRONIZACIÓN - OPCIÓN B
// Sincroniza datos de Supabase a localStorage como única fuente de verdad
export const syncSupabaseToLocal = async (): Promise<boolean> => {
  try {
    console.log('🔄 Starting Supabase to localStorage sync...');

    // 1. Obtener datos de Supabase
    const { data: supabaseProducts, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('❌ Error fetching from Supabase:', error);
      return false;
    }

    console.log(`📊 Found ${supabaseProducts?.length || 0} products in Supabase`);

    // 2. Obtener datos actuales de localStorage
    const localProducts = await getProducts();
    console.log(`📦 Found ${localProducts.length} products in localStorage`);

    // 3. Mapear y combinar datos
    let mergedProducts: Product[] = [];

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
      const localOnly = localProducts.filter(lp => !supabaseIds.has(lp.id));

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
export const initializeProducts = async (): Promise<Product[]> => {
  // Intentar sincronizar primero
  const syncSuccess = await syncSupabaseToLocal();

  if (syncSuccess) {
    console.log('🎉 Products initialized from Supabase sync');
  } else {
    console.log('⚠️ Products initialized from localStorage (fallback)');
  }

  // Retornar productos actualizados (ahora es asíncrono)
  return await getProducts();
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