'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { supabase } from '@/lib/supabase';
import type { RecipeIngredient } from '@/data/recipes';
import type { UnifiedProduct } from '@/lib/types';

interface AddSingleIngredientProps {
  ingredient: RecipeIngredient;
}

export function AddSingleIngredient({ ingredient }: AddSingleIngredientProps) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [product, setProduct] = useState<UnifiedProduct | null>(null);
  const [loaded, setLoaded] = useState(false);
  const { addItem } = useCartStore();

  // Buscar producto por slug o por nombre similar
  useEffect(() => {
    async function fetchProduct() {
      if (!ingredient.productSlug) {
        setLoaded(true);
        return;
      }

      try {
        // Primero intentar por slug exacto
        let { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('slug', ingredient.productSlug)
          .eq('is_active', true)
          .maybeSingle();

        // Si no encuentra por slug, buscar por nombre similar
        if (!data) {
          const searchTerm = ingredient.productSlug.replace(/-/g, ' ');
          const { data: nameData } = await supabase
            .from('products')
            .select('*')
            .ilike('name', `%${searchTerm}%`)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();

          data = nameData;
        }

        if (data) {
          setProduct(data as UnifiedProduct);
        }
      } catch {
        // Producto no disponible - silencioso
      } finally {
        setLoaded(true);
      }
    }

    fetchProduct();
  }, [ingredient.productSlug]);

  const handleAddToCart = async () => {
    if (!product) return;

    setLoading(true);

    try {
      // Agregar la cantidad sugerida (o 1 por defecto)
      const qty = ingredient.productQty || 1;
      addItem(product, qty);
      setAdded(true);

      // Resetear después de 2 segundos
      setTimeout(() => {
        setAdded(false);
      }, 2000);
    } catch (error) {
      console.error('Error adding product to cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // Si no tiene producto asociado o no se encontró, no mostrar nada
  if (!ingredient.productSlug || (loaded && !product)) {
    return null;
  }

  // Mientras carga el producto o si no existe
  if (!loaded || !product) {
    return null;
  }

  const price = product.discount_price || product.price;
  const qty = ingredient.productQty || 1;

  return (
    <button
      onClick={handleAddToCart}
      disabled={loading || added}
      className={`inline-flex items-center gap-1 ml-2 px-2 py-1 rounded-full text-xs font-medium transition-all ${
        added
          ? 'bg-green-100 text-green-700'
          : 'bg-verde-aguacate/10 text-verde-bosque hover:bg-verde-aguacate/20'
      }`}
      title={ingredient.productNote || `Agregar ${qty} al carrito`}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : added ? (
        <>
          <Check className="w-3 h-3" />
          <span>Agregado</span>
        </>
      ) : (
        <>
          <ShoppingCart className="w-3 h-3" />
          <span>${(price * qty).toLocaleString('es-CO')}</span>
        </>
      )}
    </button>
  );
}
