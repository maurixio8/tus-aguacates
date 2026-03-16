'use client';

import React, { useEffect, useState } from 'react';
import {
    X,
    Search,
    Plus,
    Minus,
    Package,
    Layers,
    ChevronRight,
    Save,
    MessageCircle,
    Trash2,
    AlertCircle,
    User,
    Phone,
    Mail,
    MapPin,
    FileText
} from 'lucide-react';
import type { AdminOrderType } from '@/lib/orders/operational';

interface Category {
    id: string;
    name: string;
    slug: string;
}

interface ProductVariant {
    id: string;
    variant_name: string;
    variant_value: string;
    price_adjustment: number;
    stock_quantity: number;
    is_active: boolean;
}

interface Product {
    id: string;
    name: string;
    price: number;
    main_image_url?: string;
    category_id: string;
    product_variants?: ProductVariant[];
    variants?: ProductVariant[];
    is_active: boolean;
}

interface OrderItem {
    id?: string;
    product_id: string;
    variant_id?: string;
    quantity: number;
    unit_price: number;
    product_name?: string;
    variant_name?: string;
    product_snapshot?: {
        name?: string;
        price?: number;
    };
}

interface CustomerData {
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    delivery_address: string;
    delivery_notes: string;
}

interface Order {
    id: string;
    order_number: string;
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    delivery_address?: string;
    delivery_notes?: string;
    shipping_address?: string;
    total: number;
    order_items?: OrderItem[];
    order_type?: AdminOrderType;
}

interface EditOrderModalProps {
    order: Order;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedItems: OrderItem[], newTotal: number, customerData?: CustomerData) => Promise<boolean>;
}

