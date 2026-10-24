'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { emptyStructuredAddress, formatStructuredAddress, type StructuredAddress } from '@/lib/address-structured';

interface Suggestion { id?: string | null; text: string; latitude?: number | null; longitude?: number | null; city?: string; neighborhood?: string; confidence?: 'alta' | 'media' | 'baja'; provider?: string; }
interface Props { initialValue?: Partial<StructuredAddress>; submitLabel?: string; saving?: boolean; onSubmit: (value: StructuredAddress) => void | Promise<void>; onCancel?: () => void; }

export function StructuredAddressForm({ initialValue, submitLabel = 'Guardar dirección', saving = false, onSubmit, onCancel }: Props) {
  const [value, setValue] = useState<StructuredAddress>({ ...emptyStructuredAddress, ...initialValue });
  const [query, setQuery] = useState(initialValue?.rawAddress || formatStructuredAddress({ ...emptyStructuredAddress, ...initialValue }));
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [error, setError] = useState('');
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [confirmed, setConfirmed] = useState(Boolean(initialValue?.latitude && initialValue?.longitude));
  const sessionToken = useMemo(() => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, []);

  useEffect(() => {
    const next = { ...emptyStructuredAddress, ...initialValue };
    setValue(next); setQuery(next.rawAddress || formatStructuredAddress(next)); setConfirmed(Boolean(next.latitude && next.longitude));
  }, [initialValue]);

  useEffect(() => {
    if (query.trim().length < 3) { setSuggestions([]); return; }
    const timer = window.setTimeout(async () => {
      setLoadingSuggestions(true);
      try { const r = await fetch(`/api/pwa/geocode?mode=autocomplete&q=${encodeURIComponent(query)}&sessionToken=${encodeURIComponent(sessionToken)}`); const data = await r.json(); setSuggestions(data.suggestions || []); } catch { setSuggestions([]); } finally { setLoadingSuggestions(false); }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query, sessionToken]);

  const applySuggestion = (s: Suggestion) => {
    setQuery(s.text); setSuggestions([]); setError('');
    const next = { ...value, rawAddress: s.text, viaNumber: s.text, neighborhood: s.neighborhood || '', city: s.city || value.city, latitude: s.latitude ?? null, longitude: s.longitude ?? null, pinConfidence: s.confidence === 'alta' && s.latitude != null ? 'pin' as const : 'sin_pin' as const };
    setValue(next); setConfirmed(next.pinConfidence === 'pin'); setNeedsConfirm(next.pinConfidence === 'pin');
  };

  const geocodePasted = async () => {
    if (query.trim().length < 5) return null;
    try { const r = await fetch(`/api/pwa/geocode?mode=geocode&q=${encodeURIComponent(query)}`); const data = await r.json(); const first = data.suggestions?.[0] as Suggestion | undefined; if (!first) return null; const next = { ...value, rawAddress: query.trim(), viaNumber: query.trim(), neighborhood: first.neighborhood || '', city: first.city || value.city, latitude: first.latitude ?? null, longitude: first.longitude ?? null, pinConfidence: first.confidence === 'alta' && first.latitude != null ? 'pin' : 'sin_pin' } as StructuredAddress; setValue(next); setConfirmed(false); return next; } catch { return null; }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    if (!query.trim()) { setError('Escribe una dirección para continuar.'); return; }
    let next = value;
    if (!value.latitude || !value.longitude) next = (await geocodePasted()) || { ...value, rawAddress: query.trim(), viaNumber: query.trim(), pinConfidence: 'sin_pin' };
    if (next.pinConfidence === 'pin' && !confirmed) { setNeedsConfirm(true); return; }
    await onSubmit({ ...next, rawAddress: query.trim(), viaNumber: next.viaNumber || query.trim() });
  };

  const mapSrc = value.latitude != null && value.longitude != null ? `https://www.openstreetmap.org/export/embed.html?layer=mapnik&marker=${value.latitude}%2C${value.longitude}&bbox=${value.longitude - 0.01}%2C${value.latitude - 0.01}%2C${value.longitude + 0.01}%2C${value.latitude + 0.01}` : '';
  return <form onSubmit={submit} className="space-y-4" data-testid="structured-address-form">
    <div className="relative"><Label htmlFor="address-single">Dirección de entrega *</Label><div className="relative"><Input id="address-single" value={query} onChange={(e) => { setQuery(e.target.value); setValue({ ...value, rawAddress: e.target.value, latitude: null, longitude: null, pinConfidence: 'sin_pin' }); setConfirmed(false); setNeedsConfirm(false); }} placeholder="Escribe o pega tu dirección completa" autoComplete="street-address" required /><Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" /></div>{loadingSuggestions && <p className="text-xs text-muted-foreground mt-1">Buscando direcciones...</p>}{suggestions.length > 0 && <div className="absolute z-20 mt-1 w-full rounded-md border bg-white shadow-lg">{suggestions.map((s, i) => <button key={`${s.id || s.text}-${i}`} type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100" onClick={() => applySuggestion(s)}>{s.text}</button>)}</div>}</div>
    {needsConfirm && value.latitude != null && value.longitude != null && <div className="space-y-2 rounded-lg border p-3"><p className="font-medium">¿Es aquí?</p><iframe title="Vista previa del pin" src={mapSrc} className="h-40 w-full rounded border" loading="lazy" /><div className="flex gap-2"><Button type="button" size="sm" onClick={() => { setConfirmed(true); setNeedsConfirm(false); }}>Sí, confirmar pin</Button><Button type="button" size="sm" variant="outline" onClick={() => { setValue({ ...value, latitude: null, longitude: null, pinConfidence: 'sin_pin' }); setNeedsConfirm(false); setConfirmed(false); }}>Continuar sin pin</Button></div></div>}
    <p className="text-xs text-muted-foreground">Puedes elegir una sugerencia o pegar la dirección. Si no encontramos una ubicación confiable, el pedido queda por confirmar y no se bloquea.</p>
    <div><Label htmlFor="address-delivery-notes">Notas de entrega</Label><Textarea id="address-delivery-notes" value={value.deliveryNotes} onChange={(e) => setValue({ ...value, deliveryNotes: e.target.value })} placeholder="Portería, referencia, horario..." rows={3} /></div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <div className="flex gap-2"><Button type="submit" disabled={saving}>{saving ? 'Guardando...' : submitLabel}</Button>{onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}</div>
  </form>;
}
