'use client';

import { useState, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { UnifiedProduct } from '@/lib/types';
import { ProductCard } from '../product/ProductCard';
import { ProductQuickViewModal } from '../product/ProductQuickViewModal';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UnifiedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<UnifiedProduct | null>(null);

  // Resetear query cuando se abre/cierra
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setSelectedProduct(null);
    }
  }, [isOpen]);

  // Función para normalizar texto (quitar acentos)
  const normalizeText = (text: string) => {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  };

  // Búsqueda mejorada con debounce más rápido
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const normalizedQuery = normalizeText(query);

        // ✅ Consultar directamente a Supabase con variantes
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            variants:product_variants(*)
          `)
          .eq('is_active', true)
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(50); // Traer más para filtrar mejor

        if (error) {
          console.error('Error searching products:', error);
          setResults([]);
          return;
        }

        // ✅ Ordenar por relevancia: primero los que empiezan con la búsqueda
        const sortedResults = (data || [])
          .map(product => ({
            ...product,
            // Calcular score de relevancia
            _score: (() => {
              const name = normalizeText(product.name);
              // Coincidencia exacta al inicio = máximo score
              if (name.startsWith(normalizedQuery)) return 100;
              // Primera palabra empieza con búsqueda
              if (name.split(' ').some((word: string) => word.startsWith(normalizedQuery))) return 75;
              // Contiene la palabra exacta
              if (name.includes(normalizedQuery)) return 50;
              // Coincidencia parcial
              return 25;
            })()
          }))
          .sort((a, b) => b._score - a._score)
          .slice(0, 12); // Limitar a 12 resultados

        console.log(`🔍 Búsqueda "${query}": ${sortedResults.length} productos encontrados`);
        setResults(sortedResults as UnifiedProduct[]);

      } catch (error) {
        console.error('Error in search:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200); // ⚡ Debounce más rápido (200ms vs 300ms)

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
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-4xl mx-4 shadow-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b flex items-center gap-4">
          <Search className="w-6 h-6 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-lg text-gray-900 outline-none placeholder-gray-400"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Cerrar búsqueda"
          >
            <X className="w-6 h-6 text-gray-600 hover:text-gray-900" />
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
                  <div
                    key={product.id}
                    onClick={() => {
                      console.log('SearchModal: Clicked product:', product.name, 'Variants:', product.variants);
                      setSelectedProduct(product);
                    }}
                    className="cursor-pointer hover:scale-105 transition-transform duration-200"
                  >
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

          {/* Initial state with suggestions */}
          {!query && !loading && (
            <div className="text-center py-8">
              <Search className="w-10 h-10 text-green-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-4">
                ¿Qué estás buscando hoy?
              </p>

              {/* Quick search suggestions */}
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {['Aguacate', 'Mango', 'Fresa', 'Lechuga', 'Limón', 'Germinados'].map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-full text-sm font-medium transition-colors border border-green-200"
                  >
                    {term}
                  </button>
                ))}
              </div>

              <p className="text-gray-400 text-sm">
                Escribe al menos 2 letras para buscar
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Product Quick View Modal */}
      {selectedProduct && (
        <ProductQuickViewModal
          isOpen={true}
          product={selectedProduct as any}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
