'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';

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
  dividerLatitude?: number | null;
}

const COLORS: Record<string, string> = { dentro: '#15803d', por_confirmar: '#d97706', chia: '#7c3aed', fuera: '#b91c1c' };
const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

export default function RouteMap({ orders, lineOrderIds = [], origin, dividerLatitude = null }: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const routeLayerReady = useRef(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current || mapError) return;
    try {
      maplibregl.setWorkerUrl('https://unpkg.com/maplibre-gl@6.15.0/dist/maplibre-gl-worker.mjs');
      const map = new maplibregl.Map({ container: mapContainer.current, style: OPENFREEMAP_STYLE, center: [origin.lng, origin.lat], zoom: 11 });
      map.addControl(new maplibregl.NavigationControl(), 'top-right');
      map.on('error', event => {
        const message = String((event as any)?.error?.message || 'No se pudo cargar el mapa');
        if (/WebGL2|GPUInitialization/i.test(message)) setMapError('Este navegador no tiene WebGL2 disponible. La cola y las paradas siguen visibles; abre el mapa en un navegador con aceleración gráfica.');
      });
      map.on('load', () => {
        mapRef.current = map;
        drawData(map, orders, lineOrderIds, origin);
      });
      return () => {
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
        map.remove();
        mapRef.current = null;
      };
    } catch (error: any) {
      const message = String(error?.message || error || 'No se pudo cargar el mapa');
      setMapError(/WebGL2|GPUInitialization/i.test(message) ? 'Este navegador no tiene WebGL2 disponible. La cola y las paradas siguen visibles; abre el mapa en un navegador con aceleración gráfica.' : 'No se pudo cargar el mapa; la cola sigue disponible.');
      return undefined;
    }
    // Initial map owns the first draw; updates are handled by the second effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapError]);

  useEffect(() => {
    if (mapRef.current?.isStyleLoaded()) drawData(mapRef.current, orders, lineOrderIds, origin);
  }, [orders, lineOrderIds, origin, dividerLatitude]);


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

    if (map.getLayer('north-south-divider')) map.removeLayer('north-south-divider');
    if (map.getSource('north-south-divider')) map.removeSource('north-south-divider');
    if (dividerLatitude != null) {
      map.addSource('north-south-divider', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[-74.35, dividerLatitude], [-73.9, dividerLatitude]] } } as any });
      map.addLayer({ id: 'north-south-divider', type: 'line', source: 'north-south-divider', paint: { 'line-color': '#7c3aed', 'line-width': 2, 'line-dasharray': [2, 2] } });
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

  const unresolved = orders.filter(order => order.latitude == null || order.longitude == null);
  const located = orders.length - unresolved.length;

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500">
        {lineOrderIds.length
          ? 'Línea azul: orden de ruta shadow (Spoke optimiza el orden al importar).'
          : `Mapa: ${located} ubicado${located === 1 ? '' : 's'} · ${unresolved.length} pendiente${unresolved.length === 1 ? '' : 's'} de ubicación.`}
      </div>
      {mapError ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p className="font-semibold">Mapa no disponible en este navegador</p><p className="mt-1">{mapError}</p></div> : <div ref={mapContainer} className="w-full rounded-lg border border-gray-200 overflow-hidden bg-gray-100" style={{ height: '460px' }} />}
      {unresolved.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <p className="font-semibold">Pedidos seleccionados sin parada en el mapa</p>
          <p className="mt-1">No tienen coordenadas confirmadas. No se dibuja una ubicación aproximada para evitar enviar al conductor al lugar equivocado.</p>
          <ul className="mt-2 space-y-1">
            {unresolved.map(order => <li key={order.id}><b>{escapeHtml(order.customerName)}</b> — {escapeHtml(order.coordinateSource === 'sin_coordenadas' ? 'sin coordenadas / verificar barrio' : order.coordinateSource)}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character] || character));
}
