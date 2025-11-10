# 📱 Configuración de WhatsApp Business - BMAD Spec

## 🎯 **Objetivo**
Configurar notificaciones automáticas de WhatsApp para el sistema e-commerce "Tus Aguacates" según especificaciones BMAD.

## 📋 **Requisitos**

- ✅ **WhatsApp Business configurado**
- ✅ **N8N workflow existente** (opcional)
- ✅ **Número empresa:** 3042582777
- ✅ **Supabase CLI** instalado

## 🔧 **Configuración Paso a Paso**

### 1. **Variables de Entorno**
```bash
# Copiar archivo de ejemplo
cp supabase/.env.example supabase/.env

# Editar archivo con valores reales
supabase/.env
```

**Variables requeridas:**
```env
WHATSAPP_COMPANY_NUMBER=573042582777
WHATSAPP_API_URL=https://api.whatsapp.business.com
SUPABASE_URL=tu-url-supabase
SUPABASE_ANON_KEY=tu-key-anon
```

### 2. **Validar Configuración**
```bash
npm run whatsapp:validate
```

### 3. **Desplegar Edge Functions**
```bash
npm run deploy:functions
```

### 4. **Testing Completo**
```bash
npm run whatsapp:test
```

## 📱 **Flujo de Notificaciones**

### **Cuando un cliente realiza un pedido:**

1. **Notificación a la Empresa (Inmediato):**
   - 📲 WhatsApp: +57 3 042 582 777
   - 🔔 Mensaje completo con detalles del pedido
   - 💰 Total y dirección de entrega

2. **Notificación al Cliente (3 segundos después):**
   - 📲 WhatsApp: +57 + número del cliente
   - ✅ Confirmación del pedido
   - 📋 Resumen de compra
   - 🙏 Agradecimiento

### **Templates de Mensaje:**

#### **Empresa:**
```
🔔 NUEVO PEDIDO - TUS AGUACATES

👤 Cliente: Juan Pérez
📞 Teléfono: 3001234567
📧 Email: juan@example.com

📦 PRODUCTOS:
Aguacate Hass Premium x3 - $13.500

💰 TOTAL: $13.500

🏠 DIRECCIÓN DE ENTREGA:
Calle 123 #45-67

🚚 Entregas: Martes y Viernes en Bogotá
```

#### **Cliente:**
```
✅ PEDIDO CONFIRMADO - TUS AGUACATES

¡Hola Juan! Tu pedido ha sido recibido exitosamente.

📋 RESUMEN DE TU PEDIDO:
Pedido ID: #ORDER-123456

📦 Productos:
Aguacate Hass Premium x3 - $13.500

💰 Total: $13.500

🏠 Dirección de Entrega:
Calle 123 #45-67

🙏 Gracias por tu compra!
Te contactaremos pronto para confirmar detalles.
```

## 🔍 **Validación y Testing**

### **Comandos de Validación:**
```bash
# Validar configuración completa
npm run whatsapp:validate

# Test en modo desarrollo
npm run whatsapp:test

# Re-deploy functions
npm run deploy:functions

# Deploy completo (build + functions)
npm run deploy:all
```

### **Manual Testing:**
1. **Abrir aplicación:** `npm run dev`
2. **Agregar producto** al carrito
3. **Completar checkout** con datos reales
4. **Verificar que se abran dos ventanas de WhatsApp**
5. **Revisar mensajes** en ambos WhatsApps

## ⚠️ **Troubleshooting**

### **Error: "WhatsApp no abre"**
- ✅ Verificar número: +57 3 042 582 777
- ✅ Validar Edge Functions deployadas
- ✅ Revisar logs de Supabase

### **Error: "Variables de entorno no encontradas"**
- ✅ Copiar `.env.example` a `.env`
- ✅ Configurar `WHATSAPP_COMPANY_NUMBER`
- ✅ Reiniciar servidor

### **Error: "Función no encontrada"**
- ✅ Deploy functions: `npm run deploy:functions`
- ✅ Verificar archivo `dual-whatsapp-notification`
- ✅ Revisar sintaxis TypeScript

## 🚀 **Despliegue en Producción**

1. **Configurar variables en Supabase Dashboard**
2. **Deploy functions:** `npm run deploy:functions`
3. **Validar:** `npm run whatsapp:validate`
4. **Test final:** Hacer pedido de prueba real

## 📊 **Métricas de Éxito**

### **✅ Validaciones Exitosas:**
- [ ] Número empresa: +57 3 042 582 777
- [ ] Edge Function: dual-whatsapp-notification
- [ ] Templates funcionando
- [ ] Cliente recibe confirmación
- [ ] Empresa recibe notificación

### **📈 KPIs Monitorear:**
- ✅ Tasa de pedidos completados
- ✅ Tiempo de respuesta WhatsApp
- ✅ Satisfacción del cliente
- ✅ Conversión de mensajes a ventas

## 📞 **Soporte**

**Número de Soporte BMAD:** Configurar según especificaciones

**Contacto Técnico:**
- GitHub Issues
- Slack #tus-aguacates
- Email: soporte@tusaguacates.com

---

## 🎉 **Resultado Final**

Una vez configurado correctamente, el sistema enviará automáticamente:

✅ **Notificación a empresa** (3042582777) cuando llegue un pedido
✅ **Confirmación al cliente** por WhatsApp
✅ **Mensajes personalizados** con detalles completos
✅ **URLs de WhatsApp** generadas automáticamente

**ESTADO LISTO PARA PRODUCCIÓN** 🚀