
# CONFIGURACIÓN DE SUPABASE - CORREOS PERSONALIZADOS

## Pasos para configurar correos personalizados en Supabase:

### 1. Acceder al Dashboard de Supabase
1. Ve a https://supabase.com/dashboard
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto: gxqkmaaqoehydulksudj

### 2. Configurar URLs de redirección
1. Ve a Authentication → Settings
2. En la sección "Site URL", configura:
   - Site URL: https://tus-aguacates.vercel.app
   - Redirect URLs: https://tus-aguacates.vercel.app/auth/callback
   - Additional Redirect URLs: 
     * https://tus-aguacates.vercel.app/**
     * http://localhost:3000/** (para desarrollo)

### 3. Configurar plantillas de correo personalizadas
1. Ve a Authentication → Email Templates
2. Para "Confirm signup":
   - Subject: "¡Bienvenido a Tus Aguacates! 🥑"
   - Body: Usa el contenido de plantilla-confirmacion-correo.html

3. Para "Reset password":
   - Subject: "Recupera tu contraseña - Tus Aguacates"
   - Body: Usa el contenido de plantilla-recuperacion-contrasena.html

### 4. Configurar remitente de correo
1. Ve a Settings → General
2. En "Email sender", configura:
   - From address: noreply@tusaguacates.com
   - From name: Tus Aguacates

### 5. Verificar configuración
1. Prueba el flujo de registro
2. Prueba el flujo de recuperación de contraseña
3. Verifica que los correos lleguen con el branding correcto
4. Verifica que los enlaces apunten a producción

## Variables de entorno necesarias:
NEXT_PUBLIC_SITE_URL=https://tus-aguacates.vercel.app

## URLs importantes:
- Producción: https://tus-aguacates.vercel.app
- Login: https://tus-aguacates.vercel.app/auth/login
- Registro: https://tus-aguacates.vercel.app/auth/registro
- Recuperación: https://tus-aguacates.vercel.app/auth/forgot-password
