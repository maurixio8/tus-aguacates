'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, ShoppingCart, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/lib/cart-store';
import { getMessageGreeting } from '@/lib/greetings';
import React from 'react';

// --- FAQ Local: Respuestas predefinidas ---
interface FAQItem {
  keywords: string[];
  response: string;
  followUp?: Array<{ label: string; value: string }>;
}

const FAQ_DATABASE: FAQItem[] = [
  // === ENVÍOS Y ENTREGAS ===
  {
    keywords: ['envío', 'envio', 'domicilio', 'entrega', 'entregan', 'llega', 'delivery', 'despacho', 'cuando llega', 'cuando entregan'],
    response: '🚚 **Información de Envíos**\n\n• **Días de entrega:** Martes y Viernes\n• **Horario:** 8:00 am a 6:00 pm\n• **Costo:** $7.400 COP\n• **¡GRATIS en pedidos mayores a $68.900!**\n\nEl día de tu entrega te escribimos por WhatsApp con la hora aproximada de llegada.',
    followUp: [
      { label: '📍 ¿Dónde entregan?', value: 'zonas cobertura' },
      { label: '💰 ¿Cuánto cuesta el envío?', value: 'costo envío' },
      { label: '📅 ¿Qué días entregan?', value: 'dias entrega' }
    ]
  },
  {
    keywords: ['costo envío', 'precio envío', 'cuanto cuesta envio', 'valor envío', 'tarifa envio', 'domicilio gratis', 'envio gratis'],
    response: '💰 **Costo de Envío**\n\n• **Valor fijo:** $7.400 COP\n• **¡ENVÍO GRATIS** en pedidos mayores a **$68.900!** 🎉\n\n💡 *Tip: Nuestro Combo Mercado Semanal Completo ($68.900) incluye envío gratis y tiene todo lo que necesitas para la semana.*',
    followUp: [
      { label: '🧺 Ver Combo Mercado', value: 'combo mercado' },
      { label: '🛒 Ver productos', value: 'productos' },
      { label: '⬅️ Volver al menú', value: 'menu principal' }
    ]
  },
  {
    keywords: ['dias entrega', 'que dias', 'cuando entregan', 'martes', 'viernes', 'domingo', 'festivo', 'festivos'],
    response: '📅 **Días de Entrega**\n\n• **Martes y Viernes** son nuestros días de entrega\n• **Domingos y festivos:** No realizamos entregas\n\n⏰ El día de tu entrega te avisamos por WhatsApp la hora aproximada de llegada.',
    followUp: [
      { label: '🚚 Más info de envíos', value: 'envío' },
      { label: '🛒 Hacer mi pedido', value: 'productos' }
    ]
  },
  {
    keywords: ['zonas', 'cobertura', 'donde entregan', 'ciudades', 'municipios', 'localidades', 'barrio', 'sector'],
    response: '📍 **Zonas de Cobertura**\n\n✅ **Bogotá** - Todas las localidades\n✅ **Chía**\n✅ **Soacha**\n\nSi tu barrio está en Bogotá, ¡llegamos sin problema! 🚚\n\n¿No estás seguro si llegamos a tu zona? Escríbenos por WhatsApp.',
    followUp: [
      { label: '📞 Consultar mi zona', value: 'contacto whatsapp' },
      { label: '🚚 Info de envíos', value: 'envío' }
    ]
  },

  // === PAGOS ===
  {
    keywords: ['pago', 'pagar', 'transferencia', 'nequi', 'daviplata', 'efectivo', 'tarjeta', 'metodos', 'como pago', 'formas de pago'],
    response: '💳 **Métodos de Pago**\n\n• **Nequi** ✅\n• **Daviplata** ✅\n• **Efectivo contra entrega** ✅\n\n💡 Puedes pagar al recibir tu pedido o antes, como prefieras. ¡Somos 100% confiables con 8 años de experiencia!',
    followUp: [
      { label: '🛒 Hacer mi pedido', value: 'productos' },
      { label: '❓ Otra pregunta', value: 'menu principal' }
    ]
  },
  {
    keywords: ['contra entrega', 'pago al recibir', 'pagar cuando llegue'],
    response: '💵 **Pago Contra Entrega**\n\n¡Sí! Aceptamos **efectivo contra entrega**. Pagas cuando recibes tu pedido en la puerta de tu casa.\n\nTambién puedes pagar antes por Nequi o Daviplata si lo prefieres.',
    followUp: [
      { label: '💳 Otros métodos de pago', value: 'pago' },
      { label: '🛒 Hacer pedido', value: 'productos' }
    ]
  },

  // === HORARIOS ===
  {
    keywords: ['horario', 'hora', 'abierto', 'atienden', 'trabajan', 'disponible', 'atencion'],
    response: '🕐 **Horarios de Atención**\n\n📱 **WhatsApp:** 6:00 am a 8:00 pm\n🚚 **Entregas:** Martes y Viernes, 8am a 6pm\n\n¡Respondemos rápido! Escríbenos cuando quieras.',
    followUp: [
      { label: '📞 Escribir por WhatsApp', value: 'contacto whatsapp' },
      { label: '📅 Días de entrega', value: 'dias entrega' }
    ]
  },

  // === CONTACTO ===
  {
    keywords: ['whatsapp', 'contacto', 'telefono', 'llamar', 'asesor', 'hablar', 'ayuda humana', 'numero', 'cel', 'celular'],
    response: '📱 **Contacto Directo**\n\n¡Con gusto te atendemos personalmente!\n\n📲 **WhatsApp: 304 258 2777**\n\n⏰ Horario: 6:00 am a 8:00 pm\n\nHaz clic abajo para abrir WhatsApp directamente 👇',
    followUp: [
      { label: '💬 Abrir WhatsApp', value: 'abrir whatsapp' },
      { label: '⬅️ Volver al menú', value: 'menu principal' }
    ]
  },

  // === PRODUCTOS ===
  {
    keywords: ['productos', 'que venden', 'catalogo', 'catálogo', 'tienda', 'que tienen'],
    response: '🛒 **Nuestros Productos**\n\n🥑 **Aguacates:** Hass (baby, mediano, premium), Injerto, Criollo\n🧺 **Combos:** Ahorro y Mercado Semanal\n🍓 **Frutas:** Fresas, arándanos, kiwi, banano, uvas y más\n🥕 **Verduras:** Papa, zanahoria, tomate, cebolla\n🌿 **Especiales:** Pasta de ajo, flor de jamaica, germinados\n\n¡Revisa nuestra tienda para ver todos los productos!',
    followUp: [
      { label: '🥑 Ver Aguacates', value: 'aguacates' },
      { label: '🧺 Ver Combos', value: 'combos' },
      { label: '📞 Hablar con asesor', value: 'contacto whatsapp' }
    ]
  },
  {
    keywords: ['aguacate', 'aguacates', 'hass', 'palta', 'avocado'],
    response: '🥑 **Nuestros Aguacates**\n\n**Variedades disponibles:**\n• **Hass Baby** - Pequeño y cremoso\n• **Hass Mediano** - El más popular\n• **Hass Premium** - Grande y de exportación\n• **Injerto** - Más grande, sabor suave\n• **Criollo** - Tradicional colombiano\n\n**Presentaciones:** Paquetes de 4, 8, 12 unidades o cajas de 24 y 35 unidades.\n\n🌟 Todos vienen en **3 estados de maduración** para consumo durante toda la semana.',
    followUp: [
      { label: '🍃 ¿Puedo elegir madurez?', value: 'madurez' },
      { label: '🧺 Ver Combos', value: 'combos' },
      { label: '💰 Ver precios', value: 'precios aguacate' }
    ]
  },
  {
    keywords: ['madurez', 'maduro', 'verde', 'pintón', 'pinton', 'listo para comer', 'estado'],
    response: '🍃 **Estados de Maduración**\n\nNuestras cajas de aguacates vienen en **3 estados de maduración:**\n\n1️⃣ **Verde** - Para consumir en 4-5 días\n2️⃣ **Pintón** - Listo en 2-3 días\n3️⃣ **Maduro** - Listo para comer hoy\n\n💡 *¿Quieres todos en un mismo estado? Escríbelo en los **comentarios de tu pedido** y lo preparamos especialmente para ti.*',
    followUp: [
      { label: '🥑 Ver Aguacates', value: 'aguacates' },
      { label: '🛒 Hacer pedido', value: 'productos' }
    ]
  },
  {
    keywords: ['combo', 'combos', 'paquete', 'oferta', 'promocion', 'promoción', 'ahorro'],
    response: '🧺 **Nuestros Combos**\n\n🌟 **Combo Mercado Semanal Completo** - $68.900\n*Incluye: 24 aguacates, fresas, banano, tomate, cebolla, papa, zanahoria, pasta de ajo, arándanos, uva, duraznos, limón + ¡ENVÍO GRATIS!*\n\n💰 **Combo Ahorro #1** - $34.100\n*Fresas premium + Kiwis premium*\n\n💰 **Combo Ahorro #2** - $29.900\n*Caja 24 aguacates + Arándanos orgánicos*\n\n¡Los combos son la mejor forma de ahorrar!',
    followUp: [
      { label: '🛒 Ver todos los productos', value: 'productos' },
      { label: '🚚 Info de envíos', value: 'envío' }
    ]
  },
  {
    keywords: ['combo mercado', 'mercado semanal', 'mercado completo'],
    response: '🧺 **Combo Mercado Semanal Completo**\n\n**Precio:** $68.900 (¡ENVÍO GRATIS!)\n\n**Incluye:**\n• 24 Aguacates Hass mediano\n• Fresas premium (500g)\n• Banano criollo (1kg)\n• Tomate chonto (500g)\n• Cebolla cabezona (500g)\n• Papa sabanera (500g)\n• Zanahoria (500g)\n• Pasta de ajo (100g)\n• Arándanos orgánicos (125g)\n• Uva isabelina\n• Duraznos (500g)\n• Limón Tahití (1kg)\n\n¡Todo lo que necesitas para la semana en un solo pedido!',
    followUp: [
      { label: '🛒 Hacer pedido', value: 'productos' },
      { label: '📞 Preguntar por WhatsApp', value: 'contacto whatsapp' }
    ]
  },
  {
    keywords: ['precio', 'precios', 'cuanto cuesta', 'cuánto vale', 'valor'],
    response: '💰 **Algunos Precios**\n\n🥑 **Aguacates:**\n• Paquete 8 medianos: $8.900\n• Paquete 4 premium: $9.900\n• Caja 24 medianos: $16.600\n• Caja 12 premium: $24.700\n\n🧺 **Combos:**\n• Combo Ahorro #2: $29.900\n• Combo Mercado Completo: $68.900 (envío gratis)\n\n¡Revisa la tienda para ver todos los precios actualizados!',
    followUp: [
      { label: '🛒 Ver tienda', value: 'productos' },
      { label: '🧺 Ver combos', value: 'combos' }
    ]
  },
  {
    keywords: ['organico', 'orgánico', 'organicos', 'natural', 'sin quimicos'],
    response: '🌿 **Productos Orgánicos**\n\nTenemos productos orgánicos certificados:\n\n• **Arándanos orgánicos** 🫐\n• **Frambuesas orgánicas** 🍇\n\nEstos productos son cultivados sin químicos y son ideales para una alimentación más saludable.',
    followUp: [
      { label: '🛒 Ver productos', value: 'productos' },
      { label: '❓ Otra pregunta', value: 'menu principal' }
    ]
  },

  // === DEVOLUCIONES Y GARANTÍA ===
  {
    keywords: ['problema', 'queja', 'reclamo', 'devolución', 'devolver', 'mal estado', 'dañado', 'podrido', 'golpeado'],
    response: '😔 **¿Problema con tu Pedido?**\n\n¡Lo sentimos! Tu satisfacción es nuestra prioridad.\n\n**¿Qué hacer?**\n1. Toma fotos del producto\n2. Escríbenos por WhatsApp\n3. Tienes máximo **12-18 horas** después de recibir para reportar\n\n✅ Te hacemos **cambio o devolución** del dinero como prefieras.\n\nHaz clic abajo para reportar tu problema 👇',
    followUp: [
      { label: '📲 Reportar problema', value: 'abrir whatsapp problema' }
    ]
  },
  {
    keywords: ['garantia', 'garantía', 'calidad', 'fresco', 'frescos'],
    response: '✅ **Nuestra Garantía de Calidad**\n\n• **8 años** de experiencia en el mercado\n• Productos **frescos del campo** a tu mesa\n• Aguacates en **3 estados de maduración**\n• Si no estás satisfecho, ¡te devolvemos tu dinero!\n\n🥑 Cada aguacate es seleccionado con cuidado para garantizar la mejor calidad.',
    followUp: [
      { label: '🥑 Ver aguacates', value: 'aguacates' },
      { label: '📞 Hablar con asesor', value: 'contacto whatsapp' }
    ]
  },

  // === CUENTA Y PEDIDOS ===
  {
    keywords: ['cuenta', 'registrar', 'registro', 'crear cuenta', 'necesito cuenta'],
    response: '👤 **¿Necesito crear cuenta?**\n\n**No es obligatorio.** Puedes comprar como invitado sin problema.\n\n**Beneficios de tener cuenta:**\n• Cupones de descuento exclusivos 🎟️\n• Promociones especiales 🔥\n• Historial de pedidos\n• Reordenar más rápido\n\n¡Regístrate y aprovecha los beneficios!',
    followUp: [
      { label: '🛒 Comprar ahora', value: 'productos' },
      { label: '❓ Otra pregunta', value: 'menu principal' }
    ]
  },
  {
    keywords: ['pedido minimo', 'mínimo', 'minimo', 'cuanto es lo minimo'],
    response: '📦 **Pedido Mínimo**\n\n¡No tenemos pedido mínimo! Puedes pedir lo que quieras, aunque sea un solo producto.\n\n💡 *Recuerda: El envío cuesta $7.400, pero es GRATIS en pedidos mayores a $68.900.*',
    followUp: [
      { label: '🛒 Ver productos', value: 'productos' },
      { label: '🧺 Ver combos', value: 'combos' }
    ]
  },
  {
    keywords: ['descuento', 'cupón', 'cupon', 'promoción', 'codigo', 'código'],
    response: '🎟️ **Descuentos y Cupones**\n\nLos **clientes registrados** tienen acceso a:\n\n• Cupones de descuento exclusivos\n• Promociones especiales\n• Ofertas por temporada\n\n¡Crea tu cuenta para no perderte ninguna promoción!',
    followUp: [
      { label: '🛒 Ver productos', value: 'productos' },
      { label: '📞 Consultar promociones', value: 'contacto whatsapp' }
    ]
  },
  {
    keywords: ['cancelar', 'modificar', 'cambiar pedido', 'editar pedido'],
    response: '✏️ **Modificar o Cancelar Pedido**\n\nSí puedes modificar o cancelar tu pedido. Solo escríbenos por WhatsApp lo antes posible y te ayudamos.\n\n📲 WhatsApp: 304 258 2777',
    followUp: [
      { label: '📞 Escribir por WhatsApp', value: 'contacto whatsapp' },
      { label: '⬅️ Volver al menú', value: 'menu principal' }
    ]
  },

  // === SOBRE EL NEGOCIO ===
  {
    keywords: ['tienda fisica', 'punto fisico', 'local', 'direccion', 'dirección', 'ubicacion', 'ubicación'],
    response: '🏪 **Punto Físico**\n\nActualmente solo vendemos **en línea**. No tenemos tienda física.\n\n✅ Hacemos entregas a domicilio en Bogotá, Chía y Soacha los martes y viernes.\n\n¡Es más cómodo! Pide desde tu casa y te lo llevamos.',
    followUp: [
      { label: '🚚 Info de envíos', value: 'envío' },
      { label: '🛒 Hacer pedido', value: 'productos' }
    ]
  },
  {
    keywords: ['empresa', 'empresas', 'restaurante', 'restaurantes', 'mayorista', 'al por mayor', 'grandes cantidades'],
    response: '🏢 **Ventas para Empresas**\n\n¡Sí! Vendemos a empresas, restaurantes y mayoristas.\n\nTenemos una **página especial para empresas** con precios y condiciones especiales.\n\nEscríbenos por WhatsApp para más información.',
    followUp: [
      { label: '📞 Consultar precios empresas', value: 'contacto whatsapp' },
      { label: '⬅️ Volver al menú', value: 'menu principal' }
    ]
  },
  {
    keywords: ['quienes son', 'quien es', 'historia', 'sobre ustedes', 'experiencia', 'años', 'trayectoria'],
    response: '🥑 **Sobre Tus Aguacates**\n\n¡Llevamos **8 años** llevando productos frescos a las mesas colombianas!\n\n• Productos seleccionados del campo\n• Entregas a domicilio en Bogotá, Chía y Soacha\n• 100% confiables\n• Miles de clientes satisfechos\n\n¡Gracias por confiar en nosotros! 💚',
    followUp: [
      { label: '🛒 Ver productos', value: 'productos' },
      { label: '📞 Contactarnos', value: 'contacto whatsapp' }
    ]
  },
  {
    keywords: ['confiable', 'seguro', 'estafa', 'real', 'verdad'],
    response: '🛡️ **Somos 100% Confiables**\n\n• **8 años** de experiencia\n• Miles de clientes satisfechos\n• Aceptamos pago contra entrega (¡pagas cuando recibes!)\n• Garantía de devolución si no estás satisfecho\n\n¡Confía en nosotros! 💚',
    followUp: [
      { label: '🛒 Hacer pedido', value: 'productos' },
      { label: '📞 Hablar con asesor', value: 'contacto whatsapp' }
    ]
  },

  // === MENÚS Y NAVEGACIÓN ===
  {
    keywords: ['menu principal', 'volver', 'inicio', 'opciones', 'ayuda', 'que puedes hacer'],
    response: '¿En qué más puedo ayudarte? 🥑',
    followUp: [
      { label: '🥑 Aguacates', value: 'aguacates' },
      { label: '🧺 Combos', value: 'combos' },
      { label: '🚚 Envíos', value: 'envío' },
      { label: '💳 Pagos', value: 'pago' },
      { label: '❓ Más opciones', value: 'faq menu' },
      { label: '📞 Contacto', value: 'contacto whatsapp' }
    ]
  },
  {
    keywords: ['faq menu', 'preguntas frecuentes', 'mas opciones', 'otras preguntas'],
    response: '❓ **Preguntas Frecuentes**\n\nSelecciona la categoría que te interesa:',
    followUp: [
      { label: '👤 ¿Necesito cuenta?', value: 'cuenta' },
      { label: '📦 ¿Pedido mínimo?', value: 'pedido minimo' },
      { label: '🎟️ Descuentos', value: 'descuento' },
      { label: '✏️ Modificar pedido', value: 'modificar' },
      { label: '😔 Tengo un problema', value: 'problema' },
      { label: '🛡️ Garantía', value: 'garantia' },
      { label: '🏢 Empresas', value: 'empresas' },
      { label: '🥑 Sobre nosotros', value: 'quienes son' },
      { label: '⬅️ Volver', value: 'menu principal' }
    ]
  },
  {
    keywords: ['hola', 'buenas', 'buenos días', 'buenas tardes', 'hey', 'ey', 'buen dia'],
    response: '¡Hola! 👋 Bienvenido a **Tus Aguacates**.\n\n**Selecciona una opción** para obtener información:',
    followUp: [
      { label: '🥑 Aguacates', value: 'aguacates' },
      { label: '🧺 Combos', value: 'combos' },
      { label: '🚚 Envíos', value: 'envío' },
      { label: '💳 Pagos', value: 'pago' },
      { label: '📞 Hablar con asesor', value: 'contacto whatsapp' }
    ]
  },
  {
    keywords: ['gracias', 'genial', 'perfecto', 'excelente', 'ok', 'listo', 'vale', 'entendido'],
    response: '¡Con mucho gusto! 😊\n\n¿Hay algo más en lo que pueda ayudarte?',
    followUp: [
      { label: '🏠 Menú principal', value: 'menu principal' },
      { label: '❌ No, gracias', value: 'despedida' }
    ]
  },
  {
    keywords: ['despedida', 'adios', 'chao', 'bye', 'hasta luego', 'nos vemos'],
    response: '¡Gracias por visitarnos! 🥑💚\n\nRecuerda: entregas los **martes y viernes**.\n\n¡Que tengas un excelente día y nos vemos pronto!',
    followUp: [
      { label: '🏠 Volver al inicio', value: 'menu principal' }
    ]
  }
];

