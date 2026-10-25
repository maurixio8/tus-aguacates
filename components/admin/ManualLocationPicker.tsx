'use client';

import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';

const STYLE = 'https://tiles.openfreemap.org/styles/liberty';

export default function ManualLocationPicker({ onConfirm }: { onConfirm: (latitude: number, longitude: number) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [point, setPoint] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (!container.current) return;
    maplibregl.setWorkerUrl('https://unpkg.com/maplibre-gl@6.15.0/dist/maplibre-gl-worker.mjs');
    const map = new maplibregl.Map({ container: container.current, style: STYLE, center: [-74.1, 4.65], zoom: 11 });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.on('click', event => {
      const selected = { latitude: event.lngLat.lat, longitude: event.lngLat.lng };
      setPoint(selected);
      markerRef.current?.remove();
      markerRef.current = new maplibregl.Marker({ color: '#15803d' }).setLngLat([selected.longitude, selected.latitude]).addTo(map);
    });
    mapRef.current = map;
    return () => { markerRef.current?.remove(); map.remove(); mapRef.current = null; };
  }, []);

  return <div className="space-y-2"><div ref={container} className="w-full rounded-lg border border-gray-300" style={{ height: 300 }} /><div className="flex items-center justify-between gap-2 text-xs"><span>{point ? `${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}` : 'Toca el mapa para poner el pin'}</span><button type="button" disabled={!point} onClick={() => point && onConfirm(point.latitude, point.longitude)} className="rounded bg-green-700 px-3 py-1.5 text-white disabled:opacity-40">Confirmar pin</button></div></div>;
}