export default function EditOrderModal({ order, isOpen, onClose, onSave }: EditOrderModalProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'products' | 'customer'>('customer');

    // Estado para datos del cliente
    const [customerData, setCustomerData] = useState<CustomerData>({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        delivery_address: '',
        delivery_notes: ''
    });

    // Reglas de domicilio
    const SHIPPING_COST = 7400;
    const FREE_SHIPPING_THRESHOLD = 68000;

    // Helper para extraer dirección
    const extractAddress = (order: Order): string => {
        // Primero intentar con delivery_address
        if (order.delivery_address) {
            return order.delivery_address;
        }
        // Luego con shipping_address (puede ser JSON)
        if (order.shipping_address) {
            try {
                const parsed = JSON.parse(order.shipping_address);
                return parsed.street_address || parsed.address || '';
            } catch {
                return order.shipping_address;
            }
        }
        return '';
    };

    useEffect(() => {
        if (isOpen) {
            loadCategories();

            // Debug logging para ver qué datos llega al modal
            console.log('🔍 [EDIT ORDER MODAL] Datos del pedido recibidos:', {
                order_id: order.id,
                order_number: order.order_number,
                has_order_items: !!order.order_items,
                order_items_count: order.order_items?.length || 0,
                first_order_item: order.order_items?.[0]
            });

            // Inicializar con los items actuales del pedido
            // Los items ya deberían venir formateados desde la página principal
            let items: OrderItem[] = [];

            if (order.order_items && order.order_items.length > 0) {
                console.log('✅ [EDIT ORDER MODAL] Usando order_items formateados:', order.order_items.length, 'items');
                items = order.order_items;
            } else {
                console.warn('⚠️ [EDIT ORDER MODAL] No se encontraron items en el pedido');
            }

            console.log('📦 [EDIT ORDER MODAL] Items a cargar en el estado:', items);

            setOrderItems(items.map(item => ({
                id: item.id,
                product_id: item.product_id,
                variant_id: item.variant_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                product_name: item.product_snapshot?.name || item.product_name || 'Producto',
                variant_name: item.variant_name
            })));

            // Inicializar datos del cliente
            setCustomerData({
                customer_name: order.customer_name || '',
                customer_phone: order.customer_phone || '',
                customer_email: order.customer_email || '',
                delivery_address: extractAddress(order),
                delivery_notes: order.delivery_notes || ''
            });
        }
    }, [isOpen, order]);

 
    useEffect(() => {
        if (selectedCategory) {
            loadProducts();
        } else {
            setProducts([]);
        }
    }, [selectedCategory, search]);

    const loadCategories = async () => {
        try {
            const response = await fetch('/api/categories');
            const data = await response.json();
            if (data.success || Array.isArray(data)) {
                setCategories(data.categories || data || []);
            }
        } catch (error) {
            console.error('Error cargando categorías:', error);
        } finally {
            setLoadingCategories(false);
        }
    };

    const loadProducts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('category', selectedCategory);
            params.set('status', 'active');
            params.set('limit', '100');
            if (search) params.set('search', search);

            const response = await fetch(`/api/admin/products/?${params}`, {
                credentials: 'include',
            });
            const data = await response.json();

            if (data.success) {
                const activeProducts = (data.data || []).filter((p: Product) => p.is_active);
                setProducts(activeProducts);
            }
        } catch (error) {
            console.error('Error cargando productos:', error);
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

    const addProduct = (product: Product, variant?: ProductVariant) => {
        const price = variant?.price_adjustment || product.price;
        const existingIndex = orderItems.findIndex(
            item => item.product_id === product.id &&
                ((!variant && !item.variant_id) || (variant && item.variant_id === variant.id))
        );

        if (existingIndex >= 0) {
            const updated = [...orderItems];
            updated[existingIndex].quantity += 1;
            setOrderItems(updated);
        } else {
            setOrderItems([...orderItems, {
                product_id: product.id,
                variant_id: variant?.id,
                quantity: 1,
                unit_price: price,
                product_name: product.name,
                variant_name: variant ? `${variant.variant_name}: ${variant.variant_value}` : undefined
            }]);
        }
    };

    const updateQuantity = (index: number, delta: number) => {
        const updated = [...orderItems];
        const newQty = updated[index].quantity + delta;

        if (newQty <= 0) {
            updated.splice(index, 1);
        } else {
            updated[index].quantity = newQty;
        }

        setOrderItems(updated);
    };

    const removeItem = (index: number) => {
        setOrderItems(orderItems.filter((_, i) => i !== index));
    };

    const calculateSubtotal = () => {
        return orderItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    };

    const calculateShipping = () => {
        const subtotal = calculateSubtotal();
        return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateShipping();
    };

    const handleSave = async () => {
        if (!customerData.customer_name.trim()) {
            setError('El nombre del cliente es requerido');
            return;
        }

        if (!customerData.customer_phone.trim()) {
            setError('El teléfono del cliente es requerido');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const success = await onSave(orderItems, calculateTotal(), customerData);
            if (success) {
                onClose();
            } else {
                setError('Error al guardar los cambios');
            }
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Editar Pedido #{order.order_number}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {order.customer_name} • {order.customer_phone}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span className="text-red-700">{error}</span>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-gray-200 bg-gray-50">
                    <button
                        onClick={() => setActiveTab('customer')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                            activeTab === 'customer'
                                ? 'bg-white text-green-600 border-b-2 border-green-600'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <User className="w-4 h-4" />
                        Datos del Cliente
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                            activeTab === 'products'
                                ? 'bg-white text-green-600 border-b-2 border-green-600'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <Package className="w-4 h-4" />
                        Productos ({orderItems.length})
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Tab: Customer Data */}
                    {activeTab === 'customer' && (
                        <div className="w-full p-6 overflow-y-auto">
                            <div className="max-w-2xl mx-auto space-y-4">
                                {/* Nombre */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                        <User className="w-4 h-4" />
                                        Nombre del Cliente *
                                    </label>
                                    <input
                                        type="text"
                                        value={customerData.customer_name}
                                        onChange={(e) => setCustomerData({ ...customerData, customer_name: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                        placeholder="Nombre completo del cliente"
                                    />
                                </div>

                                {/* Teléfono */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                        <Phone className="w-4 h-4" />
                                        Teléfono / WhatsApp *
                                    </label>
                                    <input
                                        type="tel"
                                        value={customerData.customer_phone}
                                        onChange={(e) => setCustomerData({ ...customerData, customer_phone: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                        placeholder="300 123 4567"
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                        <Mail className="w-4 h-4" />
                                        Correo Electrónico
                                    </label>
                                    <input
                                        type="email"
                                        value={customerData.customer_email}
                                        onChange={(e) => setCustomerData({ ...customerData, customer_email: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                        placeholder="cliente@ejemplo.com"
                                    />
                                </div>

                                {/* Dirección */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                        <MapPin className="w-4 h-4" />
                                        Dirección de Entrega
                                    </label>
                                    <textarea
                                        value={customerData.delivery_address}
                                        onChange={(e) => setCustomerData({ ...customerData, delivery_address: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                                        placeholder="Calle, número, edificio, apartamento, barrio..."
                                    />
                                </div>

                                {/* Notas de entrega */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                        <FileText className="w-4 h-4" />
                                        Notas de Entrega
                                    </label>
                                    <textarea
                                        value={customerData.delivery_notes}
                                        onChange={(e) => setCustomerData({ ...customerData, delivery_notes: e.target.value })}
                                        rows={2}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                                        placeholder="Instrucciones especiales para la entrega..."
                                    />
                                </div>

                                {/* Resumen del pedido */}
                                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Resumen del Pedido</p>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Productos:</span>
                                            <span className="font-medium">{orderItems.length} items</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Subtotal:</span>
                                            <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Domicilio:</span>
                                            <span className={calculateShipping() === 0 ? 'text-green-600 font-medium' : 'font-medium'}>
                                                {calculateShipping() === 0 ? 'GRATIS' : formatCurrency(calculateShipping())}
                                            </span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-gray-300">
                                            <span className="font-semibold">Total:</span>
                                            <span className="font-bold text-green-600">{formatCurrency(calculateTotal())}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Products - Left: Product selection */}
                    {activeTab === 'products' && (
                    <>
                    <div className="w-1/2 border-r border-gray-200 flex flex-col overflow-hidden">
                        {/* Categories */}
                        <div className="p-4 border-b border-gray-200">
                            <p className="text-sm font-medium text-gray-700 mb-2">Agregar productos</p>
                            <div className="flex flex-wrap gap-1">
                                {loadingCategories ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                                ) : (
                                    categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={`px-2 py-1 text-xs rounded-lg border transition-all ${selectedCategory === cat.id
                                                    ? 'bg-green-600 text-white border-green-600'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
                                                }`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Search */}
                        {selectedCategory && (
                            <div className="p-4 border-b border-gray-200">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar productos..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Products list */}
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                                </div>
                            ) : !selectedCategory ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm">Selecciona una categoría</p>
                                </div>
                            ) : products.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p className="text-sm">No hay productos</p>
                                </div>
                            ) : (
                                products.map(product => (
                                    <div key={product.id} className="border-b border-gray-100">
                                        <div className="p-3 hover:bg-gray-50 flex items-center gap-3">
                                            {product.main_image_url ? (
                                                <img
                                                    src={product.main_image_url}
                                                    alt={product.name}
                                                    className="w-10 h-10 rounded object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                                                    <Package className="w-5 h-5 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 text-sm truncate">{product.name}</p>
                                                <p className="text-green-600 text-sm">{formatCurrency(product.price)}</p>
                                                {(product.variants?.length || product.product_variants?.length) ? (
                                                    <button
                                                        onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
                                                        className="text-xs text-blue-600 flex items-center gap-1"
                                                    >
                                                        <Layers className="w-3 h-3" />
                                                        {product.variants?.length || product.product_variants?.length} variantes
                                                        <ChevronRight className={`w-3 h-3 transition-transform ${expandedProduct === product.id ? 'rotate-90' : ''}`} />
                                                    </button>
                                                ) : null}
                                            </div>
                                            <button
                                                onClick={() => addProduct(product)}
                                                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Variants */}
                                        {expandedProduct === product.id && (product.variants || product.product_variants) && (
                                            <div className="px-3 pb-3 space-y-1">
                                                {(product.variants || product.product_variants || [])
                                                    .filter(v => v.is_active)
                                                    .map(variant => (
                                                        <div key={variant.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                                                            <div>
                                                                <p className="text-xs font-medium">{variant.variant_value}</p>
                                                                <p className="text-xs text-gray-500">{formatCurrency(variant.price_adjustment || product.price)}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => addProduct(product, variant)}
                                                                className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right: Order items */}
                    <div className="w-1/2 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <p className="font-medium text-gray-900">Productos del Pedido ({orderItems.length})</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {orderItems.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm">No hay productos</p>
                                </div>
                            ) : (
                                orderItems.map((item, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 text-sm">{item.product_name}</p>
                                            {item.variant_name && (
                                                <p className="text-xs text-gray-500">{item.variant_name}</p>
                                            )}
                                            <p className="text-green-600 text-sm">{formatCurrency(item.unit_price)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => updateQuantity(index, -1)}
                                                className="p-1 bg-gray-200 hover:bg-gray-300 rounded"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(index, 1)}
                                                className="p-1 bg-gray-200 hover:bg-gray-300 rounded"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => removeItem(index)}
                                                className="p-1 text-red-500 hover:bg-red-50 rounded ml-2"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="text-right w-24">
                                            <p className="font-semibold text-gray-900">
                                                {formatCurrency(item.unit_price * item.quantity)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Summary */}
                        <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Domicilio:</span>
                                <span className={calculateShipping() === 0 ? 'text-green-600 font-medium' : 'font-medium'}>
                                    {calculateShipping() === 0 ? 'GRATIS' : formatCurrency(calculateShipping())}
                                </span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                <span>Total:</span>
                                <span className="text-green-600">{formatCurrency(calculateTotal())}</span>
                            </div>
                        </div>
                    </div>
                    </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <div className="flex gap-3">
                    <button
                            onClick={handleSave}
                            disabled={saving || !customerData.customer_name.trim() || !customerData.customer_phone.trim()}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {saving ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