// Función para buscar respuesta en FAQ local
const findLocalAnswer = (message: string): FAQItem | null => {
  const normalizedMsg = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  for (const faq of FAQ_DATABASE) {
    for (const keyword of faq.keywords) {
      const normalizedKeyword = keyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (normalizedMsg.includes(normalizedKeyword)) {
        return faq;
      }
    }
  }
  return null;
};

// --- Interfaces del Protocolo "Timeline" ---
interface ProductRef {
  id: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
}

interface TimelineItem {
  type: 'text' | 'typing' | 'products' | 'options';
  content?: string;
  delay?: number;
  duration?: number;
  options?: Array<{ label: string; value: string }>;
  items?: ProductRef[];
}

interface Message {
  id: string;
  text?: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  products?: ProductRef[];
  quickReplies?: Array<{ label: string; value: string }>;
  isTyping?: boolean;
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addItem, items: cartItems, getSubtotal } = useCartStore();
  const hasInteractedRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isBotTyping]);

  // Auto-despliegue REMOVIDO - ahora el usuario debe hacer clic para abrir

  const handleBotGreeting = async () => {
    setIsBotTyping(true);
    let user = null;
    let profile = null;
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      user = authUser;
      if (user) {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        profile = profileData;
      }
    } catch (e) { console.error(e); }

    setIsBotTyping(false);
    const greeting = getMessageGreeting(profile, user);
    const fullGreeting = greeting
      ? `${greeting} 👋 Soy tu asistente personal de Tus Aguacates.`
      : '¡Hola! Bienvenido a Tus Aguacates. 🥑';

    // Mensaje inicial con menú de categorías principales
    setMessages([{
      id: 'welcome',
      text: `${fullGreeting}\n\n**Selecciona una opción** para obtener información rápida:`,
      sender: 'bot',
      timestamp: new Date(),
      quickReplies: [
        { label: '🥑 Aguacates', value: 'aguacates' },
        { label: '🧺 Combos', value: 'combos' },
        { label: '🚚 Envíos', value: 'envío' },
        { label: '💳 Pagos', value: 'pago' },
        { label: '📅 Días de Entrega', value: 'dias entrega' },
        { label: '❓ Preguntas Frecuentes', value: 'faq menu' },
        { label: '📞 Hablar con Asesor', value: 'contacto whatsapp' }
      ]
    }]);
  };

  const getUserContext = async () => {
    let userId = null;
    try {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id;
    } catch (e) { }

    const cartContext = {
      itemCount: cartItems.length,
      total: getSubtotal(),
      items: cartItems.map(i => ({ name: i.product.name, qty: i.quantity }))
    };
    return { userId, cartContext };
  };

  // --- CORE: Procesador de Timeline (El "Cine") ---
  const processTimeline = async (timeline: TimelineItem[]) => {
    for (const item of timeline) {
      if (item.type === 'typing') {
        setIsBotTyping(true);
        await new Promise(resolve => setTimeout(resolve, item.duration || 1000));
        setIsBotTyping(false);
      }

      else if (item.type === 'text') {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: item.content,
          sender: 'bot',
          timestamp: new Date()
        }]);
        if (item.delay) await new Promise(resolve => setTimeout(resolve, item.delay));
      }

      else if (item.type === 'products') {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'bot',
          timestamp: new Date(),
          products: item.items
        }]);
      }

      else if (item.type === 'options') {
        // En lugar de crear un mensaje nuevo vacío, adjuntamos las opciones al último mensaje
        // O creamos uno nuevo si no hay anterior.
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.sender === 'bot' && !lastMsg.quickReplies) {
            // Actualizar último mensaje
            const updated = [...prev];
            updated[updated.length - 1] = { ...lastMsg, quickReplies: item.options };
            return updated;
          } else {
            // Nuevo mensaje solo con opciones
            return [...prev, {
              id: Date.now().toString(),
              sender: 'bot',
              timestamp: new Date(),
              quickReplies: item.options
            }];
          }
        });
      }
    }
  };

  const handleSendMessage = async (text: string, label?: string) => {
    if (!text.trim()) return;

    const displayCheck = label || text;

    hasInteractedRef.current = true;
    const newUserMsg: Message = {
      id: Date.now().toString(),
      text: displayCheck,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');

    // --- Acciones Especiales ---
    if (text === 'abrir whatsapp') {
      // Abrir WhatsApp directamente
      window.open('https://wa.me/573042582777?text=Hola,%20necesito%20ayuda%20con%20mi%20pedido', '_blank');
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: '✅ Abriendo WhatsApp... Un asesor te atenderá pronto.\n\n📲 WhatsApp: 304 258 2777',
        sender: 'bot',
        timestamp: new Date(),
        quickReplies: [
          { label: '⬅️ Volver al menú', value: 'menu principal' }
        ]
      }]);
      return;
    }

    if (text === 'abrir whatsapp problema') {
      // Abrir WhatsApp para reportar problema de calidad
      window.open('https://wa.me/573042582777?text=Hola,%20tengo%20un%20problema%20de%20calidad%20con%20mi%20pedido', '_blank');
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: '✅ Abriendo WhatsApp para reportar tu problema...\n\nRecuerda enviar fotos del producto. Te ayudaremos lo antes posible.',
        sender: 'bot',
        timestamp: new Date(),
        quickReplies: [
          { label: '⬅️ Volver al menú', value: 'menu principal' }
        ]
      }]);
      return;
    }

    // --- Buscar primero en FAQ Local ---
    const localAnswer = findLocalAnswer(text);

    if (localAnswer) {
      // Simular "escribiendo..." para efecto natural
      setIsBotTyping(true);
      await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));
      setIsBotTyping(false);

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: localAnswer.response,
        sender: 'bot',
        timestamp: new Date(),
        quickReplies: localAnswer.followUp
      }]);
      return;
    }

    // --- Si no hay respuesta local, intentar n8n (si está configurado) ---
    setIsBotTyping(true);

    try {
      const { userId, cartContext } = await getUserContext();
      const history = messages.slice(-10).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text || (m.products ? '[Productos mostrados]' : '')
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history,
          userId,
          cartContext
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en servidor');
      }

      setIsBotTyping(false);

      if (data.timeline && Array.isArray(data.timeline)) {
        await processTimeline(data.timeline);
      } else {
        await processTimeline([
          { type: 'text', content: data.text || 'No entendí.' },
          { type: 'products', items: data.products || [] },
          { type: 'options', options: (data.suggestions || []).map((s: string) => ({ label: s, value: s })) }
        ]);
      }

    } catch (error) {
      console.error('Error n8n:', error);
      setIsBotTyping(false);

      // Fallback amigable cuando n8n no funciona
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: '🤔 No estoy seguro de cómo responder eso, pero puedo ayudarte con:\n\n• Información de envíos y cobertura\n• Métodos de pago\n• Horarios de atención\n• Contacto con un asesor\n\n¿Qué te gustaría saber?',
        sender: 'bot',
        timestamp: new Date(),
        quickReplies: [
          { label: '🚚 Envíos', value: 'envío' },
          { label: '💳 Pagos', value: 'pago' },
          { label: '📞 Hablar con asesor', value: 'contacto whatsapp' }
        ]
      }]);
    }
  };

  const handleProductAction = (product: ProductRef) => {
    const productToAdd: any = {
      id: product.id,
      name: product.name,
      price: product.price,
      description: product.description || '',
      main_image_url: product.image || '/placeholder.png',
      is_active: true,
      unit: 'unidad'
    };
    addItem(productToAdd, 1);

    // Añadimos mensaje de confirmación a la conversación
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: `¡Listo! He agregado **${product.name}** a tu carrito. 🛒`,
      sender: 'bot',
      timestamp: new Date(),
      quickReplies: [
        { label: '💳 Ir a pagar', value: 'pagar' },
        { label: '🛍️ Seguir comprando', value: 'seguir' }
      ]
    }]);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          hasInteractedRef.current = true;
          if (messages.length === 0) handleBotGreeting();
        }}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 bg-naranja-frutal hover:bg-orange-600 text-white rounded-full p-4 shadow-xl transition-all hover:scale-110 flex items-center justify-center group"
      >
        <MessageCircle className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        {!hasInteractedRef.current && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-10 fade-in duration-300 h-[600px] max-h-[80vh]">
      {/* Header */}
      <div className="bg-gradient-to-r from-verde-bosque to-[#2C5E1A] text-white p-4 flex items-center justify-between shadow-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-verde-bosque rounded-full"></div>
          </div>
          <div>
            <h3 className="font-bold text-sm md:text-base">Mayordomo Digital</h3>
            <p className="text-[10px] md:text-xs text-white/80 flex items-center gap-1">
              <span className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></span>
              En línea ahora
            </p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8FAF9]">
        {messages.map((message) => (
          <div key={message.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {message.text && (
              <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${message.sender === 'user'
                  ? 'bg-verde-bosque text-white rounded-br-none'
                  : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'
                  }`}>
                  <p dangerouslySetInnerHTML={{ __html: message.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                </div>
              </div>
            )}

            {/* Products Carousel */}
            {message.products && message.products.length > 0 && (
              <div className="mt-2 pl-2 grid gap-2">
                {message.products.map((product) => (
                  <div key={product.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow">
                    <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Sin foto</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 text-sm truncate">{product.name}</h4>
                      <div className="text-verde-bosque font-bold text-sm">${product.price.toLocaleString('es-CO')}</div>
                    </div>
                    <button
                      onClick={() => handleProductAction(product)}
                      className="bg-naranja-frutal hover:bg-orange-600 text-white p-2 rounded-lg shadow-sm transition-transform active:scale-95"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Replies / Buttons */}
            {message.quickReplies && message.quickReplies.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 justify-start pl-2">
                {message.quickReplies.map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(reply.value, reply.label)}
                    className="bg-white hover:bg-green-50 text-verde-bosque border border-verde-bosque/20 hover:border-verde-bosque px-4 py-2 rounded-full text-xs font-medium transition-all shadow-sm active:scale-95"
                  >
                    {reply.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isBotTyping && (
          <div className="flex justify-start animate-pulse pl-2">
            <div className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              <span className="text-xs text-gray-400 font-medium">Escribiendo...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-100 flex-shrink-0">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }} className="relative flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Escribe algo..."
            className="w-full pl-4 pr-12 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-verde-bosque/20 focus:bg-white transition-all text-sm"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isBotTyping}
            className="absolute right-2 p-2 bg-verde-bosque hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
