'use client';

import { useEffect, useState } from 'react';
import { Search, Package, DollarSign, TrendingUp, Layers } from 'lucide-react';
import Link from 'next/link';

interface B2BProduct {
    id: string;
    name: string;
    base_price: number;
    min_quantity: number;
    is_active: boolean;
    category_name: string;
    total_sold?: number;
    total_revenue?: number;
    pricing_tiers?: Array<{
        min_quantity: number;
        max_quantity: number | null;
        price: number;
        discount_percentage: number;
    }>;
}

export default function AdminB2BProductsPage() {
    const [products, setProducts] = useState<B2BProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            // Usar la API de productos del catálogo principal
            const response = await fetch('/api/products?limit=100');
            const data = await response.json();

            // Manejar diferentes formatos de respuesta
            let productsData = [];
            if (data.success && data.products) {
                productsData = data.products;
            } else if (Array.isArray(data)) {
                productsData = data;
            } else if (data.data && Array.isArray(data.data)) {
                productsData = data.data;
            }

            if (productsData.length > 0) {
                setProducts(productsData.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    base_price: p.price || p.base_price || 0,
                    min_quantity: 1,
                    is_active: p.is_active !== false,
                    category_name: p.category_name || p.categories?.name || p.category || 'Sin categoría',
                })));
            }
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Productos B2B</h1>
                <p className="text-gray-600 mt-1">Gestiona los productos y precios por volumen</p>
            </div>

            {/* Info Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <Package className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-medium text-amber-800">Productos B2B</h3>
                        <p className="text-sm text-amber-700 mt-1">
                            Los productos B2B se sincronizan con el catálogo principal. Aquí puedes configurar precios especiales por volumen para empresas.
                        </p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar productos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                    <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h3 className="font-medium text-gray-900 line-clamp-2">{product.name}</h3>
                                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                    <Layers className="w-3 h-3" />
                                    {product.category_name}
                                </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {product.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Precio Base:</span>
                                <span className="font-semibold text-gray-900">{formatCurrency(product.base_price)}</span>
                            </div>
                            {product.pricing_tiers && product.pricing_tiers.length > 0 && (
                                <div className="pt-2 border-t border-gray-100">
                                    <p className="text-xs text-amber-600 font-medium mb-1">Precios por Volumen:</p>
                                    {product.pricing_tiers.slice(0, 2).map((tier, idx) => (
                                        <div key={idx} className="flex justify-between text-xs text-gray-600">
                                            <span>{tier.min_quantity}+ unidades</span>
                                            <span className="text-green-600">-{tier.discount_percentage}%</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            className="w-full py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                        >
                            Configurar Precios B2B
                        </button>
                    </div>
                ))}
            </div>

            {filteredProducts.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No se encontraron productos</p>
                </div>
            )}
        </div>
    );
}
