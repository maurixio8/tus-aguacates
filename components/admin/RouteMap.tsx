'use client';

import { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';

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
  const mapRef = useRef<any>(null);
  const Lref = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const geocodedKey = useRef(''); // evita re-geocodificar si no cambian los pedidos
  const initDone = useRef(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Cargando mapa...');

  // ───────────────────── 1. Inicializar mapa (solo una vez) ─────────────────────
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    let cancel = false;

    (async () => {
      try {
        const L = (await import('leaflet')).default;
        if (cancel) return;

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

        // CartoDB Positron — tiles ligeros que cargan rápido
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OSM &copy; CARTO',
          maxZoom: 19,
          subdomains: 'abcd',
        }).addTo(map);

        // Bogotá completo desde el inicio
        map.fitBounds([
          [4.45, -74.25],
          [4.85, -73.95],
        ]);

        mapRef.current = map;
        Lref.current = L;
        initDone.current = true;
        setLoading(false);

        // Disparar geocoding ahora que el mapa está listo
        geocode(orders, origin);
      } catch (e) {
        console.error('Error mapa:', e);
        setStatus('Error al cargar el mapa');
        setLoading(false);
      }
    })();

    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ───────────────────── 2. Re-geocodificar si cambian los pedidos ─────────────────────
  useEffect(() => {
    if (!initDone.current) return;
    geocode(orders, origin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, origin]);

  // ───────────────────── 3. Geocoding ─────────────────────
  async function geocode(orderList: RouteMapOrder[], ori: string) {
    const L = Lref.current;
    const map = mapRef.current;
    if (!L || !map || orderList.length === 0) return;

    // Evitar duplicados: solo geocodificar si cambió la lista
    const key = orderList.map(o => o.id).join(',') + '|' + ori;
    if (geocodedKey.current === key) return;
    geocodedKey.current = key;

    // Limpiar marcadores anteriores
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    setStatus('Ubicando direcciones...');

    const points: { lat: number; lng: number; order: RouteMapOrder; label: string }[] = [];

    // ---- Origen ----
    if (ori?.trim()) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(ori + ', Bogotá, Colombia')}&format=json&limit=1`
        );
        const data = await res.json();
        if (data?.length > 0) {
          points.push({
            lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon),
            order: { id: 'origin', customerName: 'Salida', deliveryAddress: ori, orderNumber: '' },
            label: '🏠',
          });
        }
      } catch (e) {
        console.warn('Origen no ubicado:', e);
      }
    }

    // ---- Pedidos (1 request/segundo para no saturar Nominatim) ----
    for (let i = 0; i < orderList.length; i++) {
      const o = orderList[i];
      const addr = (o.deliveryAddress + ', Bogotá, Colombia').replace(/\?/g, '').trim();
      if (!addr || addr === ', Bogotá, Colombia') continue;

      try {
        await new Promise(r => setTimeout(r, 300));
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1`
        );
        const data = await res.json();
        if (data?.length > 0) {
          points.push({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), order: o, label: `${i + 1}` });
        }
      } catch (e) {
        console.warn(`Error #${i}:`, e);
      }
    }

    // ---- Dibujar en el mapa ----
    if (points.length === 0) {
      setStatus('No se pudieron ubicar las direcciones');
      return;
    }

    const bounds = L.latLngBounds([]);
    const latlngs: [number, number][] = [];

    for (const p of points) {
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

      markersRef.current.push(
        L.marker([p.lat, p.lng], { icon })
          .addTo(map)
          .bindPopup(`<b>${isOrigin ? 'Salida' : `#${p.label} ${p.order.customerName}`}</b><br>${p.order.deliveryAddress}`)
      );
      bounds.extend([p.lat, p.lng]);
      latlngs.push([p.lat, p.lng]);
    }

    // Línea de ruta
    if (latlngs.length >= 2) {
      polylineRef.current = L.polyline(latlngs, {
        color: '#2563eb', weight: 2.5, opacity: 0.5,
      }).addTo(map);
    }

    // Ajustar vista
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }

    const stopCount = points.length - (ori?.trim() ? 1 : 0);
    setStatus(`📍 ${stopCount} parada${stopCount !== 1 ? 's' : ''} en mapa`);
  }

  // ───────────────────── 4. Render ─────────────────────
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
        {loading && (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Cargando mapa...
          </div>
        )}
      </div>
    </div>
  );
}
