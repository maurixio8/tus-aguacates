'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Loader2, MapPin, Navigation } from 'lucide-react';

interface RouteMapOrder {
  id: string;
  customerName: string;
  deliveryAddress: string;
  orderNumber: string;
}

interface GeocodedStop {
  lat: number;
  lng: number;
  order: RouteMapOrder;
  label: string;
}

interface RouteMapProps {
  orders: RouteMapOrder[];
  origin: string;
  onMapReady?: () => void;
}

export default function RouteMap({ orders, origin, onMapReady }: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [geocoded, setGeocoded] = useState<GeocodedStop[]>([]);
  const [progress, setProgress] = useState(0);
  const [mapReady, setMapReady] = useState(false);

  // Geocodificar direcciones usando Nominatim
  const geocodeAddresses = useCallback(async () => {
    if (orders.length === 0) return;
    
    setLoading(true);
    setStatus('Geocodificando direcciones...');
    const results: GeocodedStop[] = [];
    const total = orders.length + (origin ? 1 : 0);
    let done = 0;

    // Geocodificar origen primero
    if (origin) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(origin + ', Bogotá, Colombia')}&format=json&limit=1`,
          { headers: { 'User-Agent': 'TusAguacates-RouteApp/1.0' } }
        );
        const data = await res.json();
        if (data && data.length > 0) {
          results.push({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), order: { id: 'origin', customerName: '📍 Salida', deliveryAddress: origin, orderNumber: '' }, label: 'Salida' });
        }
      } catch (e) {
        console.warn('Error geocoding origin:', e);
      }
      done++;
      setProgress(Math.round((done / total) * 100));
    }

    // Geocodificar cada pedido con rate limiting (1 req/seg)
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const address = (order.deliveryAddress + ', Bogotá, Colombia').replace(/\?/g, '').trim();
      if (!address || address === ', Bogotá, Colombia') {
        done++;
        setProgress(Math.round((done / total) * 100));
        continue;
      }

      try {
        await new Promise(r => setTimeout(r, 300)); // Rate limit
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
          { headers: { 'User-Agent': 'TusAguacates-RouteApp/1.0' } }
        );
        const data = await res.json();
        if (data && data.length > 0) {
          results.push({
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
            order,
            label: `${i + 1}`,
          });
        }
      } catch (e) {
        console.warn(`Error geocoding #${i}:`, e);
      }

      done++;
      setProgress(Math.round((done / total) * 100));
    }

    setGeocoded(results);
    setLoading(false);
    setStatus(results.length > 0 ? `${results.length} direcciones ubicadas en el mapa` : 'No se pudieron ubicar direcciones');
  }, [orders, origin]);

  // Inicializar Leaflet map
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default;
        
        // Corregir iconos por defecto de Leaflet (se rompen en webpack)
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        const map = L.map(mapContainer.current!, {
          zoomControl: true,
          scrollWheelZoom: true,
        }).setView([4.711, -74.072], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        mapInstance.current = map;
        leafletRef.current = L;
        setMapReady(true);
      } catch (e) {
        console.error('Error initializing map:', e);
        setStatus('Error al cargar el mapa');
      }
    };

    initMap();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Actualizar marcadores cuando cambien las coordenadas geocodificadas
  useEffect(() => {
    if (!mapInstance.current || geocoded.length === 0) return;
    const map = mapInstance.current;
    const L = leafletRef.current;
    if (!L) return;

    // Limpiar marcadores anteriores
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    // Crear marcadores numerados con iconos personalizados
    const bounds = L.latLngBounds([]);
    const latlngs: [number, number][] = [];

    geocoded.forEach((stop, index) => {
      const isOrigin = stop.order.id === 'origin';
      const color = isOrigin ? '#2563eb' : '#16a34a';
      const size = isOrigin ? 14 : 12;

      // Crear icono numerado
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          background: ${color};
          color: white;
          width: ${size * 2}px;
          height: ${size * 2}px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${size}px;
          font-weight: bold;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ${isOrigin ? 'width: 32px; height: 32px; font-size: 16px;' : ''}
        ">${isOrigin ? '🏠' : stop.label}</div>`,
        iconSize: [size * 2, size * 2],
        iconAnchor: [size, size],
        popupAnchor: [0, -size],
      });

      const marker = L.marker([stop.lat, stop.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <b>${isOrigin ? '🏠 Salida' : `#${stop.label} - ${stop.order.customerName}`}</b><br>
          ${stop.order.deliveryAddress}<br>
          <small>${stop.order.orderNumber ? stop.order.orderNumber.slice(-15) : ''}</small>
        `);

      markersRef.current.push(marker);
      bounds.extend([stop.lat, stop.lng]);
      latlngs.push([stop.lat, stop.lng]);
    });

    // Dibujar línea de ruta
    if (latlngs.length >= 2) {
      polylineRef.current = L.polyline(latlngs, {
        color: '#16a34a',
        weight: 3,
        opacity: 0.7,
        dashArray: '10, 10',
      }).addTo(map);
    }

    // Ajustar vista para mostrar todos los marcadores
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }

    if (onMapReady) onMapReady();
  }, [geocoded, onMapReady]);

  return (
    <div className="space-y-3">
      {/* Botón para geocodificar */}
      <div className="flex items-center gap-2">
        <button
          onClick={geocodeAddresses}
          disabled={loading || orders.length === 0}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            loading || orders.length === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4" />
          )}
          {loading ? `Geocodificando... ${progress}%` : geocoded.length > 0 ? 'Actualizar mapa' : 'Generar mapa de ruta'}
        </button>

        {loading && (
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {/* Status */}
      {status && !loading && (
        <p className="text-xs text-gray-500">{status}</p>
      )}

      {/* Mapa */}
      <div
        ref={mapContainer}
        className="w-full rounded-xl border border-gray-200 overflow-hidden"
        style={{ height: geocoded.length > 0 ? '450px' : loading ? '200px' : '120px' }}
      >
        {!mapReady && !loading && (
          <div className="flex items-center justify-center h-full bg-gray-50 text-gray-400 text-sm">
            <MapPin className="w-4 h-4 mr-2" />
            Presiona "Generar mapa de ruta"
          </div>
        )}
        {loading && (
          <div className="flex items-center justify-center h-full bg-gray-50 text-gray-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Geocodificando direcciones...
          </div>
        )}
      </div>

      {/* Leyenda */}
      {geocoded.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-600 inline-block" /> Parada
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> Salida
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-0.5 bg-green-600 inline-block opacity-50" style={{ borderTop: '2px dashed #16a34a' }} /> Ruta
          </span>
          <span className="text-gray-400">({geocoded.length - (origin ? 1 : 0)} paradas)</span>
        </div>
      )}
    </div>
  );
}
