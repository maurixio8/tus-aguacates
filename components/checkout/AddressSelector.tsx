'use client';

import { useEffect, useState } from 'react';
import { supabase, type Address } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { StructuredAddressForm } from './StructuredAddressForm';
import { decodeAddressMetadata, emptyStructuredAddress, type StructuredAddress } from '@/lib/address-structured';
import { savePwaAddress } from '@/lib/address-service';

interface Props { onSelect: (address: Address) => void; selectedAddressId?: string; }

export function AddressSelector({ onSelect, selectedAddressId }: Props) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [identity, setIdentity] = useState({ label: 'Casa', fullName: '', phone: '' });

  const load = async () => { if (!user) return; setLoading(true); const { data, error: e } = await supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false }).order('created_at', { ascending: false }); if (e) setError('Error al cargar las direcciones'); else { setAddresses(data || []); if (!selectedAddressId && data?.[0]) onSelect(data[0]); } setLoading(false); };
  useEffect(() => { load(); }, [user]);

  const save = async (value: StructuredAddress) => {
    if (!identity.fullName.trim() || !/^3\d{9}$/.test(identity.phone.replace(/\D/g, ''))) { setError('Completa nombre y un teléfono celular válido.'); return; }
    setSaving(true); setError('');
    try { const address = await savePwaAddress({ ...value, label: identity.label, fullName: identity.fullName, phone: identity.phone.replace(/\D/g, ''), userId: user!.id }); onSelect(address); await load(); setShowNew(false); } catch (e) { console.error(e); setError('Error al guardar la dirección'); } finally { setSaving(false); }
  };
  if (loading) return <div className="flex justify-center p-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>;
  return <div className="space-y-4"><div className="flex justify-between items-center"><h3 className="text-lg font-semibold">Dirección de Entrega</h3>{addresses.length > 0 && !showNew && <Button type="button" variant="outline" size="sm" onClick={() => setShowNew(true)}>+ Nueva Dirección</Button>}</div>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}{showNew ? <Card><CardContent className="pt-6 space-y-4"><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><Label htmlFor="new-address-label">Etiqueta *</Label><Input id="new-address-label" value={identity.label} onChange={(e) => setIdentity({ ...identity, label: e.target.value })} required /></div><div><Label htmlFor="new-address-name">Quién recibe *</Label><Input id="new-address-name" value={identity.fullName} onChange={(e) => setIdentity({ ...identity, fullName: e.target.value })} required /></div><div><Label htmlFor="new-address-phone">Teléfono *</Label><Input id="new-address-phone" value={identity.phone} onChange={(e) => setIdentity({ ...identity, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} required /></div></div><StructuredAddressForm initialValue={emptyStructuredAddress} submitLabel="Guardar y usar" saving={saving} onSubmit={save} onCancel={() => setShowNew(false)} /></CardContent></Card> : addresses.length === 0 ? <Card><CardContent className="p-6 text-center"><p className="text-muted-foreground mb-4">No tienes direcciones guardadas</p><Button onClick={() => setShowNew(true)}>Agregar Dirección</Button></CardContent></Card> : <div className="space-y-3">{addresses.map((address) => { const meta = decodeAddressMetadata(address.additional_info); return <Card key={address.id} className={`cursor-pointer transition-all ${selectedAddressId === address.id ? 'border-primary border-2 bg-primary/5' : 'hover:border-gray-400'}`} onClick={() => onSelect(address)}><CardContent className="p-4"><div className="flex items-start gap-3"><input type="radio" name="address" checked={selectedAddressId === address.id} onChange={() => onSelect(address)} className="mt-1" /><div className="flex-1"><div className="flex items-center gap-2 mb-1"><h4 className="font-semibold">{address.label}</h4>{address.is_default && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">Por defecto</span>}</div><p className="text-sm text-muted-foreground">{address.full_name}</p><p className="text-sm">{address.street_address}</p><p className="text-sm">Barrio: {meta.neighborhood || 'Pendiente de estructura'}</p><p className="text-sm">{address.city}, {address.state}</p><p className="text-sm">Tel: {address.phone}</p>{meta.deliveryNotes && <p className="text-sm text-muted-foreground italic mt-1">Notas: {meta.deliveryNotes}</p>}</div></div></CardContent></Card>; })}</div>}</div>;
}
