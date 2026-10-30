'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import { buildGoogleMapsDirectionsUrl, buildWhatsAppUrl } from '@/lib/admin-route';
import { formatOperationalSummary } from '@/utils/orderSummaryGenerator';

interface RouteItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  totalAmount: number;
  items: { name: string; quantity: number; price: number; subtotal?: number; variantName?: string; variant_value?: string; variant_name?: string; weight?: number | string | null; unit?: string | null }[];
  itemCount: number;
  createdAt: string;
  isDelivered: boolean;
  paymentStatus: string;
  paymentMethod?: string | null;
  subtotal?: number;
  shippingFee?: number;
  discount?: number;
  couponCode?: string | null;
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
  isCancelled?: boolean;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
}

interface ZoneData {
  name: string;
  orders: RouteItem[];
  count: number;
}

interface RouteData {
  orders: RouteItem[];
  routeOrders: RouteItem[];
  zones: Record<string, ZoneData>;
  total: number;
  totalAmount: number;
  counts: { total: number; conPin: number; geocodificados: number; porVerificar: number; fueraCobertura: number; chia: number; dentro: number; porConfirmar: number; ruta?: number; excluidas?: number; cancelados?: number };
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
  const [optimizedResult, setOptimizedResult] = useState<any>(null);
  const [routeMode, setRouteMode] = useState<'compact' | 'split'>('compact');
  const [optimizedLoading, setOptimizedLoading] = useState(false);
  const [optimizedError, setOptimizedError] = useState('');
  const [departureTime, setDepartureTime] = useState('14:00');
  const [northDriver, setNorthDriver] = useState('Mauricio');
  const [southDriver, setSouthDriver] = useState('Ayudante');
  const [preRouteApproved, setPreRouteApproved] = useState(false);
  const [manualOrder, setManualOrder] = useState<RouteItem | null>(null);
  const [locationSaving, setLocationSaving] = useState(false);
  const [addressDrafts, setAddressDrafts] = useState<Record<string, string>>({});
  const [correctionLoading, setCorrectionLoading] = useState<string | null>(null);
  const [operationsTab, setOperationsTab] = useState<'compras' | 'empaque' | 'carga' | 'conductor'>('compras');
  const [shoppingChecked, setShoppingChecked] = useState<Set<string>>(new Set());
  const [packedChecked, setPackedChecked] = useState<Set<string>>(new Set());
  const [loadedChecked, setLoadedChecked] = useState<Set<string>>(new Set());
  const checklistLoaded = useRef<string | null>(null);

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
  }, [dateDesde, dateHasta]);

  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  useEffect(() => {
    const timer = window.setInterval(() => fetchRoute(), 180000);
    return () => window.clearInterval(timer);
  }, [fetchRoute]);

  useEffect(() => {
    const key = `phase5-checklists:${dateDesde || data?.dateFrom || 'sin-fecha'}:${dateHasta || data?.dateTo || 'sin-fecha'}`;
    try {
      const saved = JSON.parse(window.localStorage.getItem(key) || '{}');
      setShoppingChecked(new Set(saved.shopping || []));
      setPackedChecked(new Set(saved.packed || []));
      setLoadedChecked(new Set(saved.loaded || []));
      checklistLoaded.current = key;
    } catch { /* estado local corrupto: se reinicia sin tocar servidor */ }
  }, [dateDesde, dateHasta, data?.dateFrom, data?.dateTo]);

  useEffect(() => {
    const key = `phase5-checklists:${dateDesde || data?.dateFrom || 'sin-fecha'}:${dateHasta || data?.dateTo || 'sin-fecha'}`;
    if (checklistLoaded.current !== key) return;
    window.localStorage.setItem(key, JSON.stringify({ shopping: [...shoppingChecked], packed: [...packedChecked], loaded: [...loadedChecked] }));
  }, [shoppingChecked, packedChecked, loadedChecked, dateDesde, dateHasta, data?.dateFrom, data?.dateTo]);

  useEffect(() => {
    if (data?.routeOrders) setRouteMode(data.routeOrders.length > 25 ? 'split' : 'compact');
  }, [data?.routeOrders?.length]);

  const generateShadow = async () => {
    const date = dateDesde || data?.dateFrom;
    if (!date) return;
    setShadowLoading(true);
    try {
      const res = await fetch('/api/admin/ruta/shadow', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dateFrom: dateDesde || data?.dateFrom, dateTo: dateHasta || data?.dateTo }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'No se pudo generar la ruta sombra');
      setShadowResult(json);
    } catch (err: any) {
      setError(err.message || 'Error generando ruta sombra');
    } finally { setShadowLoading(false); }
  };

  const calculateOptimizedRoute = async (requestedMode: 'compact' | 'split' = routeMode) => {
    if (!data?.routeOrders?.length) return;
    setRouteMode(requestedMode);
    setOptimizedLoading(true);
    setOptimizedError('');
    setPreRouteApproved(false);
    const dates: string[] = [];
    const start = new Date(`${dateDesde || data.dateFrom}T00:00:00Z`);
    const end = new Date(`${dateHasta || data.dateTo}T00:00:00Z`);
    for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
      if ([2, 5].includes(cursor.getUTCDay())) dates.push(cursor.toISOString().slice(0, 10));
    }
    const stops = data.routeOrders.filter(order => !order.isCancelled && order.coverage === 'dentro' && order.latitude != null && order.longitude != null).map(order => ({
      id: order.id, orderNumber: order.orderNumber, source: order.source, customerName: order.customerName, customerPhone: order.customerPhone, deliveryAddress: order.deliveryAddress,
      deliveryDate: order.deliveryDate || dateDesde || data.dateFrom, latitude: order.latitude, longitude: order.longitude, coverage: order.coverage, items: order.items, subtotal: order.subtotal, totalAmount: order.totalAmount, status: order.isDelivered ? 'delivered' : 'pending', paymentStatus: order.paymentStatus, paymentMethod: order.paymentMethod, deliveryNotes: order.notes, notes: order.notes, shippingFee: order.shippingFee, discount: order.discount, couponCode: order.couponCode,
    }));
    const cacheKey = `admin-route-optimization:v4:${JSON.stringify({ mode: requestedMode, dates, departureTime, northDriver, southDriver, maxStops: 0, stops: stops.map(stop => [stop.id, stop.latitude, stop.longitude, stop.deliveryDate, stop.items, stop.notes]) })}`;
    try {
      const cached = window.localStorage.getItem(cacheKey);
      if (cached) { setOptimizedResult({ ...JSON.parse(cached), cacheHit: true, routesApiCalls: 0 }); return; }
      const res = await fetch('/api/admin/ruta/optimize', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: requestedMode, dates, departureTime, exportMode: 'unlimited', maxStops: 0, drivers: { norte: northDriver, sur: southDriver }, stops }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'No se pudo calcular la ruta optimizada');
      window.localStorage.setItem(cacheKey, JSON.stringify(json));
      setOptimizedResult(json);
    } catch (err: any) {
      setOptimizedError(err.message || 'Error calculando la ruta optimizada');
    } finally { setOptimizedLoading(false); }
  };

  const approvePreRoute = () => {
    if (!optimizedResult) return;
    const approved = { ...optimizedResult, approvedAt: new Date().toISOString() };
    window.localStorage.setItem(`admin-route-approved:${optimizedResult.dateFrom}:${optimizedResult.dateTo}`, JSON.stringify(approved));
    setOptimizedResult(approved);
    setPreRouteApproved(true);
  };

  const markDriverDelivered = async (stop: any) => {
    const confirmed = window.confirm(`¿Marcar como entregado el pedido de ${stop.customerName || 'este cliente'}?`);
    if (!confirmed) return false;
    const res = await fetch('/api/admin/ruta', { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'deliver', orderId: stop.id, source: stop.source, confirmDelivery: true }) });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.error || 'No se pudo marcar entregado');
    await fetchRoute();
    return true;
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

  const cancelOrder = async (order: RouteItem) => {
    if (order.isCancelled) return;
    const reason = order.coverage === 'chia' ? 'Chía' : order.coverage === 'fuera' ? (order.coverageReason || 'fuera de zonas') : (order.coverageReason || 'fuera de cobertura');
    const confirmed = window.confirm(`¿Cancelar este pedido? Está fuera de cobertura: ${reason}. El cliente quedará registrado como cancelado por fuera de cobertura.`);
    if (!confirmed) return;
    setError('');
    try {
      const res = await fetch('/api/admin/ruta', { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'cancel', orderId: order.id, source: order.source, reason, confirmCancellation: true }) });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || 'No se pudo cancelar el pedido');
      await fetchRoute();
    } catch (err: any) {
      setError(err.message || 'Error cancelando pedido');
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

  // Generar URL de Google Maps con todas las paradas en orden.
  const gmapsMultiUrl = () => {
    const candidates = (shadowResult?.routes || []).flatMap((route: any) => route.order_ids || []);
    const orderById = new Map<string, RouteItem>((data?.orders || []).map((order: RouteItem) => [order.id, order]));
    const sourceOrders: Array<RouteItem | undefined> = candidates.length ? candidates.map((id: string) => orderById.get(id)) : (data?.routeOrders || data?.orders || []);
    const ordered = sourceOrders.filter((order): order is RouteItem => Boolean(order && !order.isCancelled && order.coverage === 'dentro' && order.latitude != null && order.longitude != null && (selectedOrders.size === 0 || selectedOrders.has(order.id))));
    const originCoordinates = '4.63205,-74.15534';
    return buildGoogleMapsDirectionsUrl(originCoordinates, ordered.map(order => `${order.latitude},${order.longitude}`), originCoordinates);
  };

  const selectAll = () => {
    if (!data) return;
    if (selectedOrders.size === data.orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(data.orders.map(o => o.id)));
    }
  };

  const navigationCoordinates = (latitude: number | null, longitude: number | null) => latitude != null && longitude != null ? `${latitude},${longitude}` : null;
  const wazeUrl = (order: RouteItem) => {
    const coordinates = navigationCoordinates(order.latitude, order.longitude);
    return coordinates ? `https://waze.com/ul?ll=${encodeURIComponent(coordinates)}&navigate=yes` : null;
  };

  const gmapsUrl = (order: RouteItem) => {
    const coordinates = navigationCoordinates(order.latitude, order.longitude);
    return coordinates ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(coordinates)}&travelmode=driving` : null;
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

  const whatsappUrl = (phone: string, address?: string) => buildWhatsAppUrl(phone, address);

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
            <label className="block text-xs text-gray-500 mb-1">Desde</label>
            <input
              type="date"
              value={dateDesde}
              onChange={(e) => setDateDesde(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hasta</label>
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
        <button onClick={() => calculateOptimizedRoute()} disabled={optimizedLoading || !data?.routeOrders?.length} className="px-3 py-1.5 text-sm bg-purple-700 text-white rounded-lg hover:bg-purple-800 disabled:opacity-50">
          {optimizedLoading ? 'Calculando...' : 'Calcular ruta optimizada'}
        </button>

        {/* Botón Ruta completa en Google Maps */}
        {(selectedOrders.size > 0 || (data?.routeOrders?.length || 0) > 0) && (
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
      {shadowResult && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm"><b>Ruta sombra:</b> {shadowResult.counts?.routed || 0} paradas en {shadowResult.counts?.routes || 0} rutas para {shadowResult.dates?.join(', ') || shadowResult.date}. <span className="ml-2 inline-flex flex-wrap gap-2">{(shadowResult.days || []).map((day: any) => <span key={day.date} className="inline-flex gap-2 border-l border-green-300 pl-2"><b>{day.date}</b><a className="underline" href={`/api/admin/ruta/shadow?date=${day.date}&file=route-report.json`} target="_blank">Reporte</a><a className="underline" href={`/api/admin/ruta/shadow?date=${day.date}&file=preview.html`} target="_blank">Preview</a>{(day.routes || []).map((r: any) => <a key={r.file || r.name} className="underline" href={`/api/admin/ruta/shadow?date=${day.date}&file=${encodeURIComponent(r.file || 'ruta-completa.csv')}&download=1`} target="_blank">Descargar {r.name}.csv</a>)}</span>)}</span></div>}
      {optimizedError && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{optimizedError}</div>}
      {data && <section className="mb-4 rounded-xl border border-purple-200 bg-purple-50 p-4"><div className="mb-3 flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-purple-950">Modo de pre-ruta:</span><button type="button" onClick={() => calculateOptimizedRoute('compact')} className={`rounded px-3 py-1.5 text-xs font-semibold ${routeMode === 'compact' ? 'bg-purple-700 text-white' : 'border border-purple-200 bg-white text-purple-900'}`}>Ruta única (compacta, solo yo)</button><button type="button" onClick={() => calculateOptimizedRoute('split')} className={`rounded px-3 py-1.5 text-xs font-semibold ${routeMode === 'split' ? 'bg-purple-700 text-white' : 'border border-purple-200 bg-white text-purple-900'}`}>Dividida Norte/Sur (con ayudante)</button></div><div className="flex flex-wrap items-end gap-3"><div><label className="block text-xs font-semibold text-purple-950">Salida</label><input type="time" value={departureTime} onChange={event => { setDepartureTime(event.target.value); setOptimizedResult(null); }} className="mt-1 rounded border border-purple-200 bg-white px-2 py-1.5 text-sm" /></div><div><label className="block text-xs font-semibold text-purple-950">Conductor Norte</label><input value={northDriver} onChange={event => { setNorthDriver(event.target.value); setOptimizedResult(null); }} className="mt-1 rounded border border-purple-200 bg-white px-2 py-1.5 text-sm" /></div><div><label className="block text-xs font-semibold text-purple-950">Conductor Sur</label><input value={southDriver} onChange={event => { setSouthDriver(event.target.value); setOptimizedResult(null); }} className="mt-1 rounded border border-purple-200 bg-white px-2 py-1.5 text-sm" /></div><button type="button" onClick={() => calculateOptimizedRoute()} disabled={optimizedLoading || !data.routeOrders?.length} className="rounded bg-purple-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{optimizedLoading ? 'Calculando...' : 'Calcular ruta optimizada'}</button></div><p className="mt-2 text-xs text-purple-900">Fase 4 en sombra: propone el orden, no despacha ni envía a Spoke. La salida por defecto es 14:00.</p>{optimizedResult && <div className="mt-3 rounded-lg border border-purple-200 bg-white p-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><div><b>Pre-ruta propuesta:</b> {optimizedResult.totalStops} paradas · {optimizedResult.routeCount} rutas · tiempo total {optimizedResult.durationLabel} · llamadas Routes API: {optimizedResult.routesApiCalls}{optimizedResult.cacheHit ? ' (caché)' : ''}</div>{optimizedResult.suggestedHelper && <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">Sugerir ayudante: más de 25 pedidos</span>}</div><div className="mt-2 text-xs text-gray-700">Criterio: {optimizedResult.balanceCriterion}</div><div className="mt-3 grid gap-3 md:grid-cols-2">{optimizedResult.routes.map((route: any, index: number) => <div key={`${route.date}-${route.group}-${index}`} className="rounded border border-gray-200 p-3"><div className="flex items-center justify-between gap-2"><b>{route.date} · {route.group}</b><span className="text-xs text-gray-600">{route.driver}</span></div><div className="mt-1 text-xs text-gray-600">{route.stops.length} paradas · <b>Actual:</b> {((route.currentDistanceMeters || 0) / 1000).toFixed(1)} km / {Math.round((route.currentDurationSeconds || 0) / 60)} min · <b>Optimizada:</b> {(route.totalDistanceMeters / 1000).toFixed(1)} km / {Math.round(route.totalDurationSeconds / 60)} min</div><div className="mt-2 space-y-1 text-xs">{route.stops.map((stop: any, stopIndex: number) => <div key={stop.id}><b>{stopIndex + 1}. {route.legs?.[stopIndex]?.eta || '--:--'}</b> · {stop.address}</div>)}</div><div className="mt-2 text-[11px] text-gray-500">Orden llegada: {route.originalStops.map((stop: any) => stop.id.slice(-6)).join(' → ')}<br />Orden optimizado: {route.stops.map((stop: any) => stop.id.slice(-6)).join(' → ')}</div>{preRouteApproved && <a download={`spoke-${route.date}-${route.group}.csv`} href={`data:text/csv;charset=utf-8,${encodeURIComponent(route.csv)}`} className="mt-2 inline-block rounded border border-gray-300 px-2 py-1 text-xs text-gray-700">Descargar CSV</a>}</div>)}</div><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={approvePreRoute} disabled={preRouteApproved} className="rounded bg-green-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">{preRouteApproved ? 'Pre-ruta aprobada' : 'Aprobar pre-ruta'}</button>{preRouteApproved && <span className="self-center text-xs font-semibold text-green-800">Aprobada localmente; los CSV se importan manualmente.</span>}</div></div>}</section>}{optimizedResult?.routes?.length ? <DeliveryOperations routes={optimizedResult.routes} tab={operationsTab} setTab={setOperationsTab} shoppingChecked={shoppingChecked} setShoppingChecked={setShoppingChecked} packedChecked={packedChecked} setPackedChecked={setPackedChecked} loadedChecked={loadedChecked} setLoadedChecked={setLoadedChecked} onDelivered={markDriverDelivered} /> : null}

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
                <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => setManualOrder(order)} className="rounded bg-green-700 px-3 py-2 text-sm font-medium text-white">Poner pin manual</button><button type="button" disabled={locationSaving} onClick={() => saveLocation(order, 'whatsapp')} className="rounded border border-green-700 px-3 py-2 text-sm font-medium text-green-800">Marcar para WhatsApp</button>{whatsappUrl(order.customerPhone, order.deliveryAddress) ? <a href={whatsappUrl(order.customerPhone, order.deliveryAddress) || '#'} target="_blank" rel="noopener noreferrer" className="rounded border border-green-700 px-3 py-2 text-sm font-medium text-green-800">Escribir al cliente</a> : <button type="button" disabled className="rounded border border-gray-300 px-3 py-2 text-sm font-medium text-gray-400">Sin teléfono</button>}<button type="button" onClick={() => cancelOrder(order)} className="rounded border border-red-700 px-3 py-2 text-sm font-medium text-red-800">Cancelar pedido</button></div>
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
            Ruta visual — {selectedOrders.size > 0 ? selectedOrders.size : (data.routeOrders || []).length} paradas
          </h3>
          <RouteMap
            orders={(data.routeOrders || data.orders.filter((o: RouteItem) => !o.isCancelled && o.coverage === 'dentro' && o.latitude != null && o.longitude != null))
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
            lineOrderIds={optimizedResult?.routes?.flatMap((r: any) => r.stops?.map((stop: any) => stop.id) || []) || shadowResult?.routes?.flatMap((r: any) => r.order_ids || []) || []}
            dividerLatitude={optimizedResult ? (() => { const north = optimizedResult.routes.filter((r: any) => r.group === 'Norte').flatMap((r: any) => r.stops || []); const south = optimizedResult.routes.filter((r: any) => r.group === 'Sur').flatMap((r: any) => r.stops || []); return north.length && south.length ? (Math.max(...north.map((s: any) => s.latitude)) + Math.min(...south.map((s: any) => s.latitude))) / 2 : null; })() : null}
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
                wazeUrl={wazeUrl(order)}
                gmapsUrl={gmapsUrl(order)}
                whatsappUrl={whatsappUrl(order.customerPhone, order.deliveryAddress)}
                onCancel={() => cancelOrder(order)}
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
                  wazeUrl={wazeUrl(order)}
                  gmapsUrl={gmapsUrl(order)}
                  whatsappUrl={whatsappUrl(order.customerPhone, order.deliveryAddress)}
                onCancel={() => cancelOrder(order)}
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
  onCancel,
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
  wazeUrl: string | null;
  gmapsUrl: string | null;
  whatsappUrl: string | null;
  onCancel: () => void;
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
            href={wazeUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
            title="Abrir en Waze"
          >
            <Navigation className="w-3 h-3" />
            Waze
          </a>
          <a
            href={gmapsUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
            title="Abrir en Google Maps"
          >
            <MapPin className="w-3 h-3" />
            Maps
          </a>
          {whatsappUrl ? <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
            title="Abrir WhatsApp con mensaje preparado"
          >
            <Phone className="w-3 h-3" />
            Escribir al cliente
          </a> : <button type="button" disabled className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-50 text-gray-400 rounded" title="No hay teléfono usable"><Phone className="w-3 h-3" />Sin teléfono</button>}
          {!order.isCancelled && <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onCancel(); }}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
            title="Cancelar pedido por fuera de cobertura"
          >
            <XCircle className="w-3 h-3" />
            Cancelar pedido
          </button>}
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

function DeliveryOperations({ routes, tab, setTab, shoppingChecked, setShoppingChecked, packedChecked, setPackedChecked, loadedChecked, setLoadedChecked, onDelivered }: any) {
  const stops = routes.flatMap((route: any) => (route.stops || []).map((stop: any, index: number) => ({ ...stop, route, routeIndex: index })));
  const [driverIndex, setDriverIndex] = useState(0);
  const [notDelivered, setNotDelivered] = useState<Set<string>>(new Set());
  const shopping = Array.from(stops.reduce((map: Map<string, any>, stop: any) => {
    (stop.items || []).forEach((item: any) => {
      const components = item.comboComponents?.length ? item.comboComponents.map((component: any) => ({ ...component, quantity: Number(component.quantity || 1) * Number(item.quantity || 1) })) : [item];
      components.forEach((sourceItem: any) => {
      const variant = sourceItem.variantName || sourceItem.variant_name || sourceItem.variant_value || sourceItem.variant || '';
      const weight = sourceItem.weight !== null && sourceItem.weight !== undefined && sourceItem.weight !== '' ? `${sourceItem.weight}${sourceItem.unit || 'g'}` : '';
      const key = `${sourceItem.name}|${variant}|${weight}`;
      const current = map.get(key) || { key, name: sourceItem.name, variant, weight, quantity: 0, review: !item.comboComponents?.length && /combo/i.test(sourceItem.name) };
      current.quantity += Number(sourceItem.quantity || 1);
      map.set(key, current);
      });
    });
    return map;
  }, new Map()).values());
  const toggle = (setter: any, key: string) => setter((previous: Set<string>) => { const next = new Set(previous); next.has(key) ? next.delete(key) : next.add(key); return next; });
  const tabs = [['compras', '1. Lista de compras'], ['empaque', '2. Empaque · canastas Castilla'], ['carga', '3. Carga inversa'], ['conductor', '4. Pantalla del conductor']];
  const summary = (stop: any) => formatOperationalSummary({ id: stop.id, order_number: stop.orderNumber, customer_name: stop.customerName, customer_phone: stop.customerPhone, delivery_address: stop.address, status: stop.status, payment_status: stop.paymentStatus, payment_method: stop.paymentMethod, delivery_date: stop.deliveryDate, delivery_notes: stop.deliveryNotes, notes: stop.notes, subtotal: stop.subtotal, total_amount: stop.totalAmount, shipping_fee: stop.shippingFee, discount: stop.discount, coupon_code: stop.couponCode, items: stop.items });
  return <section className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4" data-testid="delivery-operations">
    <div className="mb-3 flex flex-wrap gap-2">{tabs.map(([key, label]) => <button key={key} type="button" onClick={() => setTab(key)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === key ? 'bg-emerald-700 text-white' : 'bg-white text-emerald-900 border border-emerald-200'}`}>{label}</button>)}</div>
    {tab === 'compras' && <div><div className="mb-3 flex items-center justify-between"><div><h2 className="text-lg font-bold text-emerald-950">Lista de compras consolidada</h2><p className="text-xs text-emerald-800">{shopping.length} productos consolidados de {stops.length} paradas.</p></div><span className="text-sm font-semibold text-emerald-900">{shopping.filter((item: any) => shoppingChecked.has(item.key)).length}/{shopping.length} listos</span></div><div className="grid gap-2 sm:grid-cols-2">{shopping.map((item: any) => <label key={item.key} className={`flex cursor-pointer items-center gap-3 rounded-xl border bg-white p-3 ${shoppingChecked.has(item.key) ? 'border-emerald-500 bg-emerald-100' : 'border-emerald-100'}`}><input type="checkbox" checked={shoppingChecked.has(item.key)} onChange={() => toggle(setShoppingChecked, item.key)} className="h-5 w-5" /><span><b>{item.quantity} × {item.name}</b>{item.review && <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs font-bold text-red-800">REVISAR</span>}{(item.variant || item.weight) && <span className="block text-xs text-gray-600">{[item.variant, item.weight].filter(Boolean).join(' · ')}</span>}</span></label>)}</div></div>}
    {tab === 'empaque' && <div><h2 className="mb-1 text-lg font-bold text-emerald-950">Empaque por pedido</h2><p className="mb-3 text-xs text-emerald-800">Una canasta Castilla por cliente. Marca cada ítem cuando quede empacado. Las canastas están en orden de entrega.</p><div className="grid gap-3 md:grid-cols-2">{stops.map((stop: any, stopIndex: number) => <article key={stop.id} className="rounded-xl border border-emerald-100 bg-white p-4"><div><b>Entrega {stopIndex + 1} · Canasta Castilla · {stop.customerName || 'Cliente'}</b><div className="text-xs text-gray-600">{stop.address}</div></div><div className="mt-3 space-y-2">{(stop.items || []).map((item: any, itemIndex: number) => { const key = `${stop.id}:item:${itemIndex}`; const combo = item.comboComponents?.length ? ` · Contenido: ${item.comboComponents.map((component: any) => `${component.quantity * Number(item.quantity || 1)} x ${component.name}${component.variant ? ` (${component.variant})` : ''}`).join('; ')}` : ''; return <label key={key} className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2 ${packedChecked.has(key) ? 'border-emerald-500 bg-emerald-100' : 'border-gray-100 bg-gray-50'}`}><input type="checkbox" checked={packedChecked.has(key)} onChange={() => toggle(setPackedChecked, key)} className="mt-1 h-5 w-5" /><span className="text-sm"><b>{item.quantity || 1} x {item.name}</b>{item.variantName && <span className="block text-xs text-gray-600">Variante: {item.variantName}</span>}{item.weight !== null && item.weight !== undefined && item.weight !== '' && <span className="block text-xs text-gray-600">Peso: {item.weight}{item.unit || 'g'}</span>}{combo && <span className="block text-xs text-indigo-700">Combo{combo}</span>}</span></label>; })}</div><div className="mt-3 text-xs text-gray-500">{(stop.items || []).filter((_: any, itemIndex: number) => packedChecked.has(`${stop.id}:item:${itemIndex}`)).length}/{(stop.items || []).length} ítems empacados</div></article>)}</div></div>}
    {tab === 'carga' && <div><h2 className="mb-1 text-lg font-bold text-emerald-950">Orden de carga inversa</h2><p className="mb-3 text-xs text-emerald-800">Lo último que se entrega se carga primero. Lo primero que se entrega queda junto a la puerta.</p><div className="space-y-2">{routes.flatMap((route: any) => [...(route.stops || [])].reverse().map((stop: any, index: number) => <label key={`${route.date}-${route.group}-${stop.id}`} className={`flex items-center gap-3 rounded-xl border bg-white p-3 ${loadedChecked.has(stop.id) ? 'border-emerald-500 bg-emerald-100' : 'border-emerald-100'}`}><span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 font-bold text-white">{index + 1}</span><input type="checkbox" checked={loadedChecked.has(stop.id)} onChange={() => toggle(setLoadedChecked, stop.id)} className="h-5 w-5" /><span><b>Cargar primero #{index + 1} · {stop.customerName || 'Cliente'}</b><span className="block text-xs text-gray-600">{stop.address} · Se entrega en posición {route.stops.length - index}</span></span></label>))}</div></div>}
    {tab === 'conductor' && <div><h2 className="mb-1 text-lg font-bold text-emerald-950">Pantalla del conductor</h2><p className="mb-3 text-xs text-emerald-800">Orden de entrega. El detalle es el mismo resumen operativo usado en Pedidos y en el CSV.</p><div className="mb-3 flex items-center justify-between gap-2"><button type="button" disabled={driverIndex === 0} onClick={() => setDriverIndex(index => Math.max(0, index - 1))} className="rounded-lg border bg-white px-3 py-2 text-sm disabled:opacity-40">Anterior</button><span className="text-sm font-bold text-emerald-900">{driverIndex + 1} / {stops.length}</span><button type="button" disabled={driverIndex >= stops.length - 1} onClick={() => setDriverIndex(index => Math.min(stops.length - 1, index + 1))} className="rounded-lg border bg-white px-3 py-2 text-sm disabled:opacity-40">Siguiente</button></div>{(() => { const stop = stops[driverIndex]; if (!stop) return null; const coordinates = `${stop.latitude},${stop.longitude}`; const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(coordinates)}&travelmode=driving`; const waze = `https://waze.com/ul?ll=${encodeURIComponent(coordinates)}&navigate=yes`; const phone = String(stop.customerPhone || '').replace(/\D/g, ''); const delivered = Boolean(stop.status === 'delivered' || stop.status === 'entregado'); return <article className="rounded-2xl border-2 border-emerald-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-sm font-bold text-emerald-700">PARADA {driverIndex + 1} · ETA {stop.route.legs?.[stop.routeIndex]?.eta || '--:--'}</div><h3 className="mt-1 text-3xl font-black text-gray-950">{stop.customerName || 'Cliente'}</h3><p className="mt-1 text-lg text-gray-800">{stop.address}</p><p className="mt-2 text-base font-semibold text-gray-700">Teléfono: {stop.customerPhone || 'Por confirmar'}</p></div><div className="rounded-xl bg-amber-100 px-4 py-3 text-right"><div className="text-xs font-semibold text-amber-900">COBRAR</div><div className="text-2xl font-black text-amber-950">${Number(stop.totalAmount || 0).toLocaleString('es-CO')}</div><div className="mt-1 text-xs font-semibold text-amber-900">{stop.paymentStatus || 'Por confirmar'}{stop.paymentMethod ? ` · ${stop.paymentMethod}` : ''}</div></div></div><div className="mt-4 flex flex-wrap gap-2"><a href={phone ? `tel:${phone}` : '#'} className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white">Llamar</a><a href={phone ? `https://wa.me/${phone.startsWith('57') ? phone : `57${phone}`}` : '#'} target="_blank" rel="noreferrer" className="rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white">WhatsApp</a><a href={mapUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white">Google Maps</a><a href={waze} target="_blank" rel="noreferrer" className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white">Waze</a></div><pre className="mt-4 whitespace-pre-wrap rounded-xl bg-gray-950 p-4 text-sm leading-6 text-white">{summary(stop)}</pre><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={delivered} onClick={async () => { try { await onDelivered(stop); } catch { /* parent reports route error */ } }} className="rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">Entregado</button><button type="button" onClick={() => { const reason = window.prompt('Motivo local de no entrega:', 'Pendiente de registrar'); if (reason) setNotDelivered(previous => new Set(previous).add(stop.id)); }} className={`rounded-lg border px-4 py-3 text-sm font-bold ${notDelivered.has(stop.id) ? 'border-red-700 bg-red-100 text-red-800' : 'border-red-700 text-red-800'}`}>{notDelivered.has(stop.id) ? 'No entregado · anotado localmente' : 'No entregado'}</button></div></article>; })()}</div>}
  </section>;
}
