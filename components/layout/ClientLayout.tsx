'use client';

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { useWishlistStore } from "@/lib/wishlist-store";
import { initializeProducts } from "@/lib/productStorage";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ChatBot } from "@/components/chat/ChatBot";
import BottomNavigation from "@/components/layout/BottomNavigation";
import { InstallPrompt, ServiceWorkerRegistration, PushNotificationPrompt } from "@/components/pwa";

function ClientLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const { loadWishlist } = useWishlistStore();

  // No mostrar componentes de cliente en rutas de admin o empresas
  const isAdminRoute = pathname?.startsWith('/admin');
  const isEmpresasRoute = pathname?.startsWith('/empresas');

  // Sincronizar productos al iniciar la app (SOLO SI NO ES ADMIN)
  useEffect(() => {
    if (!isAdminRoute) {
      initializeProducts();
    }
  }, [isAdminRoute]);

  // 🔥 CARGAR WISHLIST AUTOMÁTICAMENTE cuando el usuario se autentica
  useEffect(() => {
    if (!authLoading && user) {
      console.log('🔄 [ClientLayout] Usuario autenticado, cargando wishlist:', user.id);
      loadWishlist(user.id);
    }
  }, [user, authLoading, loadWishlist]);

  // Si es ruta de admin o empresas, solo renderizar el contenido sin header/footer/nav de cliente
  // (empresas tiene su propio layout con BusinessHeader)
  if (isAdminRoute || isEmpresasRoute) {
    return (
      <main className="min-h-screen">
        {children}
      </main>
    );
  }

  return (
    <>
      <ServiceWorkerRegistration />
      <Header />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <ChatBot />
      <BottomNavigation />
      <InstallPrompt />
      <PushNotificationPrompt />
    </>
  );
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ClientLayoutContent>
        {children}
      </ClientLayoutContent>
    </AuthProvider>
  );
}
