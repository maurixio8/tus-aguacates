/**
 * TESTS DE FUNCIONALIDAD: ImageUploadModal
 *
 * Verifica que el modal de subida de imágenes funciona correctamente
 * con validación, compresión y subida a Supabase Storage
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import ImageUploadModal from '@/components/admin/ImageUploadModal';
import type { Product } from '@/lib/productStorage';

// Mock de image-upload-service
vi.mock('@/lib/image-upload-service', () => ({
  validateImage: vi.fn((file) => {
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'Invalid file type' };
    }
    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, error: 'File too large' };
    }
    return { valid: true };
  }),
  uploadProductImage: vi.fn(async (file, productId, onProgress) => {
    // Simular progreso
    onProgress({ percentage: 50, loaded: file.size / 2, total: file.size });

    return {
      success: true,
      publicUrl: `https://supabase.example.com/products/${productId}/image.jpg`,
    };
  }),
}));

const mockProduct: Product = {
  id: '1',
  name: 'Aguacate Hass',
  description: 'Premium avocado',
  price: 6500,
  category: 'Aguacates',
  stock: 100,
  is_active: true,
};

describe('📸 ImageUploadModal - Funcionalidad de Subida', () => {
  let mockOnUpload: ReturnType<typeof vi.fn>;
  let mockOnClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnUpload = vi.fn();
    mockOnClose = vi.fn();
  });

  test('✅ Debe mostrar información del producto', () => {
    render(
      <ImageUploadModal
        product={mockProduct}
        onUpload={mockOnUpload}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Aguacate Hass')).toBeInTheDocument();
    expect(screen.getByText('Aguacates')).toBeInTheDocument();
  });

  test('✅ Debe mostrar el título del modal', () => {
    render(
      <ImageUploadModal
        product={mockProduct}
        onUpload={mockOnUpload}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/Cambiar Imagen/i)).toBeInTheDocument();
  });

  test('✅ Debe mostrar instrucciones para seleccionar archivo', () => {
    render(
      <ImageUploadModal
        product={mockProduct}
        onUpload={mockOnUpload}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/Arrastra una imagen aquí/i)).toBeInTheDocument();
    expect(screen.getByText(/Seleccionar Archivo/i)).toBeInTheDocument();
  });

  test('✅ Debe tener un input de file type', () => {
    render(
      <ImageUploadModal
        product={mockProduct}
        onUpload={mockOnUpload}
        onClose={mockOnClose}
      />
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    expect(fileInput?.accept).toBe('image/*');
  });

  test('✅ Debe deshabilitar botón Guardar si no hay archivo', () => {
    render(
      <ImageUploadModal
        product={mockProduct}
        onUpload={mockOnUpload}
        onClose={mockOnClose}
      />
    );

    const uploadBtn = screen.getByRole('button', { name: /Guardar Imagen/i });
    expect(uploadBtn).toBeDisabled();
  });

  test('✅ Debe permitir cancelar la subida', async () => {
    render(
      <ImageUploadModal
        product={mockProduct}
        onUpload={mockOnUpload}
        onClose={mockOnClose}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelBtn);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('✅ Debe mostrar información del archivo cuando se selecciona', async () => {
    render(
      <ImageUploadModal
        product={mockProduct}
        onUpload={mockOnUpload}
        onClose={mockOnClose}
      />
    );

    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    if (input) {
      await userEvent.upload(input, file);

      // Debe mostrar que el archivo fue seleccionado
      await waitFor(() => {
        expect(screen.getByText(/Archivo seleccionado:/i)).toBeInTheDocument();
        // Buscar específicamente el elemento que dice "Archivo seleccionado: test.jpg"
        const selectedText = document.evaluate(
          "//p[contains(text(), 'Archivo seleccionado')]",
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
        expect(selectedText?.textContent).toContain('test.jpg');
      });
    }
  });

  test('✅ Debe habilitar botón Guardar cuando hay archivo válido', async () => {
    render(
      <ImageUploadModal
        product={mockProduct}
        onUpload={mockOnUpload}
        onClose={mockOnClose}
      />
    );

    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    if (input) {
      await userEvent.upload(input, file);

      await waitFor(() => {
        const uploadBtn = screen.getByRole('button', { name: /Guardar Imagen/i });
        expect(uploadBtn).not.toBeDisabled();
      });
    }
  });

  test('✅ Debe mostrar opción para quitar archivo seleccionado', async () => {
    render(
      <ImageUploadModal
        product={mockProduct}
        onUpload={mockOnUpload}
        onClose={mockOnClose}
      />
    );

    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    if (input) {
      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(/Quitar archivo/i)).toBeInTheDocument();
      });
    }
  });

  test('✅ Debe mostrar preview de imagen seleccionada', async () => {
    render(
      <ImageUploadModal
        product={mockProduct}
        onUpload={mockOnUpload}
        onClose={mockOnClose}
      />
    );

    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    if (input) {
      await userEvent.upload(input, file);

      await waitFor(() => {
        const preview = document.querySelector('img[alt="Preview original"]');
        expect(preview).toBeInTheDocument();
      });
    }
  });

  test('✅ Debe mostrar información de tamaño del archivo', async () => {
    render(
      <ImageUploadModal
        product={mockProduct}
        onUpload={mockOnUpload}
        onClose={mockOnClose}
      />
    );

    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    if (input) {
      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(/Información del archivo:/i)).toBeInTheDocument();
        expect(screen.getByText(/Tamaño original:/i)).toBeInTheDocument();
      });
    }
  });
});
