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

function ClientLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const { loadWishlist } = useWishlistStore();

  // No mostrar componentes de cliente en rutas de admin
  const isAdminRoute = pathname?.startsWith('/admin');

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

  // Si es ruta de admin, solo renderizar el contenido sin header/footer/nav de cliente
  if (isAdminRoute) {
    return (
      <main className="min-h-screen">
        {children}
      </main>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <ChatBot />
      <BottomNavigation />
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
