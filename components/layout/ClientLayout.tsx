'use client';

import { AuthProvider } from "@/lib/auth-context";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ChatBot } from "@/components/chat/ChatBot";
import BottomNavigation from "@/components/layout/BottomNavigation";

export function ClientLayout({ children }: { children: React.ReactNode }) {
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
