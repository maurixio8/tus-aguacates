'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Loader2, MapPin } from 'lucide-react';

interface RouteMapOrder {
  id: string;
  customerName: string;
  deliveryAddress: string;
  orderNumber: string;
}

interface RouteMapProps {
  orders: RouteMapOrder[];
  origin: string;
}

export default function RouteMap({ orders, origin }: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const Lref = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  // Inicializar mapa — Bogotá completo desde el vamos
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    (async () => {
      try {
        const L = (await import('leaflet')).default;

        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        const map = L.map(mapContainer.current!, {
          zoomControl: true,
          scrollWheelZoom: true,
        });

        // Mapa simple CartoDB Positron — carga rápido, colores suaves
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OSM &copy; CARTO',
          maxZoom: 19,
          subdomains: 'abcd',
        }).addTo(map);

        // Mostrar Bogotá completo de una vez
        map.fitBounds([
          [4.45, -74.25], // SO
          [4.85, -73.95], // NE
        ]);

        mapInstance.current = map;
        Lref.current = L;
        setStatus('');
      } catch (e) {
        console.error('Error mapa:', e);
        setStatus('Error al cargar el mapa');
      }
    })();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Auto-geocodificar cuando cambien los pedidos
  useEffect(() => {
    if (!mapInstance.current || orders.length === 0) return;
    geocodeAndPlot();
  }, [orders, origin]);

  const geocodeAndPlot = useCallback(async () => {
    const L = Lref.current;
    const map = mapInstance.current;
    if (!L || !map) return;

    // Limpiar marcadores viejos
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    setLoading(true);
    setStatus('Ubicando direcciones...');

    const points: { lat: number; lng: number; order: RouteMapOrder; label: string }[] = [];

    // 1. Geocodificar origen
    if (origin?.trim()) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(origin + ', Bogotá, Colombia')}&format=json&limit=1`,
          { headers: { 'User-Agent': 'TusAguacates-RouteApp/1.0' } }
        );
        const data = await res.json();
        if (data?.length > 0) {
          points.push({
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
            order: { id: 'origin', customerName: 'Salida', deliveryAddress: origin, orderNumber: '' },
            label: '🏠',
          });
        }
      } catch (e) {
        console.warn('Origen no geocodificado:', e);
      }
    }

    // 2. Geocodificar pedidos
    for (let i = 0; i < orders.length; i++) {
      const o = orders[i];
      const addr = (o.deliveryAddress + ', Bogotá, Colombia').replace(/\?/g, '').trim();
      if (!addr || addr === ', Bogotá, Colombia') continue;

      try {
        await new Promise(r => setTimeout(r, 300));
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1`,
          { headers: { 'User-Agent': 'TusAguacates-RouteApp/1.0' } }
        );
        const data = await res.json();
        if (data?.length > 0) {
          points.push({
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
            order: o,
            label: `${i + 1}`,
          });
        }
      } catch (e) {
        console.warn(`Error #${i}:`, e);
      }
    }

    // 3. Dibujar marcadores
    if (points.length === 0) {
      setLoading(false);
      setStatus('No se pudieron ubicar direcciones');
      return;
    }

    const bounds = L.latLngBounds([]);
    const latlngs: [number, number][] = [];

    points.forEach((p) => {
      const isOrigin = p.order.id === 'origin';
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          background:${isOrigin ? '#3b82f6' : '#16a34a'};
          color:#fff;
          width:26px;height:26px;
          border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font-size:12px;font-weight:600;
          border:2px solid #fff;
        ">${isOrigin ? '🏠' : p.label}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker([p.lat, p.lng], { icon })
        .addTo(map)
        .bindPopup(
          `<b>${isOrigin ? 'Salida' : `#${p.label} ${p.order.customerName}`}</b><br>${p.order.deliveryAddress}`
        );

      markersRef.current.push(marker);
      bounds.extend([p.lat, p.lng]);
      latlngs.push([p.lat, p.lng]);
    });

    // 4. Línea de ruta
    if (latlngs.length >= 2) {
      polylineRef.current = L.polyline(latlngs, {
        color: '#2563eb',
        weight: 2.5,
        opacity: 0.5,
      }).addTo(map);
    }

    // 5. Ajustar vista a las paradas
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }

    setLoading(false);
    const stopCount = points.length - (origin?.trim() ? 1 : 0);
    setStatus(`📍 ${stopCount} parada${stopCount !== 1 ? 's' : ''} en mapa`);
  }, [orders, origin]);

  return (
    <div className="space-y-2">
      {status && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          {loading && <Loader2 className="w-3 h-3 animate-spin" />}
          {status}
        </div>
      )}

      <div
        ref={mapContainer}
        className="w-full rounded-lg border border-gray-200 overflow-hidden bg-gray-100"
        style={{ height: '420px' }}
      >
        {!mapInstance.current && (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Cargando mapa...
          </div>
        )}
      </div>
    </div>
  );
}
