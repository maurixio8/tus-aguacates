'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { StructuredAddress } from '@/lib/address-structured';

interface Suggestion { id?: string | null; text: string; latitude?: number | null; longitude?: number | null; city?: string; neighborhood?: string; confidence?: 'alta' | 'media' | 'baja'; }
interface Props { value: StructuredAddress; onChange: (value: StructuredAddress) => void; }

export function AddressAutocompleteField({ value, onChange }: Props) {
  const [query, setQuery] = useState(value.rawAddress || '');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [confirmMap, setConfirmMap] = useState(false);
  const token = useMemo(() => crypto.randomUUID?.() || `${Date.now()}`, []);
  useEffect(() => { setQuery(value.rawAddress || ''); }, [value.rawAddress]);
  useEffect(() => { if (query.trim().length < 3) { setSuggestions([]); return; } const timer = window.setTimeout(async () => { try { const r = await fetch(`/api/pwa/geocode?mode=autocomplete&q=${encodeURIComponent(query)}&sessionToken=${encodeURIComponent(token)}`); setSuggestions((await r.json()).suggestions || []); } catch { setSuggestions([]); } }, 250); return () => window.clearTimeout(timer); }, [query, token]);
  const apply = (s: Suggestion) => { setQuery(s.text); setSuggestions([]); onChange({ ...value, rawAddress: s.text, viaNumber: s.text, neighborhood: s.neighborhood || '', city: s.city || value.city, latitude: s.latitude ?? null, longitude: s.longitude ?? null, pinConfidence: s.confidence === 'alta' && s.latitude != null ? 'pin' : 'sin_pin' }); setConfirmMap(s.confidence === 'alta' && s.latitude != null); };
  const usePasted = async () => { if (query.trim().length < 5) return; try { const r = await fetch(`/api/pwa/geocode?mode=geocode&q=${encodeURIComponent(query)}`); const s = (await r.json()).suggestions?.[0] as Suggestion | undefined; if (!s) { onChange({ ...value, rawAddress: query.trim(), viaNumber: query.trim(), latitude: null, longitude: null, pinConfidence: 'sin_pin' }); return; } apply(s); } catch { onChange({ ...value, rawAddress: query.trim(), viaNumber: query.trim(), latitude: null, longitude: null, pinConfidence: 'sin_pin' }); } };
  const mapSrc = value.latitude != null && value.longitude != null ? `https://www.openstreetmap.org/export/embed.html?layer=mapnik&marker=${value.latitude}%2C${value.longitude}&bbox=${value.longitude - 0.01}%2C${value.latitude - 0.01}%2C${value.longitude + 0.01}%2C${value.latitude + 0.01}` : '';
  return <div className="relative space-y-2"><Label htmlFor="guest-address-single">Dirección de entrega *</Label><div className="relative"><Input id="guest-address-single" value={query} onChange={(e) => { setQuery(e.target.value); setConfirmMap(false); onChange({ ...value, rawAddress: e.target.value, viaNumber: e.target.value, latitude: null, longitude: null, pinConfidence: 'sin_pin' }); }} onBlur={usePasted} placeholder="Escribe o pega tu dirección completa" autoComplete="street-address" required /><Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" /></div>{suggestions.length > 0 && <div className="absolute z-20 mt-1 w-full rounded-md border bg-white shadow-lg">{suggestions.map((s, i) => <button key={`${s.id || s.text}-${i}`} type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100" onMouseDown={(e) => e.preventDefault()} onClick={() => apply(s)}>{s.text}</button>)}</div>}{confirmMap && mapSrc && <div className="rounded border p-2"><p className="text-sm font-medium mb-2">¿Es aquí?</p><iframe title="Vista previa del pin" src={mapSrc} className="h-32 w-full rounded" loading="lazy" /><div className="flex gap-2 mt-2"><Button type="button" size="sm" onClick={() => { setConfirmMap(false); onChange({ ...value, pinConfidence: 'pin' }); }}>Confirmar pin</Button><Button type="button" size="sm" variant="outline" onClick={() => { setConfirmMap(false); onChange({ ...value, latitude: null, longitude: null, pinConfidence: 'sin_pin' }); }}>Sin pin</Button></div></div>}<p className="text-xs text-muted-foreground">El barrio solo se pide si la dirección queda ambigua. Sin pin no se bloquea el pedido.</p></div>;
}
