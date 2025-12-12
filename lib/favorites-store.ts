import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from './supabase';

interface FavoritesState {
  favorites: string[]; // Array of product IDs
  isLoading: boolean;
  addFavorite: (productId: string) => void;
  removeFavorite: (productId: string) => void;
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  clearFavorites: () => void;
  syncWithServer: (userId: string) => Promise<void>;
  getFavoriteCount: () => number;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      isLoading: false,

      addFavorite: (productId: string) => {
        set((state) => {
          if (state.favorites.includes(productId)) {
            return state;
          }
          return { favorites: [...state.favorites, productId] };
        });
      },

      removeFavorite: (productId: string) => {
        set((state) => ({
          favorites: state.favorites.filter((id) => id !== productId),
        }));
      },

      toggleFavorite: (productId: string) => {
        const state = get();
        if (state.favorites.includes(productId)) {
          state.removeFavorite(productId);
        } else {
          state.addFavorite(productId);
        }
      },

      isFavorite: (productId: string) => {
        return get().favorites.includes(productId);
      },

      clearFavorites: () => {
        set({ favorites: [] });
      },

      syncWithServer: async (userId: string) => {
        // Optional: sync with server for logged-in users
        try {
          set({ isLoading: true });
          const response = await fetch(`/api/favorites?userId=${userId}`);
          const data = await response.json();

          if (data.success && data.favorites) {
            set({ favorites: data.favorites.map((f: any) => f.product_id) });
          }
        } catch (error) {
          console.error('Error syncing favorites:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      getFavoriteCount: () => {
        return get().favorites.length;
      },
    }),
    {
      name: 'tus-aguacates-favorites',
    }
  )
);
