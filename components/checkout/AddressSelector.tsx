'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Address } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';

interface AddressSelectorProps {
  onSelect: (address: Address) => void;
  selectedAddressId?: string;
}

export function AddressSelector({ onSelect, selectedAddressId }: AddressSelectorProps) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newAddress, setNewAddress] = useState({
    label: '',
    full_name: '',
    phone: '',
    street_address: '',
    city: 'Bogotá',
    state: 'Cundinamarca',
    postal_code: '',
    additional_info: '',
    is_default: false,
  });

  useEffect(() => {
    if (user) {
      loadAddresses();
    }
  }, [user]);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user!.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const addressList = data || [];
      setAddresses(addressList);

      // Auto-select default address or first address
      if (!selectedAddressId && addressList.length > 0) {
        const defaultAddress = addressList.find(a => a.is_default) || addressList[0];
        onSelect(defaultAddress);
      }
    } catch (err) {
      console.error('Error loading addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data, error } = await supabase
        .from('addresses')
        .insert({
          user_id: user!.id,
          ...newAddress,
          postal_code: newAddress.postal_code || null,
          additional_info: newAddress.additional_info || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Add to list and select
      await loadAddresses();
      onSelect(data);
      setShowNewForm(false);

      // Reset form
      setNewAddress({
        label: '',
        full_name: '',
        phone: '',
        street_address: '',
        city: 'Bogotá',
        state: 'Cundinamarca',
        postal_code: '',
        additional_info: '',
        is_default: false,
      });
    } catch (err) {
      console.error('Error saving address:', err);
      alert('Error al guardar la dirección');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Dirección de Entrega</h3>
        {addresses.length > 0 && !showNewForm && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowNewForm(true)}
          >
            + Nueva Dirección
          </Button>
        )}
      </div>

      {showNewForm ? (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSaveNewAddress} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-label">Etiqueta *</Label>
                  <Input
                    id="new-label"
                    placeholder="Casa, Trabajo..."
                    value={newAddress.label}
                    onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="new-full_name">Nombre Completo *</Label>
                  <Input
                    id="new-full_name"
                    placeholder="Quien recibe"
                    value={newAddress.full_name}
                    onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="new-phone">Teléfono *</Label>
                  <Input
                    id="new-phone"
                    type="tel"
                    placeholder="3001234567"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="new-city">Ciudad *</Label>
                  <select
                    id="new-city"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    required
                  >
                    <option value="Bogotá">Bogotá</option>
                    <option value="Soacha">Soacha</option>
                    <option value="Chía">Chía</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="new-street_address">Dirección Completa *</Label>
                <Input
                  id="new-street_address"
                  placeholder="Calle 123 #45-67"
                  value={newAddress.street_address}
                  onChange={(e) => setNewAddress({ ...newAddress, street_address: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="new-additional_info">Referencias</Label>
                <Textarea
                  id="new-additional_info"
                  placeholder="Ej: Casa blanca, portón negro"
                  value={newAddress.additional_info}
                  onChange={(e) => setNewAddress({ ...newAddress, additional_info: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="new-is_default"
                  checked={newAddress.is_default}
                  onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="new-is_default" className="cursor-pointer text-sm">
                  Guardar como dirección por defecto
                </Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar y Usar'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : addresses.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              No tienes direcciones guardadas
            </p>
            <Button onClick={() => setShowNewForm(true)}>
              Agregar Dirección
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <Card
              key={address.id}
              className={`cursor-pointer transition-all ${
                selectedAddressId === address.id
                  ? 'border-primary border-2 bg-primary/5'
                  : 'hover:border-gray-400'
              }`}
              onClick={() => onSelect(address)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="address"
                    checked={selectedAddressId === address.id}
                    onChange={() => onSelect(address)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{address.label}</h4>
                      {address.is_default && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                          Por defecto
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{address.full_name}</p>
                    <p className="text-sm">{address.street_address}</p>
                    <p className="text-sm">{address.city}, {address.state}</p>
                    <p className="text-sm">Tel: {address.phone}</p>
                    {address.additional_info && (
                      <p className="text-sm text-muted-foreground italic mt-1">
                        {address.additional_info}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
