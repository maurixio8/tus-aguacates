// ✅ COMPARTIDO entre admin y tienda
// Sistema unificado de almacenamiento de productos

export interface Product {
  id: string;
  name: string;
  description: string;
  category_id?: string;
  price: number;
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
  category?: string;
  benefits?: string[];
  rating?: number;
  review_count?: number;
  slug?: string;
  sku?: string;
  created_at?: string;
  updated_at?: string;
  variants?: any[];
}

// Productos por defecto si no hay datos guardados
const DEFAULT_PRODUCTS: Product[] = [
  // Aguacates
  { id: '1', name: 'Aguacate Hass Premium', description: 'Variedad premium de alta calidad', price: 6500, category: 'Aguacates', stock: 150, is_active: true, unit: 'unidad', min_quantity: 1 },
  { id: '2', name: 'Aguacate Criollo', description: 'Variedad colombiana tradicional', price: 3500, category: 'Aguacates', stock: 200, is_active: true, unit: 'unidad', min_quantity: 1 },
  { id: '3', name: 'Aguacate Orgánico', description: 'Cultivado sin pesticidas', price: 8500, category: 'Aguacates', stock: 75, is_active: true, unit: 'unidad', min_quantity: 1, is_organic: true },
  { id: '4', name: 'Aguacate Jumbo', description: 'Tamaño extra grande', price: 5500, category: 'Aguacates', stock: 100, is_active: true, unit: 'unidad', min_quantity: 1 },

  // Frutas
  { id: '5', name: 'Limón Tahití', description: 'Ácido y jugoso', price: 3700, category: 'Frutas', stock: 300, is_active: true, unit: 'unidad', min_quantity: 1 },
  { id: '6', name: 'Naranja Valencia', description: 'Dulce y jugosa', price: 2500, category: 'Frutas', stock: 250, is_active: true, unit: 'unidad', min_quantity: 1 },
  { id: '7', name: 'Mango Ataulfo', description: 'Dulce y aromático', price: 4500, category: 'Frutas', stock: 180, is_active: true, unit: 'unidad', min_quantity: 1 },
  { id: '8', name: 'Fresa Fresca', description: 'Fresa fresca y dulce', price: 8500, category: 'Frutas', stock: 120, is_active: true, unit: 'unidad', min_quantity: 1 },

  // Verduras
  { id: '9', name: 'Tomate Rojo', description: 'Tomate maduro y jugoso', price: 2000, category: 'Verduras', stock: 400, is_active: true, unit: 'unidad', min_quantity: 1 },
  { id: '10', name: 'Lechuga Crespa', description: 'Lechuga fresca y crujiente', price: 1500, category: 'Verduras', stock: 350, is_active: true, unit: 'unidad', min_quantity: 1 },
  { id: '11', name: 'Cilantro Fresco', description: 'Cilantro orgánico fresco', price: 800, category: 'Verduras', stock: 500, is_active: true, unit: 'unidad', min_quantity: 1, is_organic: true },
  { id: '12', name: 'Pimentón Rojo', description: 'Pimentón rojo fresco', price: 2200, category: 'Verduras', stock: 280, is_active: true, unit: 'unidad', min_quantity: 1 },
];

export const getDefaultProducts = (): Product[] => {
  return DEFAULT_PRODUCTS;
};

export const getProducts = (): Product[] => {
  if (typeof window === 'undefined') return DEFAULT_PRODUCTS;

  const saved = localStorage.getItem('tus_aguacates_products');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      console.log('✅ Productos cargados desde localStorage compartido:', parsed.length);
      return parsed;
    } catch (e) {
      console.log('⚠️ Error al leer localStorage, usando productos por defecto');
      return DEFAULT_PRODUCTS;
    }
  }
  console.log('📦 No hay productos guardados, usando productos por defecto');
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
  const products = getProducts();
  const updated = products.map(p =>
    p.id === productId ? { ...p, image: imageData } : p
  );
  saveProducts(updated);
  console.log('✅ Imagen actualizada para producto ID:', productId);
  return updated;
};

export const getProductsByCategory = (category: string): Product[] => {
  const allProducts = getProducts();
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