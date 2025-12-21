'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { supabase } from '@/lib/supabase';
import type { RecipeIngredient } from '@/data/recipes';
import type { UnifiedProduct } from '@/lib/types';

interface AddIngredientsButtonProps {
  ingredients: RecipeIngredient[];
}

export function AddIngredientsButton({ ingredients }: AddIngredientsButtonProps) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [products, setProducts] = useState<UnifiedProduct[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const { addItem, toggleCart } = useCartStore();

  // Buscar productos por slug
  useEffect(() => {
    async function fetchProducts() {
      const slugs = ingredients
        .filter(ing => ing.productSlug)
        .map(ing => ing.productSlug as string);

      if (slugs.length === 0) return;

      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .in('slug', slugs)
          .eq('is_active', true);

        if (error) throw error;

        if (data) {
          setProducts(data as UnifiedProduct[]);
          const total = data.reduce((sum, product) => {
            return sum + (product.discount_price || product.price);
          }, 0);
          setTotalPrice(total);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    }

    fetchProducts();
  }, [ingredients]);

  const handleAddToCart = async () => {
    if (products.length === 0) return;

    setLoading(true);

    try {
      // Agregar cada producto al carrito
      for (const product of products) {
        addItem(product, 1);
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

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="text-center p-4 bg-verde-aguacate/10 rounded-xl">
        <p className="text-sm text-gray-600 mb-1">
          {products.length} ingredientes disponibles en tienda
        </p>
        <p className="text-2xl font-bold text-verde-bosque">
          ${totalPrice.toLocaleString('es-CO')}
        </p>
      </div>

      <button
        onClick={handleAddToCart}
        disabled={loading || added}
        className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
          added
            ? 'bg-green-500'
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
            Agregar ingredientes al carrito
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Los ingredientes serán agregados a tu carrito de compras
      </p>
    </div>
  );
}
