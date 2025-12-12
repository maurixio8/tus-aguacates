# Despliegue Automático en Vercel

Este documento describe el proceso para configurar el despliegue automático de tu proyecto `tus-aguacates` en Vercel.

## Requisitos Previos

1. Tener una cuenta de Vercel (https://vercel.com)
2. Tener un repositorio de GitHub con tu proyecto
3. Tener las credenciales de Supabase y Stripe configuradas

## Configuración del Proyecto

### 1. Archivo `vercel.json`

El proyecto ya incluye un archivo de configuración de Vercel con la siguiente estructura:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next",
      "config": {
        "outputDirectory": ".next",
        "buildCommand": "npm run build"
      }
    }
  ],
  "routes": [
    {
      "src": "/((?!api|_next|static|public|favicon.ico).*)",
      "dest": "/"
    },
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "NEXT_PUBLIC_SUPABASE_URL": "",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "",
    "STRIPE_PUBLISHABLE_KEY": "",
    "STRIPE_SECRET_KEY": ""
  },
  "framework": "nextjs"
}
```

### 2. Variables de Entorno

Las siguientes variables de entorno deben configurarse en Vercel:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase | `https://gxqkmaaqoehydulksudj.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima de Supabase | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clave pública de Stripe | `pk_test_51QRiLtP3pqE0123demo456789` |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe | `sk_test_51QRiLtP3pqE0123demo456789` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Clave de Google Maps (opcional) | `AIzaSyCO0kKndUNlmQi3B5mxy4dblg_8WYcuKuk` |

## Proceso de Despliegue Automático

### 1. Conectar Repositorio de GitHub

1. Inicia sesión en tu cuenta de Vercel
2. Ve a "New Project" o "Import Project"
3. Selecciona tu repositorio de GitHub
4. Elige el branch principal (generalmente `main` o `master`)
5. Vercel detectará automáticamente que es un proyecto Next.js

### 2. Configurar Variables de Entorno

1. En la configuración del proyecto, ve a la pestaña "Environment Variables"
2. Añade las variables listadas en la sección anterior
3. Marca las variables como "Encrypted" si contienen información sensible

### 3. Configurar Dominio (Opcional)

1. Ve a la pestaña "Domains"
2. Añade tu dominio personalizado
3. Sigue las instrucciones de configuración de DNS

### 4. Despliegue Inicial

1. Haz clic en "Deploy"
2. Vercel construirá y desplegará tu aplicación automáticamente
3. El proceso puede tardar varios minutos

## Monitoreo del Despliegue

- Verifica el estado del despliegue en el dashboard de Vercel
- Revisa los logs de construcción para asegurarte de que no hay errores
- Prueba la aplicación en el dominio de Vercel proporcionado

## Despliegues Automáticos

Cada vez que hagas un push a tu repositorio de GitHub, Vercel:

1. Detectará el cambio
2. Ejecutará las pruebas (si están configuradas)
3. Construirá el proyecto
4. Desplegará la nueva versión automáticamente
5. Notificará sobre el estado del despliegue

## Solución de Problemas Comunes

### Errores de Construcción

- Verifica que todas las dependencias están en `package.json`
- Asegúrate de que las variables de entorno están correctamente configuradas
- Revisa los logs de construcción en Vercel para detalles

### Problemas de Conexión a Supabase

- Verifica que las credenciales de Supabase son correctas
- Asegúrate de que los permisos de RLS (Row Level Security) están configurados
- Revisa los logs de la consola del navegador para errores de conexión

### Problemas de Stripe

- Verifica que las claves de Stripe son correctas
- Asegúrate de que Stripe está en modo prueba para desarrollo
- Revisa la configuración de webhooks si usas funcionalidades de pago

## Actualizaciones

Para actualizar el proyecto:

1. Haz tus cambios en el código local
2. Haz commit y push a tu repositorio de GitHub
3. Vercel desplegará automáticamente la nueva versión
4. Verifica que todo funciona correctamente

## Soporte

Si encuentras problemas con el despliegue, revisa:

- [Documentación de Vercel](https://vercel.com/docs)
- [Documentación de Next.js](https://nextjs.org/docs)
- Los logs de construcción en el dashboard de Vercel
- Los archivos de configuración en tu repositorio

¡Listo! Tu proyecto ahora se desplegará automáticamente en Vercel cada vez que hagas cambios.