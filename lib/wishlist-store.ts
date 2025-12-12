import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from './productStorage';
import { supabase } from './supabase';

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  product: Product;
  created_at: string;
}

interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadWishlist: (userId: string) => Promise<void>;
  addToWishlist: (product: Product, userId: string) => Promise<boolean>;
  removeFromWishlist: (productId: string, userId: string) => Promise<boolean>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  getWishlistCount: () => number;
  getWishlistProducts: () => Product[];
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,

      loadWishlist: async (userId: string) => {
        if (!userId) {
          set({ items: [], error: null });
          return;
        }

        set({ isLoading: true, error: null });
        
        try {
          const { data, error } = await supabase
            .from('wishlist')
            .select(`
              *,
              product:products(*)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error loading wishlist:', error);
            set({ error: error.message });
            return;
          }

          // Transform data to match our interface
          const wishlistItems: WishlistItem[] = (data || []).map(item => ({
            id: item.id,
            user_id: item.user_id,
            product_id: item.product_id,
            product: item.product as Product,
            created_at: item.created_at
          }));

          set({ items: wishlistItems, isLoading: false });
        } catch (error) {
          console.error('Error loading wishlist:', error);
          set({ error: 'Error al cargar favoritos', isLoading: false });
        }
      },

      addToWishlist: async (product: Product, userId: string) => {
        if (!userId) {
          set({ error: 'Debes estar logueado para agregar favoritos' });
          return false;
        }

        // Check if already in wishlist
        if (get().isInWishlist(product.id)) {
          return true; // Already in wishlist
        }

        try {
          // Optimistic update
          const tempItem: WishlistItem = {
            id: `temp-${Date.now()}`,
            user_id: userId,
            product_id: product.id,
            product,
            created_at: new Date().toISOString()
          };

          set(state => ({
            items: [tempItem, ...state.items],
            error: null
          }));

          // Add to Supabase
          const { data, error } = await supabase
            .from('wishlist')
            .insert({
              user_id: userId,
              product_id: product.id
            })
            .select()
            .single();

          if (error) {
            // Rollback optimistic update
            set(state => ({
              items: state.items.filter(item => item.id !== tempItem.id),
              error: error.message
            }));
            return false;
          }

          // Update with real data
          set(state => ({
            items: state.items.map(item => 
              item.id === tempItem.id 
                ? { ...item, id: data.id, created_at: data.created_at }
                : item
            )
          }));

          return true;
        } catch (error) {
          console.error('Error adding to wishlist:', error);
          set({ error: 'Error al agregar a favoritos' });
          return false;
        }
      },

      removeFromWishlist: async (productId: string, userId: string) => {
        if (!userId) {
          set({ error: 'Debes estar logueado para eliminar favoritos' });
          return false;
        }

        const existingItem = get().items.find(item => item.product_id === productId);
        if (!existingItem) {
          return true; // Not in wishlist
        }

        try {
          // Optimistic update
          set(state => ({
            items: state.items.filter(item => item.product_id !== productId),
            error: null
          }));

          // Remove from Supabase
          const { error } = await supabase
            .from('wishlist')
            .delete()
            .eq('user_id', userId)
            .eq('product_id', productId);

          if (error) {
            // Rollback optimistic update
            set(state => ({
              items: [...state.items, existingItem],
              error: error.message
            }));
            return false;
          }

          return true;
        } catch (error) {
          console.error('Error removing from wishlist:', error);
          set({ error: 'Error al eliminar de favoritos' });
          return false;
        }
      },

      isInWishlist: (productId: string) => {
        return get().items.some(item => item.product_id === productId);
      },

      clearWishlist: () => {
        set({ items: [], error: null });
      },

      getWishlistCount: () => {
        return get().items.length;
      },

      getWishlistProducts: () => {
        return get().items.map(item => item.product);
      }
    }),
    {
      name: 'tus-aguacates-wishlist',
      partialize: (state) => ({ 
        items: state.items 
      })
    }
  )
);