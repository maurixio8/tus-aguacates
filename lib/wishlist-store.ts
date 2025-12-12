import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from './productStorage';
import { supabase } from './supabase';

// Funcion para obtener el token de autenticacion
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
  // Dedupe state
  _lastLoadedUserId: string | null;
  _loadingPromise: Promise<void> | null;

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
      _lastLoadedUserId: null,
      _loadingPromise: null,

      loadWishlist: async (userId: string) => {
        // Dedupe: si ya cargamos para este usuario, no volver a cargar
        const state = get();
        if (state._lastLoadedUserId === userId && state.items.length >= 0 && !state.error) {
          console.log('[WISHLIST-STORE] Skipping load - already loaded for user:', userId);
          return;
        }

        // Dedupe: si ya hay una carga en progreso, reutilizarla
        if (state._loadingPromise && state.isLoading) {
          console.log('[WISHLIST-STORE] Reusing existing loading promise');
          return state._loadingPromise;
        }

        if (!userId) {
          console.log('[WISHLIST-STORE] No userId provided, clearing wishlist');
          set({ items: [], error: null, _lastLoadedUserId: null });
          return;
        }

        console.log('[WISHLIST-STORE] Loading wishlist for user:', userId);

        const loadPromise = (async () => {
          set({ isLoading: true, error: null });

          try {
            const token = await getAuthToken();
            if (!token) {
              console.log('[WISHLIST-STORE] No auth token available');
              set({ error: 'No hay sesion activa', isLoading: false, _loadingPromise: null });
              return;
            }

            const response = await fetch('/api/wishlist', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error('[WISHLIST-STORE] API Error:', errorData);
              throw new Error(errorData.error || 'Error al cargar favoritos');
            }

            const { data } = await response.json();
            console.log('[WISHLIST-STORE] Loaded', data?.length || 0, 'items');

            const wishlistItems: WishlistItem[] = (data || []).map((item: any) => ({
              id: item.id,
              user_id: item.user_id,
              product_id: item.product_id,
              product: item.product as Product,
              created_at: item.created_at
            }));

            set({
              items: wishlistItems,
              isLoading: false,
              _lastLoadedUserId: userId,
              _loadingPromise: null
            });
          } catch (error) {
            console.error('[WISHLIST-STORE] Error loading wishlist:', error);
            set({
              error: error instanceof Error ? error.message : 'Error al cargar favoritos',
              isLoading: false,
              _loadingPromise: null
            });
          }
        })();

        set({ _loadingPromise: loadPromise });
        return loadPromise;
      },

      addToWishlist: async (product: Product, userId: string) => {
        console.log('[WISHLIST-STORE] Adding product:', product.name, '(ID:', product.id, ')');

        if (!userId) {
          set({ error: 'Debes estar logueado para agregar favoritos' });
          return false;
        }

        // Validar que el ID no sea sintetico
        if (product.id.startsWith('product-') || product.id.startsWith('prod-')) {
          console.error('[WISHLIST-STORE] ERROR: ID sintetico detectado:', product.id);
          console.error('[WISHLIST-STORE] Esto indica que la sincronizacion con Supabase no funciono.');
          console.error('[WISHLIST-STORE] Intenta limpiar localStorage y recargar la pagina.');
          set({ error: 'Error: producto no sincronizado con la base de datos. Recarga la pagina.' });
          return false;
        }

        if (get().isInWishlist(product.id)) {
          console.log('[WISHLIST-STORE] Product already in wishlist:', product.id);
          return true;
        }

        try {
          const token = await getAuthToken();
          if (!token) {
            set({ error: 'No hay sesion activa' });
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

          console.log('[WISHLIST-STORE] POST /api/wishlist with product_id:', product.id);
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
            // Rollback
            set(state => ({
              items: state.items.filter(item => item.id !== tempItem.id),
            }));

            const errorData = await response.json();
            console.error('[WISHLIST-STORE] API Error:', response.status, errorData);
            set({ error: errorData.error || 'Error al agregar a favoritos' });
            return false;
          }

          const { data } = await response.json();
          console.log('[WISHLIST-STORE] Added successfully:', data?.id);

          set(state => ({
            items: state.items.map(item =>
              item.id === tempItem.id
                ? { ...item, id: data.id, created_at: data.created_at }
                : item
            )
          }));

          return true;
        } catch (error) {
          console.error('[WISHLIST-STORE] Error:', error);
          set({ error: error instanceof Error ? error.message : 'Error al agregar a favoritos' });
          return false;
        }
      },

      removeFromWishlist: async (productId: string, userId: string) => {
        console.log('[WISHLIST-STORE] Removing product:', productId);

        if (!userId) {
          set({ error: 'Debes estar logueado para eliminar favoritos' });
          return false;
        }

        const existingItem = get().items.find(item => item.product_id === productId);
        if (!existingItem) {
          return true;
        }

        try {
          const token = await getAuthToken();
          if (!token) {
            set({ error: 'No hay sesion activa' });
            return false;
          }

          // Optimistic update
          set(state => ({
            items: state.items.filter(item => item.product_id !== productId),
            error: null
          }));

          const response = await fetch(`/api/wishlist/${productId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            // Rollback
            set(state => ({
              items: [...state.items, existingItem],
            }));

            const errorData = await response.json();
            console.error('[WISHLIST-STORE] Delete error:', errorData);
            set({ error: errorData.error || 'Error al eliminar de favoritos' });
            return false;
          }

          console.log('[WISHLIST-STORE] Removed successfully');
          return true;
        } catch (error) {
          console.error('[WISHLIST-STORE] Error:', error);
          set({ error: error instanceof Error ? error.message : 'Error al eliminar de favoritos' });
          return false;
        }
      },

      isInWishlist: (productId: string) => {
        return get().items.some(item => item.product_id === productId);
      },

      clearWishlist: () => {
        set({ items: [], error: null, _lastLoadedUserId: null, _loadingPromise: null });
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
        items: state.items,
        _lastLoadedUserId: state._lastLoadedUserId
      })
    }
  )
);
