'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, ShoppingCart, Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/lib/cart-store';
import { getMessageGreeting } from '@/lib/greetings';
import React from 'react';

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
  delay?: number;    // Para 'text': espera DESPUÉS de mostrar
  duration?: number; // Para 'typing': cuánto tiempo muestra "Escribiendo..."
  options?: Array<{ label: string; value: string }>;
  items?: ProductRef[];
}

interface Message {
  id: string;
  text?: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  products?: ProductRef[];
  quickReplies?: Array<{ label: string; value: string }>; // Estructura unificada
  isTyping?: boolean; // Para mostrar burbuja de "..."
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false); // Estado global de typing del bot
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addItem, items: cartItems, getSubtotal } = useCartStore();
  const hasInteractedRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isBotTyping]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasInteractedRef.current && !hasAutoOpened) {
        setIsOpen(true);
        setHasAutoOpened(true);
        if (messages.length === 0) handleBotGreeting();
        if (typeof window !== 'undefined') localStorage.setItem('chatbot_visited_v2', 'true');
      }
    }, 20000);
    return () => clearTimeout(timer);
  }, [hasAutoOpened, messages.length]);

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

    // Mensaje inicial hardcoded pero con estructura compatible
    setMessages([{
      id: 'welcome',
      text: `${fullGreeting}\n¿En qué puedo ayudarte hoy?`,
      sender: 'bot',
      timestamp: new Date(),
      quickReplies: [
        { label: '🥑 Aguacates Hass', value: 'intent_avocados' },
        { label: '🧺 Combos & Mercado', value: 'intent_market' },
        { label: '🔥 Ver ofertas', value: 'intent_offers' }
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

    // Si viene de un botón (label), mostramos el label, pero enviamos el value (text) por debajo si fuera necesario
    // Por simplicidad, mostramos lo que se envía.
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
    setIsBotTyping(true); // Feedback inmediato

    try {
      const { userId, cartContext } = await getUserContext();
      // Historial para contexto: Convertimos a formato simple para la API
      const history = messages.slice(-10).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text || (m.products ? '[Productos mostrados]' : '')
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text, // Enviamos el valor real (value del botón o input)
          history,
          userId,
          cartContext
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error en servidor');

      setIsBotTyping(false); // Apagamos el typing "falso" inicial para dar paso al timeline real

      if (data.timeline && Array.isArray(data.timeline)) {
        await processTimeline(data.timeline);
      } else {
        // Fallback porsiaca n8n manda formato antiguo
        await processTimeline([
          { type: 'text', content: data.text || 'No entendí.' },
          { type: 'products', items: data.products || [] },
          { type: 'options', options: (data.suggestions || []).map((s: string) => ({ label: s, value: s })) }
        ]);
      }

    } catch (error) {
      console.error('Error:', error);
      setIsBotTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: 'Tuve un pequeño problema de conexión. ¿Intentamos de nuevo? 🔌',
        sender: 'bot',
        timestamp: new Date()
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
        {!hasInteractedRef.current && !hasAutoOpened && (
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
