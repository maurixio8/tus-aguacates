'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
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
  Filter,
} from 'lucide-react';

import RouteMap from '@/components/admin/RouteMap';
import ManualLocationPicker from '@/components/admin/ManualLocationPicker';
import { formatNormalizedDeliveryAddress } from '@/lib/location-resolution';

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
  source: 'orders' | 'guest_orders';
  deliveryDate: string | null;
  latitude: number | null;
  longitude: number | null;
  coordinateSource: string;
  confidence: string;
  coverage: string;
  coverageReason: string | null;
  coverageZone: string | null;
  city: string;
  resolutionStatus: 'sin_coordenadas' | 'candidata' | 'confirmada' | 'rechazada';
  resolutionCandidates: { latitude: number; longitude: number; label: string; confidence: string; provider: string; matchType?: string | null; confidenceBuildingLevel?: number | null; locality?: string | null; level?: 'fuerte' | 'ambiguo' | 'calle'; levelLabel?: string; multipleLocalities?: boolean; coverage?: string; coverageLabel?: string; recommended?: boolean }[];
  correctedAddress?: string | null;
  normalizedAddress?: string | null;
  resolutionId?: string | null;
  resolutionConfirmedBy?: string | null;
  resolutionResolvedAt?: string | null;
  resolutionHistory?: Array<{ event: string; status: string; corrected_address?: string | null; latitude?: number | null; longitude?: number | null; confirmed_by?: string | null; resolved_at?: string | null; rejection_reason?: string | null; captured_at: string }>;
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
  counts: { total: number; conPin: number; geocodificados: number; porVerificar: number; fueraCobertura: number; chia: number; dentro: number; porConfirmar: number };
  dateFrom: string;
  dateTo: string;
  canonicalDateSource: string;
  origin: { lat: number; lng: number; address: string };
}

