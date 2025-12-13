import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from './productStorage';
import { getProducts } from './productStorage';
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
        console.log(' [WISHLIST-STORE] Loading wishlist for user:', userId);
        
        if (!userId) {
          console.log(' [WISHLIST-STORE] No userId provided, clearing wishlist');
          set({ items: [], error: null });
          return;
        }

        set({ isLoading: true, error: null });
        
        try {
          // Obtener token de autenticación
          console.log(' [WISHLIST-STORE] Getting auth token...');
          const token = await getAuthToken();
          if (!token) {
            console.log(' [WISHLIST-STORE] No auth token available');
            set({ error: 'No hay sesión activa', isLoading: false });
            return;
          }

          console.log(' [WISHLIST-STORE] Auth token obtained, fetching wishlist...');
          
          // Usar API route con autenticación
          const response = await fetch('/api/wishlist', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          console.log(' [WISHLIST-STORE] Wishlist API response status:', response.status);

          if (!response.ok) {
            const errorData = await response.json();
            console.error(' [WISHLIST-STORE] API Error:', errorData);
            throw new Error(errorData.error || 'Error al cargar favoritos');
          }

          const { data } = await response.json();
          console.log('[WISHLIST-STORE] Wishlist data received:', data?.length || 0, 'items');

          // Obtener productos del JSON local para hacer match con product_id
          const allProducts = await getProducts();
          const productMap = new Map(allProducts.map(p => [p.id, p]));

          // Transform data to match our interface, buscando el producto en el JSON local
          const wishlistItems: WishlistItem[] = (data || [])
            .map((item: any) => {
              const product = productMap.get(item.product_id);
              if (!product) {
                console.log('[WISHLIST-STORE] Product not found in local JSON:', item.product_id);
                return null;
              }
              return {
                id: item.id,
                user_id: item.user_id,
                product_id: item.product_id,
                product: product,
                created_at: item.created_at
              };
            })
            .filter((item: WishlistItem | null): item is WishlistItem => item !== null);

          console.log('[WISHLIST-STORE] Wishlist loaded successfully:', wishlistItems.length, 'items');
          set({ items: wishlistItems, isLoading: false });
        } catch (error) {
          console.error(' [WISHLIST-STORE] Error loading wishlist:', error);
          set({ error: error instanceof Error ? error.message : 'Error al cargar favoritos', isLoading: false });
        }
      },

      addToWishlist: async (product: Product, userId: string) => {
        console.log(' [WISHLIST-STORE] Adding product to wishlist:', product.name, 'for user:', userId);
        
        if (!userId) {
          console.log(' [WISHLIST-STORE] No userId provided for addToWishlist');
          set({ error: 'Debes estar logueado para agregar favoritos' });
          return false;
        }

        // Check if already in wishlist
        if (get().isInWishlist(product.id)) {
          console.log(' [WISHLIST-STORE] Product already in wishlist:', product.id);
          return true; // Already in wishlist
        }

        try {
          // Obtener token de autenticación
          console.log(' [WISHLIST-STORE] Getting auth token for addToWishlist...');
          const token = await getAuthToken();
          if (!token) {
            console.log(' [WISHLIST-STORE] No auth token available for addToWishlist');
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

          console.log(' [WISHLIST-STORE] Performing optimistic update for product:', product.id);
          set(state => ({
            items: [tempItem, ...state.items],
            error: null
          }));

          // Usar API route con autenticación
          console.log(' [WISHLIST-STORE] Sending POST request to /api/wishlist for product:', product.id);
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

          console.log(' [WISHLIST-STORE] Add to wishlist API response status:', response.status);

          if (!response.ok) {
            // Rollback optimistic update
            console.log(' [WISHLIST-STORE] API error, rolling back optimistic update');
            set(state => ({
              items: state.items.filter(item => item.id !== tempItem.id),
            }));
            
            const errorData = await response.json();
            console.error(' [WISHLIST-STORE] API Error:', errorData);
            set({ error: errorData.error || 'Error al agregar a favoritos' });
            return false;
          }

          const { data } = await response.json();
          console.log(' [WISHLIST-STORE] Product added to wishlist successfully:', data);

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
          console.error(' [WISHLIST-STORE] Error adding to wishlist:', error);
          set({ error: error instanceof Error ? error.message : 'Error al agregar a favoritos' });
          return false;
        }
      },

      removeFromWishlist: async (productId: string, userId: string) => {
        console.log(' [WISHLIST-STORE] Removing product from wishlist:', productId, 'for user:', userId);
        
        if (!userId) {
          console.log(' [WISHLIST-STORE] No userId provided for removeFromWishlist');
          set({ error: 'Debes estar logueado para eliminar favoritos' });
          return false;
        }

        const existingItem = get().items.find(item => item.product_id === productId);
        if (!existingItem) {
          console.log(' [WISHLIST-STORE] Product not in wishlist:', productId);
          return true; // Not in wishlist
        }

        try {
          // Obtener token de autenticación
          console.log(' [WISHLIST-STORE] Getting auth token for removeFromWishlist...');
          const token = await getAuthToken();
          if (!token) {
            console.log(' [WISHLIST-STORE] No auth token available for removeFromWishlist');
            set({ error: 'No hay sesión activa' });
            return false;
          }

          // Optimistic update
          console.log(' [WISHLIST-STORE] Performing optimistic update to remove product:', productId);
          set(state => ({
            items: state.items.filter(item => item.product_id !== productId),
            error: null
          }));

          // Usar API route con autenticación
          console.log(' [WISHLIST-STORE] Sending DELETE request to /api/wishlist/', productId);
          const response = await fetch(`/api/wishlist/${productId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          console.log(' [WISHLIST-STORE] Remove from wishlist API response status:', response.status);

          if (!response.ok) {
            // Rollback optimistic update
            console.log(' [WISHLIST-STORE] API error, rolling back optimistic update');
            set(state => ({
              items: [...state.items, existingItem],
            }));
            
            const errorData = await response.json();
            console.error(' [WISHLIST-STORE] API Error:', errorData);
            set({ error: errorData.error || 'Error al eliminar de favoritos' });
            return false;
          }

          console.log(' [WISHLIST-STORE] Product removed from wishlist successfully:', productId);
          return true;
        } catch (error) {
          console.error(' [WISHLIST-STORE] Error removing from wishlist:', error);
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