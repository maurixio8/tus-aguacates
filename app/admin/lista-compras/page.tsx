'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Package,
  CheckSquare,
  Square,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  User,
  FileSpreadsheet,
  Copy,
  MapPin,
  ClipboardList,
  Check,
  DollarSign,
  Truck,
  CheckCircle,
  RotateCcw,
  ExternalLink,
  Edit,
  Sun,
  Moon,
  List,
  Download
} from 'lucide-react';

interface OrderItem {
  id: string;
  product_id: string;
  product_snapshot?: {
    name?: string;
    price?: number;
    main_image_url?: string;
    image?: string;
    variant_name?: string;
    variant_value?: string;
  };
  quantity: number;
  unit_price: number;
  subtotal: number;
  products?: {
    name?: string;
    main_image_url?: string;
  };
  product_name?: string;
  productName?: string;
  variantName?: string;
  variant_value?: string;
  price?: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  delivery_address?: string;
  status: string;
  created_at: string;
  order_items?: OrderItem[];
  items?: OrderItem[];
  order_type?: 'registered' | 'guest';
  order_data?: any;
  // Campos de totales
  total?: number;
  total_amount?: number;
  subtotal?: number;
  shipping_fee?: number;
  shipping_cost?: number;
}

// Desglose de un producto por cliente
interface CustomerBreakdown {
  customer_name: string;
  customer_address?: string;
  order_id: string;
  variant_name?: string;
  quantity: number;
  weight_grams?: number;
  weight_display?: string;
  // Para el resumen del pedido completo
  order_items?: Array<{
    product_name: string;
    variant_name?: string;
    quantity: number;
    weight_display?: string;
  }>;
}

interface ProductGrouped {
  // Clave única para agrupación
  grouping_key: string;
  // Nombre base del producto
  product_name: string;
  // Variante si existe (null si no hay)
  variant_name?: string;
  variant_value?: string;
  // Texto completo a mostrar
  display_name: string;
  // Precio unitario de venta
  unit_price: number;
  // Cantidad total (unidades vendidas)
  total_quantity: number;
  // Unidades físicas totales (considerando multiplicadores de variante)
  // Ej: 1x "2 Bandejas" + 4x "1 Bandeja" = 5 unidades vendidas pero 6 bandejas físicas
  total_physical_units?: number;
  // Nombre de la unidad física (ej: "Bandeja", "unidad")
  physical_unit_name?: string;
  // Peso de la variante por unidad (en gramos)
  weight_per_unit_grams?: number;
  // Peso total (en gramos)
  total_weight_grams?: number;
  // Texto del peso total formateado (ej: "2.5 kg", "500 gr")
  total_weight_display?: string;
  // Peso de la unidad más pequeña encontrada (en gramos)
  smallest_weight_grams?: number;
  // Total convertido a unidades de la presentación más pequeña
  total_in_smallest_units?: number;
  // Indica si hay clientes sin variante definida
  has_missing_variants: boolean;
  // En cuántos pedidos aparece
  orders_count: number;
  // Desglose por cliente
  customer_breakdown: CustomerBreakdown[];
  // Items originales para referencia (ej. obtener product_id)
  items: OrderItem[];
}

