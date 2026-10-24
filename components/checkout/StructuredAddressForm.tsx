'use client';

import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { emptyStructuredAddress, type StructuredAddress } from '@/lib/address-structured';

interface Props {
  initialValue?: Partial<StructuredAddress>;
  submitLabel?: string;
  saving?: boolean;
  onSubmit: (value: StructuredAddress) => void | Promise<void>;
  onCancel?: () => void;
}

export function StructuredAddressForm({ initialValue, submitLabel = 'Guardar dirección', saving = false, onSubmit, onCancel }: Props) {
  const [value, setValue] = useState<StructuredAddress>({ ...emptyStructuredAddress, ...initialValue });
  const [error, setError] = useState('');

  useEffect(() => setValue({ ...emptyStructuredAddress, ...initialValue }), [initialValue]);

  const update = (patch: Partial<StructuredAddress>) => setValue((current) => ({ ...current, ...patch }));
  const useLocation = () => {
    if (!navigator.geolocation) { setError('Este dispositivo no permite usar la ubicación. Puedes continuar sin pin.'); return; }
    navigator.geolocation.getCurrentPosition(
      (position) => { update({ latitude: position.coords.latitude, longitude: position.coords.longitude, pinConfidence: 'pin' }); setError(''); },
      () => setError('No pudimos obtener tu ubicación. Puedes continuar sin pin.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!value.viaNumber.trim() || !value.neighborhood.trim()) {
      setError('Completa el número de vía y el barrio para continuar.');
      return;
    }
    await onSubmit({ ...value, neighborhood: value.neighborhood.trim(), viaNumber: value.viaNumber.trim() });
  };

  return <form onSubmit={submit} className="space-y-4" data-testid="structured-address-form">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div><Label htmlFor="address-via-type">Tipo de vía *</Label><select id="address-via-type" className="w-full h-10 rounded-md border px-3" value={value.viaType} onChange={(e) => update({ viaType: e.target.value })}><option>Calle</option><option>Carrera</option><option>Diagonal</option><option>Transversal</option><option>Avenida</option><option>Autopista</option></select></div>
      <div><Label htmlFor="address-via-number">Número de vía *</Label><Input id="address-via-number" value={value.viaNumber} onChange={(e) => update({ viaNumber: e.target.value })} placeholder="123 # 45-67" required /></div>
    </div>
    <div><Label htmlFor="address-complement">Complemento</Label><Input id="address-complement" value={value.complement} onChange={(e) => update({ complement: e.target.value })} placeholder="Torre 2, apto 304, interior..." /></div>
    <div><Label htmlFor="address-neighborhood">Barrio *</Label><Input id="address-neighborhood" value={value.neighborhood} onChange={(e) => update({ neighborhood: e.target.value })} placeholder="Escribe o selecciona el barrio" list="address-neighborhood-suggestions" required /><datalist id="address-neighborhood-suggestions"><option value="Ciudad Salitre" /><option value="Chapinero" /><option value="Kennedy" /><option value="Suba" /><option value="Teusaquillo" /><option value="Usaquén" /></datalist></div>
    <div><Label htmlFor="address-city">Ciudad *</Label><select id="address-city" className="w-full h-10 rounded-md border px-3" value={value.city} onChange={(e) => update({ city: e.target.value })} required><option>Bogotá</option><option>Soacha</option><option>Chía</option></select></div>
    <div className="rounded-lg border border-dashed p-3 space-y-2"><div className="flex items-center gap-2 font-medium"><MapPin className="h-4 w-4" /> Pin de entrega <span className="text-xs text-muted-foreground">(opcional en esta fase)</span></div><div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={useLocation}>Usar mi ubicación</Button>{value.pinConfidence === 'pin' && <span className="text-sm text-green-700 self-center">Pin guardado</span>}</div><div className="grid grid-cols-2 gap-2"><Input aria-label="Latitud" type="number" step="any" placeholder="Latitud" value={value.latitude ?? ''} onChange={(e) => update({ latitude: e.target.value ? Number(e.target.value) : null, pinConfidence: e.target.value ? 'pin' : 'sin_pin' })} /><Input aria-label="Longitud" type="number" step="any" placeholder="Longitud" value={value.longitude ?? ''} onChange={(e) => update({ longitude: e.target.value ? Number(e.target.value) : null, pinConfidence: e.target.value ? 'pin' : 'sin_pin' })} /></div><p className="text-xs text-muted-foreground">Si no marcas pin, el pedido queda como sin_pin y no se bloquea.</p></div>
    <div><Label htmlFor="address-delivery-notes">Notas de entrega</Label><Textarea id="address-delivery-notes" value={value.deliveryNotes} onChange={(e) => update({ deliveryNotes: e.target.value })} placeholder="Portería, referencia, horario..." rows={3} /></div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <div className="flex gap-2"><Button type="submit" disabled={saving}>{saving ? 'Guardando...' : submitLabel}</Button>{onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}</div>
  </form>;
}
