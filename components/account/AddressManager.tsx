'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Address } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';

interface AddressFormData {
  label: string;
  full_name: string;
  phone: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  additional_info: string;
  is_default: boolean;
}

const initialFormData: AddressFormData = {
  label: '',
  full_name: '',
  phone: '',
  street_address: '',
  city: 'Bogotá',
  state: 'Cundinamarca',
  postal_code: '',
  additional_info: '',
  is_default: false,
};

export function AddressManager() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AddressFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setAddresses(data || []);
    } catch (err: any) {
      console.error('Error loading addresses:', err);
      setError('Error al cargar las direcciones');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (editingId) {
        // Update existing address
        const { error } = await supabase
          .from('addresses')
          .update({
            label: formData.label,
            full_name: formData.full_name,
            phone: formData.phone,
            street_address: formData.street_address,
            city: formData.city,
            state: formData.state,
            postal_code: formData.postal_code || null,
            additional_info: formData.additional_info || null,
            is_default: formData.is_default,
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        // Create new address
        const { error } = await supabase
          .from('addresses')
          .insert({
            user_id: user!.id,
            label: formData.label,
            full_name: formData.full_name,
            phone: formData.phone,
            street_address: formData.street_address,
            city: formData.city,
            state: formData.state,
            postal_code: formData.postal_code || null,
            additional_info: formData.additional_info || null,
            is_default: formData.is_default,
          });

        if (error) throw error;
      }

      // Reload addresses and close form
      await loadAddresses();
      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormData);
    } catch (err: any) {
      console.error('Error saving address:', err);
      setError('Error al guardar la dirección');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (address: Address) => {
    setFormData({
      label: address.label,
      full_name: address.full_name,
      phone: address.phone,
      street_address: address.street_address,
      city: address.city,
      state: address.state,
      postal_code: address.postal_code || '',
      additional_info: address.additional_info || '',
      is_default: address.is_default,
    });
    setEditingId(address.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta dirección?')) return;

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadAddresses();
    } catch (err: any) {
      console.error('Error deleting address:', err);
      setError('Error al eliminar la dirección');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;
      await loadAddresses();
    } catch (err: any) {
      console.error('Error setting default address:', err);
      setError('Error al establecer dirección por defecto');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Mis Direcciones</h2>
          <p className="text-muted-foreground">Administra tus direcciones de entrega</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            + Nueva Dirección
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? 'Editar Dirección' : 'Nueva Dirección'}
            </CardTitle>
            <CardDescription>
              {editingId ? 'Actualiza los datos de tu dirección' : 'Agrega una nueva dirección de entrega'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="label">Etiqueta *</Label>
                  <Input
                    id="label"
                    placeholder="Casa, Trabajo, Oficina..."
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="full_name">Nombre Completo *</Label>
                  <Input
                    id="full_name"
                    placeholder="Nombre de quien recibe"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="3001234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="city">Ciudad *</Label>
                  <select
                    id="city"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  >
                    <option value="Bogotá">Bogotá</option>
                    <option value="Soacha">Soacha</option>
                    <option value="Chía">Chía</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="street_address">Dirección Completa *</Label>
                <Input
                  id="street_address"
                  placeholder="Calle 123 #45-67"
                  value={formData.street_address}
                  onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="state">Departamento</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="postal_code">Código Postal</Label>
                  <Input
                    id="postal_code"
                    placeholder="110111"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="additional_info">Referencias / Instrucciones de Entrega</Label>
                <Textarea
                  id="additional_info"
                  placeholder="Ej: Casa blanca, portón negro. Dejar con el portero."
                  value={formData.additional_info}
                  onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="is_default" className="cursor-pointer">
                  Establecer como dirección por defecto
                </Label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {addresses.length === 0 && !showForm ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              No tienes direcciones guardadas
            </p>
            <Button onClick={() => setShowForm(true)}>
              Agregar tu primera dirección
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <Card key={address.id} className={address.is_default ? 'border-primary border-2' : ''}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {address.label}
                      {address.is_default && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                          Por defecto
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>{address.full_name}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">{address.street_address}</p>
                <p className="text-sm">{address.city}, {address.state}</p>
                {address.postal_code && (
                  <p className="text-sm">CP: {address.postal_code}</p>
                )}
                <p className="text-sm font-medium">Tel: {address.phone}</p>
                {address.additional_info && (
                  <p className="text-sm text-muted-foreground italic">
                    {address.additional_info}
                  </p>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(address)}
                  >
                    Editar
                  </Button>
                  {!address.is_default && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetDefault(address.id)}
                    >
                      Predeterminada
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(address.id)}
                  >
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
