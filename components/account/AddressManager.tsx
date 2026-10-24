'use client';

import { useEffect, useState } from 'react';
import { supabase, type Address } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { StructuredAddressForm } from '@/components/checkout/StructuredAddressForm';
import { decodeAddressMetadata, emptyStructuredAddress, type StructuredAddress } from '@/lib/address-structured';
import { savePwaAddress } from '@/lib/address-service';

function addressValue(address: Address): Partial<StructuredAddress> {
  const meta = decodeAddressMetadata(address.additional_info);
  return { ...emptyStructuredAddress, city: address.city, deliveryNotes: meta.deliveryNotes || '', neighborhood: meta.neighborhood || '', latitude: meta.latitude ?? null, longitude: meta.longitude ?? null, pinConfidence: meta.pinConfidence || 'sin_pin' };
}

export function AddressManager() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAddresses = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error: loadError } = await supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false }).order('created_at', { ascending: false });
    if (loadError) setError('Error al cargar las direcciones'); else setAddresses(data || []);
    setLoading(false);
  };
  useEffect(() => { loadAddresses(); }, [user]);

  const handleSave = async (value: StructuredAddress) => {
    if (!user) return;
    setSaving(true); setError(null);
    try {
      await savePwaAddress({ ...value, id: editing?.id, label: editing?.label || 'Casa', fullName: editing?.full_name || user.email || 'Cliente', phone: editing?.phone || '', userId: user.id });
      await loadAddresses(); setShowForm(false); setEditing(null);
    } catch (e) { console.error(e); setError('Error al guardar la dirección'); } finally { setSaving(false); }
  };
  const deleteAddress = async (id: string) => { if (!confirm('¿Eliminar esta dirección?')) return; const { error: e } = await supabase.from('addresses').delete().eq('id', id); if (e) setError('Error al eliminar la dirección'); else loadAddresses(); };
  const setDefault = async (id: string) => { const { error: e } = await supabase.from('addresses').update({ is_default: true }).eq('id', id); if (e) setError('Error al establecer dirección por defecto'); else loadAddresses(); };

  if (loading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  return <div className="space-y-6">
    <div className="flex justify-between items-center"><div><h2 className="text-2xl font-bold">Mis Direcciones</h2><p className="text-muted-foreground">Dirección estructurada, barrio y pin opcional</p></div>{!showForm && <Button onClick={() => { setEditing(null); setShowForm(true); }}>+ Nueva Dirección</Button>}</div>
    {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}
    {showForm && <Card><CardHeader><CardTitle>{editing ? 'Editar Dirección' : 'Nueva Dirección'}</CardTitle><CardDescription>El barrio es obligatorio. El pin es opcional en esta fase.</CardDescription></CardHeader><CardContent><StructuredAddressForm initialValue={editing ? addressValue(editing) : emptyStructuredAddress} submitLabel={editing ? 'Actualizar' : 'Guardar'} saving={saving} onSubmit={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} /></CardContent></Card>}
    {!showForm && addresses.length === 0 && <Card><CardContent className="p-8 text-center"><p className="text-muted-foreground mb-4">No tienes direcciones guardadas</p><Button onClick={() => setShowForm(true)}>Agregar Dirección</Button></CardContent></Card>}
    {!showForm && addresses.length > 0 && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{addresses.map((address) => { const meta = decodeAddressMetadata(address.additional_info); return <Card key={address.id} className={address.is_default ? 'border-primary border-2' : ''}><CardHeader><CardTitle className="text-lg">{address.label}{address.is_default && <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">Por defecto</span>}</CardTitle><CardDescription>{address.full_name}</CardDescription></CardHeader><CardContent className="space-y-2"><p className="text-sm">{address.street_address}</p><p className="text-sm">Barrio: {meta.neighborhood || 'Pendiente de estructura'}</p><p className="text-sm">{address.city}, {address.state}</p><p className="text-sm font-medium">Tel: {address.phone}</p>{meta.deliveryNotes && <p className="text-sm text-muted-foreground italic">Notas: {meta.deliveryNotes}</p>}<div className="flex gap-2 pt-4"><Button size="sm" variant="outline" onClick={() => { setEditing(address); setShowForm(true); }}>Editar</Button>{!address.is_default && <Button size="sm" variant="outline" onClick={() => setDefault(address.id)}>Predeterminada</Button>}<Button size="sm" variant="destructive" onClick={() => deleteAddress(address.id)}>Eliminar</Button></div></CardContent></Card>; })}</div>}
  </div>;
}
