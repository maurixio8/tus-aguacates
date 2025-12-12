'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase, Subscription, SubscriptionDelivery, Address } from '@/lib/supabase';
import { 
  Calendar, 
  Package, 
  MapPin, 
  CreditCard, 
  Bell, 
  Pause, 
  Play, 
  X, 
  Edit, 
  Clock,
  CheckCircle,
  AlertCircle,
  Repeat,
  Settings,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SuscripcionesPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [deliveries, setDeliveries] = useState<Record<string, SubscriptionDelivery[]>>({});
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    loadSubscriptions();
  }, [user]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      setError('');

      // Cargar suscripciones
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (subscriptionsError) throw subscriptionsError;

      // Cargar direcciones
      const { data: addressesData, error: addressesError } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user!.id);

      if (addressesError) throw addressesError;

      // Cargar entregas para cada suscripción
      const deliveriesData: Record<string, SubscriptionDelivery[]> = {};
      for (const subscription of subscriptionsData || []) {
        const { data: deliveryData } = await supabase
          .from('subscription_deliveries')
          .select('*')
          .eq('subscription_id', subscription.id)
          .order('delivery_date', { ascending: false })
          .limit(5);

        deliveriesData[subscription.id] = deliveryData || [];
      }

      setSubscriptions(subscriptionsData || []);
      setDeliveries(deliveriesData);
      setAddresses(addressesData || []);

    } catch (err: any) {
      console.error('Error loading subscriptions:', err);
      setError(err.message || 'Error al cargar suscripciones');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseSubscription = async (subscriptionId: string) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'paused',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      // Registrar modificación
      await supabase
        .from('subscription_modifications')
        .insert({
          subscription_id: subscriptionId,
          modification_type: 'pause',
          old_values: { status: 'active' },
          new_values: { status: 'paused' },
          modified_by: user!.id,
          reason: 'Pausado por el cliente'
        });

      loadSubscriptions();

    } catch (err: any) {
      console.error('Error pausing subscription:', err);
      setError(err.message || 'Error al pausar suscripción');
    }
  };

  const handleResumeSubscription = async (subscriptionId: string) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      // Registrar modificación
      await supabase
        .from('subscription_modifications')
        .insert({
          subscription_id: subscriptionId,
          modification_type: 'resume',
          old_values: { status: 'paused' },
          new_values: { status: 'active' },
          modified_by: user!.id,
          reason: 'Reanudado por el cliente'
        });

      loadSubscriptions();

    } catch (err: any) {
      console.error('Error resuming subscription:', err);
      setError(err.message || 'Error al reanudar suscripción');
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta suscripción? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: 'Cancelado por el cliente',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      // Registrar modificación
      await supabase
        .from('subscription_modifications')
        .insert({
          subscription_id: subscriptionId,
          modification_type: 'cancel',
          old_values: { status: 'active' },
          new_values: { status: 'cancelled' },
          modified_by: user!.id,
          reason: 'Cancelado por el cliente'
        });

      loadSubscriptions();

    } catch (err: any) {
      console.error('Error cancelling subscription:', err);
      setError(err.message || 'Error al cancelar suscripción');
    }
  };

  const getAddressLabel = (addressId: string) => {
    const address = addresses.find(a => a.id === addressId);
    return address ? address.label : 'Dirección desconocida';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activa';
      case 'paused': return 'Pausada';
      case 'cancelled': return 'Cancelada';
      case 'expired': return 'Expirada';
      default: return status;
    }
  };

  const showSubscriptionDetails = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Cargando tus suscripciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mis Suscripciones
          </h1>
          <p className="text-gray-600">
            Gestiona tus pedidos recurrentes automáticos
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Lista de suscripciones */}
        {subscriptions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No tienes suscripciones activas
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Configura pedidos recurrentes para recibir tus productos favoritos automáticamente cada 15 días.
              </p>
              <Button
                onClick={() => router.push('/productos')}
                className="bg-green-600 hover:bg-green-700"
              >
                Crear mi primera suscripción
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {subscriptions.map((subscription) => (
              <Card key={subscription.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Repeat className="w-5 h-5 text-green-600" />
                        {subscription.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                          {getStatusText(subscription.status)}
                        </span>
                        <span className="text-sm text-gray-500">
                          Cada {subscription.frequency_days} días
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => showSubscriptionDetails(subscription)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Próxima entrega */}
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Próxima entrega</p>
                        <p className="text-sm text-gray-600">
                          {new Date(subscription.next_delivery_date).toLocaleDateString('es-CO', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Dirección */}
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Dirección de entrega</p>
                        <p className="text-sm text-gray-600">
                          {getAddressLabel(subscription.address_id)}
                        </p>
                      </div>
                    </div>

                    {/* Método de pago */}
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Método de pago</p>
                        <p className="text-sm text-gray-600 capitalize">
                          {subscription.payment_method === 'daviplata' ? 'Daviplata' : 'Efectivo'}
                        </p>
                      </div>
                    </div>

                    {/* Estadísticas */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {subscription.successful_deliveries}
                        </p>
                        <p className="text-xs text-gray-500">Entregas exitosas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {subscription.total_deliveries}
                        </p>
                        <p className="text-xs text-gray-500">Total entregas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-600">
                          ${subscription.estimated_total.toLocaleString('es-CO')}
                        </p>
                        <p className="text-xs text-gray-500">Total por entrega</p>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2 pt-4 border-t">
                      {subscription.status === 'active' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePauseSubscription(subscription.id)}
                            className="flex-1"
                          >
                            <Pause className="w-4 h-4 mr-1" />
                            Pausar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/cuenta/suscripciones/${subscription.id}/editar`)}
                            className="flex-1"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        </>
                      )}
                      
                      {subscription.status === 'paused' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResumeSubscription(subscription.id)}
                          className="flex-1"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Reanudar
                        </Button>
                      )}
                      
                      {(subscription.status === 'active' || subscription.status === 'paused') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelSubscription(subscription.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de detalles */}
        {showDetailsModal && selectedSubscription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Detalles de Suscripción
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Información básica */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Información General
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Nombre</p>
                        <p className="text-sm text-gray-600">{selectedSubscription.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Estado</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedSubscription.status)}`}>
                          {getStatusText(selectedSubscription.status)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Frecuencia</p>
                        <p className="text-sm text-gray-600">Cada {selectedSubscription.frequency_days} días</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Fecha de inicio</p>
                        <p className="text-sm text-gray-600">
                          {new Date(selectedSubscription.start_date).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Entregas recientes */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Entregas Recientes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {deliveries[selectedSubscription.id]?.length === 0 ? (
                        <p className="text-gray-500 text-sm">No hay entregas registradas</p>
                      ) : (
                        <div className="space-y-3">
                          {deliveries[selectedSubscription.id].map((delivery) => (
                            <div key={delivery.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="text-sm font-medium">
                                  {new Date(delivery.delivery_date).toLocaleDateString('es-CO')}
                                </p>
                                <p className="text-xs text-gray-500">
                                  ${delivery.total_amount.toLocaleString('es-CO')} COP
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {delivery.status === 'completed' && (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                )}
                                {delivery.status === 'pending' && (
                                  <Clock className="w-4 h-4 text-yellow-600" />
                                )}
                                {delivery.status === 'failed' && (
                                  <AlertCircle className="w-4 h-4 text-red-600" />
                                )}
                                <span className="text-xs capitalize">
                                  {delivery.status === 'completed' ? 'Completada' :
                                   delivery.status === 'pending' ? 'Pendiente' :
                                   delivery.status === 'failed' ? 'Fallida' : delivery.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Productos */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Productos de la Suscripción
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-3">Productos Fijos</h4>
                        {selectedSubscription.fixed_products.length === 0 ? (
                          <p className="text-gray-500 text-sm">No hay productos fijos</p>
                        ) : (
                          <div className="space-y-2">
                            {selectedSubscription.fixed_products.map((product: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  {product.product_image && (
                                    <img
                                      src={product.product_image}
                                      alt={product.product_name}
                                      className="w-10 h-10 object-cover rounded"
                                    />
                                  )}
                                  <div>
                                    <p className="font-medium">{product.product_name}</p>
                                    <p className="text-sm text-gray-600">
                                      {product.quantity} x ${product.unit_price.toLocaleString('es-CO')}
                                      {product.variant_name && ` (${product.variant_name})`}
                                    </p>
                                  </div>
                                </div>
                                <p className="font-medium">
                                  ${(product.unit_price * product.quantity).toLocaleString('es-CO')}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {selectedSubscription.optional_products.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3">Productos Opcionales</h4>
                          <div className="space-y-2">
                            {selectedSubscription.optional_products.map((product: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  {product.product_image && (
                                    <img
                                      src={product.product_image}
                                      alt={product.product_name}
                                      className="w-10 h-10 object-cover rounded"
                                    />
                                  )}
                                  <div>
                                    <p className="font-medium">{product.product_name}</p>
                                    <p className="text-sm text-gray-600">
                                      {product.quantity} x ${product.unit_price.toLocaleString('es-CO')}
                                      {product.variant_name && ` (${product.variant_name})`}
                                    </p>
                                  </div>
                                </div>
                                <p className="font-medium">
                                  ${(product.unit_price * product.quantity).toLocaleString('es-CO')}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}