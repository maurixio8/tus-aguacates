'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { supabase } from '@/lib/supabase';
import type { RecipeIngredient } from '@/data/recipes';
import type { UnifiedProduct } from '@/lib/types';

interface ProductWithQty {
  product: UnifiedProduct;
  qty: number;
  slug: string;
  ingredientName: string;
}

interface AddIngredientsButtonProps {
  ingredients: RecipeIngredient[];
}

// Mapeo de slugs a términos de búsqueda alternativos
const searchTermsMap: Record<string, string[]> = {
  'aguacate-hass': ['aguacate', 'hass'],
  'cebolla-morada': ['cebolla roja', 'cebolla morada', 'cebolla'],
  'limon-tahiti': ['limón tahiti', 'limon tahiti', 'limón', 'limon'],
  'miel': ['miel'],
  'banano': ['banano', 'banana'],
  'mango': ['mango'],
  'fresas': ['fresa', 'fresas'],
  'tomate': ['tomate'],
  'cilantro': ['cilantro'],
  'lechuga': ['lechuga'],
  'espinaca': ['espinaca'],
  'platano': ['plátano', 'platano'],
};

export function AddIngredientsButton({ ingredients }: AddIngredientsButtonProps) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [productsWithQty, setProductsWithQty] = useState<ProductWithQty[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const { addItem, toggleCart } = useCartStore();

  // Crear mapa de slug -> cantidad
  const qtyMap = new Map<string, number>();
  ingredients.forEach(ing => {
    if (ing.productSlug) {
      qtyMap.set(ing.productSlug, ing.productQty || 1);
    }
  });

  // Buscar productos por slug o por nombre similar
  useEffect(() => {
    async function fetchProducts() {
      const ingredientsWithSlug = ingredients.filter(ing => ing.productSlug);

      if (ingredientsWithSlug.length === 0) return;

      try {
        const foundProducts: ProductWithQty[] = [];

        for (const ing of ingredientsWithSlug) {
          const slug = ing.productSlug as string;
          const searchTerms = searchTermsMap[slug] || [slug.replace(/-/g, ' ')];
          let data = null;

          // Primero intentar por slug exacto
          const { data: slugData } = await supabase
            .from('products')
            .select('*')
            .eq('slug', slug)
            .eq('is_active', true)
            .maybeSingle();

          if (slugData) {
            data = slugData;
          } else {
            // Buscar por términos alternativos
            for (const term of searchTerms) {
              // Buscar en nombre
              const { data: nameData } = await supabase
                .from('products')
                .select('*')
                .ilike('name', `%${term}%`)
                .eq('is_active', true)
                .limit(1)
                .maybeSingle();

              if (nameData) {
                data = nameData;
                break;
              }

              // Buscar en descripción si no encuentra en nombre
              const { data: descData } = await supabase
                .from('products')
                .select('*')
                .ilike('description', `%${term}%`)
                .eq('is_active', true)
                .limit(1)
                .maybeSingle();

              if (descData) {
                data = descData;
                break;
              }
            }
          }

          if (data) {
            foundProducts.push({
              product: data as UnifiedProduct,
              qty: qtyMap.get(slug) || 1,
              slug,
              ingredientName: ing.name
            });
          }
        }

        if (foundProducts.length > 0) {
          setProductsWithQty(foundProducts);
          // Por defecto, seleccionar todos los productos encontrados
          setSelectedProducts(new Set(foundProducts.map(p => p.product.id)));
        }
      } catch {
        // Error silencioso - la funcionalidad no es crítica
      }
    }

    fetchProducts();
  }, [ingredients]);

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const selectedItems = productsWithQty.filter(p => selectedProducts.has(p.product.id));

  const totalPrice = selectedItems.reduce((sum, { product, qty }) => {
    const price = product.discount_price || product.price;
    return sum + (price * qty);
  }, 0);

  const handleAddToCart = async () => {
    if (selectedItems.length === 0) return;

    setLoading(true);

    try {
      // Agregar solo los productos seleccionados
      for (const { product, qty } of selectedItems) {
        addItem(product, qty);
      }

      setAdded(true);

      // Abrir el carrito después de un pequeño delay
      setTimeout(() => {
        toggleCart();
      }, 500);

      // Resetear el estado después de 3 segundos
      setTimeout(() => {
        setAdded(false);
      }, 3000);
    } catch (error) {
      console.error('Error adding products to cart:', error);
    } finally {
      setLoading(false);
    }
  };

  if (productsWithQty.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Lista de productos seleccionables */}
      <div className="bg-gray-50 rounded-xl p-3 space-y-2">
        <p className="text-sm font-medium text-gray-700 mb-2">
          Selecciona los ingredientes que deseas:
        </p>
        {productsWithQty.map(({ product, qty, ingredientName }) => {
          const price = product.discount_price || product.price;
          const isSelected = selectedProducts.has(product.id);

          return (
            <label
              key={product.id}
              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                isSelected ? 'bg-verde-aguacate/20' : 'bg-white hover:bg-gray-100'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleProduct(product.id)}
                className="w-4 h-4 text-verde-bosque rounded focus:ring-verde-aguacate"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {product.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  Para: {ingredientName}
                </p>
              </div>
              <span className="text-sm font-semibold text-verde-bosque whitespace-nowrap">
                ${(price * qty).toLocaleString('es-CO')}
              </span>
            </label>
          );
        })}
      </div>

      {/* Total y botón */}
      <div className="text-center p-4 bg-verde-aguacate/10 rounded-xl">
        <p className="text-sm text-gray-600 mb-1">
          {selectedItems.length} de {productsWithQty.length} ingredientes seleccionados
        </p>
        <p className="text-2xl font-bold text-verde-bosque">
          ${totalPrice.toLocaleString('es-CO')}
        </p>
      </div>

      <button
        onClick={handleAddToCart}
        disabled={loading || added || selectedItems.length === 0}
        className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
          added
            ? 'bg-green-500'
            : selectedItems.length === 0
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-verde-bosque hover:bg-verde-bosque/90'
        } disabled:opacity-70`}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Agregando...
          </>
        ) : added ? (
          <>
            <Check className="w-5 h-5" />
            ¡Agregados al carrito!
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" />
            Agregar {selectedItems.length} ingrediente{selectedItems.length !== 1 ? 's' : ''} al carrito
          </>
        )}
      </button>
    </div>
  );
}
