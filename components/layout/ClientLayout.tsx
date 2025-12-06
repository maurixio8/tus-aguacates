'use client';

import { usePathname } from "next/navigation";
import { AuthProvider } from "@/lib/auth-context";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ChatBot } from "@/components/chat/ChatBot";
import BottomNavigation from "@/components/layout/BottomNavigation";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // No mostrar componentes de cliente en rutas de admin
  const isAdminRoute = pathname?.startsWith('/admin');

  // Si es ruta de admin, solo renderizar el contenido sin header/footer/nav de cliente
  if (isAdminRoute) {
    return (
      <AuthProvider>
        <main className="min-h-screen">
          {children}
        </main>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <Header />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <ChatBot />
      <BottomNavigation />
    </AuthProvider>
  );
}
