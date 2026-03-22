'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
    X,
    Search,
    Plus,
    Minus,
    Package,
    Layers,
    ChevronRight,
    Save,
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
    const customerNameInputRef = useRef<HTMLInputElement | null>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);

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

    useEffect(() => {
        if (!isOpen) return;

        const focusTimer = window.setTimeout(() => {
            if (activeTab === 'customer') {
                customerNameInputRef.current?.focus();
            } else {
                searchInputRef.current?.focus();
            }
        }, 120);

        return () => window.clearTimeout(focusTimer);
    }, [activeTab, isOpen]);

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

    const selectedCategoryName = categories.find((category) => category.id === selectedCategory)?.name;
    const fieldClassName = 'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[15px] text-gray-900 placeholder:text-gray-400 shadow-sm outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100 caret-green-700';
    const sectionCardClassName = 'rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/60 p-0 backdrop-blur-[2px] sm:p-4">
            <div className="mx-auto flex h-full max-w-6xl items-end justify-center sm:items-center">
                <div className="flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:max-h-[94vh] sm:rounded-[28px]">
                {/* Header */}
                <div className="border-b border-gray-200 bg-white px-4 py-3 sm:bg-gradient-to-r sm:from-white sm:via-green-50 sm:to-emerald-50 sm:px-6 sm:py-4">
                    <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="hidden text-xs font-semibold uppercase tracking-[0.24em] text-green-700 sm:block">
                            GestiÃ³n de pedidos
                        </p>
                        <h2 className="text-lg font-bold text-gray-950 sm:mt-1 sm:text-2xl">
                            Editar Pedido #{order.order_number}
                        </h2>
                        <p className="mt-1 text-sm text-gray-600">
                            {order.customer_name} • {order.customer_phone}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                    <div className="hidden gap-3 sm:grid sm:grid-cols-3">
                        <div className="rounded-2xl border border-green-100 bg-white/80 px-4 py-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Productos</p>
                            <p className="mt-1 text-lg font-semibold text-gray-900">{orderItems.length}</p>
                        </div>
                        <div className="rounded-2xl border border-green-100 bg-white/80 px-4 py-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Subtotal</p>
                            <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(calculateSubtotal())}</p>
                        </div>
                        <div className="rounded-2xl border border-green-100 bg-white/80 px-4 py-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total actual</p>
                            <p className="mt-1 text-lg font-semibold text-green-700">{formatCurrency(calculateTotal())}</p>
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-4 mt-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 sm:mx-6">
                        <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
                        <span className="text-sm font-medium text-red-700">{error}</span>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-gray-200 bg-white px-2 sm:px-4">
                    <button
                        onClick={() => setActiveTab('customer')}
                        className={`flex-1 rounded-t-2xl px-4 py-3 text-sm font-semibold transition-colors sm:px-6 ${
                            activeTab === 'customer'
                                ? 'border-b-2 border-green-600 bg-green-50 text-green-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <User className="h-4 w-4" />
                            Datos del Cliente
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`flex-1 rounded-t-2xl px-4 py-3 text-sm font-semibold transition-colors sm:px-6 ${
                            activeTab === 'products'
                                ? 'border-b-2 border-green-600 bg-green-50 text-green-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <Package className="h-4 w-4" />
                            Productos ({orderItems.length})
                        </span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-slate-50">
                    {/* Tab: Customer Data */}
                    {activeTab === 'customer' && (
                        <div className="w-full p-4 sm:p-6">
                            <div className="mx-auto max-w-3xl space-y-4">
                                {/* Nombre */}
                                <div className={sectionCardClassName}>
                                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-800">
                                        <User className="h-4 w-4 text-green-700" />
                                        Nombre del Cliente *
                                    </label>
                                    <input
                                        ref={customerNameInputRef}
                                        type="text"
                                        value={customerData.customer_name}
                                        onChange={(e) => setCustomerData({ ...customerData, customer_name: e.target.value })}
                                        className={fieldClassName}
                                        placeholder="Nombre completo del cliente"
                                    />
                                </div>

                                {/* Teléfono */}
                                <div className={sectionCardClassName}>
                                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-800">
                                        <Phone className="h-4 w-4 text-green-700" />
                                        Teléfono / WhatsApp *
                                    </label>
                                    <input
                                        type="tel"
                                        value={customerData.customer_phone}
                                        onChange={(e) => setCustomerData({ ...customerData, customer_phone: e.target.value })}
                                        className={fieldClassName}
                                        placeholder="300 123 4567"
                                    />
                                </div>

                                {/* Email */}
                                <div className={sectionCardClassName}>
                                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-800">
                                        <Mail className="h-4 w-4 text-green-700" />
                                        Correo Electrónico
                                    </label>
                                    <input
                                        type="email"
                                        value={customerData.customer_email}
                                        onChange={(e) => setCustomerData({ ...customerData, customer_email: e.target.value })}
                                        className={fieldClassName}
                                        placeholder="cliente@ejemplo.com"
                                    />
                                </div>

                                {/* Dirección */}
                                <div className={sectionCardClassName}>
                                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-800">
                                        <MapPin className="h-4 w-4 text-green-700" />
                                        Dirección de Entrega
                                    </label>
                                    <textarea
                                        value={customerData.delivery_address}
                                        onChange={(e) => setCustomerData({ ...customerData, delivery_address: e.target.value })}
                                        rows={4}
                                        className={`${fieldClassName} min-h-[112px] resize-y`}
                                        placeholder="Calle, número, edificio, apartamento, barrio..."
                                    />
                                </div>

                                {/* Notas de entrega */}
                                <div className={sectionCardClassName}>
                                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-800">
                                        <FileText className="h-4 w-4 text-green-700" />
                                        Notas de Entrega
                                    </label>
                                    <textarea
                                        value={customerData.delivery_notes}
                                        onChange={(e) => setCustomerData({ ...customerData, delivery_notes: e.target.value })}
                                        rows={3}
                                        className={`${fieldClassName} min-h-[96px] resize-y`}
                                        placeholder="Instrucciones especiales para la entrega..."
                                    />
                                </div>

                                {/* Resumen del pedido */}
                                <details className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                                    <summary className="cursor-pointer list-none text-sm font-semibold text-gray-900">
                                        Ver resumen del pedido
                                    </summary>
                                    <div className="mt-4 space-y-2 text-sm">
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
                                        <div className="flex justify-between border-t border-gray-200 pt-2">
                                            <span className="font-semibold">Total:</span>
                                            <span className="font-bold text-green-600">{formatCurrency(calculateTotal())}</span>
                                        </div>
                                    </div>
                                </details>
                            </div>
                        </div>
                    )}

                    {/* Tab: Products - Left: Product selection */}
                    {activeTab === 'products' && (
                    <div className="flex flex-col gap-4 p-4 sm:p-6 lg:flex-row">
                    <div className="w-full lg:w-1/2 rounded-2xl border border-gray-200 bg-white shadow-sm flex flex-col overflow-hidden">
                        {/* Categories */}
                        <div className="grid gap-4 border-b border-gray-200 p-4 sm:grid-cols-2">
                            <div>
                                <p className="mb-2 text-sm font-medium text-gray-800">Categoría</p>
                                {loadingCategories ? (
                                    <div className="flex h-[50px] items-center">
                                        <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-green-600"></div>
                                    </div>
                                ) : (
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => {
                                            setSelectedCategory(e.target.value);
                                            setExpandedProduct(null);
                                        }}
                                        className={fieldClassName}
                                    >
                                        <option value="">Selecciona una categoría</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div>
                                <p className="mb-2 text-sm font-medium text-gray-800">Buscar producto</p>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder={selectedCategory ? 'Buscar productos...' : 'Selecciona primero una categoría'}
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        disabled={!selectedCategory}
                                        className={`${fieldClassName} pl-10 disabled:bg-gray-100 disabled:text-gray-400`}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="border-b border-gray-200 px-4 py-3">
                            <p className="text-sm text-gray-600">
                                {selectedCategoryName
                                    ? `${products.length} producto${products.length === 1 ? '' : 's'} en ${selectedCategoryName}`
                                    : 'Elige una categoría para ver el catálogo.'}
                            </p>
                        </div>

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
                                    <div key={product.id} className="m-3 rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:border-green-300 hover:shadow-md">
                                        <div className="p-4 flex items-start gap-3">
                                            {product.main_image_url ? (
                                                <img
                                                    src={product.main_image_url}
                                                    alt={product.name}
                                                    className="w-12 h-12 rounded-xl object-cover"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                                                    <Package className="w-5 h-5 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 text-sm truncate">{product.name}</p>
                                                <p className="text-green-700 text-sm font-medium">{formatCurrency(product.price)}</p>
                                                {(product.variants?.length || product.product_variants?.length) ? (
                                                    <button
                                                        onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
                                                        className="mt-2 inline-flex items-center gap-1 rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                                                    >
                                                        <Layers className="w-3 h-3" />
                                                        {product.variants?.length || product.product_variants?.length} variantes
                                                        <ChevronRight className={`w-3 h-3 transition-transform ${expandedProduct === product.id ? 'rotate-90' : ''}`} />
                                                    </button>
                                                ) : null}
                                            </div>
                                            <button
                                                onClick={() => addProduct(product)}
                                                className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-green-600 text-white transition hover:bg-green-700"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Variants */}
                                        {expandedProduct === product.id && (product.variants || product.product_variants) && (
                                            <div className="px-4 pb-4 space-y-2">
                                                {(product.variants || product.product_variants || [])
                                                    .filter(v => v.is_active)
                                                    .map(variant => (
                                                        <div key={variant.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-slate-50 p-3">
                                                            <div>
                                                                <p className="text-xs font-medium">{variant.variant_value}</p>
                                                                <p className="text-xs text-gray-500">{formatCurrency(variant.price_adjustment || product.price)}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => addProduct(product, variant)}
                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700"
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
                    <div className="w-full lg:w-1/2 rounded-2xl border border-gray-200 bg-white shadow-sm flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <p className="font-medium text-gray-900">Productos del Pedido ({orderItems.length})</p>
                            <p className="mt-1 text-sm text-gray-500">Ajusta cantidades o elimina productos sin perder de vista el total.</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {orderItems.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm">No hay productos</p>
                                </div>
                            ) : (
                                orderItems.map((item, index) => (
                                    <div key={index} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 text-sm">{item.product_name}</p>
                                            {item.variant_name && (
                                                <p className="text-xs text-gray-500">{item.variant_name}</p>
                                            )}
                                            <p className="text-green-600 text-sm">{formatCurrency(item.unit_price)}</p>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                                            <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1">
                                            <button
                                                onClick={() => updateQuantity(index, -1)}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-gray-700 transition hover:bg-gray-200"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="min-w-[2.5rem] text-center font-medium text-gray-900">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(index, 1)}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-gray-700 transition hover:bg-gray-200"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                            </div>
                                            <button
                                                onClick={() => removeItem(index)}
                                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                                            <span className="text-sm text-gray-500">Total línea</span>
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
                    </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                    >
                        Cancelar
                    </button>
                    <div className="flex flex-col-reverse gap-3 sm:flex-row">
                    <button
                            onClick={handleSave}
                            disabled={saving || !customerData.customer_name.trim() || !customerData.customer_phone.trim()}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
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
        </div>
    );
}
