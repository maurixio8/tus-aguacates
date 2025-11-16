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
}

// Productos por defecto si no hay datos guardados
const DEFAULT_PRODUCTS: Product[] = [];

export const getDefaultProducts = (): Product[] => {
  return DEFAULT_PRODUCTS;
};

// Función para cargar productos desde el CSV pre-generado
const loadProductsFromCSV = async (): Promise<Product[]> => {
  try {
    const response = await fetch('/catalogo-productos.csv');
    const csvText = await response.text();

    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());

    const products: Product[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"(.*)"$/, '$1'));

      if (values.length >= 6) {
        const product: Product = {
          id: values[0] || `product-${i}`,
          name: values[1] || 'Producto sin nombre',
          description: values[2] || '',
          price: parseFloat(values[3]) || 0,
          category: values[4] || 'General',
          image: values[5] || '',
          is_active: true,
          stock: 100, // Stock por defecto
          unit: 'unidad',
          min_quantity: 1
        };

        products.push(product);
      }
    }

    console.log(`✅ ${products.length} productos cargados desde CSV`);
    return products;
  } catch (error) {
    console.error('❌ Error cargando productos desde CSV:', error);
    return [];
  }
};

export const getProducts = async (): Promise<Product[]> => {
  if (typeof window === 'undefined') return DEFAULT_PRODUCTS;

  const saved = localStorage.getItem('tus_aguacates_products');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      console.log('✅ Productos cargados desde localStorage compartido:', parsed.length);
      return parsed;
    } catch (e) {
      console.log('⚠️ Error al leer localStorage, intentando cargar desde CSV');
    }
  }

  // Si no hay datos en localStorage, intentar cargar desde CSV
  console.log('📦 Cargando productos desde CSV...');
  const csvProducts = await loadProductsFromCSV();

  if (csvProducts.length > 0) {
    // Guardar en localStorage para futuras cargas
    localStorage.setItem('tus_aguacates_products', JSON.stringify(csvProducts));
    return csvProducts;
  }

  // Último recurso: productos por defecto (vacío)
  console.log('⚠️ No se pudieron cargar productos, usando lista vacía');
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
  const categories: { [key: string]: string } = {
    'aguacates': 'Aguacates',
    'frutas': 'Frutas',
    'verduras': 'Verduras',
    'lacteos': 'Lácteos',
    'panaderia': 'Panadería'
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