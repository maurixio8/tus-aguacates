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
  AlertCircle,
  MessageCircle,
  CheckCircle
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url?: string;
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
  variants?: ProductVariant[];
  hasVariants?: boolean;
  is_active: boolean;
}

interface OrderItem {
  product_id: string;
  variant_id?: string;
  quantity: number;
  product: Product;
  variant?: ProductVariant;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  notes?: string;
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

  // Estado para feedback de producto agregado
  const [addedNotification, setAddedNotification] = useState<string | null>(null);
  const [createdOrderData, setCreatedOrderData] = useState<{
    orderId: string;
    total: number;
    items: OrderItem[];
    customerName: string;
    customerPhone: string;
  } | null>(null);

  // Estado para autocompletado de clientes
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerType, setCustomerType] = useState<'existing' | 'new'>('existing');

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

      const response = await fetch(`/api/admin/products/?${params}`, {
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

  // Buscar clientes para autocompletado
  const searchCustomers = async (query: string) => {
    if (query.length < 2) {
      setCustomerSuggestions([]);
      setShowCustomerSuggestions(false);
      return;
    }

    setLoadingCustomers(true);
    try {
      const response = await fetch(`/api/admin/customers?search=${encodeURIComponent(query)}&limit=5`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setCustomerSuggestions(data.data || []);
        setShowCustomerSuggestions(true);
      }
    } catch (error) {
      console.error('Error buscando clientes:', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Seleccionar cliente del autocompletado
  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setCustomerEmail(customer.email || '');
    setDeliveryAddress(customer.address || '');
    setDeliveryNotes(customer.notes || '');
    setCustomerSearch(customer.name);
    setShowCustomerSuggestions(false);
  };

  // Limpiar cliente seleccionado
  const clearSelectedCustomer = () => {
    setSelectedCustomer(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setDeliveryAddress('');
    setDeliveryNotes('');
    setCustomerSearch('');
  };

  // Efecto para buscar clientes con debounce (solo para clientes existentes)
  useEffect(() => {
    if (customerType !== 'existing') return;

    const timer = setTimeout(() => {
      if (customerSearch && !selectedCustomer) {
        searchCustomers(customerSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch, selectedCustomer, customerType]);

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

    // Mostrar notificación de producto agregado
    const notificationText = variant
      ? `${product.name} (${variant.variant_value})`
      : product.name;
    setAddedNotification(notificationText);
    setTimeout(() => setAddedNotification(null), 2000);
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
    // Si hay variante, usar su precio (guardado en price_adjustment)
    if (item.variant?.price_adjustment) {
      return item.variant.price_adjustment;
    }
    // Si no hay variante, usar el precio base del producto
    return item.product.price;
  };

  const calculateItemTotal = (item: OrderItem) => {
    return calculateItemPrice(item) * item.quantity;
  };

  const calculateSubtotal = () => {
    return selectedItems.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  // Reglas de domicilio: $7,400 - Gratis desde $68,000
  const SHIPPING_COST = 7400;
  const FREE_SHIPPING_THRESHOLD = 68000;

  const calculateShipping = () => {
    const subtotal = calculateSubtotal();
    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Generar mensaje de WhatsApp con resumen del pedido
  const generateWhatsAppMessage = (orderData: typeof createdOrderData) => {
    if (!orderData) return '';

    // Obtener solo el primer nombre
    const firstName = orderData.customerName.split(' ')[0];

    let message = '';

    // Saludo inicial
    message += `Hola ${firstName}! 👋\n`;
    message += `Tu pedido #${orderData.orderId.slice(-6).toUpperCase()} ha sido confirmado.\n\n`;

    // === PRODUCTOS (formato compacto) ===
    message += `🛒 *PRODUCTOS:*\n`;

    let subtotal = 0;
    orderData.items.forEach((item) => {
      const itemName = item.product.name;
      const variantInfo = item.variant ? ` (${item.variant.variant_value})` : '';
      const itemPrice = item.variant?.price_adjustment || item.product.price;
      const itemTotal = itemPrice * item.quantity;
      subtotal += itemTotal;

      // Formato: "• 2x Duraznos (500grs) - $10.400"
      message += `• ${item.quantity}x ${itemName}${variantInfo} - ${formatCurrency(itemTotal)}\n`;
    });

    // === RESUMEN ===
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    message += `\n💰 *Subtotal:* ${formatCurrency(subtotal)}\n`;
    message += `🚚 *Envío:* ${shipping === 0 ? 'GRATIS 🎉' : formatCurrency(shipping)}\n`;
    message += `✨ *TOTAL:* ${formatCurrency(orderData.total)}\n\n`;

    // === ENTREGA ===
    const address = (typeof deliveryAddress === 'string' && deliveryAddress.trim())
      ? deliveryAddress.trim()
      : 'No especificada';
    message += `📍 *Entrega:* ${address}\n\n`;

    // === CONFIRMACIÓN ===
    message += `${firstName}, confirma si todo está correcto. Gracias! 💚`;

    return encodeURIComponent(message);
  };

  // Abrir WhatsApp con el mensaje
  const openWhatsApp = () => {
    if (!createdOrderData || !createdOrderData.customerPhone) return;

    // Limpiar el numero de telefono (quitar espacios, guiones, etc)
    let phone = createdOrderData.customerPhone.replace(/\D/g, '');

    // Si el numero no tiene codigo de pais, agregar el de Colombia
    if (phone.length === 10 && phone.startsWith('3')) {
      phone = '57' + phone;
    }

    const message = generateWhatsAppMessage(createdOrderData);
    const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedItems.length === 0) {
      setError('Debe agregar al menos un producto al pedido');
      return;
    }

    // Validación detallada de campos
    const missingFields = [];
    if (!customerName.trim()) missingFields.push('Nombre');
    if (!customerPhone.trim()) missingFields.push('Teléfono');
    if (!deliveryAddress.trim()) missingFields.push('Dirección');

    if (missingFields.length > 0) {
      setError(`Campos requeridos: ${missingFields.join(', ')}`);
      return;
    }

    setSubmitting(true);
    try {
      const subtotal = calculateSubtotal();
      const shipping = calculateShipping();
      const total = subtotal + shipping;

      const orderData = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || null,
        delivery_address: deliveryAddress.trim(),
        delivery_notes: shipping > 0
          ? `${deliveryNotes.trim() ? deliveryNotes.trim() + ' | ' : ''}Domicilio: ${formatCurrency(shipping)}`
          : deliveryNotes.trim() || null,
        payment_method: paymentMethod,
        items: selectedItems.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          quantity: item.quantity,
          price: calculateItemPrice(item),
          product_name: item.product.name,
          variant_name: item.variant?.variant_name || null,
          variant_value: item.variant?.variant_value || null,
        })),
        total_amount: total,
      };

      const response = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (data.success) {
        // Guardar cliente nuevo si no estaba seleccionado de la lista
        if (!selectedCustomer) {
          try {
            await fetch('/api/admin/customers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                name: customerName.trim(),
                phone: customerPhone.trim(),
                email: customerEmail.trim() || null,
                address: deliveryAddress.trim(),
                notes: deliveryNotes.trim() || null,
              }),
            });
          } catch (customerErr) {
            // Si falla guardar el cliente, no es crítico - el pedido ya se creó
            console.log('No se pudo guardar cliente nuevo:', customerErr);
          }
        }

        // Guardar datos del pedido para WhatsApp
        setCreatedOrderData({
          orderId: data.data?.id || Date.now().toString(),
          total: total,
          items: [...selectedItems],
          customerName,
          customerPhone,
        });
        setSuccess(true);
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

      {/* Notificacion de producto agregado */}
      {addedNotification && (
        <div className="fixed top-4 right-4 z-50 animate-pulse">
          <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Agregado: {addedNotification}</span>
          </div>
        </div>
      )}

      {/* Success Message with WhatsApp Button */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-green-800 text-lg">Pedido creado exitosamente</p>
              <p className="text-green-600 mt-1">
                Pedido #{createdOrderData?.orderId?.slice(-6).toUpperCase()} registrado correctamente
              </p>
              <p className="text-green-700 font-medium mt-2">
                Total: {formatCurrency(createdOrderData?.total || 0)}
              </p>

              {/* Botones de accion */}
              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={openWhatsApp}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Enviar resumen por WhatsApp
                </button>
                <button
                  onClick={() => {
                    setSelectedItems([]);
                    setCustomerName('');
                    setCustomerPhone('');
                    setCustomerEmail('');
                    setDeliveryAddress('');
                    setDeliveryNotes('');
                    setPaymentMethod('efectivo');
                    setSuccess(false);
                    setCreatedOrderData(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Crear nuevo pedido
                </button>
              </div>
            </div>
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
          {/* Selector de Categoría - Carrusel Horizontal */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              1. Selecciona una categoría
            </label>
            {loadingCategories ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-2 px-2">
                <div className="flex gap-3 pb-2" style={{ minWidth: 'min-content' }}>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setSearch('');
                      }}
                      className={`flex-shrink-0 w-32 rounded-xl border-2 transition-all overflow-hidden ${
                        selectedCategory === category.id
                          ? 'border-green-600 shadow-md'
                          : 'border-gray-200 hover:border-green-400'
                      }`}
                    >
                      <div className="aspect-square relative">
                        {category.image_url ? (
                          <img
                            src={category.image_url}
                            alt={category.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                            <Layers className="w-8 h-8 text-green-600" />
                          </div>
                        )}
                        {selectedCategory === category.id && (
                          <div className="absolute inset-0 bg-green-600 bg-opacity-20 flex items-center justify-center">
                            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className={`p-2 text-center ${
                        selectedCategory === category.id
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-50 text-gray-700'
                      }`}>
                        <p className="text-xs font-medium truncate">{category.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Búsqueda y productos */}
          {selectedCategory && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-white">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Search className="w-4 h-4 text-green-600" />
                  2. Buscar productos
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Escribe el nombre del producto..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-base"
                  />
                  {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                    </div>
                  )}
                  {search && !loading && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
                {search && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Buscando "{search}" en la categoría seleccionada...
                  </p>
                )}
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
                            {((product.variants && product.variants.length > 0) || (product.product_variants && product.product_variants.length > 0)) && (
                              <button
                                onClick={() =>
                                  setExpandedProduct(expandedProduct === product.id ? null : product.id)
                                }
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                              >
                                <Layers className="w-3 h-3" />
                                {(product.variants?.length || product.product_variants?.length || 0)} variante(s)
                                <ChevronRight
                                  className={`w-3 h-3 transition-transform ${
                                    expandedProduct === product.id ? 'rotate-90' : ''
                                  }`}
                                />
                              </button>
                            )}
                          </div>

                          {/* Botón Agregar - Solo si NO tiene variantes */}
                          {!((product.variants && product.variants.length > 0) || (product.product_variants && product.product_variants.length > 0)) ? (
                            <button
                              onClick={() => addToOrder(product)}
                              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                            >
                              <Plus className="w-4 h-4" />
                              <span className="hidden sm:inline">Agregar</span>
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                setExpandedProduct(expandedProduct === product.id ? null : product.id)
                              }
                              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                            >
                              <Layers className="w-4 h-4" />
                              <span className="hidden sm:inline">Ver variantes</span>
                            </button>
                          )}
                        </div>

                        {/* Variantes expandidas */}
                        {expandedProduct === product.id && (product.variants || product.product_variants) && (
                          <div className="mt-3 ml-17 space-y-2">
                            {(product.variants || product.product_variants || [])
                              .filter((v) => v.is_active === true && (v.stock_quantity === undefined || v.stock_quantity > 0))
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
                                      {formatCurrency(variant.price_adjustment || product.price)}
                                      {variant.stock_quantity !== undefined && ` · Stock: ${variant.stock_quantity}`}
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
                            {(product.variants || product.product_variants || []).filter((v) => v.is_active === true && (v.stock_quantity === undefined || v.stock_quantity > 0))
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">Datos del Cliente</h2>
              </div>
              {selectedCustomer && customerType === 'existing' && (
                <button
                  type="button"
                  onClick={clearSelectedCustomer}
                  className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Limpiar
                </button>
              )}
            </div>

            {/* Toggle para tipo de cliente */}
            <div className="mb-4">
              <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50 w-full">
                <button
                  type="button"
                  onClick={() => {
                    setCustomerType('existing');
                    clearSelectedCustomer();
                  }}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    customerType === 'existing'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Cliente Existente
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerType('new');
                    clearSelectedCustomer();
                  }}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    customerType === 'new'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Cliente Nuevo
                </button>
              </div>
            </div>

            {/* Búsqueda de cliente existente */}
            {customerType === 'existing' && (
              <div className="mb-4 relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar por nombre o teléfono
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      if (selectedCustomer) setSelectedCustomer(null);
                    }}
                    onFocus={() => customerSuggestions.length > 0 && setShowCustomerSuggestions(true)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Escribe nombre o teléfono..."
                  />
                  {loadingCustomers && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    </div>
                  )}
                </div>

                {/* Sugerencias de clientes */}
                {showCustomerSuggestions && customerSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {customerSuggestions.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => selectCustomer(customer)}
                        className="w-full px-4 py-3 text-left hover:bg-green-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                          {customer.address && (
                            <>
                              <span className="text-gray-300">|</span>
                              <MapPin className="w-3 h-3" />
                              <span className="truncate max-w-[150px]">{customer.address}</span>
                            </>
                          )}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {showCustomerSuggestions && customerSuggestions.length === 0 && customerSearch.length >= 2 && !loadingCustomers && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center">
                    <p className="text-gray-500 text-sm">No se encontraron clientes</p>
                    <p className="text-xs text-gray-400 mt-1">Puedes cambiar a "Cliente Nuevo" para crear uno</p>
                  </div>
                )}
              </div>
            )}

            {/* Mensaje de cliente nuevo */}
            {customerType === 'new' && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Los datos del cliente serán guardados en la base de datos
                </p>
              </div>
            )}

            {selectedCustomer && customerType === 'existing' && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Cliente seleccionado: <strong>{selectedCustomer.name}</strong>
                </p>
              </div>
            )}

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

                {/* Subtotal, Domicilio y Total */}
                <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Domicilio:</span>
                    {calculateShipping() === 0 ? (
                      <span className="text-green-600 font-medium">GRATIS</span>
                    ) : (
                      <span className="font-medium">{formatCurrency(calculateShipping())}</span>
                    )}
                  </div>
                  {calculateSubtotal() > 0 && calculateSubtotal() < FREE_SHIPPING_THRESHOLD && (
                    <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                      Agrega {formatCurrency(FREE_SHIPPING_THRESHOLD - calculateSubtotal())} más para domicilio gratis
                    </p>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(calculateTotal())}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
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
