import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { vi, beforeEach, describe, it, expect } from 'vitest';

// Mock imports before importing the component
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn()
      }))
    })),
    functions: {
      invoke: vi.fn()
    }
  }
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}));

vi.mock('@/lib/cart-store', () => ({
  useCartStore: vi.fn()
}));

import { GuestCheckoutForm } from '@/components/checkout/GuestCheckoutForm';
import { useCartStore } from '@/lib/cart-store';

describe('Payment Methods Integration', () => {
  const mockItems = [
    {
      product: {
        id: '1',
        name: 'Aguacate Hass Premium',
        price: 4500
      },
      quantity: 2,
      variant: null,
      price: 4500
    }
  ];

  const mockCartStore = {
    items: mockItems,
    getTotal: () => 9000,
    clearCart: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useCartStore as vi.Mock).mockReturnValue(mockCartStore);

    // Mock successful Supabase responses
    const { supabase } = require('@/lib/supabase');

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'test-order-123' },
          error: null
        })
      })
    });

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null })
    });

    supabase.from.mockReturnValue({
      insert: mockInsert,
      update: mockUpdate
    });

    supabase.functions.invoke.mockResolvedValue({
      data: {
        success: true,
        businessWhatsAppUrl: 'https://wa.me/573042582777',
        customerWhatsAppUrl: 'https://wa.me/573001234567'
      },
      error: null
    });

    // Mock window.open
    window.open = vi.fn();
  });

  it('should show payment method selection step after info form', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    render(<GuestCheckoutForm onSuccess={onSuccess} />);

    // Fill out the form
    await user.type(screen.getByLabelText(/Nombre Completo/i), 'Juan Pérez');
    await user.type(screen.getByLabelText(/Email/i), 'juan@example.com');
    await user.type(screen.getByLabelText(/Teléfono/i), '3001234567');
    await user.type(screen.getByLabelText(/Dirección de Entrega/i), 'Cra 1 #1-1');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /Continuar al Pago/i }));

    // Should show payment method selection
    await waitFor(() => {
      expect(screen.getByText(/💳 Método de Pago/i)).toBeInTheDocument();
      expect(screen.getByText(/Selecciona cómo prefieres pagar tu pedido/i)).toBeInTheDocument();
      expect(screen.getByText(/Total a Pagar/i)).toBeInTheDocument();
      expect(screen.getByText('$ 9.000 COP')).toBeInTheDocument();
    });
  });

  it('should display both payment options with correct details', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    render(<GuestCheckoutForm onSuccess={onSuccess} />);

    // Fill out and submit info form
    await user.type(screen.getByLabelText(/Nombre Completo/i), 'Juan Pérez');
    await user.type(screen.getByLabelText(/Email/i), 'juan@example.com');
    await user.type(screen.getByLabelText(/Teléfono/i), '3001234567');
    await user.type(screen.getByLabelText(/Dirección de Entrega/i), 'Cra 1 #1-1');
    await user.click(screen.getByRole('button', { name: /Continuar al Pago/i }));

    // Wait for payment method step
    await waitFor(() => {
      expect(screen.getByText(/Daviplata/i)).toBeInTheDocument();
      expect(screen.getByText(/Efectivo/i)).toBeInTheDocument();
    });

    // Check Daviplata option
    expect(screen.getByText(/Transferencia bancaria instantánea/i)).toBeInTheDocument();
    expect(screen.getByText(/320 306 2007/)).toBeInTheDocument();
    expect(screen.getByText(/Abre tu app Daviplata/i)).toBeInTheDocument();

    // Check Efectivo option
    expect(screen.getByText(/Paga cuando recibas tu pedido/i)).toBeInTheDocument();
    expect(screen.getByText(/Prepara el dinero exacto si es posible/i)).toBeInTheDocument();
  });

  it('should allow switching between payment methods', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    render(<GuestCheckoutForm onSuccess={onSuccess} />);

    // Get to payment method step
    await user.type(screen.getByLabelText(/Nombre Completo/i), 'Juan Pérez');
    await user.type(screen.getByLabelText(/Email/i), 'juan@example.com');
    await user.type(screen.getByLabelText(/Teléfono/i), '3001234567');
    await user.type(screen.getByLabelText(/Dirección de Entrega/i), 'Cra 1 #1-1');
    await user.click(screen.getByRole('button', { name: /Continuar al Pago/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue('daviplata')).toBeInTheDocument();
    });

    // Click on Efectivo
    await user.click(screen.getByDisplayValue('efectivo'));

    await waitFor(() => {
      expect(screen.getByDisplayValue('efectivo')).toBeInTheDocument();
    });

    // Check button text updated
    expect(screen.getByRole('button', { name: /Confirmar Pedido - Efectivo/i })).toBeInTheDocument();

    // Click back to Daviplata
    await user.click(screen.getByDisplayValue('daviplata'));

    await waitFor(() => {
      expect(screen.getByDisplayValue('daviplata')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Confirmar Pedido - Daviplata/i })).toBeInTheDocument();
  });

  it('should submit order with Daviplata payment method', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    render(<GuestCheckoutForm onSuccess={onSuccess} />);

    // Complete info form
    await user.type(screen.getByLabelText(/Nombre Completo/i), 'Juan Pérez');
    await user.type(screen.getByLabelText(/Email/i), 'juan@example.com');
    await user.type(screen.getByLabelText(/Teléfono/i), '3001234567');
    await user.type(screen.getByLabelText(/Dirección de Entrega/i), 'Cra 1 #1-1');
    await user.click(screen.getByRole('button', { name: /Continuar al Pago/i }));

    // Wait for payment method step
    await waitFor(() => {
      expect(screen.getByDisplayValue('daviplata')).toBeInTheDocument();
    });

    // Confirm order with Daviplata
    await user.click(screen.getByRole('button', { name: /Confirmar Pedido - Daviplata/i }));

    // Check that checkout flow completes successfully
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('test-order-123');
    });
  });

  it('should submit order with Efectivo payment method', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    render(<GuestCheckoutForm onSuccess={onSuccess} />);

    // Complete info form
    await user.type(screen.getByLabelText(/Nombre Completo/i), 'Juan Pérez');
    await user.type(screen.getByLabelText(/Email/i), 'juan@example.com');
    await user.type(screen.getByLabelText(/Teléfono/i), '3001234567');
    await user.type(screen.getByLabelText(/Dirección de Entrega/i), 'Cra 1 #1-1');
    await user.click(screen.getByRole('button', { name: /Continuar al Pago/i }));

    // Wait for payment method step
    await waitFor(() => {
      expect(screen.getByDisplayValue('daviplata')).toBeInTheDocument();
    });

    // Select Efectivo
    await user.click(screen.getByDisplayValue('efectivo'));

    // Confirm order with Efectivo
    await user.click(screen.getByRole('button', { name: /Confirmar Pedido - Efectivo/i }));

    // Check that checkout flow completes successfully
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('test-order-123');
    });
  });

  it('should send WhatsApp notifications with payment method', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const { supabase } = require('@/lib/supabase');

    render(<GuestCheckoutForm onSuccess={onSuccess} />);

    // Complete checkout flow
    await user.type(screen.getByLabelText(/Nombre Completo/i), 'Juan Pérez');
    await user.type(screen.getByLabelText(/Email/i), 'juan@example.com');
    await user.type(screen.getByLabelText(/Teléfono/i), '3001234567');
    await user.type(screen.getByLabelText(/Dirección de Entrega/i), 'Cra 1 #1-1');
    await user.click(screen.getByRole('button', { name: /Continuar al Pago/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue('daviplata')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Confirmar Pedido - Daviplata/i }));

    // Check WhatsApp function was called
    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledWith('dual-whatsapp-notification', {
        body: expect.objectContaining({
          orderData: expect.objectContaining({
            total: 9000,
            items: expect.any(Array)
          }),
          customerInfo: expect.objectContaining({
            name: 'Juan Pérez',
            email: 'juan@example.com',
            phone: '3001234567'
          })
        })
      });
    });

    // Check WhatsApp windows were opened
    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith(
        'https://wa.me/573042582777',
        '_blank'
      );
    });
  });

  it('should handle navigation back to info form', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    render(<GuestCheckoutForm onSuccess={onSuccess} />);

    // Get to payment method step
    await user.type(screen.getByLabelText(/Nombre Completo/i), 'Juan Pérez');
    await user.type(screen.getByLabelText(/Email/i), 'juan@example.com');
    await user.type(screen.getByLabelText(/Teléfono/i), '3001234567');
    await user.type(screen.getByLabelText(/Dirección de Entrega/i), 'Cra 1 #1-1');
    await user.click(screen.getByRole('button', { name: /Continuar al Pago/i }));

    // Wait for payment method step
    await waitFor(() => {
      expect(screen.getByText(/💳 Método de Pago/i)).toBeInTheDocument();
    });

    // Click back button
    await user.click(screen.getByRole('button', { name: /Volver/i }));

    // Should return to info form
    await waitFor(() => {
      expect(screen.getByLabelText(/Nombre Completo/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('Juan Pérez')).toBeInTheDocument();
    });
  });

  it('should validate responsive design on mobile viewport', async () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667,
    });

    const user = userEvent.setup();
    const onSuccess = vi.fn();

    render(<GuestCheckoutForm onSuccess={onSuccess} />);

    // Complete info form
    await user.type(screen.getByLabelText(/Nombre Completo/i), 'Juan Pérez');
    await user.type(screen.getByLabelText(/Email/i), 'juan@example.com');
    await user.type(screen.getByLabelText(/Teléfono/i), '3001234567');
    await user.type(screen.getByLabelText(/Dirección de Entrega/i), 'Cra 1 #1-1');
    await user.click(screen.getByRole('button', { name: /Continuar al Pago/i }));

    // Check payment method layout on mobile
    await waitFor(() => {
      const paymentOptions = screen.getAllByRole('radio');
      expect(paymentOptions).toHaveLength(2);

      // Check that instructions are visible and scrollable
      expect(screen.getByText(/📱 Instrucciones:/i)).toBeInTheDocument();
      expect(screen.getByText(/💵 Instrucciones:/i)).toBeInTheDocument();
    });

    // Test touch-friendly interaction
    const daviplataOption = screen.getByDisplayValue('daviplata');
    await user.click(daviplataOption);

    await waitFor(() => {
      expect(daviplataOption).toBeChecked();
    });
  });

  it('should show loading state during order processing', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    // Mock slow response
    const { supabase } = require('@/lib/supabase');
    supabase.from().insert().select().single.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        data: { id: 'test-order-123' },
        error: null
      }), 100))
    );

    render(<GuestCheckoutForm onSuccess={onSuccess} />);

    // Complete checkout
    await user.type(screen.getByLabelText(/Nombre Completo/i), 'Juan Pérez');
    await user.type(screen.getByLabelText(/Email/i), 'juan@example.com');
    await user.type(screen.getByLabelText(/Teléfono/i), '3001234567');
    await user.type(screen.getByLabelText(/Dirección de Entrega/i), 'Cra 1 #1-1');
    await user.click(screen.getByRole('button', { name: /Continuar al Pago/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue('daviplata')).toBeInTheDocument();
    });

    // Click confirm and check loading
    await user.click(screen.getByRole('button', { name: /Confirmar Pedido - Daviplata/i }));

    expect(screen.getByRole('button', { name: /Procesando\.\.\./i })).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});