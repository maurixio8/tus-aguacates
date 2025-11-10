'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase, Product, Category } from '@/lib/supabase';
import { ProductCard } from '@/components/product/ProductCard';
import { Filter } from 'lucide-react';

interface ProductWithCategory extends Product {
  categories: { name: string; slug: string } | null;
}

function ProductosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const categoriaParam = searchParams?.get('categoria');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // Obtener categorías
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      setCategories(categoriesData || []);

      // Obtener productos
      let query = supabase
        .from('products')
        .select(`
          *,
          categories (name, slug)
        `)
        .eq('is_active', true);

      if (categoriaParam) {
        const { data: category } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', categoriaParam)
          .single();
        
        if (category) {
          query = query.eq('category_id', category.id);
        }
      }

      query = query.order('created_at', { ascending: false });

      const { data: productsData } = await query;
      setProducts(productsData || []);
      setLoading(false);
    }

    fetchData();
  }, [categoriaParam]);

  const categoriaActual = categories.find(c => c.slug === categoriaParam);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-verde-bosque"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl md:text-4xl mb-2">
          {categoriaActual ? categoriaActual.name : 'Todos los Productos'}
        </h1>
        <p className="text-gray-600">
          {products.length} producto{products.length !== 1 ? 's' : ''} disponible{products.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filtros de Categorías */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex gap-3 min-w-max pb-2">
          <button
            onClick={() => router.push('/productos')}
            className={`px-6 py-2.5 rounded-full font-bold whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${
              !categoriaParam
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-verde-bosque-700 shadow-lg border-2 border-verde-aguacate'
                : 'bg-white text-gray-700 hover:bg-yellow-100 hover:border-2 hover:border-yellow-500 shadow-soft hover:shadow-medium'
            }`}
          >
            Todos
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => router.push(`/productos?categoria=${category.slug}`)}
              className={`px-6 py-2.5 rounded-full font-bold whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${
                categoriaParam === category.slug
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-verde-bosque-700 shadow-lg border-2 border-verde-aguacate'
                  : 'bg-white text-gray-700 hover:bg-yellow-100 hover:border-2 hover:border-yellow-500 shadow-soft hover:shadow-medium'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Productos */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-xl mb-2">No se encontraron productos</h3>
          <p className="text-gray-600 mb-6">
            Intenta con otros filtros o categorías
          </p>
          <button
            onClick={() => router.push('/productos')}
            className="inline-block bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-verde-bosque-700 font-bold px-8 py-3 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-verde-aguacate"
          >
            Ver todos los productos
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProductosPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-verde-bosque"></div>
        </div>
      </div>
    }>
      <ProductosContent />
    </Suspense>
  );
}
