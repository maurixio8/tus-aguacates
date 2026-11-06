'use client';

import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';

const STYLE = 'https://tiles.openfreemap.org/styles/liberty';
type Suggestion = { id?: string; text: string; latitude?: number; longitude?: number; city?: string; neighborhood?: string; confidence?: string; provider?: string };

export default function ManualLocationPicker({ onConfirm, initialAddress = '' }: { onConfirm: (latitude: number, longitude: number) => void; initialAddress?: string }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [point, setPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [query, setQuery] = useState(initialAddress);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [searchError, setSearchError] = useState('');

  const setMapPoint = (selected: { latitude: number; longitude: number }, label = '') => {
    setPoint(selected);
    setSelectedLabel(label);
    const map = mapRef.current;
    if (map) {
      map.flyTo({ center: [selected.longitude, selected.latitude], zoom: 17, essential: true });
      markerRef.current?.remove();
      markerRef.current = new maplibregl.Marker({ color: '#15803d' }).setLngLat([selected.longitude, selected.latitude]).addTo(map);
    }
  };

  useEffect(() => {
    if (!container.current) return;
    maplibregl.setWorkerUrl('https://unpkg.com/maplibre-gl@6.15.0/dist/maplibre-gl-worker.mjs');
    const map = new maplibregl.Map({ container: container.current, style: STYLE, center: [-74.1, 4.65], zoom: 11 });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.on('click', event => setMapPoint({ latitude: event.lngLat.lat, longitude: event.lngLat.lng }, 'Pin puesto manualmente'));
    mapRef.current = map;
    return () => { markerRef.current?.remove(); map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 3) { setSuggestions([]); setSearchError(''); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true); setSearchError('');
      try {
        const response = await fetch(`/api/pwa/geocode?mode=autocomplete&q=${encodeURIComponent(value)}`, { signal: controller.signal, cache: 'no-store' });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error || 'No se pudo buscar la dirección');
        setSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
      } catch (error: any) {
        if (error?.name !== 'AbortError') { setSuggestions([]); setSearchError(error?.message || 'No se pudo buscar la dirección'); }
      } finally { setSearching(false); }
    }, 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  const chooseSuggestion = async (suggestion: Suggestion) => {
    setSearching(true); setSearchError('');
    try {
      let result = suggestion;
      if ((result.latitude == null || result.longitude == null) && result.id) {
        const response = await fetch(`/api/pwa/geocode?mode=details&placeId=${encodeURIComponent(result.id)}`, { cache: 'no-store' });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.suggestions?.[0]) throw new Error('No se pudo obtener el punto exacto');
        result = data.suggestions[0];
      }
      if (result.latitude == null || result.longitude == null) throw new Error('La dirección no tiene coordenadas confiables');
      setQuery(result.text || suggestion.text);
      setSuggestions([]);
      setMapPoint({ latitude: Number(result.latitude), longitude: Number(result.longitude) }, result.text || suggestion.text);
    } catch (error: any) { setSearchError(error?.message || 'No se pudo seleccionar la dirección'); }
    finally { setSearching(false); }
  };

  return <div className="space-y-3">
    <div className="relative">
      <label className="mb-1 block text-sm font-medium text-gray-800">Buscar dirección o barrio</label>
      <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Ej. Calle 34 Sur #87-68, Floralia, Bogotá" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100" />
      {searching && <p className="mt-1 text-xs text-gray-500">Buscando coincidencias…</p>}
      {suggestions.length > 0 && <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
        {suggestions.map((suggestion, index) => <button key={`${suggestion.id || suggestion.text}-${index}`} type="button" onClick={() => void chooseSuggestion(suggestion)} className="block w-full border-b border-gray-100 px-3 py-2 text-left text-sm hover:bg-green-50">
          <span className="block font-medium text-gray-900">{suggestion.text}</span><span className="text-xs text-gray-500">{suggestion.neighborhood || suggestion.city || suggestion.provider || 'Resultado de dirección'}</span>
        </button>)}
      </div>}
      {searchError && <p className="mt-1 text-xs text-red-700">{searchError}</p>}
    </div>
    <p className="text-xs text-gray-600">Selecciona una coincidencia para centrar el mapa. Si no aparece, también puedes tocar el punto manualmente.</p>
    <div ref={container} className="w-full rounded-lg border border-gray-300" style={{ height: 300 }} />
    <div className="flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
      <span>{point ? `${selectedLabel ? `${selectedLabel} · ` : ''}${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}` : 'Busca una dirección o toca el mapa para poner el pin'}</span>
      <button type="button" disabled={!point} onClick={() => point && onConfirm(point.latitude, point.longitude)} className="rounded bg-green-700 px-3 py-1.5 text-white disabled:opacity-40">Confirmar pin</button>
    </div>
  </div>;
}
