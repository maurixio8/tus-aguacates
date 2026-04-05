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
  Download,
  Search,
  Route
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import SupplierView from './SupplierView';
import { SUPPLIERS } from '@/lib/suppliers-config';

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
  order_type?: 'registered' | 'guest' | 'admin_manual';
  order_data?: any;
  // Campos de totales
  total?: number;
  total_amount?: number;
  subtotal?: number;
  shipping_fee?: number;
  shipping_cost?: number;
}

interface CatalogVariant {
  id: string;
  variant_name?: string;
  variant_value?: string;
  is_active?: boolean;
}

interface CatalogProduct {
  id: string;
  name: string;
  variants?: CatalogVariant[];
  product_variants?: CatalogVariant[];
}

// Desglose de un producto por cliente
interface CustomerBreakdown {
  customer_name: string;
  customer_address?: string;
  order_id: string;
  order_type?: Order['order_type'];
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

export interface ProductGrouped {
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
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
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

  const getOrderTypeLabel = (orderType?: Order['order_type']) => {
    switch (orderType) {
      case 'guest':
        return 'Cliente invitado';
      case 'admin_manual':
        return 'Creado en dashboard';
      case 'registered':
      default:
        return 'Cliente registrado';
    }
  };

  const getOrderTypeBadgeClass = (orderType?: Order['order_type']) => {
    switch (orderType) {
      case 'guest':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300';
      case 'admin_manual':
        return 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/50 dark:text-fuchsia-300';
      case 'registered':
      default:
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300';
    }
  };
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  const [hidePurchased, setHidePurchased] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [showSupplierView, setShowSupplierView] = useState(false);

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
      { name: 'Caja de 24 unidades hass mediano', quantity: 1, unit: 'caja', variant: '24 unidades' },
      { name: 'Arándanos Orgánicos', quantity: 1, unit: 'paq', variant: 'X250grs' }
    ],
    'combo ahorro #2': [
      { name: 'Kiwi', quantity: 2, unit: 'bandeja', variant: '400grs' },
      { name: 'Fresas premium', quantity: 1, unit: 'kg', variant: '1000 gr' }
    ],
    'combo ahorro #3': [
      { name: 'Fresa Económica', quantity: 1, unit: 'paq', variant: '500grs' },
      { name: 'Arándanos Orgánicos', quantity: 1, unit: 'paq', variant: 'X250grs' },
      { name: 'Paquete 4 Unidades injerto', quantity: 1, unit: 'paq', variant: '4 unidades' }
    ],
    'combo aceite y caja de aguacate': [
      { name: 'Botella de aceite', quantity: 1, unit: 'unidad', variant: '250 ml' },
      { name: 'Caja de 24 unidades hass mediano', quantity: 1, unit: 'caja', variant: '24 unidades' }
    ],
    'combo premium': [
      { name: 'Botella de aceite', quantity: 1, unit: 'unidad', variant: '250 ml' },
      { name: 'Caja de 12 unidades Premium', quantity: 1, unit: 'caja', variant: '12 unidades' }
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

  // Sistema de aliases para normalizar nombres de productos
  // Permite agrupar productos con nombres similares
  const PRODUCT_NAME_ALIASES: Record<string, string> = {
    // --- ARÁNDANOS ---
    'arandano': 'Arándanos Orgánicos',
    'arandanos': 'Arándanos Orgánicos',
    'arándano': 'Arándanos Orgánicos',
    'arándanos': 'Arándanos Orgánicos',
    'arandanos organicos': 'Arándanos Orgánicos',
    'arándanos orgánicos': 'Arándanos Orgánicos',
    'arandanos organic': 'Arándanos Orgánicos',
    'arándanos organic': 'Arándanos Orgánicos',
    'arandanos organico': 'Arándanos Orgánicos',
    'arándanos orgánico': 'Arándanos Orgánicos',

    // --- FRESAS ---
    'fresa economica': 'Fresa Económica',
    'fresas economicas': 'Fresa Económica',
    'fresa económica': 'Fresa Económica',
    'fresas económicas': 'Fresa Económica',
    'fresa premium': 'Fresas Premium',
    'fresas premium': 'Fresas Premium',

    // --- BANANOS (mantener separados por variedad) ---
  'banano criollo': 'Banano criollo',
  'banano criollo kilo': 'Banano criollo',
  'banano criollo (un kilo)': 'Banano criollo',
  'banano criollo (1 kilo)': 'Banano criollo',
  'banana criollo': 'Banano criollo',
  'banana criollo kilo': 'Banano criollo',
  'banano criollo 1 kilo': 'Banano criollo',
  'banano criollo 1kilo': 'Banano criollo',
  'banano criollo 1k': 'Banano criollo',

    'banano bocadillo': 'Banano bocadillo',
    'banano bocadillo kilo': 'Banano bocadillo',
    'banana bocadillo': 'Banano bocadillo',
    'banana bocadillo kilo': 'Banano bocadillo',
    'banano bocadillo 1 kilo': 'Banano bocadillo',
    'banano bocadillo 1kilo': 'Banano bocadillo',

    // --- TOMATES ---
    'tomate chonto': 'Tomate chonto',
    'tomate chonto tamaño mixto': 'Tomate chonto',
    'tomate chonto 500 gr': 'Tomate chonto',
    'tomate chonto 500gr': 'Tomate chonto',
    'tomate chonto 500grs': 'Tomate chonto',

    'tomate cherry': 'Tomate cherry',
    'tomate cereza': 'Tomate cherry',

    'tomate de arbol': 'Tomate de Árbol',
    'tomate de árbol': 'Tomate de Árbol',
    'tomate arbol': 'Tomate de Árbol',

    'tomate larga vida': 'Tomate larga vida',
    'tomate larga vida 500 gr': 'Tomate larga vida',

    'tomate uvalina': 'Tomate Uvalina',
    'tomate uvilla': 'Tomate Uvalina',

    // --- AGUACATES ---
    'aguacate hass': 'Aguacates Hass',
    'aguacate hass mediano': 'Aguacates Hass',
    'aguacate hass baby': 'Aguacates Hass Baby',
    'aguacate hass premium': 'Aguacates Hass Premium',

    'aguacate injerto': 'Aguacate injerto',
    'aguacate criollo': 'Aguacate criollo',

  // --- CAJAS DE AGUACATES ---
  'caja de 24 unidades hass': 'Caja de 24 unidades hass mediano',
  'caja24 unidades': 'Caja de 24 unidades hass mediano',
  'caja 24 unidades': 'Caja de 24 unidades hass mediano',
  '24 aguacates': 'Caja de 24 unidades hass mediano',
  'caja24 aguacates': 'Caja de 24 unidades hass mediano',
  'caja de (24 unidades)': 'Caja de 24 unidades hass mediano',
  'caja de 24 unidades': 'Caja de 24 unidades hass mediano',

  'caja de 12 unidades hass': 'Caja de 12 unidades Premium',
  'caja12 unidades': 'Caja de 12 unidades Premium',
  'caja 12 unidades': 'Caja de 12 unidades Premium',
  '12 aguacates': 'Caja de 12 unidades Premium',
  'caja12 aguacates': 'Caja de 12 unidades Premium',
  'caja de (12 unidades)': 'Caja de 12 unidades Premium',
  'caja de 12 unidades': 'Caja de 12 unidades Premium',

    'caja de 7 unidades injerto': 'Caja de 7 unidades injerto',
    'caja7 unidades': 'Caja de 7 unidades injerto',
    'caja 7 unidades': 'Caja de 7 unidades injerto',

    'caja de 35 unidades hass baby': 'Caja de 35 unidades hass baby',
    'caja35 unidades baby': 'Caja de 35 unidades hass baby',
    'caja 35 unidades baby': 'Caja de 35 unidades hass baby',

    // --- PAQUETES DE AGUACATES ---
    'paquete 4 unidades': 'Paquete 4 Unidades injerto',
    'paquete x4 unidades': 'Paquete 4 Unidades injerto',
    'paquete4 unidades': 'Paquete 4 Unidades injerto',
    'paquete4unidades': 'Paquete 4 Unidades injerto',
    '4 aguacates injerto': 'Paquete 4 Unidades injerto',

    'paquete 8 unidades': 'Paquete x 8 unidades mediano',
    'paquete x8 unidades': 'Paquete x 8 unidades mediano',
    'paquete8 unidades': 'Paquete x 8 unidades mediano',
    'paquete8unidades': 'Paquete x 8 unidades mediano',

    'paquete 12 unidades': 'Paquete X 12 Unidades baby',
    'paquete x12 unidades': 'Paquete X 12 Unidades baby',
    'paquete12 unidades': 'Paquete X 12 Unidades baby',
    'paquete12unidades': 'Paquete X 12 Unidades baby',

    // --- OTROS PRODUCTOS ---
    'pasta de ajo': 'Pasta de Ajo',
    'pasta ajo': 'Pasta de Ajo',

    'flor de jamaica': 'Flor de Jamaica',
    'flor de jamaic': 'Flor de Jamaica',
    'flor jamaica': 'Flor de Jamaica',
    'flor jamaic': 'Flor de Jamaica',

  // --- ACEITES ---
  'aceite de coco': 'Aceite de Coco',
  'aceite de coco 105': 'Aceite de Coco',
  'aceite coco': 'Aceite de Coco',
  'aceite coco 105': 'Aceite de Coco',
  'aceite de coco (x 105 ml)': 'Aceite de Coco',
  'aceite de coco x 105': 'Aceite de Coco',

  // --- FRESAS (añadir variantes) ---
  'fresas premium 500gr': 'Fresas Premium',
  'fresas premium 500 gr': 'Fresas Premium',
  'fresas premium (500gr)': 'Fresas Premium',
  'fresas premium (500 gr)': 'Fresas Premium',

  // --- MANGOS ---
  'mango azucar': 'Mango Azúcar',
  'mango azucar 500gr': 'Mango Azúcar',
  'mango azucar 500 gr': 'Mango Azúcar',
  'mango azucar (500grs)': 'Mango Azúcar',
  'mango commun': 'Mango Comun',
  'mango comun': 'Mango Comun',
  'mango comun 500gr': 'Mango Comun',
  'mango comun 500 gr': 'Mango Comun',
  'mango comun (500grs)': 'Mango Comun',

  // --- FRIJOL ---
  // --- FRIJOL ---
  'frijol desgranado': 'Frijol Desgranado',
  'frijol desgranado 500gr': 'Frijol Desgranado',
  'frijol desgranado 500 gr': 'Frijol Desgranado',
  'frijol desgranado (500grs)': 'Frijol Desgranado',

  // --- DURAZNOS ---
  'durazno': 'Duraznos',
  'duraznos': 'Duraznos',
  'durazno importado': 'Duraznos importados',
  'duraznos importados': 'Duraznos importados',
  'granadillas en bandeja': 'Granadillas',
  'granadilla en bandeja': 'Granadillas',
  'granada fresca': 'Granada',
  'granada': 'Granada',
  'kiwi': 'Kiwis',
  'kiwis': 'Kiwis',
  'kiwi 400 gramos': 'Kiwis',
  'kiwi 450grs': 'Kiwis',
  'kiwi 900grs': 'Kiwis',
  'manzana verde en bandeja': 'Manzana verde Bandeja',
  'manzana verde bandeja': 'Manzana verde Bandeja',
  'manzana roja en bandeja': 'Manzana roja Bandeja',
  'manzana roja bandeja': 'Manzana roja Bandeja',
  'cebolla larga maya': 'Cebolla larga malla',
  'apio entero': 'Apio Entero paquete',
  'apio tallos': 'Apio tallos bandeja',
  'zumo de limon': 'Zumo Limón concentrado',
  'zumo limon': 'Zumo Limón concentrado',
  'zumo de limon concentrado': 'Zumo Limón concentrado',
  'zumo limon concentrado': 'Zumo Limón concentrado',
  'semillas de chia': 'Semillas de Chía',
  'semillas chia': 'Semillas de Chía',
  'semillas de chia 120 gramos': 'Semillas de Chía',
  'semillas de linaza': 'Semillas Linaza',
  'linaza': 'Semillas Linaza',
  'aceite aguacate': 'Aceite de Aguacate',
  'aceite de aguacate': 'Aceite de Aguacate',
    'uva isabelina': 'Uva isabelina',
    'uva isabela': 'Uva isabelina',

  'uva chilena': 'Uva chilena importada',
  'uva importada': 'Uva chilena importada',

  // --- NUEVA MAYA (productos renombrados) ---
  'nueva maya paquete x 8 mediano': 'Nueva Maya mediano',
  'nueva maya paquete x8 mediano': 'Nueva Maya mediano',
  'nueva maya 8 mediano': 'Nueva Maya mediano',
  'nueva maya x 8 mediano': 'Nueva Maya mediano',
  'nueva maya paquete 8 mediano': 'Nueva Maya mediano',

  'nueva maya paquete x 7 premium': 'Nueva Maya premium',
  'nueva maya paquete x7 premium': 'Nueva Maya premium',
  'nueva maya 7 premium': 'Nueva Maya premium',
  'nueva maya x 7 premium': 'Nueva Maya premium',
  'nueva maya paquete 7 premium': 'Nueva Maya premium',
  'nueva maya premium': 'Nueva Maya premium',

  // --- OTROS PRODUCTOS RENOMBRADOS ---
  'ajo importado malla': 'Ajo importado',
  'apio entero paquete': 'Apio Entero',
  'apio tallos bandeja': 'Apio tallos',
  'cebolla larga malla': 'Cebolla larga',
  'cilantro fresco paquete': 'Cilantro fresco',
  'espinaca paquete x1 kilo': 'Espinaca',
  'guisantes bandeja': 'Guisantes',
  'jalapeños bandeja': 'Jalapeños',
  'mangostinos kilo': 'Mangostinos',
  'manzana bandeja combinada': 'Manzana combinada',
  'manzanilla paquete': 'Manzanilla',
  'mazorca sabanera x3 uni': 'Mazorca sabanera',
  'pitahaya morada kilo': 'Pitahaya morada',
  'platano verde x 4 unidades': 'Platano verde',
  'rabanos x bandeja': 'Rábanos',
  'rugula bandeja': 'Rúcula',
  'yacon bandeja': 'Yacon',
  };

  // Emoticones para cada producto
  const PRODUCT_EMOJIS: Record<string, string> = {
    'aguacate': '🥑',
    'aguacates': '🥑',
    'aguacate hass': '🥑',
    'aguacates hass': '🥑',
    'aguacate injerto': '🥑',
    'caja de 24 unidades': '🥑',
    'caja de 12 unidades': '🥑',
    'caja de 7 unidades': '🥑',
    'caja de 35 unidades': '🥑',
    'paquete 4 unidades': '🥑',
    'paquete x 8 unidades': '🥑',
    'paquete x 12 unidades': '🥑',

    'arandano': '🫐',
    'arandanos': '🫐',
    'arándanos': '🫐',
    'arandanos organicos': '🫐',
    'arándanos orgánicos': '🫐',

    'fresa': '🍓',
    'fresas': '🍓',
    'fresa economica': '🍓',
    'fresa económica': '🍓',
    'fresas economicas': '🍓',
    'fresas económicas': '🍓',
    'fresa premium': '🍓',
    'fresas premium': '🍓',

    'banano': '🍌',
    'banana': '🍌',
    'banano criollo': '🍌',
    'banana criollo': '🍌',
    'banano bocadillo': '🍌',
    'banana bocadillo': '🍌',

    'tomate': '🍅',
    'tomate chonto': '🍅',
    'tomate cherry': '🍅',
    'tomate de arbol': '🍅',
    'tomate de árbol': '🍅',
    'tomate larga vida': '🍅',
    'tomate uvalina': '🍅',
    'tomate uvilla': '🍅',

    'cebolla': '🧅',
    'cebolla cabezona': '🧅',

    'pasta de ajo': '🧄',
    'pasta ajo': '🧄',
    'ajo': '🧄',

    'zanahoria': '🥕',
    'papa': '🥔',
    'papa sabanera': '🥔',

    'apio': '🥬',

    'berenjena': '🍆',
    'champinones': '🍄',

    'cilantro': '🌿',
    'hierbabuena': '🌿',
    'laurel': '🌿',
    'perejil': '🌿',

    'lechuga': '🥬',
    'lechuga romana': '🥬',

    'pepino': '🥒',

    'pimenton': '🫑',

    'mandarina': '🍊',
    'naranja': '🍊',

    'limon': '🍋',
    'limon tahiti': '🍋',

    'uva': '🍇',
    'uva isabelina': '🍇',
    'uva chilena': '🍇',

    'mango': '🥭',

    'durazno': '🍑',
    'duraznos': '🍑',

    'manzana': '🍎',

    'pera': '🍐',

    'sandia': '🍉',
    'sandia baby': '🍉',

    'melocoton': '🍑',

    'cereza': '🍒',

    'piña': '🍍',
    'pina': '🍍',

    'papaya': '🍈',

    'ciruela': '🍑',

    'gulupa': '🍈',

    'pitaya': '🌵',

    'mazorca': '🌽',
    'mazorca baby': '🌽',

    'zucchini': '🍆',
    'zucchini verde': '🍆',
    'zucchini amarillo': '🍆',
    'auyama': '🎃',

    'remolacha': '🍠',

    'picados para sopa': '🥗',

    'brocoli': '🥦',

    'coliflor': '🥦',

    'coco': '🥥',

    'guanabana': '🍈',

    'fruta': '🍎',
    'verdura': '🥬',
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

  const loadCatalogProducts = async () => {
    try {
      const params = new URLSearchParams();
      params.set('status', 'active');
      params.set('limit', '500');

      const response = await fetch(`/api/admin/products?${params}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setCatalogProducts(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando catalogo de productos:', error);
    }
  };

  // Cargar pedidos cuando cambien las fechas
  useEffect(() => {
    // Solo cargar si tenemos ambas fechas
    if (dateFrom && dateTo) {
      loadOrders();
      if (!initialLoadDone) {
        setInitialLoadDone(true);
      }
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    loadCatalogProducts();
  }, []);

  const extractVariantInfo = (item: any) => {
    const nestedVariant = item?.variant && typeof item.variant === 'object' ? item.variant : null;
    const snapshot = item?.product_snapshot && typeof item.product_snapshot === 'object'
      ? item.product_snapshot
      : null;

    let variantType =
      item?.variantType ||
      item?.variant_type ||
      item?.variant_name ||
      item?.variantName ||
      nestedVariant?.variant_name ||
      snapshot?.variant_name ||
      null;

    let variantValue =
      item?.variantValue ||
      item?.variant_value ||
      nestedVariant?.variant_value ||
      snapshot?.variant_value ||
      null;

    // Handle case where variant_name contains both type and value (e.g., "Presentacion: 500 gr")
    // This happens in some historical orders where the format was stored incorrectly
    if (variantType && variantType.includes(':') && !variantValue) {
      const parts = variantType.split(':').map((s: string) => s.trim());
      if (parts.length === 2) {
        variantType = parts[0]; // e.g., "Presentacion"
        variantValue = parts[1]; // e.g., "500 gr"
      }
    }

    return {
      variantType,
      variantValue,
      variantDisplay: variantValue || variantType || null,
    };
  };

  // Extraer items de order_data si no hay order_items
  // Extraer items de order_data si no hay order_items
  const extractItemsFromOrder = (order: Order): OrderItem[] => {
    // Primero extraer desde order_data (para pedidos de invitados y registrados que guardan variantes ahí)
    // Esto tiene prioridad porque ahí se guarda la información correcta de variantes
    if (order.order_data?.items) {
      return order.order_data.items.map((item: any, index: number) => {
        const variantInfo = extractVariantInfo(item);

        return {
          id: item.id || `item-${index}`,
          product_id: item.productId || item.product_id || `product-${index}`,
          product_snapshot: {
            name: item.productName || item.product_name || 'Producto',
            price: item.price || item.unit_price || 0,
            variant_name: variantInfo.variantType,
            variant_value: variantInfo.variantValue
          },
          quantity: item.quantity || 0,
          unit_price: item.price || item.unit_price || 0,
          subtotal: (item.quantity || 0) * (item.price || item.unit_price || 0),
          variantName: variantInfo.variantDisplay,
          variant_value: variantInfo.variantValue
        };
      });
    }

    if (order.order_items && order.order_items.length > 0) {
      return order.order_items.map((item: any) => {
        const variantInfo = extractVariantInfo(item);

        return {
          ...item,
          variantName: variantInfo.variantDisplay,
          variant_value: variantInfo.variantValue,
          product_snapshot: {
            ...item.product_snapshot,
            variant_name: variantInfo.variantType,
            variant_value: variantInfo.variantValue
          }
        };
      });
    }

    if (order.items && order.items.length > 0) {
      return order.items.map((item: any) => {
        const variantInfo = extractVariantInfo(item);

        return {
          ...item,
          variantName: variantInfo.variantDisplay,
          variant_value: variantInfo.variantValue,
          product_snapshot: {
            ...item.product_snapshot,
            variant_name: variantInfo.variantType,
            variant_value: variantInfo.variantValue
          }
        };
      });
    }

    // Luego intentar con order_items
    if (order.order_items && order.order_items.length > 0) {
      return order.order_items.map((item: any) => ({
        ...item,
        // Asegurar que variantName esté disponible en el nivel superior
        variantName: item.variantName || item.variant_name || item.product_snapshot?.variant_name || null,
        variant_value: item.variant_value || item.product_snapshot?.variant_value || null,
        product_snapshot: {
          ...item.product_snapshot,
          variant_name: item.variantName || item.variant_name || item.product_snapshot?.variant_name || null,
          variant_value: item.variant_value || item.product_snapshot?.variant_value || null
        }
      }));
    }

    // Finalmente con items
    if (order.items && order.items.length > 0) {
      return order.items;
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

  // Obtener emoji para el producto
  const getProductEmoji = (productName: string): string => {
    const name = productName.toLowerCase();

    // Buscar palabras clave en el nombre del producto
    const keywords = Object.keys(PRODUCT_EMOJIS);

    for (const keyword of keywords) {
      if (name.includes(keyword)) {
        return PRODUCT_EMOJIS[keyword];
      }
    }

    // Si no encuentra emoji específico, usar uno genérico por categoría
    if (name.includes('frut') || name.includes('fresa') || name.includes('manzana') ||
      name.includes('banan') || name.includes('aguacat') || name.includes('durazn') ||
      name.includes('mango') || name.includes('piña') || name.includes('papaya') ||
      name.includes('ciruela') || name.includes('cereza') || name.includes('sandía') ||
      name.includes('limón') || name.includes('naranja') || name.includes('mandarina') ||
      name.includes('uva') || name.includes('mora') || name.includes('granadilla') ||
      name.includes('maracuyá') || name.includes('guayaba') || name.includes('pitahaya') ||
      name.includes('melón')) {
      return '🍎';
    }

    if (name.includes('verd') || name.includes('tomat') || name.includes('ceboll') ||
      name.includes('zanahoria') || name.includes('papa') || name.includes('lechuga') ||
      name.includes('apio') || name.includes('brócoli') || name.includes('coliflor') ||
      name.includes('pepino') || name.includes('pimentón') || name.includes('champiñon') ||
      name.includes('cilantro') || name.includes('perejil') || name.includes('albahaca') ||
      name.includes('hierbabuena') || name.includes('romero') || name.includes('orégano')) {
      return '🥬';
    }

    return '📦';
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
  // Extraer peso en gramos desde la variante
  // Busca patrones como: "1000grs", "500 gramos", "1kg", "0.5 kg", "250grs"
  const extractWeightFromVariant = (variantName: string | null): number | undefined => {
    if (!variantName) return undefined;

    const text = variantName.toLowerCase().trim();

    // Patrones de búsqueda (en orden de especificidad)
    const patterns = [
      // "1000 grs", "500 gramos", "250 grs"
      /(\d+(?:\.\d+)?)\s*(?:grs|gramas|gramos|gr)\b/i,
      // "1 kg", "0.5 kg", "2 kilos"
      /(\d+(?:\.\d+)?)\s*(?:kg|kilos?)\b/i,
      // "1000grs" (sin espacio)
      /(\d+(?:\.\d+)?)grs/i,
      // "X250grs" (formato especial)
      /x(\d+(?:\.\d+)?)grs/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const value = parseFloat(match[1]);
        // Si está en kg, convertir a gramos
        if (/kg|kilos?/i.test(text)) {
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
    if (!name) return 'producto sin nombre';

    // Función auxiliar para quitar acentos de forma consistente
    const stripAccents = (str: string) =>
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

    let normalized = stripAccents(name);

    // SIEMPRE remover CUALQUIER contenido final entre paréntesis
    normalized = normalized.replace(/\s*\([^)]*\)\s*$/, '').trim();

    // Remover información de cantidad redundante al final del nombre si ya está normalizada en la variante
    // Ej: "Arandanos 125gr" -> "arandanos"
    normalized = normalized.replace(/\s*\d+\s*(grs?|gramos|kg|kilos?|unidades?|bandeja?s?)\b.*$/i, '').trim();

    // Normalizar espacios múltiples
    normalized = normalized.replace(/\s+/g, ' ');

    // Buscar alias y usar nombre canónico (pero SIN acentos para la clave de agrupación)
    const alias = PRODUCT_NAME_ALIASES[normalized];
    if (alias) {
      return stripAccents(alias);
    }

    return normalized;
  };

  // Normalizar variante para agrupación consistente
  // Normalizar variante para agrupación consistente
const normalizeVariant = (variant: string | null): string => {
  if (!variant || variant.trim() === '') return '';

  // Ignorar variantes que son solo nombres de campos, no valores reales
  const lowerVariant = variant.trim().toLowerCase();
  const fieldNames = ['cantidad', 'peso', 'presentación', 'presentacion', 'volumen', 'unidad', 'unidades'];
  if (fieldNames.includes(lowerVariant)) {
    return ''; // Tratar como sin variante
  }

  // Si podemos extraer un peso numérico, usar el peso en gramos como variante normalizada
  // Esto agrupa "1000 gr" con "1 kg" automáticamente
  const weightGrams = extractWeightFromVariant(variant);
  if (weightGrams !== undefined) {
    return `${weightGrams}grs`;
  }

  let normalized = variant.trim();

    // Eliminar acentos/diacríticos
    normalized = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Convertir a minúsculas
    normalized = normalized.toLowerCase();

    // Eliminar 'x' inicial si va seguida de un número (ej: "X250" -> "250")
    normalized = normalized.replace(/^x\s*(\d+)/i, '$1');

    // Normalizar formatos comunes
    normalized = normalized
      .replace(/\s*x\s*/g, 'x')
      .replace(/\s+grs?/g, 'grs')
      .replace(/\s+gr\b/g, 'grs')
      .replace(/\s+gramos/g, 'grs')
      .replace(/\s+kg\b/g, 'kg')
      .replace(/\s+kilos?/g, 'kg')
      .replace(/\s+unidades?/g, 'unidades')
      .replace(/\s+bandeja?s/g, 'bandejas');

    // Normalizar espacios múltiples
    normalized = normalized.replace(/\s+/g, ' ').trim();

    return normalized;
  };

  // Crear clave de agrupación inteligente
  // Agrupa por nombre normalizado Y variante normalizada para precisión
  // Esto permite: "Arándanos Orgánicos (X250grs)" y "Arándanos Orgánicos (X125grs)" = diferentes grupos
  const createGroupingKey = (productName: string, variant: string | null): string => {
    const normalizedName = normalizeProductName(productName, variant);
    const normalizedVariant = normalizeVariant(variant);

    if (!normalizedVariant) {
      return normalizedName;
    }

    return `${normalizedName}|${normalizedVariant}`;
  };

  // Detectar si el nombre del producto ya contiene información de cantidad/tamaño
  // Ej: "Caja de 12 unidades Premium" -> true
  // Ej: "Arándanos Orgánicos" -> false
  const productNameHasQuantityInfo = (productName: string): boolean => {
    const name = productName.toLowerCase();
    // Patrones que indican que el nombre ya tiene info de cantidad
    const patterns = [
      /\d+\s*unidad/i,      // "12 unidades", "4 unidad"
      /x\s*\d+/i,           // "x4", "x 12"
      /\d+\s*(gr|grs|kg|kilos|gramos)/i,  // "500gr", "1 kg"
      /\d+\s*bandeja/i,
      /\bbandeja\b/i,
      /\d+\s*ml\b/i,
      /paquete\s*x?\s*\d+/i, // "paquete 4", "paquete x4"
      /\bpaquete\b/i,
      /\bmalla\b/i,
      /caja\s*de\s*\d+/i,   // "caja de 12"
      /\d+\s*kilo/i,        // "1 kilo"
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
      const unit = weightMatch[2].toLowerCase();
      return `${weightMatch[1]} ${unit}`;
    }

    const trayMatch = productName.match(/(\d+)\s*bandeja(s)?/i);
    if (trayMatch) {
      return `${trayMatch[1]} Bandejas`;
    }

    if (/\bbandeja\b/i.test(name)) {
      return '1 Bandeja';
    }

    const mlMatch = productName.match(/(\d+(?:\.\d+)?)\s*ml/i);
    if (mlMatch) {
      return `X${mlMatch[1]} ml`;
    }

    if (/\bmalla\b/i.test(name)) {
      return 'Malla';
    }

    if (/\bpaquete\b/i.test(name)) {
      return 'Paquete';
    }

    return null;
  };

  const getActiveCatalogVariants = (product: CatalogProduct): CatalogVariant[] => {
    return (product.variants || product.product_variants || []).filter((variant) => variant.is_active !== false);
  };

  const catalogVariantsByName = useMemo(() => {
    const catalogMap = new Map<string, { displayName: string; variants: Map<string, string>; variantNames: Map<string, string> }>();

    catalogProducts.forEach((product) => {
      const normalizedName = normalizeProductName(product.name, null);
      const existing = catalogMap.get(normalizedName) || {
        displayName: product.name,
        variants: new Map<string, string>(),
        variantNames: new Map<string, string>()
      };

      getActiveCatalogVariants(product).forEach((variant) => {
        const variantDisplay = variant.variant_value || variant.variant_name || '';
        const normalizedVariant = normalizeVariant(variantDisplay);
        if (normalizedVariant && !existing.variants.has(normalizedVariant)) {
          existing.variants.set(normalizedVariant, variantDisplay);
          // Also store the current variant_name (e.g., "Peso", "Cantidad", "Volumen")
          if (variant.variant_name) {
            existing.variantNames.set(normalizedVariant, variant.variant_name);
          }
        }
      });

      catalogMap.set(normalizedName, existing);
    });

    return catalogMap;
  }, [catalogProducts]);

  const selectedVariantHints = useMemo(() => {
    const variantHints = new Map<string, Map<string, { display: string; count: number }>>();
    const selectedOrdersList = orders.filter((order) => selectedOrders.has(order.id));

    selectedOrdersList.forEach((order) => {
      extractItemsFromOrder(order).forEach((item) => {
        const productName =
          item.product_snapshot?.name ||
          item.products?.name ||
          item.product_name ||
          item.productName ||
          'Producto sin nombre';

        const variantInfo = extractVariantInfo(item);
        const candidateVariant = variantInfo.variantValue || variantInfo.variantType || extractQuantityFromName(productName);
        if (!candidateVariant) {
          return;
        }

        const normalizedName = normalizeProductName(productName, candidateVariant);
        const normalizedVariant = normalizeVariant(candidateVariant);
        if (!normalizedVariant) {
          return;
        }

        const productHints = variantHints.get(normalizedName) || new Map<string, { display: string; count: number }>();
        const currentVariant = productHints.get(normalizedVariant);

        productHints.set(normalizedVariant, {
          display: currentVariant?.display || candidateVariant,
          count: (currentVariant?.count || 0) + 1
        });

        variantHints.set(normalizedName, productHints);
      });
    });

    return variantHints;
  }, [orders, selectedOrders]);

  const resolveVariantForProduct = (productName: string, item: OrderItem) => {
    const variantInfo = extractVariantInfo(item);
    let variantDisplay = variantInfo.variantValue || variantInfo.variantType || null;
    let currentVariantName: string | null = null; // Will hold current catalog variant_name
    const quantityFromName = extractQuantityFromName(productName);
    const normalizedName = normalizeProductName(productName, variantDisplay || quantityFromName);

    if (!variantDisplay && quantityFromName) {
      variantDisplay = quantityFromName;
    }

    const catalogEntry = catalogVariantsByName.get(normalizedName);
    const selectedHints = selectedVariantHints.get(normalizedName);

    // If we have a catalog entry, try to get the current variant_name and value
    if (catalogEntry) {
      // First, try to find exact match with the variant value
      if (variantDisplay) {
        const normalizedDisplay = normalizeVariant(variantDisplay);
        const catalogVariantName = catalogEntry.variantNames.get(normalizedDisplay);
        if (catalogVariantName && catalogVariantName !== 'Presentación') {
          currentVariantName = catalogVariantName;
        }
      }
      
      // If no exact match OR if variantDisplay is generic "Presentación", 
      // use the variant_name and first variant value from ANY active variant
      if ((!currentVariantName || variantDisplay === 'Presentación') && catalogEntry.variantNames.size > 0) {
        const firstVariantName = Array.from(catalogEntry.variantNames.values())[0];
        const firstVariantValue = Array.from(catalogEntry.variants.values())[0];
        if (firstVariantName && firstVariantName !== 'Presentación') {
          currentVariantName = firstVariantName;
        }
        // If the order's variant_value is generic "Presentación", use the catalog's actual value
        if (variantDisplay === 'Presentación' && firstVariantValue) {
          variantDisplay = firstVariantValue;
        }
      }
    }

    if (!variantDisplay && selectedHints && selectedHints.size === 1) {
      variantDisplay = Array.from(selectedHints.values())[0].display;
    }

    if (!variantDisplay && catalogEntry && catalogEntry.variants.size === 1) {
      variantDisplay = Array.from(catalogEntry.variants.values())[0];
      // Also get the variant_name for single-variant products
      const normalizedDisplay = normalizeVariant(variantDisplay);
      const catalogVariantName = catalogEntry.variantNames.get(normalizedDisplay);
      if (catalogVariantName) {
        currentVariantName = catalogVariantName;
      }
    }

    const requiresVariant = Math.max(
      catalogEntry?.variants.size || 0,
      selectedHints?.size || 0
    ) > 1;

    return {
      normalizedName,
      variantDisplay,
      currentVariantName, // Include the current catalog variant_name
      requiresVariant,
      catalogDisplayName: catalogEntry?.displayName || productName
    };
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
        const { variantDisplay } = resolveVariantForProduct(productName, item);
        const variantName = variantDisplay || null;
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
  }, [orders, selectedOrders, catalogProducts]);

  // Calcular productos agrupados de los pedidos seleccionados
  const groupedProducts = useMemo(() => {
    const selectedOrdersList = orders.filter(order =>
      selectedOrders.has(order.id)
    );

    const productMap = new Map<string, ProductGrouped>();

    // MAPA PARA RASTREAR CLIENTES POR PRODUCTO Y ORDEN
    // Evita duplicar el mismo cliente en múltiples entradas de customer_breakdown
    const customerProductMap = new Map<string, CustomerBreakdown>();

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
            // Usar createGroupingKey que incluye la variante para agrupación precisa
            const componentKey = createGroupingKey(component.name, component.variant || null);
            const normalizedName = normalizeProductName(component.name, component.variant || null);

            // CLAVE ÚNICA PARA EVITAR DUPLICAR CLIENTES
            const customerUniqueKey = `${componentKey}|${order.id}`;

            // Verificar si ya existe este cliente para este producto
            let customerInfo = customerProductMap.get(customerUniqueKey);

            if (!customerInfo) {
              // Crear nueva entrada de cliente
              customerInfo = {
                customer_name: customerName,
                customer_address: customerAddress,
                order_id: order.id,
                order_type: order.order_type,
                variant_name: component.variant,
                quantity: component.quantity * item.quantity,
                order_items: orderSummaries.get(order.id)
              };
              customerProductMap.set(customerUniqueKey, customerInfo);
            } else {
              // Actualizar cantidad si ya existe
              customerInfo.quantity += component.quantity * item.quantity;
            }

            if (productMap.has(componentKey)) {
              const existing = productMap.get(componentKey)!;
              existing.total_quantity += component.quantity * item.quantity;
              existing.orders_count += 1;

              // Verificar si este cliente ya está en customer_breakdown
              const existingCustomerIndex = existing.customer_breakdown.findIndex(
                cb => cb.order_id === order.id
              );

              if (existingCustomerIndex >= 0) {
                // Actualizar cantidad del cliente existente
                existing.customer_breakdown[existingCustomerIndex].quantity += component.quantity * item.quantity;
                existing.customer_breakdown[existingCustomerIndex].variant_name = component.variant;
              } else {
                // Agregar nuevo cliente al breakdown
                existing.customer_breakdown.push(customerInfo);
              }

              if (!existing.items) existing.items = [];
              existing.items.push(item);
            } else {
              productMap.set(componentKey, {
                grouping_key: componentKey,
                product_name: normalizedName,
                variant_name: component.variant,
                display_name: component.variant ? `${normalizedName} (${component.variant})` : normalizedName,
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

          const variantResolution = resolveVariantForProduct(productName, item);
          if (variantResolution.variantDisplay) {
            variantDisplay = variantResolution.variantDisplay;
          }

          // Precio unitario de venta
          const unitPrice = item.unit_price || item.price || 0;

          // Extraer peso de la variante (si existe)
          const weightPerUnitGrams = extractWeightFromVariant(variantDisplay);

          // Crear clave de agrupación inteligente (detecta si variante ya está en el nombre)
          const groupingKey = createGroupingKey(variantResolution.catalogDisplayName, variantDisplay);
          const normalizedName = variantResolution.normalizedName;

          // Calcular peso para este item
          const itemWeightGrams = weightPerUnitGrams ? weightPerUnitGrams * item.quantity : undefined;
          const itemWeightDisplay = itemWeightGrams ? formatWeight(itemWeightGrams) : undefined;

          // CLAVE ÚNICA PARA EVITAR DUPLICAR CLIENTES
          const customerUniqueKey = `${groupingKey}|${order.id}`;

          // Verificar si ya existe este cliente para este producto
          let customerInfo = customerProductMap.get(customerUniqueKey);

          if (!customerInfo) {
            // Crear nueva entrada de cliente
            customerInfo = {
              customer_name: customerName,
              customer_address: customerAddress,
              order_id: order.id,
              order_type: order.order_type,
              variant_name: variantDisplay || undefined,
              quantity: item.quantity,
              weight_grams: itemWeightGrams,
              weight_display: itemWeightDisplay,
              order_items: orderSummaries.get(order.id)
            };
            customerProductMap.set(customerUniqueKey, customerInfo);
          } else {
            // Actualizar cantidad si ya existe
            customerInfo.quantity += item.quantity;
            if (itemWeightGrams) {
              customerInfo.weight_grams = (customerInfo.weight_grams || 0) + itemWeightGrams;
              customerInfo.weight_display = formatWeight(customerInfo.weight_grams);
            }
          }

          // Verificar si ya existe este grupo
          if (productMap.has(groupingKey)) {
            const existing = productMap.get(groupingKey)!;
            existing.total_quantity += item.quantity;
            existing.orders_count += 1;

            // Verificar si este cliente ya está en customer_breakdown
            const existingCustomerIndex = existing.customer_breakdown.findIndex(
              cb => cb.order_id === order.id
            );

            if (existingCustomerIndex >= 0) {
              // Actualizar cantidad del cliente existente
              existing.customer_breakdown[existingCustomerIndex].quantity += item.quantity;
              if (itemWeightGrams) {
                existing.customer_breakdown[existingCustomerIndex].weight_grams =
                  (existing.customer_breakdown[existingCustomerIndex].weight_grams || 0) + itemWeightGrams;
                existing.customer_breakdown[existingCustomerIndex].weight_display =
                  formatWeight(existing.customer_breakdown[existingCustomerIndex].weight_grams || 0);
              }
            } else {
              // Agregar nuevo cliente al breakdown
              existing.customer_breakdown.push(customerInfo);
            }

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
            if (!variantDisplay && !nameHasQuantity && variantResolution.requiresVariant) {
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
            let displayBaseName = variantResolution.catalogDisplayName || normalizedName;
            
            // Fallback: if catalog lookup failed (displayBaseName === normalizedName),
            // try to use alias for display
            if (displayBaseName === normalizedName) {
              const stripAccents = (str: string) =>
                str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
              const normalizedForAlias = stripAccents(productName)
                .replace(/\s*\([^)]*\)\s*$/, '').trim()
                .replace(/\s*\d+\s*(grs?|gramos?|kg|kilos?|unidades?|bandeja?s?)\b.*$/i, '').trim()
                .replace(/\s+/g, ' ');
              const alias = PRODUCT_NAME_ALIASES[normalizedForAlias];
              if (alias) {
                displayBaseName = alias;
              }
            }
            
            let displayName = displayBaseName;

                // Use current catalog variant_name if available (e.g., "Peso", "Cantidad", "Volumen")
                // instead of historical "Presentación"
                const displayVariantName = variantResolution.currentVariantName || null;

                // Si hay variante, agregarla al nombre a mostrar
                // NOTA: No incluir el nombre del campo ("Cantidad:", "Peso:") porque se ve redundante
                // Solo mostrar el valor de la variante entre paréntesis
                if (variantDisplay) {
                  displayName = `${displayBaseName} (${variantDisplay})`;
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
              product_name: displayBaseName,
              variant_name: displayVariantName || variantDisplay || undefined,
              variant_value: variantDisplay || undefined,
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
              has_missing_variants: !variantDisplay && !nameHasQuantity && variantResolution.requiresVariant,
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
  }, [orders, selectedOrders, catalogProducts]);

  // Filtrar productos por búsqueda
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return groupedProducts;
    const search = productSearch.toLowerCase().trim();
    return groupedProducts.filter(p =>
      p.product_name.toLowerCase().includes(search) ||
      p.display_name.toLowerCase().includes(search) ||
      (p.variant_name && p.variant_name.toLowerCase().includes(search)) ||
      p.customer_breakdown.some(c => c.customer_name.toLowerCase().includes(search))
    );
  }, [groupedProducts, productSearch]);

  // Progreso de compra
  const purchaseProgress = useMemo(() => {
    const total = groupedProducts.length;
    if (total === 0) return { purchased: 0, total: 0, percentage: 0 };
    const purchased = groupedProducts.filter(p => purchasedProducts.has(p.grouping_key)).length;
    return { purchased, total, percentage: Math.round((purchased / total) * 100) };
  }, [groupedProducts, purchasedProducts]);

  // Productos por bodega (para SupplierView)
  const productsBySupplier = useMemo(() => {
    const supplierMap = new Map<string, {
      products: typeof groupedProducts;
      totalCost: number;
      totalWeight: number;
      customerCount: number;
    }>();

    SUPPLIERS.forEach(supplier => {
      supplierMap.set(supplier.id, {
        products: [],
        totalCost: 0,
        totalWeight: 0,
        customerCount: 0
      });
    });

    const productSupplierMap: Record<string, string> = {
      'aguacate': 'corabastos',
      'hass': 'corabastos',
      'fresa': 'corabastos',
      'arandano': 'corabastos',
      'arándano': 'corabastos',
      'banano': 'corabastos',
      'tomate': 'corabastos',
      'cebolla': 'corabastos',
      'papa': 'corabastos',
      'zanahoria': 'corabastos',
      'limon': 'corabastos',
      'mango': 'corabastos',
      'uva': 'corabastos',
      'durazno': 'corabastos',
      'manzana': 'corabastos',
      'kiwi': 'plaza',
      'pera': 'plaza',
      'ciruela': 'plaza',
      'cereza': 'plaza',
      'aceite': 'deposito',
      'pasta de ajo': 'deposito',
      'semillas': 'deposito',
      'zumo': 'deposito',
      'manzanilla': 'deposito',
      'flor de jamaica': 'deposito',
    };

    filteredProducts.forEach(product => {
      const name = product.product_name.toLowerCase();
      let assignedSupplier = 'corabastos';
      for (const [keyword, supplierId] of Object.entries(productSupplierMap)) {
        if (name.includes(keyword)) {
          assignedSupplier = supplierId;
          break;
        }
      }
      const supplierData = supplierMap.get(assignedSupplier);
      if (supplierData) {
        supplierData.products.push(product);
        supplierData.totalCost += product.unit_price * product.total_quantity;
        supplierData.totalWeight += product.total_weight_grams || 0;
        supplierData.customerCount = Math.max(supplierData.customerCount, product.customer_breakdown.length);
      }
    });

    return supplierMap;
  }, [filteredProducts]);

  // Estados para controlar la visibilidad de secciones (Compact View)
  const [showSalesSummary, setShowSalesSummary] = useState(false);
  const [showOrdersList, setShowOrdersList] = useState(false);

  // Obtener etiqueta de entrega basada en la fecha
  const getDeliveryLabel = () => {
    if (!dateFrom) return '';
    try {
      const date = new Date(dateFrom);
      // Ajustar por zona horaria si es necesario, o usar la fecha tal cual
      // En este caso asumimos que el input trae la fecha local
      // Si es martes (2) o miércoles (3) -> Viernes
      // Si es viernes (5) o domingo (0) -> Martes (de la otra semana o cercano)
      // Simplemente mostraremos el día de la semana de la fecha seleccionada
      const dayName = format(date, 'EEEE', { locale: es });
      return `Entregas ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}`;
    } catch (e) {
      return '';
    }
  };

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

  // Toggle ocultar productos comprados
  const toggleHidePurchased = () => {
    setHidePurchased(!hidePurchased);
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

    const lines = [`Pedido para: ${customer.customer_name}`, `Origen: ${getOrderTypeLabel(customer.order_type)}`, ''];
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

    const BOM = '\uFEFF';
    const headers = ['Producto', 'Variante', 'Cantidad Total', 'Peso Total', 'Precio Unitario', 'Costo Total', 'Clientes', 'Direcciones', 'Pedidos IDs'];

    const rows: string[][] = [];

    groupedProducts.forEach(product => {
      const customerNames = product.customer_breakdown.map(c => c.customer_name).join('; ');
      const addresses = product.customer_breakdown.map(c => c.customer_address || 'N/A').join('; ');
      const orderIds = product.customer_breakdown.map(c => c.order_id).join('; ');
      const totalCost = product.unit_price * product.total_quantity;

      rows.push([
        product.product_name,
        product.variant_name || 'Sin variante',
        product.total_quantity.toString(),
        product.total_weight_display || '-',
        product.unit_price > 0 ? formatPrice(product.unit_price) : '-',
        totalCost > 0 ? formatPrice(totalCost) : '-',
        customerNames,
        addresses,
        orderIds
      ]);

      product.customer_breakdown.forEach(customer => {
        rows.push([
          '',
          '',
          '',
          '',
          '',
          '',
          customer.customer_name,
          getOrderTypeLabel(customer.order_type),
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
    const allText = filteredProducts.map(p =>
      `${p.display_name}\t${p.total_weight_display || p.total_quantity}`
    ).join('\n');
    await navigator.clipboard.writeText(allText);
    setCopiedItems(new Set(filteredProducts.map(p => p.grouping_key)));
    setTimeout(() => setCopiedItems(new Set()), 2000);
  };

// Extraer unidades por caja del nombre del producto
// Ej: "Caja de 24 unidades hass mediano" -> 24
// Ej: "Caja de 12 unidades Premium" -> 12
// Ej: "caja de (24 unidades)" -> 24
const getUnitsPerBox = (productName: string): number | null => {
  const name = productName.toLowerCase();
  
  // Patrón 1: "caja de 24 unidades" o "caja de (24 unidades)"
  const match = name.match(/caja\s+(?:de\s+)?\(?\s*(\d+)\s*\)?\s*unidad/i);
  if (match) return parseInt(match[1], 10);
  
  // Patrón 2: "caja 24" sin "unidades"
  const match2 = name.match(/caja\s+(\d+)/i);
  if (match2) return parseInt(match2[1], 10);
  
  return null;
};

// Mostrar cantidad como cajas con información de unidades
// NOTA: Las cantidades en pedidos YA son número de cajas (ej: 2 cajas = cantidad 2)
// NO convertir unidades a cajas porque las cantidades ya son cajas
const formatBoxQuantity = (productName: string, boxCount: number): { display: string; totalUnits: number } | null => {
  const unitsPerBox = getUnitsPerBox(productName);
  if (!unitsPerBox) return null;
  
  // boxCount ya es el número de cajas, no convertir
  const totalUnits = boxCount * unitsPerBox;
  return {
    display: `${boxCount} cajas (${totalUnits} unid.)`,
    totalUnits
  };
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

      {/* Banner de Entrega */}
      {getDeliveryLabel() && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-4 mb-4 rounded-r-lg">
          <p className="font-bold text-orange-800 dark:text-orange-300 text-lg">
            📅 {getDeliveryLabel()}
          </p>
        </div>
      )}

      {/* Filtros de Fecha Mejorados */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-orange-100 dark:border-gray-700 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 items-center overflow-x-auto pb-2 md:pb-0 w-full md:w-auto text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap mr-2">Rangos rápidos:</span>
          <button onClick={() => applyDatePreset('today')} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-orange-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors whitespace-nowrap">Hoy</button>
          <button onClick={() => applyDatePreset('tomorrow')} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-orange-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors whitespace-nowrap">Mañana</button>

          <button
            onClick={() => {
              setDateFrom(getDeliveryCycleDate('friday'));
              setDateTo(formatLocalDate(new Date()));
            }}
            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors border border-blue-300 whitespace-nowrap"
            title="Pedidos desde el viernes 10AM hasta ahora (para entregar el martes)"
          >
            🚚 Entrega Martes
          </button>

          <button
            onClick={() => {
              setDateFrom(getDeliveryCycleDate('tuesday'));
              setDateTo(formatLocalDate(new Date()));
            }}
            className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors border border-purple-300 whitespace-nowrap"
            title="Pedidos desde el martes 10AM hasta ahora (para entregar el viernes)"
          >
            🚚 Entrega Viernes
          </button>

          <button onClick={() => applyDatePreset(7)} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-orange-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors whitespace-nowrap">Últimos 7 días</button>
          <button onClick={() => applyDatePreset(30)} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-orange-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors whitespace-nowrap">Últimos 30 días</button>
        </div>

        <div className="flex items-center w-full md:w-auto bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden divide-x divide-gray-200 dark:divide-gray-700">
          <div className="relative group flex-1">
            <label className="text-[10px] text-gray-500 dark:text-gray-400 absolute top-0.5 left-2">Desde</label>
            <input
              type="date"
              className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-0 w-full pt-4 pb-1 px-2 cursor-pointer dark:[color-scheme:dark]"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="relative group flex-1">
            <label className="text-[10px] text-gray-500 dark:text-gray-400 absolute top-0.5 left-2">Hasta</label>
            <input
              type="date"
              className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-0 w-full pt-4 pb-1 px-2 cursor-pointer dark:[color-scheme:dark]"
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

            {/* Stats Compactos (Una sola fila) */}
            {orders.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Rango</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{orders.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Selec.</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400 leading-tight">{selectedOrders.size}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Prods.</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400 leading-tight">{groupedProducts.length}</p>
                </div>
              </div>
            )}

            {/* Resumen de Ventas de Pedidos Seleccionados (Colapsable) */}
            {selectedOrders.size > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 mb-6 transition-all">
                <div
                  className="p-4 flex items-center justify-between cursor-pointer"
                  onClick={() => setShowSalesSummary(!showSalesSummary)}
                >
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h3 className="font-semibold text-green-800 dark:text-green-300">Resumen de Ventas</h3>
                  </div>
                  {showSalesSummary ? <ChevronUp className="w-5 h-5 text-green-700 dark:text-green-400" /> : <ChevronDown className="w-5 h-5 text-green-700 dark:text-green-400" />}
                </div>

                {showSalesSummary && (
                  <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
                    {/* Total en Productos */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-100 dark:border-green-800/50 shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">Venta en Productos</p>
                      </div>
                      <p className="text-xl font-bold text-green-700 dark:text-green-400">{formatPrice(salesSummary.productTotal)}</p>
                    </div>
                    {/* Total en Domicilios */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-100 dark:border-blue-800/50 shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">Recaudado en Domicilios</p>
                      </div>
                      <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{formatPrice(salesSummary.shippingTotal)}</p>
                    </div>
                    {/* Total General */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-100 dark:border-purple-800/50 shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total General</p>
                      </div>
                      <p className="text-xl font-bold text-purple-700 dark:text-purple-400">{formatPrice(salesSummary.grandTotal)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Lista de Pedidos con Checkbox (Colapsable) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6 transition-all">
              <div
                className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900 cursor-pointer"
                onClick={() => setShowOrdersList(!showOrdersList)}
              >
                <div className="flex items-center gap-2">
                  {showOrdersList ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pedidos Disponibles ({orders.length})</h2>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelectAll();
                  }}
                  className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium transition-colors px-3 py-1 bg-green-50 dark:bg-green-900/30 rounded-lg"
                >
                  {selectAll ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              </div>

              {showOrdersList && (
                <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto animate-fadeIn">
                  {orders.map(order => {
                    const itemCount = extractItemsFromOrder(order).reduce((acc, item) => acc + item.quantity, 0);
                    return (
                      <div
                        key={order.id}
                        className="p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                        onClick={() => toggleOrderSelection(order.id)}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleOrderSelection(order.id);
                          }}
                          className="flex-shrink-0"
                        >
                          {selectedOrders.has(order.id) ? (
                            <CheckSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {order.customer_name || 'Cliente'}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {itemCount} productos
                            </p>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getOrderTypeBadgeClass(order.order_type)}`}>
                              {getOrderTypeLabel(order.order_type)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tabla Principal */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Alerta de Duplicados */}
              {duplicateWarnings.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700/50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-full flex-shrink-0">
                      <User className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-800 dark:text-amber-300">Posibles Clientes Duplicados Detectados</h3>
                      <p className="text-sm text-amber-700 dark:text-amber-400/80 mb-2">Revisa si estos pedidos pertenecen al mismo cliente para unificar el envío:</p>
                      <ul className="list-disc list-inside text-sm text-amber-800 dark:text-amber-300 space-y-1">
                        {duplicateWarnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-wrap gap-2">
                  {/* Barra de búsqueda */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar producto..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none w-48"
                    />
                    {productSearch && (
                      <button
                        onClick={() => setProductSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleCopyAll}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    {copiedItems.size === filteredProducts.length && filteredProducts.length > 0 ? (
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
                  <button
                    onClick={() => setShowSupplierView(!showSupplierView)}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${showSupplierView
                      ? 'bg-orange-100 dark:bg-orange-900 border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-800'
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    title="Ver ruta de compra por bodega"
                  >
                    <Route size={16} />
                    {showSupplierView ? 'Ver Tabla' : 'Ruta de Compra'}
                  </button>
                  <button
                    onClick={toggleHidePurchased}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${hidePurchased
                      ? 'bg-purple-100 dark:bg-purple-900 border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800'
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    title={hidePurchased ? "Mostrar productos comprados" : "Ocultar productos comprados"}
                  >
                    {hidePurchased ? (
                      <>
                        <List size={16} />
                        Mostrar Comprados
                      </>
                    ) : (
                      <>
                        <List size={16} />
                        Ocultar Comprados
                      </>
                    )}
                  </button>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedOrders.size} pedidos seleccionados
                  </div>
                  {/* Barra de progreso de compra */}
                  {groupedProducts.length > 0 && (
                    <div className="flex items-center gap-2 w-48">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-green-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${purchaseProgress.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {purchaseProgress.purchased}/{purchaseProgress.total} ({purchaseProgress.percentage}%)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Vista de Ruta de Compra por Bodega */}
              {showSupplierView && selectedOrders.size > 0 && (
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 animate-fadeIn">
                  <SupplierView
                    productsBySupplier={productsBySupplier}
                    selectedOrdersCount={selectedOrders.size}
                    onCopySupplierList={async (supplierId: string) => {
                      const supplierData = productsBySupplier.get(supplierId);
                      if (!supplierData) return;
                      const text = supplierData.products.map(p =>
                        `${p.total_quantity}x ${p.display_name}${p.total_weight_display ? ` (${p.total_weight_display})` : ''}`
                      ).join('\n');
                      await navigator.clipboard.writeText(text);
                    }}
                    onCopyAllLists={async () => {
                      const allText = Array.from(productsBySupplier.entries())
                        .filter(([, data]) => data.products.length > 0)
                        .map(([id, data]) => {
                          const supplier = SUPPLIERS.find(s => s.id === id);
                          return `📍 ${supplier?.name || id}:\n${data.products.map(p =>
                            `  ${p.total_quantity}x ${p.display_name}`
                          ).join('\n')}`;
                        }).join('\n\n');
                      await navigator.clipboard.writeText(allText);
                    }}
                    copiedItems={copiedItems}
                    formatPrice={formatPrice}
                  />
                </div>
              )}

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
                  {filteredProducts.filter(p => !hidePurchased || !purchasedProducts.has(p.grouping_key)).map(product => {
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
                                  {getProductEmoji(product.product_name)} {product.display_name}
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
                                    {product.customer_breakdown.length} cliente{product.customer_breakdown.length === 1 ? '' : 's'}
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
                                        <div className="mt-1">
                                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getOrderTypeBadgeClass(customer.order_type)}`}>
                                            {getOrderTypeLabel(customer.order_type)}
                                          </span>
                                        </div>
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
                                          {customer.order_items && customer.order_items.length > 0 && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                copyToClipboard(generateOrderSummary(customer), summaryCopyId);
                                              }}
                                              className={`px-1.5 py-0.5 text-[10px] rounded flex items-center gap-1 transition-colors ${copiedItems.has(summaryCopyId)
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                                                : 'bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-800/50'
                                                }`}
                                            >
                                              {copiedItems.has(summaryCopyId) ? <Check size={10} /> : <ClipboardList size={10} />}
                                              {copiedItems.has(summaryCopyId) ? 'Copiado' : 'Resumen'}
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
                      {(() => {
                        const boxInfo = formatBoxQuantity(product.display_name, customer.quantity);
                        return boxInfo ? boxInfo.display : `${customer.quantity}x`;
                      })()}
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
                {(() => {
                  const boxInfo = formatBoxQuantity(product.display_name, product.total_quantity);
                  return boxInfo ? (
                    <>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        {product.total_quantity} cajas
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        ({boxInfo.totalUnits} unid. = {product.total_quantity} × {boxInfo.totalUnits / product.total_quantity})
                      </p>
                    </>
                  ) : product.total_weight_display ? (
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
                })()}
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
              {selectedOrders.size > 0 && filteredProducts.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
                  <Package className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                  <p className="text-yellow-800 font-medium">
                    {productSearch ? 'No se encontraron productos que coincidan con la búsqueda' : 'Los pedidos seleccionados no contienen productos'}
                  </p>
                </div>
              )}
          </>
        )}
    </div >
  );
}
