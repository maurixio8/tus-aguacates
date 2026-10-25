'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef } from 'react';
import zones from '@/config/zonas-entrega.json';

export interface RouteMapOrder {
  id: string;
  customerName: string;
  deliveryAddress: string;
  orderNumber: string;
  latitude: number | null;
  longitude: number | null;
  coordinateSource: string;
  coverage: string;
}

interface RouteMapProps { orders: RouteMapOrder[]; lineOrderIds?: string[]; origin: { lat: number; lng: number; address: string }; }

const COLORS: Record<string, string> = { dentro: '#15803d', por_confirmar: '#d97706', chia: '#7c3aed', fuera: '#b91c1c' };

export default function RouteMap({ orders, lineOrderIds = [], origin }: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!mapContainer.current || mapRef.current) return;
      const L = (await import('leaflet')).default;
      if (cancelled) return;
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({ iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png', iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png' });
      const map = L.map(mapContainer.current!, { zoomControl: true, scrollWheelZoom: true });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OSM &copy; CARTO', maxZoom: 19, subdomains: 'abcd' }).addTo(map);
      L.geoJSON(zones as any, { style: (feature: any) => ({ color: feature?.properties?.tipo === 'exclusion' ? '#b91c1c' : '#15803d', fillOpacity: 0.16, weight: 2 }) }).addTo(map);
      mapRef.current = map;
      draw(map, L, orders, lineOrderIds, origin);
    })();
    return () => { cancelled = true; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  useEffect(() => { if (mapRef.current) import('leaflet').then(({ default: L }) => draw(mapRef.current, L, orders, lineOrderIds, origin)); }, [orders, lineOrderIds, origin]);

  function draw(map: any, L: any, list: RouteMapOrder[], routeIds: string[], start: { lat: number; lng: number; address: string }) {
    layersRef.current.forEach(layer => map.removeLayer(layer)); layersRef.current = [];
    const bounds = L.latLngBounds([[start.lat, start.lng]]);
    const routePoints: [number, number][] = [[start.lat, start.lng]];
    const routeMap = new Map(list.map(o => [o.id, o]));
    const ordered = routeIds.map(id => routeMap.get(id)).filter((o): o is RouteMapOrder => Boolean(o && o.latitude != null && o.longitude != null));
    ordered.forEach(o => routePoints.push([o.latitude!, o.longitude!]));
    routePoints.push([start.lat, start.lng]);
    const routeLayer = routeIds.length > 0 && ordered.length > 0 ? L.polyline(routePoints, { color: '#2563eb', weight: 3, opacity: 0.72, dashArray: '8 5' }).addTo(map) : null;
    if (routeLayer) layersRef.current.push(routeLayer);
    const originLayer = L.marker([start.lat, start.lng]).addTo(map).bindPopup(`<b>Salida y llegada</b><br>${start.address}`); layersRef.current.push(originLayer); bounds.extend([start.lat, start.lng]);
    list.forEach((o, index) => {
      if (o.latitude == null || o.longitude == null) return;
      const color = COLORS[o.coverage] || '#6b7280';
      const icon = L.divIcon({ className: '', html: `<div style="background:${color};color:white;width:27px;height:27px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid white">${index + 1}</div>`, iconSize: [27, 27], iconAnchor: [13, 13] });
      const marker = L.marker([o.latitude, o.longitude], { icon }).addTo(map).bindPopup(`<b>${o.customerName}</b><br>${o.deliveryAddress || 'Sin dirección'}<br>Estado: ${o.coverage}<br>Coordenadas: ${o.coordinateSource}`);
      layersRef.current.push(marker); bounds.extend([o.latitude, o.longitude]);
    });
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 });
  }

  return <div className="space-y-2"><div className="text-xs text-gray-500">{lineOrderIds.length ? 'Línea azul: orden de ruta shadow (Spoke optimiza el orden al importar).' : 'Sin ruta shadow generada: se muestran todos los pedidos con coordenadas; la línea no representa una ruta optimizada.'}</div><div ref={mapContainer} className="w-full rounded-lg border border-gray-200 overflow-hidden bg-gray-100" style={{ height: '460px' }} /></div>;
}
