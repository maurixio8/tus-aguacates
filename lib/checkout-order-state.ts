export type CheckoutRecoveryState =
  | 'payment_method_pending'
  | 'payment_failed'
  | 'deferred_payment'
  | 'saved'
  | 'confirmed';

export interface CheckoutRecoveryInput {
  status?: string | null;
  paymentMethod?: string | null;
  checkoutState?: string | null;
  paymentAttemptedAt?: string | null;
  paymentFailedAt?: string | null;
}

export function getCheckoutRecoveryState(input: CheckoutRecoveryInput): CheckoutRecoveryState {
  const method = String(input.paymentMethod || '').toLowerCase();
  const status = String(input.status || '').toLowerCase();
  if (input.paymentAttemptedAt || input.paymentFailedAt || status === 'pago_fallido') {
    return 'payment_failed';
  }
  if (input.checkoutState === 'payment_method_pending' && !method) {
    return 'payment_method_pending';
  }
  if (method === 'efectivo' || method === 'nequi') {
    return 'deferred_payment';
  }
  if (['confirmado', 'confirmed', 'pendiente_entrega', 'pagado'].includes(status)) {
    return 'confirmed';
  }
  return 'saved';
}

export function getCheckoutRecoveryCopy(state: CheckoutRecoveryState, firstName: string) {
  if (state === 'payment_method_pending') {
    return {
      title: '¡Tu pedido quedó guardado!',
      subtitle: `Solo falta elegir cómo pagar, ${firstName}`,
      body: 'Tranqui: no perdiste tu pedido ni tienes una deuda. Elige el método de pago para terminarlo.',
      status: 'Pedido guardado · método de pago pendiente',
      primary: 'Continuar con mi pedido',
      footer: 'Te llevaremos al paso exacto para elegir el método de pago.',
    };
  }
  if (state === 'payment_failed') {
    return {
      title: 'Podemos terminar tu pedido',
      subtitle: `El pago necesita un nuevo intento, ${firstName}`,
      body: 'El pedido está guardado. Puedes intentar el pago nuevamente o pedir ayuda por WhatsApp.',
      status: 'Pedido guardado · pago no completado',
      primary: 'Reintentar pago',
      footer: 'Te llevaremos al checkout para intentar el pago otra vez.',
    };
  }
  if (state === 'deferred_payment') {
    return {
      title: '¡Tu pedido está guardado!',
      subtitle: `Pago al recibir, ${firstName}`,
      body: 'No necesitas pagar en línea ahora. Tu pedido queda pendiente de confirmación y el pago se realiza al recibirlo.',
      status: `Pedido guardado · ${String(state)}`,
      primary: '',
      footer: 'Si quieres agregar algo o necesitas ayuda, escríbenos por WhatsApp.',
    };
  }
  if (state === 'confirmed') {
    return {
      title: '¡Tu pedido está confirmado!',
      subtitle: `Ya lo recibimos, ${firstName}`,
      body: 'Tu pedido está registrado en nuestro sistema. Si necesitas modificar algo, escríbenos antes de la entrega.',
      status: 'Pedido confirmado',
      primary: '',
      footer: 'Estamos pendientes de tu entrega.',
    };
  }
  return {
    title: '¡Tu pedido quedó guardado!',
    subtitle: `Ya lo recibimos, ${firstName}`,
    body: 'Tu pedido está guardado en nuestro sistema. Puedes consultarnos por WhatsApp si necesitas ayuda.',
    status: 'Pedido guardado',
    primary: '',
    footer: 'Si necesitas agregar algo, escríbenos por WhatsApp.',
  };
}
