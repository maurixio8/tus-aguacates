'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Truck,
  MapPin,
  Phone,
  User,
  Package,
  DollarSign,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Check,
  Loader2,
  Calendar,
  Clock,
  Search,
  Navigation,
  Copy,
  ClipboardList,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface RouteItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  totalAmount: number;
  items: { name: string; quantity: number; price: number }[];
  itemCount: number;
  createdAt: string;
  isDelivered: boolean;
  paymentStatus: string;
  notes: string;
}

interface ZoneData {
  name: string;
  orders: RouteItem[];
  count: number;
}

interface RouteData {
  orders: RouteItem[];
  zones: Record<string, ZoneData>;
  total: number;
  totalAmount: number;
}

export default function RutaPage() {
  const [data, setData] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [markingLoading, setMarkingLoading] = useState(false);
  const [markSuccess, setMarkSuccess] = useState(0);
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const fetchRoute = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/ruta');
      if (!res.ok) throw new Error('Error al cargar ruta');
      const json = await res.json();
      setData(json);
      // Expandir todas las zonas por defecto
      if (json.zones) {
        setExpandedZones(new Set(Object.keys(json.zones)));
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  // Marcar seleccionados como entregados
  const markAsDelivered = async () => {
    if (selectedOrders.size === 0) return;
    if (!confirm(`¿Marcar ${selectedOrders.size} pedido${selectedOrders.size > 1 ? 's' : ''} como entregado${selectedOrders.size > 1 ? 's' : ''}?`)) return;

    setMarkingLoading(true);
    try {
      const res = await fetch('/api/admin/ruta', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: Array.from(selectedOrders) }),
      });
      if (!res.ok) throw new Error('Error al marcar');
      const json = await res.json();
      setMarkSuccess(json.marked || 0);
      setSelectedOrders(new Set());
      // Recargar datos después de marcar
      setTimeout(() => {
        setMarkSuccess(0);
        fetchRoute();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al marcar entregados');
    } finally {
      setMarkingLoading(false);
    }
  };

  const toggleZone = (zoneName: string) => {
    setExpandedZones(prev => {
      const next = new Set(prev);
      if (next.has(zoneName)) next.delete(zoneName);
      else next.add(zoneName);
      return next;
    });
  };

  const toggleOrder = (orderId: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const toggleSelect = (orderId: string) => {
    setSelectedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const selectAll = () => {
    if (!data) return;
    if (selectedOrders.size === data.orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(data.orders.map(o => o.id)));
    }
  };

  // Generar URL de Waze
  const wazeUrl = (address: string) => {
    const q = encodeURIComponent(address.replace(/\?/g, '').trim());
    return `https://waze.com/ul?q=${q}&navigate=yes`;
  };

  // Generar URL de Google Maps
  const gmapsUrl = (address: string) => {
    const q = encodeURIComponent(address.replace(/\?/g, '').trim());
    return `https://www.google.com/maps/dir/?api=1&destination=${q}`;
  };

  // Copiar al portapapeles
  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(id);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedIndex(id);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  // Formatear teléfono para WhatsApp
  const whatsappUrl = (phone: string) => {
    const clean = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${clean}`;
  };

  // Fecha en hora Colombia
  const toColombiaTime = (utcStr: string) => {
    if (!utcStr) return '';
    const d = new Date(utcStr);
    // Restar 5h (UTC-5 Colombia)
    const col = new Date(d.getTime() - 5 * 60 * 60 * 1000);
    const day = col.getDate().toString().padStart(2, '0');
    const month = (col.getMonth() + 1).toString().padStart(2, '0');
    const hour = col.getHours().toString().padStart(2, '0');
    const min = col.getMinutes().toString().padStart(2, '0');
    return `${day}/${month} ${hour}:${min}`;
  };

  // Determinar día de entrega (martes o viernes)
  const getDeliveryDay = () => {
    const now = new Date();
    const day = now.getDay(); // 0=Dom, 1=Lun, 2=Mar, 3=Mie, 4=Jue, 4=Vie, 6=Sab
    if (day <= 2) return 'Martes';
    if (day <= 5) return 'Viernes';
    return 'Martes'; // finde, próximo martes
  };

  const getDeliveryDate = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = day <= 2 ? 2 - day : (day <= 5 ? 5 - day : 9 - day); // Próximo martes o viernes
    const next = new Date(now);
    next.setDate(now.getDate() + diff);
    return next.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  // Filtrar por búsqueda
  const filteredOrders = data?.orders.filter(o => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return o.customerName.toLowerCase().includes(s)
      || o.deliveryAddress.toLowerCase().includes(s)
      || o.customerPhone.includes(s)
      || o.orderNumber.toLowerCase().includes(s);
  }) || [];

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        <span className="ml-3 text-gray-600">Cargando ruta...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <Truck className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ruta de Hoy</h1>
            <p className="text-sm text-gray-500 capitalize">
              {getDeliveryDate()}
            </p>
          </div>
        </div>

        {/* Stats */}
        {data && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-500">Pendientes</p>
              <p className="text-xl font-bold text-gray-900">{data.total}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold text-green-600">
                ${data.totalAmount.toLocaleString('es-CO')}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-500">Zonas</p>
              <p className="text-xl font-bold text-gray-900">
                {Object.keys(data.zones || {}).length}
              </p>
            </div>
          </div>
        )}

        {/* Barra de búsqueda */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, dirección o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Mensaje de éxito */}
        {markSuccess > 0 && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">
              ¡{markSuccess} pedido{markSuccess > 1 ? 's' : ''} marcado{markSuccess > 1 ? 's' : ''} como entregado{markSuccess > 1 ? 's' : ''}! 🎉
            </span>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>

      {/* Control buttons */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={selectAll}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {selectedOrders.size === data?.orders.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
        </button>

        <button
          onClick={markAsDelivered}
          disabled={selectedOrders.size === 0 || markingLoading}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            selectedOrders.size === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {markingLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Marcando...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Marcar como entregados ({selectedOrders.size})
            </>
          )}
        </button>

        <button
          onClick={fetchRoute}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
        >
          <RefreshCw className="w-4 h-4" />
          Recargar
        </button>

        {/* Botón abrir todo en Waze */}
        {selectedOrders.size > 0 && (
          <a
            href={wazeUrl(filteredOrders.filter(o => selectedOrders.has(o.id)).map(o => o.deliveryAddress).join('&q='))}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
          >
            <Navigation className="w-4 h-4" />
            Abrir en Waze
          </a>
        )}
      </div>

      {/* Lista de pedidos agrupada por zona */}
      {data && Object.keys(data.zones || {}).length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">¡No hay pedidos pendientes! 🎉</h3>
          <p className="text-sm text-gray-500 mt-1">Todos los pedidos han sido entregados.</p>
          <button
            onClick={fetchRoute}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Recargar
          </button>
        </div>
      )}

      {/* Pedidos sin zona (búsqueda activa) */}
      {searchTerm && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-700">
              Resultados de búsqueda ({filteredOrders.length})
            </h3>
          </div>
          <div className="space-y-2">
            {filteredOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                selected={selectedOrders.has(order.id)}
                expanded={expandedOrders.has(order.id)}
                onToggleSelect={() => toggleSelect(order.id)}
                onToggleExpand={() => toggleOrder(order.id)}
                wazeUrl={wazeUrl(order.deliveryAddress)}
                gmapsUrl={gmapsUrl(order.deliveryAddress)}
                whatsappUrl={whatsappUrl(order.customerPhone)}
                copyToClipboard={copyToClipboard}
                copiedIndex={copiedIndex}
                toColombiaTime={toColombiaTime}
              />
            ))}
          </div>
        </div>
      )}

      {/* Por zonas */}
      {!searchTerm && data?.zones && Object.entries(data.zones).map(([zoneKey, zone]) => (
        <div key={zoneKey} className="mb-4">
          <button
            onClick={() => toggleZone(zoneKey)}
            className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors mb-2"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-600" />
              <span className="font-semibold text-gray-900">{zone.name}</span>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {zone.count}
              </span>
              <span className="text-xs text-gray-400">
                ${zone.orders.reduce((s, o) => s + (o.totalAmount || 0), 0).toLocaleString('es-CO')}
              </span>
            </div>
            {expandedZones.has(zoneKey) ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {expandedZones.has(zoneKey) && (
            <div className="space-y-2 pl-2">
              {zone.orders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  selected={selectedOrders.has(order.id)}
                  expanded={expandedOrders.has(order.id)}
                  onToggleSelect={() => toggleSelect(order.id)}
                  onToggleExpand={() => toggleOrder(order.id)}
                  wazeUrl={wazeUrl(order.deliveryAddress)}
                  gmapsUrl={gmapsUrl(order.deliveryAddress)}
                  whatsappUrl={whatsappUrl(order.customerPhone)}
                  copyToClipboard={copyToClipboard}
                  copiedIndex={copiedIndex}
                  toColombiaTime={toColombiaTime}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Componente de tarjeta de pedido individual
function OrderCard({
  order,
  selected,
  expanded,
  onToggleSelect,
  onToggleExpand,
  wazeUrl,
  gmapsUrl,
  whatsappUrl,
  copyToClipboard,
  copiedIndex,
  toColombiaTime,
}: {
  order: RouteItem;
  selected: boolean;
  expanded: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  wazeUrl: string;
  gmapsUrl: string;
  whatsappUrl: string;
  copyToClipboard: (text: string, id: string) => void;
  copiedIndex: string | null;
  toColombiaTime: (s: string) => string;
}) {
  // Resumen de items para vista compacta
  const itemsSummary = order.items.slice(0, 3).map(i => i.name).join(', ');
  const hasMore = order.items.length > 3;
  const hasQuestion = order.deliveryAddress.includes('?');

  return (
    <div
      className={`bg-white rounded-lg border transition-all ${
        selected ? 'border-green-400 ring-2 ring-green-100' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Cabecera */}
      <div className="p-3">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <div
            onClick={onToggleSelect}
            className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer flex-shrink-0 transition-colors ${
              selected
                ? 'bg-green-600 border-green-600'
                : 'border-gray-300 hover:border-green-400'
            }`}
          >
            {selected && <Check className="w-3 h-3 text-white" />}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggleExpand}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="font-medium text-gray-900 truncate">
                  {order.customerName}
                </span>
              </div>
              <span className="text-sm font-semibold text-green-700 flex-shrink-0 ml-2">
                ${order.totalAmount.toLocaleString('es-CO')}
              </span>
            </div>

            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                {order.deliveryAddress.replace(/\?/g, '').trim() || 'Sin dirección'}
              </span>
              {hasQuestion && (
                <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" aria-label="Dirección con ?" />
              )}
            </div>

            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-xs text-gray-400">{order.itemCount} items</span>
              <span className="text-xs text-gray-400">
                {toColombiaTime(order.createdAt)}
              </span>
              {itemsSummary && (
                <span className="text-xs text-gray-400 truncate">{itemsSummary}{hasMore ? '...' : ''}</span>
              )}
            </div>
          </div>
        </div>

        {/* Botones de acción rápidos */}
        <div className="flex gap-1.5 mt-2 ml-8">
          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
            title="Abrir en Waze"
          >
            <Navigation className="w-3 h-3" />
            Waze
          </a>
          <a
            href={gmapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
            title="Abrir en Google Maps"
          >
            <MapPin className="w-3 h-3" />
            Maps
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
            title="Enviar WhatsApp"
          >
            <Phone className="w-3 h-3" />
            WhatsApp
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(order.deliveryAddress, `addr-${order.id}`);
            }}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
            title="Copiar dirección"
          >
            {copiedIndex === `addr-${order.id}` ? (
              <Check className="w-3 h-3 text-green-600" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            Copiar
          </button>
        </div>
      </div>

      {/* Detalle expandido */}
      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-gray-100 ml-8">
          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
            <div>
              <p className="text-xs text-gray-500">Teléfono</p>
              <p className="text-gray-700">{order.customerPhone}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Pedido</p>
              <p className="text-gray-700 font-mono text-xs">{order.orderNumber.slice(-20)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Pago</p>
              <p className="text-gray-700 capitalize">{order.paymentStatus}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Items</p>
              <p className="text-gray-700">{order.itemCount}</p>
            </div>
          </div>

          {/* Lista de items */}
          {order.items.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Productos:</p>
              <div className="space-y-1">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-0.5">
                    <span className="text-gray-700 truncate">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="text-gray-500 text-xs flex-shrink-0 ml-2">
                      ${(item.price * item.quantity).toLocaleString('es-CO')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dirección completa */}
          <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
            <div className="flex justify-between items-start">
              <span className="break-all">{order.deliveryAddress}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(order.deliveryAddress, `full-addr-${order.id}`);
                }}
                className="flex-shrink-0 ml-2 text-green-600 hover:text-green-700"
              >
                {copiedIndex === `full-addr-${order.id}` ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>

          {order.notes && (
            <div className="mt-2 p-2 bg-amber-50 rounded text-xs text-amber-700">
              📝 {order.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
