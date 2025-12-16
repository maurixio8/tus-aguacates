'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, configureExtendedSession } from './supabase';
import { migrateGuestOrders } from './migrations';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<any>;
  signUp: (email: string, password: string, fullName: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar usuario al montar
  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } finally {
        setLoading(false);
      }
    }
    loadUser();

    // Configurar listener de auth - SIMPLE, sin operaciones async en callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // NUNCA usar operaciones async en el callback
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Métodos de autenticación
  async function signIn(email: string, password: string, rememberMe: boolean = false) {
    // Configurar persistencia extendida antes del inicio de sesión
    configureExtendedSession(rememberMe);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        // Configurar persistencia de sesión según "Recordarme"
        // Si rememberMe es true, la sesión persiste por más tiempo
        // Por defecto, Supabase usa persistencia 'session' (persistente hasta que se cierra el navegador)
        // Con rememberMe, usaremos 'local' para persistencia más larga
        // Sin rememberMe, usaremos 'session' para sesión temporal
      }
    });

    if (error) throw error;

    // Si "Recordarme" está activado, guardar preferencia en localStorage
    if (rememberMe && typeof window !== 'undefined') {
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('userEmail', email);
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('userEmail');
    }

    // Migrar pedidos de invitado automáticamente
    if (data.user) {
      try {
        const result = await migrateGuestOrders(data.user.id, email);
        if (result.success && result.migratedCount > 0) {
          console.log(`Migrated ${result.migratedCount} orders for user ${email}`);
        }
      } catch (migrationError) {
        // No bloquear el login si falla la migración
        console.error('Error migrating guest orders:', migrationError);
      }
    }

    return data;
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/auth/callback`,
        data: {
          full_name: fullName,
        }
      }
    });

    if (error) throw error;

    // Crear perfil de usuario
    if (data.user) {
      console.log('🔄 Creando perfil de usuario para:', email);

      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
        preferred_name: null, // Se puede configurar después
        role: 'customer',
      });

      if (profileError) {
        console.error('❌ Error al crear perfil:', profileError);
        throw new Error(`Database error saving new user: ${profileError.message}`);
      }

      console.log('✅ Perfil creado exitosamente');

      // Migrar pedidos de invitado automáticamente
      try {
        const result = await migrateGuestOrders(data.user.id, email);
        if (result.success && result.migratedCount > 0) {
          console.log(`Migrated ${result.migratedCount} orders for new user ${email}`);
        }
      } catch (migrationError) {
        // No bloquear el registro si falla la migración
        console.error('Error migrating guest orders during signup:', migrationError);
      }
    }

    return data;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
