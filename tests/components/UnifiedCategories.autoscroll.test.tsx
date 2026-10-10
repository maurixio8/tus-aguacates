import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import UnifiedCategories from '@/components/categories/UnifiedCategories';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: async () => ({
              data: [{
                id: 'test-category',
                name: 'Prueba',
                slug: 'prueba',
                image_url: null,
                description: null,
                sort_order: 1,
                is_active: true,
              }],
              error: null,
            }),
          }),
        }),
      }),
    }),
  },
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('UnifiedCategories automatic scrolling', () => {
  test('moves continuously while keeping duplicate links out of the accessibility tree', async () => {
    let nextFrame: FrameRequestCallback | undefined;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      nextFrame = callback;
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    const { container } = render(
      <UnifiedCategories variant="scroll" maxItems={2} autoScroll />
    );

    const viewport = await screen.findByRole('region', { name: 'Categorías de productos' });
    const originalSequence = container.querySelector<HTMLElement>(
      '[data-category-sequence="original"]'
    );

    expect(originalSequence).not.toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(container.querySelectorAll('[data-category-sequence="duplicate"] a')).toHaveLength(2);

    Object.defineProperty(originalSequence, 'scrollWidth', { configurable: true, value: 200 });
    Object.defineProperty(viewport, 'scrollLeft', { configurable: true, writable: true, value: 199 });
    act(() => window.dispatchEvent(new Event('resize')));

    for (const timestamp of [1000, 1016, 1032, 1048, 1064, 1080]) {
      act(() => {
        const frame = nextFrame;
        nextFrame = undefined;
        frame?.(timestamp);
      });
    }

    expect(viewport.scrollLeft).toBeGreaterThan(0);
    expect(viewport.scrollLeft).toBeLessThan(5);
  });

  test('does not animate when the visitor prefers reduced motion', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList);
    const requestAnimationFrame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);

    render(<UnifiedCategories variant="scroll" maxItems={2} autoScroll />);
    await screen.findByRole('region', { name: 'Categorías de productos' });

    expect(requestAnimationFrame).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Activar movimiento de categorías' }));
    await waitFor(() => expect(requestAnimationFrame).toHaveBeenCalled());
  });
});
