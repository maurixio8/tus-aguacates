'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Minus,
  X,
  ShoppingCart,
  User,
  Phone,
  MapPin,
  Mail,
  FileText,
  CreditCard,
  Package,
  Layers,
  ChevronRight,
  Check,
  AlertCircle
} from 'lucide-react';

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
  categories?: Category;
  product_variants?: ProductVariant[];
  is_active: boolean;
}

interface OrderItem {
  product_id: string;
  variant_id?: string;
  quantity: number;
  product: Product;
  variant?: ProductVariant;
}

export default function CreateOrderPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  // Form data
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

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

      const response = await fetch(`/api/admin/products?${params}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        // Filtrar solo productos activos con stock
        const activeProducts = (data.data || []).filter(
          (p: Product) => p.is_active
        );
        setProducts(activeProducts);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToOrder = (product: Product, variant?: ProductVariant) => {
    const existingItemIndex = selectedItems.findIndex(
      (item) =>
        item.product_id === product.id &&
        ((!variant && !item.variant_id) || (variant && item.variant_id === variant.id))
    );

    if (existingItemIndex >= 0) {
      const updatedItems = [...selectedItems];
      updatedItems[existingItemIndex].quantity += 1;
      setSelectedItems(updatedItems);
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          product_id: product.id,
          variant_id: variant?.id,
          quantity: 1,
          product,
          variant,
        },
      ]);
    }
  };

  const updateQuantity = (index: number, delta: number) => {
    const updatedItems = [...selectedItems];
    const newQuantity = updatedItems[index].quantity + delta;

    if (newQuantity <= 0) {
      updatedItems.splice(index, 1);
    } else {
      updatedItems[index].quantity = newQuantity;
    }

    setSelectedItems(updatedItems);
  };

  const removeFromOrder = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const calculateItemPrice = (item: OrderItem) => {
    const basePrice = item.product.price;
    const variantAdjustment = item.variant?.price_adjustment || 0;
    return basePrice + variantAdjustment;
  };

  const calculateItemTotal = (item: OrderItem) => {
    return calculateItemPrice(item) * item.quantity;
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedItems.length === 0) {
      setError('Debe agregar al menos un producto al pedido');
      return;
    }

    if (!customerName || !customerPhone || !deliveryAddress) {
      setError('Complete todos los campos requeridos');
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || null,
        delivery_address: deliveryAddress,
        delivery_notes: deliveryNotes || null,
        payment_method: paymentMethod,
        items: selectedItems.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          quantity: item.quantity,
          price: calculateItemPrice(item),
          product_name: item.product.name,
          variant_name: item.variant
            ? `${item.variant.variant_name}: ${item.variant.variant_value}`
            : null,
        })),
        total_amount: calculateTotal(),
      };

      const response = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Reset form after 2 seconds
        setTimeout(() => {
          setSelectedItems([]);
          setCustomerName('');
          setCustomerPhone('');
          setCustomerEmail('');
          setDeliveryAddress('');
          setDeliveryNotes('');
          setPaymentMethod('efectivo');
          setSuccess(false);
        }, 2000);
      } else {
        setError(data.error || 'Error al crear el pedido');
      }
    } catch (err) {
      console.error('Error creando pedido:', err);
      setError('Error de conexión al crear el pedido');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Crear Nuevo Pedido</h1>
        <p className="text-gray-600 mt-1">Crea pedidos manuales seleccionando productos por categoría</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <Check className="w-6 h-6 text-green-600" />
          <div>
            <p className="font-medium text-green-800">Pedido creado exitosamente</p>
            <p className="text-sm text-green-600">El pedido ha sido registrado correctamente</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <p className="text-red-700">{error}</p>
          <button onClick={() => setError('')} className="ml-auto p-1 hover:bg-red-100 rounded">
            <X className="w-4 h-4 text-red-600" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna izquierda: Selección de productos */}
        <div className="space-y-4">
          {/* Selector de Categoría */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              1. Selecciona una categoría
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {loadingCategories ? (
                <div className="col-span-full flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                </div>
              ) : (
                categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setSearch('');
                    }}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      selectedCategory === category.id
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-green-500 hover:bg-green-50'
                    }`}
                  >
                    {category.name}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Búsqueda y productos */}
          {selectedCategory && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  2. Buscar y agregar productos
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar en esta categoría..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Lista de productos */}
              <div className="max-h-[400px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No hay productos en esta categoría</p>
                  </div>
                ) : (
                  products.map((product) => (
                    <div key={product.id} className="border-b border-gray-100 last:border-b-0">
                      <div className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          {product.main_image_url ? (
                            <img
                              src={product.main_image_url}
                              alt={product.name}
                              className="w-14 h-14 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900">{product.name}</p>
                            <p className="text-green-600 font-medium">{formatCurrency(product.price)}</p>
                            {product.product_variants && product.product_variants.length > 0 && (
                              <button
                                onClick={() =>
                                  setExpandedProduct(expandedProduct === product.id ? null : product.id)
                                }
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                              >
                                <Layers className="w-3 h-3" />
                                {product.product_variants.length} variante(s)
                                <ChevronRight
                                  className={`w-3 h-3 transition-transform ${
                                    expandedProduct === product.id ? 'rotate-90' : ''
                                  }`}
                                />
                              </button>
                            )}
                          </div>
                          <button
                            onClick={() => addToOrder(product)}
                            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Agregar</span>
                          </button>
                        </div>

                        {/* Variantes expandidas */}
                        {expandedProduct === product.id && product.product_variants && (
                          <div className="mt-3 ml-17 space-y-2">
                            {product.product_variants
                              .filter((v) => v.is_active && v.stock_quantity > 0)
                              .map((variant) => (
                                <div
                                  key={variant.id}
                                  className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {variant.variant_name}: {variant.variant_value}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      {formatCurrency(product.price + variant.price_adjustment)}
                                      {variant.price_adjustment !== 0 && (
                                        <span className="text-blue-600 ml-1">
                                          ({variant.price_adjustment > 0 ? '+' : ''}
                                          {formatCurrency(variant.price_adjustment)})
                                        </span>
                                      )}
                                      {' · '}Stock: {variant.stock_quantity}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => addToOrder(product, variant)}
                                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                                  >
                                    Agregar
                                  </button>
                                </div>
                              ))}
                            {product.product_variants.filter((v) => v.is_active && v.stock_quantity > 0)
                              .length === 0 && (
                              <p className="text-sm text-gray-500 p-2">
                                No hay variantes disponibles con stock
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {!selectedCategory && (
            <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Selecciona una categoría para ver los productos</p>
            </div>
          )}
        </div>

        {/* Columna derecha: Formulario y resumen */}
        <div className="space-y-4">
          {/* Datos del cliente */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Datos del Cliente</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="Nombre del cliente"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono / WhatsApp *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="300 123 4567"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="cliente@ejemplo.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección de entrega *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    rows={2}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                    placeholder="Calle, número, barrio, ciudad"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas de entrega
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    rows={2}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                    placeholder="Instrucciones especiales, referencia, etc."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Método de pago
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none appearance-none bg-white"
                  >
                    <option value="efectivo">Efectivo contra entrega</option>
                    <option value="transferencia">Transferencia / Nequi / Daviplata</option>
                    <option value="tarjeta">Tarjeta de crédito/débito</option>
                  </select>
                </div>
              </div>
            </form>
          </div>

          {/* Resumen del pedido */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Resumen del Pedido</h2>
              {selectedItems.length > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  {selectedItems.length} producto(s)
                </span>
              )}
            </div>

            {selectedItems.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No hay productos en el pedido</p>
                <p className="text-sm text-gray-400">Agrega productos desde la lista</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedItems.map((item, index) => (
                  <div
                    key={`${item.product_id}-${item.variant_id || 'base'}`}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.product.name}</p>
                      {item.variant && (
                        <p className="text-sm text-blue-600">
                          {item.variant.variant_name}: {item.variant.variant_value}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        {formatCurrency(calculateItemPrice(item))} × {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(index, -1)}
                        className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(index, 1)}
                        className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeFromOrder(index)}
                        className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg transition-colors ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Total */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(calculateTotal())}
                    </span>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={submitting || selectedItems.length === 0}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creando Pedido...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Crear Pedido
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
