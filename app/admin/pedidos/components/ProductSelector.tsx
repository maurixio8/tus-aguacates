'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Product {
  id: string;
  name: string;
  price: number;
  category_id: string;
  main_image_url?: string;
  stock: number;
}

interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
}

interface SelectedProduct {
  product: Product;
  quantity: number;
}

interface ProductSelectorProps {
  onProductsChange: (products: SelectedProduct[]) => void;
  selectedProducts: SelectedProduct[];
}

const categoryIcons: { [key: string]: string } = {
  'aguacates': '🥑',
  'frutas-tropicales': '🍍',
  'frutos-rojos': '🍓',
  'verduras': '🥬',
  'aromaticas': '🌿',
  'saludables': '🥗',
  'especias': '🌶️',
  'combos': '📦'
};

export default function ProductSelector({ onProductsChange, selectedProducts }: ProductSelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadCategories();
    loadAllProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [selectedCategory, searchTerm, products]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const loadAllProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, category_id, main_image_url, stock')
        .eq('is_active', true)
        .gt('stock', 0)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Filtrar por categoría
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category_id === selectedCategory);
    }

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(term));
    }

    setFilteredProducts(filtered);
  };

  const handleAddProduct = (product: Product) => {
    const existing = selectedProducts.find((sp) => sp.product.id === product.id);

    if (existing) {
      // Incrementar cantidad
      const updated = selectedProducts.map((sp) =>
        sp.product.id === product.id
          ? { ...sp, quantity: Math.min(sp.quantity + 1, product.stock) }
          : sp
      );
      onProductsChange(updated);
    } else {
      // Agregar nuevo
      onProductsChange([...selectedProducts, { product, quantity: 1 }]);
    }
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (quantity <= 0) {
      // Eliminar
      onProductsChange(selectedProducts.filter((sp) => sp.product.id !== productId));
    } else if (quantity <= product.stock) {
      // Actualizar
      const updated = selectedProducts.map((sp) =>
        sp.product.id === productId ? { ...sp, quantity } : sp
      );
      onProductsChange(updated);
    }
  };

  const handleRemoveProduct = (productId: string) => {
    onProductsChange(selectedProducts.filter((sp) => sp.product.id !== productId));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getProductQuantity = (productId: string) => {
    const item = selectedProducts.find((sp) => sp.product.id === productId);
    return item ? item.quantity : 0;
  };

  const totalAmount = selectedProducts.reduce(
    (sum, sp) => sum + sp.product.price * sp.quantity,
    0
  );

  return (
    <div className="space-y-6">
      {/* Búsqueda */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Buscar Productos
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <svg
            className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Grid de Categorías */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categorías
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedCategory === null
                ? 'border-green-500 bg-green-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-green-300 hover:shadow'
            }`}
          >
            <div className="text-3xl mb-1">🛒</div>
            <div className="text-sm font-medium text-gray-700">Todas</div>
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedCategory === category.id
                  ? 'border-green-500 bg-green-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-green-300 hover:shadow'
              }`}
            >
              <div className="text-3xl mb-1">{categoryIcons[category.slug] || '📦'}</div>
              <div className="text-sm font-medium text-gray-700">{category.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Productos */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Productos Disponibles
          </label>
          <span className="text-xs text-gray-500">{filteredProducts.length} productos</span>
        </div>

        {isLoading ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-2 text-gray-600 text-sm">Cargando productos...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="mt-2 text-gray-600">No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
            {filteredProducts.map((product) => {
              const currentQuantity = getProductQuantity(product.id);
              const isSelected = currentQuantity > 0;

              return (
                <div
                  key={product.id}
                  className={`bg-white rounded-lg border-2 p-3 transition-all ${
                    isSelected
                      ? 'border-green-500 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow'
                  }`}
                >
                  <div className="flex gap-3">
                    {product.main_image_url && (
                      <img
                        src={product.main_image_url}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </h4>
                      <p className="text-sm font-bold text-green-600">
                        {formatCurrency(product.price)}
                      </p>
                      <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                    </div>
                  </div>

                  {isSelected ? (
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleUpdateQuantity(product.id, currentQuantity - 1)}
                        className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded hover:bg-red-200"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={currentQuantity}
                        onChange={(e) =>
                          handleUpdateQuantity(product.id, parseInt(e.target.value) || 0)
                        }
                        min="0"
                        max={product.stock}
                        className="w-16 text-center border border-gray-300 rounded py-1"
                      />
                      <button
                        onClick={() => handleUpdateQuantity(product.id, currentQuantity + 1)}
                        disabled={currentQuantity >= product.stock}
                        className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        +
                      </button>
                      <button
                        onClick={() => handleRemoveProduct(product.id)}
                        className="ml-auto text-red-500 hover:text-red-700"
                        title="Eliminar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAddProduct(product)}
                      className="w-full mt-3 bg-green-600 text-white py-1.5 rounded hover:bg-green-700 text-sm"
                    >
                      Agregar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resumen de productos seleccionados */}
      {selectedProducts.length > 0 && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">
            Productos Seleccionados ({selectedProducts.length})
          </h3>
          <div className="space-y-2 mb-3">
            {selectedProducts.map((sp) => (
              <div
                key={sp.product.id}
                className="flex justify-between items-center text-sm bg-white p-2 rounded"
              >
                <div className="flex-1">
                  <span className="font-medium text-gray-900">{sp.product.name}</span>
                  <span className="text-gray-600 ml-2">x{sp.quantity}</span>
                </div>
                <span className="font-semibold text-green-600">
                  {formatCurrency(sp.product.price * sp.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-green-300 pt-3 flex justify-between items-center">
            <span className="font-bold text-gray-900">Total:</span>
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
