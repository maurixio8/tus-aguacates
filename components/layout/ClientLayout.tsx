'use client';

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { useWishlistStore } from "@/lib/wishlist-store";
import { initializeProducts } from "@/lib/productStorage";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { EmpresasFooter } from "@/components/layout/EmpresasFooter";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ChatBot } from "@/components/chat/ChatBot";
import BottomNavigation from "@/components/layout/BottomNavigation";
import { InstallPrompt, ServiceWorkerRegistration } from "@/components/pwa";
import { SplashScreen } from "@/components/splash/SplashScreen";

function ClientLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const { loadWishlist } = useWishlistStore();

  // Splash screen state
  const [showSplash, setShowSplash] = useState(true);

  // No mostrar componentes de cliente en rutas de admin
  const isAdminRoute = pathname?.startsWith('/admin');

  // Detectar ruta de empresas para ocultar componentes
  const isEmpresasRoute = pathname?.startsWith('/empresas');

  // Determinar variante del splash
  const splashVariant = isEmpresasRoute ? 'empresas' : 'tienda';

  // No mostrar splash en admin o si ya se mostró (usando sessionStorage)
  useEffect(() => {
    const hasShownSplash = sessionStorage.getItem('splashShown');
    if (hasShownSplash || isAdminRoute) {
      setShowSplash(false);
    }
  }, [isAdminRoute]);

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

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem('splashShown', 'true');
  };

  // Si es ruta de admin, solo renderizar el contenido sin header/footer/nav de cliente
  if (isAdminRoute) {
    return (
      <main className="min-h-screen">
        {children}
      </main>
    );
  }

  // Mostrar splash screen si está activo
  if (showSplash) {
    return (
      <>
        <SplashScreen onComplete={handleSplashComplete} variant={splashVariant} />
      </>
    );
  }

  return (
    <>
      <ServiceWorkerRegistration />
      <Header />
      <main className="min-h-screen">
        {children}
      </main>
      {isEmpresasRoute ? <EmpresasFooter /> : <Footer />}
      <CartDrawer />
      {!isEmpresasRoute && <ChatBot />}
      {!isEmpresasRoute && <BottomNavigation />}
      <InstallPrompt />
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
