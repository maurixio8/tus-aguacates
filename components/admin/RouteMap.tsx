'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
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

interface RouteMapProps {
  orders: RouteMapOrder[];
  lineOrderIds?: string[];
  origin: { lat: number; lng: number; address: string };
}

const COLORS: Record<string, string> = { dentro: '#15803d', por_confirmar: '#d97706', chia: '#7c3aed', fuera: '#b91c1c' };
const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

export default function RouteMap({ orders, lineOrderIds = [], origin }: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const routeLayerReady = useRef(false);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    maplibregl.setWorkerUrl('https://unpkg.com/maplibre-gl@6.15.0/dist/maplibre-gl-worker.mjs');
    const map = new maplibregl.Map({ container: mapContainer.current, style: OPENFREEMAP_STYLE, center: [origin.lng, origin.lat], zoom: 11 });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.on('load', () => {
      mapRef.current = map;
      addZones(map);
      drawData(map, orders, lineOrderIds, origin);
    });
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
    // Initial map owns the first draw; updates are handled by the second effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mapRef.current?.isStyleLoaded()) drawData(mapRef.current, orders, lineOrderIds, origin);
  }, [orders, lineOrderIds, origin]);

  function addZones(map: maplibregl.Map) {
    if (map.getSource('delivery-zones')) return;
    map.addSource('delivery-zones', { type: 'geojson', data: zones as any });
    map.addLayer({ id: 'delivery-zones-fill', type: 'fill', source: 'delivery-zones', paint: { 'fill-color': ['case', ['==', ['get', 'tipo'], 'exclusion'], '#b91c1c', '#15803d'], 'fill-opacity': 0.16 } });
    map.addLayer({ id: 'delivery-zones-line', type: 'line', source: 'delivery-zones', paint: { 'line-color': ['case', ['==', ['get', 'tipo'], 'exclusion'], '#b91c1c', '#15803d'], 'line-width': 2 } });
  }

  function drawData(map: maplibregl.Map, list: RouteMapOrder[], routeIds: string[], start: { lat: number; lng: number; address: string }) {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    if (routeLayerReady.current && map.getLayer('shadow-route-line')) map.removeLayer('shadow-route-line');
    if (routeLayerReady.current && map.getSource('shadow-route')) map.removeSource('shadow-route');
    routeLayerReady.current = false;

    const bounds = new maplibregl.LngLatBounds([start.lng, start.lat], [start.lng, start.lat]);
    const routeMap = new Map(list.map(order => [order.id, order]));
    const ordered = routeIds.map(id => routeMap.get(id)).filter((order): order is RouteMapOrder => Boolean(order && order.latitude != null && order.longitude != null));
    if (ordered.length) {
      const coordinates = [[start.lng, start.lat], ...ordered.map(order => [order.longitude!, order.latitude!]), [start.lng, start.lat]];
      map.addSource('shadow-route', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } } as any });
      map.addLayer({ id: 'shadow-route-line', type: 'line', source: 'shadow-route', paint: { 'line-color': '#2563eb', 'line-width': 3, 'line-opacity': 0.75, 'line-dasharray': [2, 1] } });
      routeLayerReady.current = true;
    }

    const originMarker = document.createElement('div');
    originMarker.textContent = '🏠';
    originMarker.style.cssText = 'background:#2563eb;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 1px 4px #555;font-size:16px';
    markersRef.current.push(new maplibregl.Marker({ element: originMarker }).setLngLat([start.lng, start.lat]).setPopup(new maplibregl.Popup().setHTML(`<b>Salida y llegada</b><br>${escapeHtml(start.address)}`)).addTo(map));

    list.forEach((order, index) => {
      if (order.latitude == null || order.longitude == null) return;
      const color = COLORS[order.coverage] || '#6b7280';
      const markerElement = document.createElement('div');
      markerElement.textContent = String(index + 1);
      markerElement.style.cssText = `background:${color};color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid white;box-shadow:0 1px 4px #555`;
      const popup = new maplibregl.Popup().setHTML(`<b>${escapeHtml(order.customerName)}</b><br>${escapeHtml(order.deliveryAddress || 'Sin dirección')}<br>Estado: ${escapeHtml(order.coverage)}<br>Coordenadas: ${escapeHtml(order.coordinateSource)}`);
      markersRef.current.push(new maplibregl.Marker({ element: markerElement }).setLngLat([order.longitude, order.latitude]).setPopup(popup).addTo(map));
      bounds.extend([order.longitude, order.latitude]);
    });
    map.fitBounds(bounds, { padding: 35, maxZoom: 14, duration: 0 });
  }

  return <div className="space-y-2"><div className="text-xs text-gray-500">{lineOrderIds.length ? 'Línea azul: orden de ruta shadow (Spoke optimiza el orden al importar).' : 'Sin ruta shadow generada: se muestran todos los pedidos con coordenadas; la línea no representa una ruta optimizada.'}</div><div ref={mapContainer} className="w-full rounded-lg border border-gray-200 overflow-hidden bg-gray-100" style={{ height: '460px' }} /></div>;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character] || character));
}
