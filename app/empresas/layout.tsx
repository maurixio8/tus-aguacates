'use client';

import { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import { BusinessCartDrawer } from '@/components/cart/BusinessCartDrawer';

interface B2BLayoutProps {
  children: ReactNode;
}

export default function B2BLayout({ children }: B2BLayoutProps) {
  return (
    <ToastProvider>
      {children}
      <BusinessCartDrawer />
    </ToastProvider>
  );
}