export default function RutaPage() {
  const routeSearch = useSearchParams();
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
  const [dateDesde, setDateDesde] = useState(() => routeSearch.get('desde') || '');
  const [dateHasta, setDateHasta] = useState(() => routeSearch.get('hasta') || '');
  const [originAddress] = useState('Corabastos, Bogotá');
  const [excludedOrders, setExcludedOrders] = useState<Set<string>>(new Set());
  const [showMap, setShowMap] = useState(true);
  const [shadowResult, setShadowResult] = useState<any>(null);
  const [shadowLoading, setShadowLoading] = useState(false);
  const [manualOrder, setManualOrder] = useState<RouteItem | null>(null);
  const [locationSaving, setLocationSaving] = useState(false);
  const [addressDrafts, setAddressDrafts] = useState<Record<string, string>>({});
  const [correctionLoading, setCorrectionLoading] = useState<string | null>(null);

  const fetchRoute = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (dateDesde) params.set('desde', dateDesde);
      if (dateHasta) params.set('hasta', dateHasta);
      const res = await fetch(`/api/admin/ruta?${params.toString()}`, { credentials: 'include', cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || 'Error al cargar ruta');
      // Excluir pedidos pausados
      if (excludedOrders.size > 0 && json.orders) {
        json.orders = json.orders.filter((o: any) => !excludedOrders.has(o.id));
        // Recalcular zonas
        json.zones = recalculateZones(json.orders);
        json.total = json.orders.length;
        json.totalAmount = json.orders.reduce((s: number, o: any) => s + (o.totalAmount || 0), 0);
      }
      setData(json);
      if (!dateDesde && json.dateFrom) setDateDesde(json.dateFrom);
      if (!dateHasta && json.dateTo) setDateHasta(json.dateTo);
      // Expandir todas las zonas por defecto
      if (json.zones) {
        setExpandedZones(new Set(Object.keys(json.zones)));
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [dateDesde, dateHasta, excludedOrders]);

  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  useEffect(() => {
    const timer = window.setInterval(() => fetchRoute(), 180000);
    return () => window.clearInterval(timer);
  }, [fetchRoute]);

  const generateShadow = async () => {
    const date = dateDesde || data?.dateFrom;
    if (!date) return;
    setShadowLoading(true);
    try {
      const res = await fetch('/api/admin/ruta/shadow', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'No se pudo generar la ruta sombra');
      setShadowResult(json);
    } catch (err: any) {
      setError(err.message || 'Error generando ruta sombra');
    } finally { setShadowLoading(false); }
  };

  const correctAddress = async (order: RouteItem) => {
    const correctedAddress = (addressDrafts[order.id] || order.correctedAddress || order.deliveryAddress).trim();
    if (!correctedAddress) return;
    setCorrectionLoading(order.id);
    setError('');
    try {
      const res = await fetch('/api/admin/ruta/locations', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'correct', orderId: order.id, source: order.source, customerPhone: order.customerPhone, originalAddress: order.deliveryAddress, correctedAddress, city: order.city }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'No se pudo corregir la dirección');
      setAddressDrafts(previous => ({ ...previous, [order.id]: correctedAddress }));
      await fetchRoute();
    } catch (err: any) {
      setError(err.message || 'Error corrigiendo dirección');
    } finally {
      setCorrectionLoading(null);
    }
  };

  const reopenResolution = async (order: RouteItem) => {
    if (!order.resolutionId) return;
    setError('');
    try {
      const res = await fetch('/api/admin/ruta/locations', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reopen', resolutionId: order.resolutionId, originalAddress: order.deliveryAddress, correctedAddress: order.correctedAddress || order.deliveryAddress, city: order.city }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'No se pudo reabrir la resolución');
      await fetchRoute();
    } catch (err: any) {
      setError(err.message || 'Error reabriendo resolución');
    }
  };

  const rejectResolution = async (order: RouteItem) => {
    if (!order.resolutionId) return;
    const reason = window.prompt('Motivo para rechazar esta resolución:', 'candidato equivocado')?.trim();
    if (!reason) return;
    setError('');
    try {
      const res = await fetch('/api/admin/ruta/locations', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reject', resolutionId: order.resolutionId, originalAddress: order.deliveryAddress, correctedAddress: order.correctedAddress || order.deliveryAddress, city: order.city, reason }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'No se pudo rechazar la resolución');
      await fetchRoute();
    } catch (err: any) {
      setError(err.message || 'Error rechazando resolución');
    }
  };

  const saveLocation = async (order: RouteItem, action: 'confirm' | 'whatsapp', candidate?: { latitude: number; longitude: number; label?: string; provider?: string; confidence?: string }) => {
    setLocationSaving(true);
    try {
      const payload: any = { action, orderId: order.id, source: order.source, customerPhone: order.customerPhone, originalAddress: order.deliveryAddress, correctedAddress: order.correctedAddress || addressDrafts[order.id] || order.deliveryAddress, city: order.city, normalizedAddress: order.normalizedAddress || undefined, latitude: candidate?.latitude, longitude: candidate?.longitude, provider: candidate?.provider || 'manual', providerConfidence: candidate?.confidence, candidates: order.resolutionCandidates };
      let res = await fetch('/api/admin/ruta/locations', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      let json = await res.json();
      if (res.status === 409 && json.requiresCoverageConfirmation) {
        const confirmed = window.confirm(json.warning || 'Esta ubicación está fuera de tus zonas de entrega y no entrará a la ruta. ¿Quieres confirmarla de todas formas?');
        if (!confirmed) return;
        payload.confirmOutsideCoverage = true;
        res = await fetch('/api/admin/ruta/locations', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        json = await res.json();
      }
      if (!res.ok) throw new Error(json.error || 'No se pudo guardar la ubicación');
      setManualOrder(null);
      await fetchRoute();
    } catch (err: any) { setError(err.message || 'Error guardando ubicación'); }
    finally { setLocationSaving(false); }
  };

  // Marcar seleccionados como entregados
  const markAsDelivered = async () => {
    if (selectedOrders.size === 0) return;
    if (!confirm(`¿Marcar ${selectedOrders.size} pedido${selectedOrders.size > 1 ? 's' : ''} como entregado${selectedOrders.size > 1 ? 's' : ''}?`)) return;

    setMarkingLoading(true);
    try {
      const res = await fetch('/api/admin/ruta', {
        method: 'PATCH',
        credentials: 'include',
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

  const toggleExclude = (orderId: string) => {
    setExcludedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
    // Quitar de seleccionados si estaba
    setSelectedOrders(prev => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });
  };

  // Generar URL de Google Maps multi-parada
  const gmapsMultiUrl = () => {
    const selected = data?.orders.filter(o => selectedOrders.has(o.id) && !excludedOrders.has(o.id)) || [];
    if (selected.length === 0 && !originAddress) return '#';
    const base = 'https://www.google.com/maps/dir/';
    const origin = originAddress ? encodeURIComponent(originAddress) : '';
    const destinations = selected.map(o => '/' + encodeURIComponent(o.deliveryAddress.replace(/\?/g, '').trim()));
    return `${base}${origin}${destinations.join('')}`;
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

  // Recalcular zonas cuando se excluyen pedidos
  const recalculateZones = (orders: any[]) => {
    const zoneKeywords: Record<string, string[]> = {
      chapinero: ['chapinero'], usaquen: ['usaquén', 'cedritos', 'santa bárbara'],
      suba: ['suba', 'iberia', 'prado'], engativa: ['engativá', 'normandía', 'bonanza'],
      fontibon: ['fontibón'], teusaquillo: ['teusaquillo', 'salitre'],
      barrios_unidos: ['barrios unidos', 'doce de octubre'],
      puente_aranda: ['puente aranda', 'paloquemao', 'carabelas'],
      martires: ['mártires'], tintal: ['tintal', 'bosa'],
      kennedy: ['kennedy', 'britalia', 'marsella'],
      ciudad_bolivar: ['ciudad bolívar'], rafael_uribe: ['rafael uribe'],
      santa_fe: ['santa fe', 'centro'], san_cristobal: ['san cristóbal'],
    };
    const zones: Record<string, any> = {};
    for (const order of orders) {
      const addr = (order.deliveryAddress || '').toLowerCase();
      let assigned = false;
      for (const [key, keywords] of Object.entries(zoneKeywords)) {
        if (keywords.some(k => addr.includes(k))) {
          if (!zones[key]) zones[key] = { name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '), orders: [], count: 0 };
          zones[key].orders.push(order); zones[key].count++; assigned = true; break;
        }
      }
      if (!assigned) {
        if (!zones.otras) zones.otras = { name: 'Otras', orders: [], count: 0 };
        zones.otras.orders.push(order); zones.otras.count++;
      }
    }
    return zones;
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
              {data?.dateFrom ? `Entrega: ${data.dateFrom}${data.dateTo !== data.dateFrom ? ` → ${data.dateTo}` : ''}` : getDeliveryDate()}
            </p>
          </div>
        </div>

        {/* Stats */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mt-4">
            <div className="bg-white rounded-lg p-3 border border-gray-200"><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold text-gray-900">{data.counts.total}</p></div>
            <div className="bg-white rounded-lg p-3 border border-gray-200"><p className="text-xs text-gray-500">Con pin</p><p className="text-xl font-bold text-green-700">{data.counts.conPin}</p></div>
            <div className="bg-white rounded-lg p-3 border border-gray-200"><p className="text-xs text-gray-500">Geocodificados</p><p className="text-xl font-bold text-blue-700">{data.counts.geocodificados}</p></div>
            <div className="bg-white rounded-lg p-3 border border-gray-200"><p className="text-xs text-gray-500">Por verificar</p><p className="text-xl font-bold text-amber-700">{data.counts.porVerificar}</p></div>
            <div className="bg-white rounded-lg p-3 border border-gray-200"><p className="text-xs text-gray-500">Fuera</p><p className="text-xl font-bold text-red-700">{data.counts.fueraCobertura}</p></div>
            <div className="bg-white rounded-lg p-3 border border-gray-200"><p className="text-xs text-gray-500">Chía</p><p className="text-xl font-bold text-purple-700">{data.counts.chia}</p></div>
            <div className="bg-white rounded-lg p-3 border border-gray-200"><p className="text-xs text-gray-500">Dentro</p><p className="text-xl font-bold text-green-700">{data.counts.dentro}</p></div>
            <div className="bg-white rounded-lg p-3 border border-gray-200"><p className="text-xs text-gray-500">Zonas texto</p><p className="text-xl font-bold text-gray-900">{Object.keys(data.zones || {}).length}</p></div>
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

        {/* Filtros: Rango de fechas + Origen */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Rango de entrega — Desde</label>
            <input
              type="date"
              value={dateDesde}
              onChange={(e) => setDateDesde(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Rango de entrega — Hasta</label>
            <input
              type="date"
              value={dateHasta}
              onChange={(e) => setDateHasta(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Origen y llegada fija</label>
            <div className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50">Corabastos, Bogotá · 4.63205, -74.15534</div>
          </div>
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
          Actualizar
        </button>
        <button onClick={generateShadow} disabled={shadowLoading} className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          {shadowLoading ? 'Generando...' : 'Generar ruta sombra'}
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

        {/* Botón Ruta completa en Google Maps */}
        {selectedOrders.size > 0 && (
          <a
            href={gmapsMultiUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
          >
            <MapPin className="w-4 h-4" />
            Ruta en Google Maps
          </a>
        )}

        {/* Botón mostrar/ocultar mapa */}
        {data && data.orders.length > 0 && (
          <button
            onClick={() => setShowMap(!showMap)}
            className={`px-3 py-1.5 text-sm border rounded-lg transition-colors flex items-center gap-1 ${
              showMap ? 'bg-green-50 border-green-300 text-green-700' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <MapPin className="w-4 h-4" />
            {showMap ? 'Ocultar mapa' : 'Mostrar mapa'}
          </button>
        )}
      </div>

      {data && <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-900"><b>Fecha canónica:</b> {data.dateFrom}{data.dateTo !== data.dateFrom ? ` a ${data.dateTo}` : ''}. {data.canonicalDateSource}</div>}
      {shadowResult && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm"><b>Ruta sombra:</b> {shadowResult.counts?.routed || 0} paradas en {shadowResult.counts?.routes || 0} CSV{shadowResult.counts?.pending_coordinates ? ` · ${shadowResult.counts.pending_coordinates} sin coordenadas` : ''}. <span className="mt-2 inline-flex flex-wrap gap-2">{(shadowResult.csvFiles || []).map((file: any) => <a key={file.name} className="underline" download={file.name} href={`data:text/csv;charset=utf-8,${encodeURIComponent(file.content)}`}>Descargar {file.name}</a>)}</span>{shadowResult.warning && <span className="mt-2 block text-xs text-green-800">{shadowResult.warning}</span>}</div>}

      {data && data.orders.filter(order => order.latitude == null || order.longitude == null).length > 0 && (
        <section className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between gap-2"><h2 className="font-semibold text-amber-950">Ubicaciones pendientes</h2><span className="rounded-full bg-amber-200 px-2 py-1 text-xs text-amber-950">{data.orders.filter(order => order.latitude == null || order.longitude == null).length}</span></div>
          <p className="mt-1 text-xs text-amber-900">Solo las ubicaciones confirmadas aparecen como paradas. No se adivinan coordenadas.</p>
          <div className="mt-3 space-y-3">
            {data.orders.filter(order => order.latitude == null || order.longitude == null).map(order => {
              const draftAddress = addressDrafts[order.id] ?? order.correctedAddress ?? order.deliveryAddress;
              const normalizedPreview = order.correctedAddress ? formatNormalizedDeliveryAddress(order.correctedAddress, order.city) : null;
              return <div key={order.id} className="rounded-lg border border-amber-200 bg-white p-3 text-sm">
                <div className="font-medium text-gray-900">{order.customerName}</div>
                <div className="mt-1 text-xs text-gray-500">Dirección original: {order.deliveryAddress || 'Sin dirección'}</div>
                <label className="mt-3 block text-xs font-semibold text-gray-700" htmlFor={`route-address-${order.id}`}>Corregir dirección antes de buscar</label>
                <textarea id={`route-address-${order.id}`} value={draftAddress} onChange={event => setAddressDrafts(previous => ({ ...previous, [order.id]: event.target.value }))} rows={2} className="mt-1 min-h-20 w-full rounded-lg border border-gray-300 px-3 py-2 text-base leading-6 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-200" />
                <button type="button" disabled={correctionLoading === order.id || !draftAddress.trim()} onClick={() => correctAddress(order)} className="mt-2 w-full rounded-lg bg-amber-600 px-3 py-2.5 text-base font-semibold text-white disabled:opacity-50">{correctionLoading === order.id ? 'Buscando candidatos...' : 'Corregir dirección'}</button>
                {normalizedPreview && <div className="mt-2 rounded-md bg-green-50 p-2 text-xs text-green-900"><b>Versión normalizada:</b> {normalizedPreview}</div>}
                {order.resolutionHistory && order.resolutionHistory.length > 0 && <details className="mt-2 rounded-md bg-gray-50 p-2 text-xs text-gray-700"><summary className="cursor-pointer font-semibold">Historial de resolución ({order.resolutionHistory.length})</summary><div className="mt-2 space-y-1">{order.resolutionHistory.slice().reverse().map((entry, index) => <div key={`${entry.captured_at}-${index}`} className="border-l-2 border-gray-300 pl-2"><b>{entry.event}</b> · {entry.status} · {entry.confirmed_by || 'sin confirmador'} · {toColombiaTime(entry.captured_at)}{entry.rejection_reason ? ` · ${entry.rejection_reason}` : ''}</div>)}</div></details>}
                {order.resolutionCandidates.length > 0 ? <div className="mt-3 space-y-1"><div className="text-xs font-semibold text-gray-700">Candidatos — niveles y cobertura separados</div>{order.resolutionCandidates.slice(0, 5).map((candidate, index) => <button key={`${candidate.latitude}-${candidate.longitude}-${index}`} type="button" disabled={locationSaving} onClick={() => saveLocation(order, 'confirm', candidate)} className={`block w-full rounded border px-3 py-2 text-left text-sm ${candidate.level === 'fuerte' && candidate.recommended ? 'border-green-200 bg-green-50 text-green-900' : candidate.level === 'calle' ? 'border-gray-200 bg-gray-50 text-gray-700' : 'border-amber-200 bg-amber-50 text-amber-950'}`}><b>{candidate.levelLabel || 'AMBIGUO · requiere revisión'}</b> · candidato {index + 1} · {candidate.label} · proveedor: {candidate.provider} · confianza: {candidate.confidenceBuildingLevel ?? candidate.confidence} · {candidate.coverageLabel || 'cobertura por confirmar'}{candidate.locality ? ` · ${candidate.locality}` : ''}</button>)}</div> : <div className="mt-2 text-xs text-amber-800">No hay candidato exacto todavía. Si sigue así, usa pin manual o WhatsApp.</div>}
                <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => setManualOrder(order)} className="rounded bg-green-700 px-3 py-2 text-sm font-medium text-white">Poner pin manual</button><button type="button" disabled={locationSaving} onClick={() => saveLocation(order, 'whatsapp')} className="rounded border border-green-700 px-3 py-2 text-sm font-medium text-green-800">Marcar para WhatsApp</button></div>
              </div>;
            })}
          </div>
        </section>
      )}

      {manualOrder && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-4"><div className="mb-3 flex items-start justify-between gap-3"><div><h2 className="font-semibold text-gray-900">Poner pin manual</h2><p className="text-xs text-gray-600">{manualOrder.customerName} · {manualOrder.deliveryAddress || 'Sin dirección'}</p></div><button type="button" onClick={() => setManualOrder(null)} className="text-gray-500">Cerrar</button></div><ManualLocationPicker onConfirm={(latitude, longitude) => saveLocation(manualOrder, 'confirm', { latitude, longitude, provider: 'manual' })} /></div></div>}

      {/* MAPA DE RUTA */}
      {showMap && data && (
        <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-600" />
            Ruta visual — {selectedOrders.size > 0 ? selectedOrders.size : data.orders.length} paradas
          </h3>
          <RouteMap
            orders={data.orders
              .filter(o => selectedOrders.size === 0 || selectedOrders.has(o.id))
              .filter(o => !excludedOrders.has(o.id))
              .map(o => ({
                id: o.id,
                customerName: o.customerName,
                deliveryAddress: o.deliveryAddress,
                orderNumber: o.orderNumber,
                latitude: o.latitude,
                longitude: o.longitude,
                coordinateSource: o.coordinateSource,
                coverage: o.coverage,
              }))}
            lineOrderIds={shadowResult?.routes?.flatMap((r: any) => r.order_ids || []) || []}
            origin={data.origin}
          />
        </div>
      )}

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
                onToggleExclude={() => toggleExclude(order.id)}
                isExcluded={excludedOrders.has(order.id)}
                onToggleExpand={() => toggleOrder(order.id)}
                wazeUrl={wazeUrl(order.deliveryAddress)}
                gmapsUrl={gmapsUrl(order.deliveryAddress)}
                whatsappUrl={whatsappUrl(order.customerPhone)}
                copyToClipboard={copyToClipboard}
                copiedIndex={copiedIndex}
                toColombiaTime={toColombiaTime}
                onReopenResolution={() => reopenResolution(order)}
                onRejectResolution={() => rejectResolution(order)}
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
                  onToggleExclude={() => toggleExclude(order.id)}
                  isExcluded={excludedOrders.has(order.id)}
                  onToggleExpand={() => toggleOrder(order.id)}
                  wazeUrl={wazeUrl(order.deliveryAddress)}
                  gmapsUrl={gmapsUrl(order.deliveryAddress)}
                  whatsappUrl={whatsappUrl(order.customerPhone)}
                  copyToClipboard={copyToClipboard}
                  copiedIndex={copiedIndex}
                  toColombiaTime={toColombiaTime}
                  onReopenResolution={() => reopenResolution(order)}
                  onRejectResolution={() => rejectResolution(order)}
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
  onToggleExclude,
  isExcluded,
  onToggleExpand,
  wazeUrl,
  gmapsUrl,
  whatsappUrl,
  copyToClipboard,
  copiedIndex,
  toColombiaTime,
  onReopenResolution,
  onRejectResolution,
}: {
  order: RouteItem;
  selected: boolean;
  expanded: boolean;
  onToggleSelect: () => void;
  onToggleExclude: () => void;
  isExcluded: boolean;
  onToggleExpand: () => void;
  wazeUrl: string;
  gmapsUrl: string;
  whatsappUrl: string;
  copyToClipboard: (text: string, id: string) => void;
  copiedIndex: string | null;
  toColombiaTime: (s: string) => string;
  onReopenResolution: () => void;
  onRejectResolution: () => void;
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

            <div className="flex items-center gap-2 mt-1 text-[11px] flex-wrap">
              <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{order.coverage}</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">{order.coordinateSource}</span>
              <span className="text-gray-400">confianza: {order.confidence}</span>
            </div>

            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-xs font-medium text-indigo-700">Entrega: {order.deliveryDate || 'sin fecha'}</span>
              <span className="text-xs text-gray-400">Creado: {toColombiaTime(order.createdAt)}</span>
              <span className="text-xs text-gray-400">{order.itemCount} items</span>
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExclude();
            }}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
              isExcluded
                ? 'bg-amber-100 text-amber-700'
                : 'bg-gray-50 text-gray-500 hover:bg-amber-50 hover:text-amber-600'
            }`}
            title={isExcluded ? 'Incluir en ruta' : 'Excluir de ruta'}
          >
            {isExcluded ? '✓ Incluir' : '⏸ Excluir'}
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

          {order.resolutionStatus === 'confirmada' && order.resolutionId && (
            <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-950">
              <div className="font-semibold">Resolución confirmada</div>
              <div className="mt-1">Coordenadas: {order.latitude?.toFixed(6)}, {order.longitude?.toFixed(6)}</div>
              <div>Confirmó: {order.resolutionConfirmedBy || 'administrador'} · {order.resolutionResolvedAt ? toColombiaTime(order.resolutionResolvedAt) : 'sin fecha'}</div>
              <div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={onReopenResolution} className="rounded bg-amber-600 px-2.5 py-1.5 font-medium text-white">Corregir de nuevo</button><button type="button" onClick={onRejectResolution} className="rounded border border-red-600 px-2.5 py-1.5 font-medium text-red-700">Rechazar resolución</button></div>
            </div>
          )}
          {order.resolutionHistory && order.resolutionHistory.length > 0 && (
            <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
              <div className="font-semibold">Historial de resolución</div>
              <div className="mt-2 space-y-1">{order.resolutionHistory.slice().reverse().map((entry, index) => <div key={`${entry.captured_at}-${index}`} className="border-l-2 border-gray-300 pl-2"><b>{entry.event}</b> · {entry.status} · {entry.confirmed_by || 'sin confirmador'} · {toColombiaTime(entry.captured_at)}{entry.rejection_reason ? ` · ${entry.rejection_reason}` : ''}</div>)}</div>
            </div>
          )}

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
