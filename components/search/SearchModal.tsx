'use client';

import { useState, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/lib/supabase';
import { ProductCard } from '../product/ProductCard';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Resetear query cuando se abre/cierra
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Búsqueda con debounce
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .ilike('name', `%${query}%`)
          .eq('is_active', true)
          .limit(8)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error searching products:', error);
          setResults([]);
        } else {
          setResults(data || []);
        }
      } catch (error) {
        console.error('Error in search:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Cerrar con ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevenir scroll del body
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-2xl w-full max-w-4xl mx-4 shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center gap-4">
          <Search className="w-6 h-6 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-lg outline-none placeholder-gray-400"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Cerrar búsqueda"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Results */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-green-600 mr-2" />
              <span className="text-gray-600">Buscando productos...</span>
            </div>
          )}

          {/* Results */}
          {!loading && results.length > 0 && (
            <>
              <p className="text-sm text-gray-500 mb-4">
                {results.length} {results.length === 1 ? 'producto encontrado' : 'productos encontrados'}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.map((product) => (
                  <div key={product.id} onClick={onClose}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* No results */}
          {query && !loading && results.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">
                No se encontraron productos
              </p>
              <p className="text-gray-400 text-sm">
                Intenta con otros términos como "aguacate" o "frutas"
              </p>
            </div>
          )}

          {/* Initial state */}
          {!query && !loading && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">
                ¿Qué estás buscando?
              </p>
              <p className="text-gray-400 text-sm">
                Escribe al menos 2 caracteres para comenzar a buscar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}