'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { StructuredAddress } from '@/lib/address-structured';

interface Suggestion {
  id?: string | null;
  text: string;
  latitude?: number | null;
  longitude?: number | null;
  city?: string;
  neighborhood?: string;
  confidence?: 'alta' | 'media' | 'baja';
}

interface Props {
  value: StructuredAddress;
  onChange: (value: StructuredAddress) => void;
}

export function AddressAutocompleteField({ value, onChange }: Props) {
  const [query, setQuery] = useState(value.rawAddress || '');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [confirmMap, setConfirmMap] = useState(false);
  const token = useMemo(() => crypto.randomUUID?.() || `${Date.now()}`, []);

  useEffect(() => {
    setQuery(value.rawAddress || '');
  }, [value.rawAddress]);

  useEffect(() => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/pwa/geocode?mode=autocomplete&q=${encodeURIComponent(query)}&sessionToken=${encodeURIComponent(token)}`);
        setSuggestions((await response.json()).suggestions || []);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query, token]);

  const commitTypedAddress = () => {
    const text = query.trim();
    setSuggestions([]);
    setConfirmMap(false);
    onChange({
      ...value,
      rawAddress: text,
      viaNumber: text,
      latitude: null,
      longitude: null,
      pinConfidence: 'sin_pin',
    });
  };

  const clearAddress = () => {
    setQuery('');
    setSuggestions([]);
    setConfirmMap(false);
    onChange({
      ...value,
      rawAddress: '',
      viaNumber: '',
      latitude: null,
      longitude: null,
      pinConfidence: 'sin_pin',
    });
  };

  const apply = (suggestion: Suggestion) => {
    setQuery(suggestion.text);
    setSuggestions([]);
    onChange({
      ...value,
      rawAddress: suggestion.text,
      viaNumber: suggestion.text,
      neighborhood: suggestion.neighborhood || '',
      city: suggestion.city || value.city,
      latitude: suggestion.latitude ?? null,
      longitude: suggestion.longitude ?? null,
      pinConfidence: suggestion.confidence === 'alta' && suggestion.latitude != null ? 'pin' : 'sin_pin',
    });
    setConfirmMap(suggestion.confidence === 'alta' && suggestion.latitude != null);
  };

  const mapSrc = value.latitude != null && value.longitude != null
    ? `https://www.openstreetmap.org/export/embed.html?layer=mapnik&marker=${value.latitude}%2C${value.longitude}&bbox=${value.longitude - 0.01}%2C${value.latitude - 0.01}%2C${value.longitude + 0.01}%2C${value.latitude + 0.01}`
    : '';

  return (
    <div className="relative space-y-2">
      <Label htmlFor="guest-address-single">Dirección de entrega *</Label>
      <div className="relative">
        <Input
          id="guest-address-single"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setConfirmMap(false);
            onChange({ ...value, rawAddress: event.target.value, viaNumber: event.target.value, latitude: null, longitude: null, pinConfidence: 'sin_pin' });
          }}
          onBlur={commitTypedAddress}
          placeholder="Escribe o pega tu dirección completa"
          autoComplete="street-address"
          required
          className={query ? 'pr-20' : 'pr-10'}
        />
        {query && (
          <button type="button" onClick={clearAddress} aria-label="Borrar dirección completa" title="Borrar dirección completa" className="absolute right-8 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
        <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
      </div>

      {query.trim().length >= 3 && (suggestions.length > 0 || query.trim().length >= 3) && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-white shadow-lg">
          {suggestions.map((suggestion, index) => (
            <button key={`${suggestion.id || suggestion.text}-${index}`} type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100" onMouseDown={(event) => event.preventDefault()} onClick={() => apply(suggestion)}>
              {suggestion.text}
            </button>
          ))}
          <button type="button" className="flex w-full items-center gap-2 border-t px-3 py-2 text-left text-sm font-medium text-green-700 hover:bg-green-50" onMouseDown={(event) => event.preventDefault()} onClick={commitTypedAddress}>
            <ArrowRight className="h-4 w-4 shrink-0" />
            <span className="truncate">Usar esta dirección: {query.trim()}</span>
          </button>
        </div>
      )}

      {confirmMap && mapSrc && (
        <div className="rounded border p-2">
          <p className="mb-2 text-sm font-medium">¿Es aquí?</p>
          <iframe title="Vista previa del pin" src={mapSrc} className="h-32 w-full rounded" loading="lazy" />
          <div className="mt-2 flex gap-2">
            <Button type="button" size="sm" onClick={() => { setConfirmMap(false); onChange({ ...value, pinConfidence: 'pin' }); }}>Confirmar pin</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { setConfirmMap(false); onChange({ ...value, latitude: null, longitude: null, pinConfidence: 'sin_pin' }); }}>Sin pin</Button>
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground">Si aparece una sugerencia, puedes elegirla. Si no aparece, pulsa “Usar esta dirección” o continúa con el texto que escribiste. Sin pin no se bloquea el pedido.</p>
    </div>
  );
}