export default function ListaComprasPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Inicializar modo oscuro
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDark = localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setDarkMode(isDark);
      if (isDark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  // Cargar productos comprados desde localStorage
  const [purchasedProducts, setPurchasedProducts] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shopping-list-purchased');
      if (saved) {
        try {
          return new Set(JSON.parse(saved));
        } catch (e) {
          console.error('Error loading purchased from localStorage:', e);
        }
      }
    }
    return new Set();
  });

  // Guardar productos comprados en localStorage cuando cambian
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('shopping-list-purchased', JSON.stringify([...purchasedProducts]));
    }
  }, [purchasedProducts]);

  // Mapeo de combos a sus componentes reales
  // Basado en información del usuario:
  // - Combo Ahorro #1: 1kg fresas premium
  // - Combo Ahorro #2: Caja 24 aguacates + Arándanos 250g
  // - Combo Ahorro #3: Fresas económica 500g + Arándanos 250g + Paquete 4 aguacates injerto
  // - Combo Mercado Semanal: Caja 24 aguacates, Fresa económica, Banano 1kg, Tomate 500g, Cebolla 500g, etc.
  const COMBO_COMPONENTS: Record<string, Array<{ name: string; quantity: number; unit: string; variant?: string }>> = {
    'combo ahorro #1': [
      { name: 'Fresas premium', quantity: 1, unit: 'kg', variant: '1000 gr' }
    ],
    'combo ahorro #2': [
      { name: 'Caja de 24 unidades hass mediano', quantity: 1, unit: 'caja', variant: '24 unidades' },
      { name: 'Arándanos Orgánicos', quantity: 1, unit: 'paq', variant: 'X250grs' }
    ],
    'combo ahorro #3': [
      { name: 'Fresa Económica', quantity: 1, unit: 'paq', variant: '500grs' },
      { name: 'Arándanos Orgánicos', quantity: 1, unit: 'paq', variant: 'X250grs' },
      { name: 'Paquete 4 Unidades injerto', quantity: 1, unit: 'paq', variant: '4 unidades' }
    ],
    'nuevo combo 4': [
      { name: 'Arándanos Orgánicos', quantity: 1, unit: 'paq', variant: 'X250grs' },
      { name: 'Fresas premium', quantity: 1, unit: 'kg', variant: '1000 gr' },
      { name: 'Caja de 24 unidades hass mediano', quantity: 1, unit: 'caja', variant: '24 unidades' }
    ],
    'combo mercado semanal completo': [
      { name: 'Caja de 24 unidades hass mediano', quantity: 1, unit: 'caja', variant: '24 unidades' },
      { name: 'Fresa Económica', quantity: 1, unit: 'paq', variant: '500grs' },
      { name: 'Banano criollo', quantity: 1, unit: 'kg', variant: '1 Kilo' },
      { name: 'Tomate chonto', quantity: 1, unit: 'lb', variant: '500 gr' },
      { name: 'Cebolla cabezona', quantity: 1, unit: 'lb', variant: '500 gr' },
      { name: 'Papa Sabanera', quantity: 1, unit: 'lb', variant: 'X 500 grs' },
      { name: 'Zanahoria', quantity: 1, unit: 'lb', variant: '500 gr' },
      { name: 'Pasta de Ajo', quantity: 1, unit: 'unidad', variant: 'x100 gr' },
      { name: 'Arándanos Orgánicos', quantity: 1, unit: 'paq', variant: 'X125grs' },
      { name: 'Uva isabelina', quantity: 1, unit: 'bandeja', variant: '400grs' },
      { name: 'Duraznos', quantity: 1, unit: 'lb', variant: '500 gr' },
      { name: 'Limón Tahiti', quantity: 1, unit: 'kg', variant: '1000 gr' }
    ],
    'combo navideño premium': [
      { name: 'Caja de 12 unidades Premium', quantity: 1, unit: 'caja', variant: '12 unidades' },
      { name: 'Uva chilena importada', quantity: 1, unit: 'paq', variant: '500 grs' },
      { name: 'Cerezas', quantity: 1, unit: 'paq', variant: '125 grs' }
    ]
  };

  // Helper para formatear fecha LOCAL (no UTC)
  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calcular fecha del ciclo de entrega (viernes o martes 10AM hacia ahora)
  const getDeliveryCycleDate = (deliveryDay: 'friday' | 'tuesday') => {
    const now = new Date();
    const today = new Date();
    const targetDay = deliveryDay === 'friday' ? 5 : 2;
    const currentDay = today.getDay();

    let daysBack = currentDay - targetDay;
    if (daysBack < 0) daysBack += 7;
    if (daysBack === 0 && now.getHours() < 10) {
      daysBack = 7;
    }

    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() - daysBack);
    return formatLocalDate(deliveryDate);
  };

  // Inicializar con últimos 7 días por defecto
  useEffect(() => {
    // Si ya tenemos fechas en URL o estado, no sobreescribir
    if (dateFrom && dateTo) return;

    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    setDateTo(formatLocalDate(today));
    setDateFrom(formatLocalDate(sevenDaysAgo));
  }, []);

  // Presets de fecha
  const applyDatePreset = (days: number | 'today' | 'tomorrow' | 'this_week' | 'next_week') => {
    const today = new Date();
    let start = new Date(today);
    let end = new Date(today);

    if (days === 'today') {
      // start y end son hoy
    } else if (days === 'tomorrow') {
      start.setDate(today.getDate() + 1);
      end.setDate(today.getDate() + 1);
    } else if (days === 'this_week') {
      // Lunes a Domingo de esta semana
      const day = today.getDay() || 7; // 1 (Mon) - 7 (Sun)
      if (day !== 1) start.setHours(-24 * (day - 1));
      end = new Date(start);
      end.setDate(start.getDate() + 6);
    } else if (typeof days === 'number') {
      start.setDate(today.getDate() - (days - 1));
    }

    setDateFrom(formatLocalDate(start));
    setDateTo(formatLocalDate(end));
  };

  // Cargar pedidos cuando cambian las fechas
  useEffect(() => {
    if (dateFrom && dateTo) {
      loadOrders();
    }
  }, [dateFrom, dateTo]);

  // Detectar posibles clientes duplicados en los pedidos SELECCIONADOS
  const duplicateWarnings = useMemo(() => {
    if (selectedOrders.size === 0) return [];

    const activeOrders = orders.filter(o => selectedOrders.has(o.id));
    const warnings: string[] = [];
    const processedIds = new Set<string>();

    const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    // 1. Agrupar por Teléfono (muy fuerte indicador)
    const byPhone = new Map<string, Order[]>();
    activeOrders.forEach(o => {
      if (!o.customer_phone) return;
      const phone = o.customer_phone.replace(/\D/g, '');
      if (phone.length < 7) return;
      if (!byPhone.has(phone)) byPhone.set(phone, []);
      byPhone.get(phone)!.push(o);
    });

    byPhone.forEach((group, phone) => {
      if (group.length > 1) {
        const names = Array.from(new Set(group.map(o => o.customer_name || 'Sin Nombre'))).join(' / ');
        warnings.push(`Mismo teléfono (${phone}): ${names} (${group.length} pedidos)`);
        group.forEach(o => processedIds.add(o.id));
      }
    });

    // 2. Agrupar por Nombre Normalizado (si no fueron capturados por teléfono)
    const byName = new Map<string, Order[]>();
    activeOrders.forEach(o => {
      // Si ya fue procesado por teléfono, ignorar para evitar duplicar alertas
      if (processedIds.has(o.id)) return;

      const name = normalize(o.customer_name || '');
      if (!name) return;
      if (!byName.has(name)) byName.set(name, []);
      byName.get(name)!.push(o);
    });

    byName.forEach((group, name) => {
      if (group.length > 1) {
        const displayNames = Array.from(new Set(group.map(o => o.customer_name))).join(' / ');
        warnings.push(`Mismo nombre: ${displayNames} (${group.length} pedidos)`);
      }
    });

    return warnings;
  }, [selectedOrders, orders]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('dateFrom', dateFrom);
      params.set('dateTo', dateTo);
      params.set('limit', '100');

      const response = await fetch(`/api/admin/orders?${params}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        // Filtrar solo pedidos no cancelados
        const validOrders = (data.orders || []).filter(
          (order: Order) => order.status !== 'cancelled'
        );
        setOrders(validOrders);
        // Resetear selección cuando cambian los pedidos
        setSelectedOrders(new Set());
        setSelectAll(false);
      }
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Extraer items de order_data si no hay order_items
  const extractItemsFromOrder = (order: Order): OrderItem[] => {
    // Primero intentar con order_items
    if (order.order_items && order.order_items.length > 0) {
      return order.order_items;
    }

    // Luego con items
    if (order.items && order.items.length > 0) {
      return order.items;
    }

    // Finalmente extraer desde order_data (para pedidos de invitados)
    if (order.order_data?.items) {
      return order.order_data.items.map((item: any, index: number) => ({
        id: item.id || `item-${index}`,
        product_id: item.productId || item.product_id || `product-${index}`,
        product_snapshot: {
          name: item.productName || item.product_name || 'Producto',
          price: item.price || item.unit_price || 0,
          variant_name: item.variantName || item.variant_name || null,
          variant_value: item.variantValue || item.variant_value || null
        },
        quantity: item.quantity || 0,
        unit_price: item.price || item.unit_price || 0,
        subtotal: (item.quantity || 0) * (item.price || item.unit_price || 0),
        variantName: item.variantName || item.variant_name || null,
        variant_value: item.variantValue || item.variant_value || null
      }));
    }

    return [];
  };

  // Formatear precio para mostrar
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Detectar categoría del producto basándose en palabras clave del nombre
  // Devuelve un objeto con clases de estilo CSS para diferenciar visualmente
  const getCategoryStyle = (productName: string): { bg: string; border: string; label: string; color: string } => {
    const name = productName.toLowerCase();

    // Combos y Cajas (primero para tener prioridad)
    if (name.includes('combo') || name.includes('caja')) {
      return {
        bg: 'bg-purple-50 dark:bg-purple-900/30',
        border: 'border-l-4 border-l-purple-500 dark:border-l-purple-400',
        label: 'Combo/Caja',
        color: 'text-purple-700 dark:text-purple-300'
      };
    }

    // Frutas
    const frutas = ['manzana', 'fresa', 'arándano', 'arandano', 'naranja', 'limón', 'limon', 'mandarina',
      'mango', 'piña', 'pina', 'papaya', 'banano', 'banana', 'uva', 'ciruela', 'durazno',
      'mora', 'granadilla', 'maracuyá', 'maracuya', 'guayaba', 'aguacate', 'pera', 'sandía',
      'sandia', 'melón', 'melon', 'cereza', 'kiwi', 'coco', 'pitiahaya', 'pitaya', 'lulo', 'tomate de árbol'];
    if (frutas.some(f => name.includes(f))) {
      return {
        bg: 'bg-orange-50 dark:bg-orange-900/30',
        border: 'border-l-4 border-l-orange-400 dark:border-l-orange-400',
        label: 'Fruta',
        color: 'text-orange-700 dark:text-orange-300'
      };
    }

    // Verduras y Hierbas
    const verduras = ['lechuga', 'espinaca', 'kale', 'rúgula', 'rugula', 'acelga', 'apio', 'brócoli',
      'brocoli', 'coliflor', 'zanahoria', 'pepino', 'tomate', 'cebolla', 'ajo', 'cilantro',
      'perejil', 'albahaca', 'hierbabuena', 'menta', 'romero', 'tomillo', 'orégano', 'oregano',
      'papa', 'yuca', 'plátano', 'platano', 'maíz', 'maiz', 'arveja', 'habichuela',
      'calabacín', 'calabacin', 'berenjena', 'pimentón', 'pimenton', 'champiñón', 'champiñon'];
    if (verduras.some(v => name.includes(v))) {
      return {
        bg: 'bg-green-50 dark:bg-green-900/30',
        border: 'border-l-4 border-l-green-500 dark:border-l-green-400',
        label: 'Verdura',
        color: 'text-green-700 dark:text-green-300'
      };
    }

    // Default - sin categoría específica
    return {
      bg: 'bg-white dark:bg-gray-800',
      border: 'border-l-4 border-l-gray-300 dark:border-l-gray-600',
      label: '',
      color: 'text-gray-600 dark:text-gray-400'
    };
  };

  // Extraer peso en gramos desde la variante
  // Busca patrones como: "1000grs", "500 gramos", "1kg", "0.5 kg", "250grs"
  const extractWeightFromVariant = (variantName: string | null): number | undefined => {
    if (!variantName) return undefined;

    // Patrones de búsqueda (en orden de especificidad)
    const patterns = [
      // "1000 grs", "500 gramos", "250 grs"
      /(\d+(?:\.\d+)?)\s*(?:grs|gramas|gr)\b/i,
      // "1 kg", "0.5 kg", "2 kilos"
      /(\d+(?:\.\d+)?)\s*(?:kg|kilos)\b/i,
      // "1000grs" (sin espacio)
      /(\d+(?:\.\d+)?)grs/i,
      // "X250grs" (formato especial)
      /x(\d+(?:\.\d+)?)grs/i,
    ];

    for (const pattern of patterns) {
      const match = variantName.match(pattern);
      if (match) {
        const value = parseFloat(match[1]);
        // Si está en kg, convertir a gramos
        if (/kg|kilos/i.test(variantName)) {
          return value * 1000;
        }
        return value;
      }
    }

    return undefined;
  };

  // Formatear peso total para mostrar
  const formatWeight = (grams: number): string => {
    if (grams >= 1000) {
      const kg = grams / 1000;
      // Si es entero, mostrar sin decimales, si no, con 1 decimal
      return kg % 1 === 0 ? `${kg.toFixed(0)} kg` : `${kg.toFixed(1)} kg`;
    }
    return `${grams} gr`;
  };

  // Normalizar nombre del producto para consolidar entradas duplicadas
  // Elimina variantes o números repetidos al final del nombre y normaliza acentos
  const normalizeProductName = (name: string, variant?: string | null): string => {
    if (!name) return 'Producto sin nombre';
    let normalized = name.trim();

    // Eliminar acentos/diacríticos
    normalized = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // SIEMPRE remover CUALQUIER contenido final entre paréntesis
    // Esto agrupa productos como "Caja de 12 unidades Premium (12 unidades)" con "Caja de 12 unidades Premium"
    normalized = normalized.replace(/\s*\([^)]*\)\s*$/, '').trim();

    // Normalizar espacios múltiples
    normalized = normalized.replace(/\s+/g, ' ');

    return normalized;
  };

  // Crear clave de agrupación inteligente
  // SIEMPRE agrupa por nombre normalizado solamente - ignora variantes para evitar duplicados
  // Esto consolida: "Fresas premium" + "Fresas premium (500 gr)" = mismo producto
  const createGroupingKey = (productName: string, variant: string | null): string => {
    // Usar SOLO el nombre normalizado como clave de agrupación
    // Esto garantiza que todas las variantes del mismo producto se agrupen
    return normalizeProductName(productName, variant);
  };

  // Detectar si el nombre del producto ya contiene información de cantidad/tamaño
  // Ej: "Caja de 12 unidades Premium" -> true
  // Ej: "Arándanos Orgánicos" -> false
  const productNameHasQuantityInfo = (productName: string): boolean => {
    const name = productName.toLowerCase();
    // Patrones que indican que el nombre ya tiene info de cantidad
    const patterns = [
      /\d+\s*unidad/,      // "12 unidades", "4 unidad"
      /x\s*\d+/,           // "x4", "x 12"
      /\d+\s*(gr|grs|kg|kilos|gramos)/,  // "500gr", "1 kg"
      /paquete\s*x?\s*\d+/, // "paquete 4", "paquete x4"
      /caja\s*de\s*\d+/,   // "caja de 12"
      /\d+\s*kilo/,        // "1 kilo"
    ];
    return patterns.some(pattern => pattern.test(name));
  };

  // Extraer la info de cantidad del nombre del producto para mostrar
  // Ej: "Caja de 12 unidades Premium" -> "12 unidades"
  const extractQuantityFromName = (productName: string): string | null => {
    const name = productName.toLowerCase();

    // Buscar "X unidades" o "de X unidades"
    const unitsMatch = productName.match(/(\d+)\s*unidad(es)?/i);
    if (unitsMatch) {
      return `${unitsMatch[1]} unidades`;
    }

    // Buscar peso en gramos o kilos
    const weightMatch = productName.match(/(\d+(?:\.\d+)?)\s*(gr|grs|kg|kilos?|gramos)/i);
    if (weightMatch) {
      return `${weightMatch[1]} ${weightMatch[2]}`;
    }

    return null;
  };

  // Extraer multiplicador de la variante para calcular unidades físicas
  // Ej: "2 Bandejas" -> 2, "3 unidades" -> 3, "X2" -> 2
  // EXCEPCIÓN: Para productos tipo "Caja de X unidades", NO multiplicar porque
  // la caja ya es la unidad de compra (queremos contar cajas, no aguacates)
  const extractMultiplierFromVariant = (variant: string | null, productName?: string): number => {
    if (!variant) return 1;

    const text = variant.toLowerCase().trim();

    // Si el PRODUCTO es una "Caja de X unidades", NO multiplicar
    // La caja ya es la unidad de compra, las "12 unidades" son contenido interno
    if (productName) {
      const productLower = productName.toLowerCase();
      if (productLower.includes('caja de') && productLower.includes('unidad')) {
        // Es una caja, retornar 1 (contar cajas, no contenido interno)
        return 1;
      }
    }

    // Patrones para encontrar multiplicadores
    // "2 Bandejas", "2 bandejas"
    const bandejaMatch = text.match(/^(\d+)\s*bandeja/i);
    if (bandejaMatch) return parseInt(bandejaMatch[1], 10);

    // "X2", "x 2"
    const xMatch = text.match(/^x\s*(\d+)/i);
    if (xMatch) return parseInt(xMatch[1], 10);

    // "2 unidades" al inicio - pero solo si NO es variante derivada del nombre de caja
    const unitsMatch = text.match(/^(\d+)\s*unidad/i);
    if (unitsMatch) return parseInt(unitsMatch[1], 10);

    // "2X" al inicio
    const numXMatch = text.match(/^(\d+)\s*x/i);
    if (numXMatch) return parseInt(numXMatch[1], 10);

    return 1; // Sin multiplicador detectado
  };

  // Pre-procesar pedidos para obtener el resumen de cada uno
  const orderSummaries = useMemo(() => {
    const summaries = new Map<string, Array<{
      product_name: string;
      variant_name?: string;
      quantity: number;
      weight_display?: string;
    }>>();

    orders.forEach(order => {
      const items = extractItemsFromOrder(order);
      const orderItems = items.map(item => {
        const productName = item.product_snapshot?.name || item.products?.name || item.product_name || item.productName || 'Producto';
        const variantName = item.product_snapshot?.variant_name || item.product_snapshot?.variant_value || null;
        const weightPerUnit = extractWeightFromVariant(variantName);
        const totalWeight = weightPerUnit ? weightPerUnit * item.quantity : undefined;

        return {
          product_name: productName,
          variant_name: variantName || undefined,
          quantity: item.quantity,
          weight_display: totalWeight ? formatWeight(totalWeight) : undefined
        };
      });
      summaries.set(order.id, orderItems);
    });

    return summaries;
  }, [orders]);

  // Calcular productos agrupados de los pedidos seleccionados
  const groupedProducts = useMemo(() => {
    const selectedOrdersList = orders.filter(order =>
      selectedOrders.has(order.id)
    );

    const productMap = new Map<string, ProductGrouped>();

    selectedOrdersList.forEach(order => {
      const items = extractItemsFromOrder(order);
      const customerName = order.customer_name || 'Cliente sin nombre';
      const customerAddress = order.delivery_address || order.order_data?.customer?.address || order.order_data?.delivery_address || '';

      items.forEach(item => {
        // Extraer información del producto
        const productName =
          item.product_snapshot?.name ||
          item.products?.name ||
          item.product_name ||
          item.productName ||
          'Producto sin nombre';

        // Verificar si es un combo y obtener sus componentes
        const comboKey = productName.toLowerCase();
        const comboComponents = COMBO_COMPONENTS[comboKey] ||
          Object.entries(COMBO_COMPONENTS).find(([key]) => comboKey.includes(key))?.[1];

        if (comboComponents) {
          // Es un combo - desglosar en sus componentes
          comboComponents.forEach(component => {
            const componentKey = `${component.name}|${component.variant || 'Sin variante'}|COMBO`;

            // Info del cliente para este componente (del combo)
            const customerInfo: CustomerBreakdown = {
              customer_name: customerName,
              customer_address: customerAddress,
              order_id: order.id,
              variant_name: component.variant,
              quantity: component.quantity * item.quantity,
              order_items: orderSummaries.get(order.id)
            };

            if (productMap.has(componentKey)) {
              const existing = productMap.get(componentKey)!;
              existing.total_quantity += component.quantity * item.quantity;
              existing.orders_count += 1;
              existing.customer_breakdown.push(customerInfo);
              if (!existing.items) existing.items = [];
              existing.items.push(item);
            } else {
              productMap.set(componentKey, {
                grouping_key: componentKey,
                product_name: component.name,
                variant_name: component.variant,
                display_name: component.variant ? `${component.name} (${component.variant})` : component.name,
                unit_price: 0, // No tiene precio individual
                total_quantity: component.quantity * item.quantity,
                has_missing_variants: false, // Combos siempre tienen variante definida
                orders_count: 1,
                customer_breakdown: [customerInfo],
                items: [item]
              });
            }
          });
        } else {
          // Extraer variante si existe - PRIORIZAR variant_value sobre variant_name
          // variant_value contiene el valor específico (ej: "X125grs", "X250grs")
          // variant_name contiene el tipo genérico (ej: "Presentación", "Tamaño")
          const variantName = item.product_snapshot?.variant_name || null;
          const variantValue = item.product_snapshot?.variant_value || null;
          let variantDisplay = variantValue || variantName || null;

          // Si no hay variante pero el nombre tiene info de cantidad, usar esa info
          // Ej: "Caja de 12 unidades Premium" -> variantDisplay = "12 unidades"
          const quantityFromName = extractQuantityFromName(productName);
          const nameHasQuantity = productNameHasQuantityInfo(productName);

          // Si no hay variante guardada pero el nombre tiene la info, usarla
          if (!variantDisplay && quantityFromName) {
            variantDisplay = quantityFromName;
          }

          // Precio unitario de venta
          const unitPrice = item.unit_price || item.price || 0;

          // Extraer peso de la variante (si existe)
          const weightPerUnitGrams = extractWeightFromVariant(variantDisplay);

          // Crear clave de agrupación inteligente (detecta si variante ya está en el nombre)
          const groupingKey = createGroupingKey(productName, variantDisplay);
          const normalizedName = normalizeProductName(productName, variantDisplay);

          // Calcular peso para este item
          const itemWeightGrams = weightPerUnitGrams ? weightPerUnitGrams * item.quantity : undefined;
          const itemWeightDisplay = itemWeightGrams ? formatWeight(itemWeightGrams) : undefined;

          // Info del cliente para este item
          const customerInfo: CustomerBreakdown = {
            customer_name: customerName,
            customer_address: customerAddress,
            order_id: order.id,
            variant_name: variantDisplay || undefined,
            quantity: item.quantity,
            weight_grams: itemWeightGrams,
            weight_display: itemWeightDisplay,
            order_items: orderSummaries.get(order.id)
          };

          // Verificar si ya existe este grupo
          if (productMap.has(groupingKey)) {
            const existing = productMap.get(groupingKey)!;
            existing.total_quantity += item.quantity;
            existing.orders_count += 1;

            // Agregar desglose por cliente
            existing.customer_breakdown.push(customerInfo);
            if (!existing.items) existing.items = [];
            existing.items.push(item);

            // Calcular unidades físicas para este item (SIEMPRE, no solo con multiplicador > 1)
            const multiplier = extractMultiplierFromVariant(variantDisplay, normalizedName);
            const itemPhysicalUnits = item.quantity * multiplier;

            // Inicializar total_physical_units si no existe
            if (existing.total_physical_units === undefined) {
              // Recalcular desde cero sumando todos los items anteriores
              existing.total_physical_units = 0;
              existing.customer_breakdown.slice(0, -1).forEach(cb => {
                const prevMultiplier = extractMultiplierFromVariant(cb.variant_name || null, normalizedName);
                existing.total_physical_units! += cb.quantity * prevMultiplier;
              });
            }
            existing.total_physical_units += itemPhysicalUnits;

            // Detectar nombre de unidad física si no existe
            if (!existing.physical_unit_name) {
              if (productName.toLowerCase().includes('caja')) {
                existing.physical_unit_name = 'Caja';
              } else if (variantDisplay) {
                const lower = variantDisplay.toLowerCase();
                if (lower.includes('bandeja')) existing.physical_unit_name = 'Bandeja';
                else if (lower.includes('unidad')) existing.physical_unit_name = 'unidad';
                else if (lower.includes('paquete')) existing.physical_unit_name = 'paquete';
              }
            }

            // Solo marcar como faltante si NO hay variante Y el nombre NO tiene info de cantidad
            // (productos como "Caja de 12 unidades" no necesitan variante)
            if (!variantDisplay && !nameHasQuantity) {
              existing.has_missing_variants = true;
            }

            // Recalcular peso total si hay peso por unidad
            if (itemWeightGrams) {
              existing.total_weight_grams = (existing.total_weight_grams || 0) + itemWeightGrams;
              existing.total_weight_display = formatWeight(existing.total_weight_grams);

              // Actualizar peso mínimo si este es menor
              if (weightPerUnitGrams && (!existing.smallest_weight_grams || weightPerUnitGrams < existing.smallest_weight_grams)) {
                existing.smallest_weight_grams = weightPerUnitGrams;
              }

              // Recalcular unidades equivalentes en la presentación más pequeña
              if (existing.smallest_weight_grams && existing.total_weight_grams) {
                existing.total_in_smallest_units = Math.ceil(existing.total_weight_grams / existing.smallest_weight_grams);
              }
            }
          } else {
            // Crear nombre a mostrar (usando nombre normalizado)
            let displayName = normalizedName;

            // Si hay variante separada, agregarla
            if (variantDisplay) {
              displayName = `${normalizedName} (${variantDisplay})`;
            }

            // Calcular peso total inicial
            const initialWeightGrams = weightPerUnitGrams ? weightPerUnitGrams * item.quantity : undefined;
            const weightDisplay = initialWeightGrams ? formatWeight(initialWeightGrams) : undefined;

            // Calcular unidades físicas (considerando multiplicador de variante)
            // Ej: 1 pedido de "2 Bandejas" = 2 bandejas físicas
            const multiplier = extractMultiplierFromVariant(variantDisplay, normalizedName);
            const physicalUnits = item.quantity * multiplier;

            let physicalUnitName: string | undefined = undefined;
            if (productName.toLowerCase().includes('caja')) {
              physicalUnitName = 'Caja';
            } else if (variantDisplay) {
              const lower = variantDisplay.toLowerCase();
              if (lower.includes('bandeja')) physicalUnitName = 'Bandeja';
              else if (lower.includes('unidad')) physicalUnitName = 'unidad';
              else if (lower.includes('paquete')) physicalUnitName = 'paquete';
            }

            productMap.set(groupingKey, {
              grouping_key: groupingKey,
              product_name: normalizedName,
              variant_name: variantDisplay || undefined,
              variant_value: variantValue || undefined,
              display_name: displayName,
              unit_price: unitPrice,
              total_quantity: item.quantity,
              // Siempre guardar unidades físicas si hay nombre de unidad (bandeja, etc.)
              total_physical_units: physicalUnitName ? physicalUnits : undefined,
              physical_unit_name: physicalUnitName,
              weight_per_unit_grams: weightPerUnitGrams,
              total_weight_grams: initialWeightGrams,
              total_weight_display: weightDisplay,
              smallest_weight_grams: weightPerUnitGrams, // Inicializar con el peso de esta variante
              total_in_smallest_units: item.quantity, // Inicializar con la cantidad actual
              // Solo falta variante si NO hay variantDisplay Y el nombre NO tiene info de cantidad
              has_missing_variants: !variantDisplay && !nameHasQuantity,
              orders_count: 1,
              customer_breakdown: [customerInfo],
              items: [item]
            });
          }
        }
      });
    });

    return Array.from(productMap.values()).sort(
      (a, b) => {
        // Orden de prioridad de categorías (1: Combo/Caja, 2: Fruta, 3: Verdura, 4: Otro)
        const getPriority = (name: string) => {
          const style = getCategoryStyle(name);
          if (style.label === 'Combo/Caja') return 1;
          if (style.label === 'Fruta') return 2;
          if (style.label === 'Verdura') return 3;
          return 4;
        };

        const priorityA = getPriority(a.product_name);
        const priorityB = getPriority(b.product_name);

        // 1. Clasificar por Categoría
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        // 2. Si es la misma categoría, ordenar Alfabéticamente por nombre
        return a.product_name.localeCompare(b.product_name);
      }
    );
  }, [orders, selectedOrders]);

  // Calcular resumen de ventas de pedidos seleccionados
  const salesSummary = useMemo(() => {
    const selectedOrdersList = orders.filter(order => selectedOrders.has(order.id));

    let totalProducts = 0;   // Total en productos (subtotal)
    let totalShipping = 0;   // Total en domicilios
    let totalGeneral = 0;    // Total general

    selectedOrdersList.forEach(order => {
      // Obtener costo de envío
      const shippingCost = order.shipping_fee || order.shipping_cost || order.order_data?.shipping_cost || order.order_data?.shippingFee || 0;

      // Obtener total del pedido
      const orderTotal = order.total || order.total_amount || 0;

      // Calcular subtotal de productos
      let productAmount = order.subtotal || 0;

      // Si no hay subtotal explícito, calcularlo desde los items del pedido
      if (!productAmount && orderTotal > 0) {
        const items = extractItemsFromOrder(order);
        if (items.length > 0) {
          productAmount = items.reduce((sum, item) => {
            const price = item.unit_price || item.price || 0;
            return sum + (price * item.quantity);
          }, 0);
        } else {
          // Como último recurso, restar el envío del total
          productAmount = Math.max(0, orderTotal - shippingCost);
        }
      }

      totalProducts += productAmount;
      totalShipping += shippingCost;
      // El total general es Productos + Envíos (para consistencia)
      totalGeneral += productAmount + shippingCost;
    });

    return {
      productTotal: totalProducts,
      shippingTotal: totalShipping,
      grandTotal: totalGeneral,
      ordersCount: selectedOrdersList.length
    };
  }, [orders, selectedOrders]);

  // Toggle selección individual
  const toggleOrderSelection = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);

    // Actualizar estado de selectAll
    setSelectAll(newSelected.size === orders.length && orders.length > 0);
  };

  // Toggle seleccionar todos
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map(o => o.id)));
    }
    setSelectAll(!selectAll);
  };

  // Calcular total de items en un pedido
  const getOrderItemCount = (order: Order): number => {
    const items = extractItemsFromOrder(order);
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  // Toggle expandir producto para ver desglose
  const toggleProductExpanded = (groupingKey: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(groupingKey)) {
      newExpanded.delete(groupingKey);
    } else {
      newExpanded.add(groupingKey);
    }
    setExpandedProducts(newExpanded);
  };

  // Expandir/colapsar todos los productos
  const toggleExpandAll = () => {
    if (expandedProducts.size === groupedProducts.length) {
      setExpandedProducts(new Set());
    } else {
      setExpandedProducts(new Set(groupedProducts.map(p => p.grouping_key)));
    }
  };

  // Toggle marcar producto como comprado
  const togglePurchased = (groupingKey: string) => {
    const newPurchased = new Set(purchasedProducts);
    if (newPurchased.has(groupingKey)) {
      newPurchased.delete(groupingKey);
    } else {
      newPurchased.add(groupingKey);
    }
    setPurchasedProducts(newPurchased);
  };

  // Limpiar todos los productos marcados como comprados
  const clearAllPurchased = () => {
    setPurchasedProducts(new Set());
  };

  // Verificar si un producto es un combo
  const isCombo = (productName: string): boolean => {
    return productName.toLowerCase().includes('combo');
  };

  // Obtener componentes de un combo
  const getComboComponents = (productName: string) => {
    const key = productName.toLowerCase();
    for (const [comboKey, components] of Object.entries(COMBO_COMPONENTS)) {
      if (key.includes(comboKey) || comboKey.includes(key.replace('combo ', ''))) {
        return components;
      }
    }
    return null;
  };

  // Copiar al portapapeles con feedback visual
  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(new Set([...copiedItems, itemId]));
      // Remover el estado de copiado después de 2 segundos
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error('Error copiando:', err);
    }
  };

  // Generar resumen del pedido como texto
  const generateOrderSummary = (customer: CustomerBreakdown) => {
    if (!customer.order_items || customer.order_items.length === 0) return '';

    const lines = [`Pedido para: ${customer.customer_name}`, ''];
    customer.order_items.forEach(item => {
      const variant = item.variant_name ? ` (${item.variant_name})` : '';
      const weight = item.weight_display ? ` - ${item.weight_display}` : '';
      lines.push(`• ${item.product_name}${variant}: ${item.quantity} unidad${item.quantity === 1 ? '' : 'es'}${weight}`);
    });

    if (customer.customer_address) {
      lines.push('', `Dirección: ${customer.customer_address}`);
    }

    return lines.join('\n');
  };

  // Exportar a Excel (CSV)
  const exportToExcel = () => {
    if (groupedProducts.length === 0) return;

    // Crear CSV con BOM para Excel
    const BOM = '\uFEFF';
    const headers = ['Producto', 'Variante', 'Cantidad Total', 'Peso Total', 'Cliente', 'Dirección', 'Cantidad Cliente', 'Peso Cliente'];

    const rows: string[][] = [];

    groupedProducts.forEach(product => {
      // Primera fila con el total del producto
      rows.push([
        product.product_name,
        product.variant_name || 'Sin variante',
        product.total_quantity.toString(),
        product.total_weight_display || '-',
        '--- TOTAL ---',
        '',
        '',
        ''
      ]);

      // Filas con el desglose por cliente
      product.customer_breakdown.forEach(customer => {
        rows.push([
          '',
          '',
          '',
          '',
          customer.customer_name,
          customer.customer_address || '-',
          customer.quantity.toString(),
          customer.weight_display || '-'
        ]);
      });
    });

    const csvContent = BOM + [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `lista-compras-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyAll = async () => {
    const allText = groupedProducts.map(p =>
      `${p.display_name}\t${p.total_weight_display || p.total_quantity}`
    ).join('\n');
    await navigator.clipboard.writeText(allText);
    setCopiedItems(new Set(groupedProducts.map(p => p.grouping_key)));
    setTimeout(() => setCopiedItems(new Set()), 2000);
  };

  const handleDownloadCSV = exportToExcel;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Lista de Compras
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Genera una lista consolidada de productos para reabastecer inventario
          </p>
        </div>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Filtros de Fecha Mejorados */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-orange-100 dark:border-gray-700 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 items-center overflow-x-auto pb-2 md:pb-0 w-full md:w-auto text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap mr-2">Rangos rápidos:</span>
          <button onClick={() => applyDatePreset('today')} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-orange-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors whitespace-nowrap">Hoy</button>
          <button onClick={() => applyDatePreset('tomorrow')} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-orange-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors whitespace-nowrap">Mañana</button>
          <button onClick={() => applyDatePreset(7)} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-orange-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors whitespace-nowrap">Últimos 7 días</button>
          <button onClick={() => applyDatePreset(30)} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-orange-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors whitespace-nowrap">Últimos 30 días</button>
        </div>

        <div className="flex gap-3 items-center w-full md:w-auto bg-gray-50 dark:bg-gray-900 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="relative group">
            <label className="text-xs text-gray-500 dark:text-gray-400 absolute -top-2 left-2 bg-gray-50 dark:bg-gray-900 px-1">Desde</label>
            <input
              type="date"
              className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-0 w-32 cursor-pointer dark:[color-scheme:dark]"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <span className="text-gray-400">→</span>
          <div className="relative group">
            <label className="text-xs text-gray-500 dark:text-gray-400 absolute -top-2 left-2 bg-gray-50 dark:bg-gray-900 px-1">Hasta</label>
            <input
              type="date"
              className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-0 w-32 cursor-pointer dark:[color-scheme:dark]"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      {
        loading ? (
          <div className="flex items-center justify-center py-12" >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No se encontraron pedidos en este rango de fechas</p>
          </div>
        ) : (
          <>
            {/* Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                <p className="text-sm text-gray-600 dark:text-gray-400">Pedidos en el rango</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{orders.length}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                <p className="text-sm text-gray-600 dark:text-gray-400">Pedidos seleccionados</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{selectedOrders.size}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                <p className="text-sm text-gray-600 dark:text-gray-400">Productos únicos</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{groupedProducts.length}</p>
              </div>
            </div>

            {/* Resumen de Ventas de Pedidos Seleccionados */}
            {selectedOrders.size > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-800">Resumen de Ventas ({salesSummary.ordersCount} pedidos)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Total en Productos */}
                  <div className="bg-white rounded-lg p-4 border border-green-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-4 h-4 text-green-600" />
                      <p className="text-sm text-gray-600">Venta en Productos</p>
                    </div>
                    <p className="text-xl font-bold text-green-700">{formatPrice(salesSummary.productTotal)}</p>
                  </div>
                  {/* Total en Domicilios */}
                  <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Truck className="w-4 h-4 text-blue-600" />
                      <p className="text-sm text-gray-600">Recaudado en Domicilios</p>
                    </div>
                    <p className="text-xl font-bold text-blue-700">{formatPrice(salesSummary.shippingTotal)}</p>
                  </div>
                  {/* Total General */}
                  <div className="bg-white rounded-lg p-4 border border-purple-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-purple-600" />
                      <p className="text-sm text-gray-600">Total General</p>
                    </div>
                    <p className="text-xl font-bold text-purple-700">{formatPrice(salesSummary.grandTotal)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tabla Principal */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50 dark:bg-gray-900">
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyAll}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    {copiedItems.size === groupedProducts.length ? (
                      <>
                        <Check size={16} className="text-green-600 dark:text-green-400" />
                        <span className="text-green-600 dark:text-green-400">Copiados</span>
                      </>
                    ) : (
                      <>
                        <List size={16} />
                        Copiar Todo
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownloadCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Download size={16} />
                    Exportar CSV
                  </button>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedOrders.size} pedidos seleccionados
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Producto / Cantidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Desglose / Clientes
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {groupedProducts.map(product => {
                      const isExpanded = expandedProducts.has(product.grouping_key);
                      const isPurchased = purchasedProducts.has(product.grouping_key);
                      const categoryStyle = getCategoryStyle(product.product_name);

                      return (
                        <tr key={product.grouping_key} className={isPurchased ? 'bg-purple-50 dark:bg-purple-900/20' : ''}>
                          {/* Columna 1: Producto / Cantidad */}
                          <td className="px-6 py-4 align-top">
                            <div className="flex items-start gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePurchased(product.grouping_key);
                                }}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 transition-colors ${isPurchased
                                  ? 'bg-purple-600 hover:bg-purple-700'
                                  : 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-800 dark:hover:bg-purple-700'
                                  }`}
                                title={isPurchased ? 'Desmarcar como comprado' : 'Marcar como comprado'}
                              >
                                {isPurchased ? (
                                  <CheckCircle className="w-5 h-5 text-white" />
                                ) : (
                                  <div className="w-4 h-4 border-2 border-purple-400 rounded-md" />
                                )}
                              </button>
                              <div className="min-w-0 flex-1">
                                <p className={`font-medium text-base ${isPurchased ? 'text-gray-500 line-through dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                  {product.display_name}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                  {product.unit_price > 0 && (
                                    <div className="flex items-center gap-1">
                                      <p className={`text-sm font-semibold ${isPurchased ? 'text-gray-400' : 'text-green-700 dark:text-green-400'}`}>
                                        {formatPrice(product.unit_price)} c/u
                                      </p>
                                      <a
                                        href={`/admin/productos?search=${encodeURIComponent(product.product_name)}&edit=${product.items[0]?.product_id || ''}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors dark:hover:bg-blue-900/50"
                                        title="Editar precio del producto"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </a>
                                    </div>
                                  )}
                                  <p className={`text-sm ${isPurchased ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {product.orders_count} cliente{product.orders_count === 1 ? '' : 's'}
                                  </p>
                                  {product.has_missing_variants && (
                                    <p className="text-xs text-amber-600 font-medium bg-amber-50 dark:bg-amber-900/50 px-2 py-0.5 rounded">
                                      ⚠️ Hay pedidos sin variante
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Columna 2: Desglose / Clientes */}
                          <td className="px-6 py-4 align-top">
                            <div className="flex items-center gap-2 mb-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleProductExpanded(product.grouping_key);
                                }}
                                className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
                              >
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                {isExpanded ? 'Ocultar desglose' : 'Ver desglose'}
                              </button>
                            </div>

                            {isExpanded && (
                              <div className="space-y-3 pl-2 border-l-2 border-gray-100 dark:border-gray-700">
                                {product.customer_breakdown.map((customer, idx) => {
                                  const addressCopyId = `addr-${customer.order_id}-${idx}`;
                                  const summaryCopyId = `sum-${customer.order_id}-${idx}`;
                                  return (
                                    <div key={`${customer.order_id}-${idx}`} className="flex items-start gap-3">
                                      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <User className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-gray-900 dark:text-white text-xs">
                                          {customer.customer_name}
                                        </p>
                                        {customer.customer_address && (
                                          <p className="text-xs text-gray-500 dark:text-gray-400 break-words mt-0.5">
                                            {customer.customer_address}
                                          </p>
                                        )}
                                        <div className="flex gap-2 mt-1.5 flex-wrap">
                                          {customer.customer_address && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                copyToClipboard(customer.customer_address!, addressCopyId);
                                              }}
                                              className={`px-1.5 py-0.5 text-[10px] rounded flex items-center gap-1 transition-colors ${copiedItems.has(addressCopyId)
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                                }`}
                                            >
                                              {copiedItems.has(addressCopyId) ? <Check size={10} /> : <Copy size={10} />}
                                              {copiedItems.has(addressCopyId) ? 'Copiado' : 'Dirección'}
                                            </button>
                                          )}
                                          <a
                                            href={`/admin/pedidos?id=${customer.order_id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="px-1.5 py-0.5 text-[10px] rounded flex items-center gap-1 transition-colors bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-400 dark:hover:bg-purple-800/50"
                                          >
                                            <ExternalLink size={10} />
                                            Pedido
                                          </a>
                                        </div>
                                      </div>
                                      <div className="text-right flex-shrink-0">
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">
                                          {customer.quantity}x
                                        </p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                          {customer.variant_name || 'Unidad'}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>

                          {/* Columna 3: Totales */}
                          <td className="px-6 py-4 whitespace-nowrap text-right align-top">
                            <div className="flex flex-col items-end gap-1">
                              {product.total_weight_display ? (
                                <>
                                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                    {product.total_weight_display}
                                  </p>
                                  {product.total_in_smallest_units && product.smallest_weight_grams && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                      ({product.total_in_smallest_units} × {formatWeight(product.smallest_weight_grams)})
                                    </p>
                                  )}
                                </>
                              ) : product.total_physical_units && product.total_physical_units > product.total_quantity ? (
                                <>
                                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                    {product.total_physical_units}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {product.physical_unit_name || 'unidad'}{product.total_physical_units === 1 ? '' : 's'}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                    {product.total_quantity}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    unid.
                                  </p>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Estado cuando hay pedidos seleccionados pero sin productos */}
            {selectedOrders.size > 0 && groupedProducts.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
                <Package className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                <p className="text-yellow-800 font-medium">
                  Los pedidos seleccionados no contienen productos
                </p>
              </div>
            )}
          </>
        )
      }
    </div >
  );
}
