'use client';

import { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import { BusinessCartDrawer } from '@/components/cart/BusinessCartDrawer';
import { B2BHeader } from '@/components/layout/B2BHeader';
import { Building2, Phone, Mail } from 'lucide-react';
import Link from 'next/link';

interface B2BLayoutProps {
  children: ReactNode;
}

export default function B2BLayout({ children }: B2BLayoutProps) {
  return (
    <ToastProvider>
      <B2BHeader />
      {children}
      <B2BFooter />
      <BusinessCartDrawer />
    </ToastProvider>
  );
}

function B2BFooter() {
  return (
    <footer className="bg-verde-bosque text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Columna 1: Logo y descripcion */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-6 h-6" />
              <span className="font-display font-bold text-xl">Canal Empresarial</span>
            </div>
            <p className="text-white/70 text-sm">
              Venta mayorista de aguacates y frutas tropicales para restaurantes,
              hoteles, catering y empresas. Directo del Eje Cafetero.
            </p>
          </div>

          {/* Columna 2: Navegacion */}
          <div>
            <h3 className="font-semibold mb-4">Catalogo B2B</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link href="/empresas/aguacates" className="hover:text-white transition-colors">
                  Aguacates Mayorista
                </Link>
              </li>
              <li>
                <Link href="/empresas/frutas-tropicales" className="hover:text-white transition-colors">
                  Frutas Tropicales
                </Link>
              </li>
              <li>
                <Link href="/empresas/catalogo" className="hover:text-white transition-colors">
                  Ver Todo el Catalogo
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Contacto */}
          <div>
            <h3 className="font-semibold mb-4">Contacto Empresas</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="tel:+573042582777"
                  className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  +57 304 258 2777
                </a>
              </li>
              <li>
                <a
                  href="mailto:empresas@tusaguacates.com"
                  className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  empresas@tusaguacates.com
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/573042582777?text=Hola,%20quiero%20información%20sobre%20pedidos%20mayoristas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-white font-semibold transition-colors mt-2"
                >
                  <span>💬</span>
                  WhatsApp Empresas
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-6 text-center text-sm text-white/50">
          <p>Tus Aguacates - Canal Empresarial B2B</p>
          <p className="mt-1">Del Eje Cafetero a tu Negocio</p>
        </div>
      </div>
    </footer>
  );
}
