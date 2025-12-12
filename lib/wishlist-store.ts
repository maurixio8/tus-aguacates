import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from './productStorage';
import { supabase } from './supabase';

// Función para obtener el token de autenticación
async function getAuthToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

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
          // Obtener token de autenticación
          const token = await getAuthToken();
          if (!token) {
            set({ error: 'No hay sesión activa', isLoading: false });
            return;
          }

          // Usar API route con autenticación
          const response = await fetch('/api/wishlist', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al cargar favoritos');
          }

          const { data } = await response.json();

          // Transform data to match our interface
          const wishlistItems: WishlistItem[] = (data || []).map((item: any) => ({
            id: item.id,
            user_id: item.user_id,
            product_id: item.product_id,
            product: item.product as Product,
            created_at: item.created_at
          }));

          set({ items: wishlistItems, isLoading: false });
        } catch (error) {
          console.error('Error loading wishlist:', error);
          set({ error: error instanceof Error ? error.message : 'Error al cargar favoritos', isLoading: false });
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
          // Obtener token de autenticación
          const token = await getAuthToken();
          if (!token) {
            set({ error: 'No hay sesión activa' });
            return false;
          }

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

          // Usar API route con autenticación
          const response = await fetch('/api/wishlist', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              product_id: product.id
            }),
          });

          if (!response.ok) {
            // Rollback optimistic update
            set(state => ({
              items: state.items.filter(item => item.id !== tempItem.id),
            }));
            
            const errorData = await response.json();
            set({ error: errorData.error || 'Error al agregar a favoritos' });
            return false;
          }

          const { data } = await response.json();

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
          set({ error: error instanceof Error ? error.message : 'Error al agregar a favoritos' });
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
          // Obtener token de autenticación
          const token = await getAuthToken();
          if (!token) {
            set({ error: 'No hay sesión activa' });
            return false;
          }

          // Optimistic update
          set(state => ({
            items: state.items.filter(item => item.product_id !== productId),
            error: null
          }));

          // Usar API route con autenticación
          const response = await fetch(`/api/wishlist/${productId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            // Rollback optimistic update
            set(state => ({
              items: [...state.items, existingItem],
            }));
            
            const errorData = await response.json();
            set({ error: errorData.error || 'Error al eliminar de favoritos' });
            return false;
          }

          return true;
        } catch (error) {
          console.error('Error removing from wishlist:', error);
          set({ error: error instanceof Error ? error.message : 'Error al eliminar de favoritos' });
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