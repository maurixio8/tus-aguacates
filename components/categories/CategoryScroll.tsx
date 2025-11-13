'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url?: string;
  product_count: number;
}

interface CategoryScrollProps {
  selectedCategory?: string;
  onCategoryChange?: (slug: string) => void;
  showProductCount?: boolean;
}

export default function CategoryScroll({
  selectedCategory,
  onCategoryChange,
  showProductCount = false
}: CategoryScrollProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);

      // Get categories with product count
      const { data, error } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          slug,
          image_url,
          products!inner(count)
        `)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Transform data to include product count
      const transformedCategories = (data || []).map(category => ({
        ...category,
        product_count: category.products?.length || 0
      }));

      setCategories(transformedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: Category) => {
    if (onCategoryChange) {
      onCategoryChange(category.slug);
    } else {
      router.push(`/productos?categoria=${category.slug}`);
    }
  };

  // Fallback placeholder images for categories
  const getPlaceholderImage = (categoryName: string) => {
    const name = categoryName.toLowerCase();

    if (name.includes('aguacate')) return 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=100&h=100&fit=crop&crop=center';
    if (name.includes('mango') || name.includes('fruta')) return 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=100&h=100&fit=crop&crop=center';
    if (name.includes('piña') || name.includes('frutas tropicales')) return 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=100&h=100&fit=crop&crop=center';
    if (name.includes('verduras') || name.includes('vegetales')) return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100&h=100&fit=crop&crop=center';
    if (name.includes('limón') || name.includes('citrico')) return 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=100&h=100&fit=crop&crop=center';

    return 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=100&h=100&fit=crop&crop=center';
  };

  const getActiveClass = (slug: string) => {
    const isSelected = selectedCategory === slug ||
                      (pathname === '/productos' && slug === 'todos');
    return isSelected
      ? 'ring-2 ring-verde-aguacate bg-verde-aguacate-10'
      : 'hover:ring-2 hover:ring-gray-300 bg-white';
  };

  if (loading) {
    return (
      <div className="bg-white p-4 border-b">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="flex-shrink-0 animate-pulse">
              <div className="w-16 h-16 bg-gray-200 rounded-full mb-1"></div>
              <div className="w-16 h-3 bg-gray-200 rounded mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 border-b">
      <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x">
        {/* All Products Category */}
        <button
          onClick={() => handleCategoryClick({
            id: 'all',
            name: 'Todos',
            slug: 'todos',
            product_count: categories.reduce((sum, cat) => sum + cat.product_count, 0)
          })}
          className={`flex-shrink-0 flex flex-col items-center justify-center p-2 rounded-xl transition-all snap-center min-w-[80px] ${getActiveClass('todos')}`}
        >
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden mb-1 bg-gradient-to-br from-verde-aguacate to-verde-bosque flex items-center justify-center">
            <span className="text-white text-lg md:text-xl font-bold">🛒</span>
          </div>
          <span className="text-xs md:text-sm font-medium text-gray-800 text-center">
            Todos
          </span>
          {showProductCount && (
            <span className="text-xs text-gray-500">
              {categories.reduce((sum, cat) => sum + cat.product_count, 0)}
            </span>
          )}
        </button>

        {/* Categories */}
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category)}
            className={`flex-shrink-0 flex flex-col items-center justify-center p-2 rounded-xl transition-all snap-center min-w-[80px] ${getActiveClass(category.slug)}`}
          >
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden mb-1 bg-gray-100">
              <img
                src={category.image_url || getPlaceholderImage(category.name)}
                alt={category.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = getPlaceholderImage(category.name);
                }}
              />
            </div>
            <span className="text-xs md:text-sm font-medium text-gray-800 text-center">
              {category.name}
            </span>
            {showProductCount && (
              <span className="text-xs text-gray-500">
                {category.product_count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}