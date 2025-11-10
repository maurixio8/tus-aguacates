'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, ShoppingCart } from 'lucide-react';
import { supabase, Product } from '@/lib/supabase';
import { useCartStore } from '@/lib/cart-store';

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  products?: Product[];
  quickReplies?: string[];
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCartStore();

  // Mostrar automáticamente el chatbot después de 3 segundos en la primera visita
  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem('chatbot_visited');
    
    if (!hasVisitedBefore) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        localStorage.setItem('chatbot_visited', 'true');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addBotMessage = useCallback((text: string, quickReplies?: string[], products?: Product[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'bot',
      timestamp: new Date(),
      quickReplies,
      products
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0 && !hasShownWelcome) {
      // Mensaje de bienvenida
      setTimeout(() => {
        addBotMessage(
          '¡Hola! Soy tu asistente de Tus Aguacates. ¿En qué puedo ayudarte hoy?',
          [
            'Ver productos populares',
            'Horarios de entrega',
            'Cómo hacer un pedido',
            'Zonas de entrega'
          ]
        );
        setHasShownWelcome(true);
      }, 300);
    }
  }, [isOpen, messages.length, hasShownWelcome, addBotMessage]);

  const addUserMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    addUserMessage(text);
    setInputValue('');
    setIsTyping(true);

    // Simular tiempo de respuesta
    await new Promise(resolve => setTimeout(resolve, 800));

    const lowerText = text.toLowerCase();

    // Respuestas basadas en palabras clave
    if (lowerText.includes('horario') || lowerText.includes('entrega') || lowerText.includes('cuando')) {
      addBotMessage(
        'Realizamos entregas los martes y viernes en Bogotá. Puedes hacer tu pedido en cualquier momento y te contactaremos para coordinar la entrega en el próximo día disponible.',
        ['Ver productos', 'Métodos de pago', 'Hacer un pedido']
      );
    } else if (lowerText.includes('pago') || lowerText.includes('pagar')) {
      addBotMessage(
        'Aceptamos los siguientes métodos de pago:\n• Efectivo\n• Transferencia bancaria\n• PSE\n• Tarjeta de crédito/débito\n\nNos pondremos en contacto contigo después de tu pedido para coordinar el método de pago.',
        ['Ver productos', 'Hacer un pedido']
      );
    } else if (lowerText.includes('zona') || lowerText.includes('dónde') || lowerText.includes('ubicación')) {
      addBotMessage(
        'Actualmente realizamos entregas únicamente en Bogotá. Próximamente estaremos expandiendo nuestras zonas de cobertura.',
        ['Ver productos', 'Horarios de entrega']
      );
    } else if (lowerText.includes('popular') || lowerText.includes('producto') || lowerText.includes('qué venden')) {
      // Mostrar productos populares
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .limit(4);

      if (products && products.length > 0) {
        addBotMessage(
          'Aquí están algunos de nuestros productos más populares. ¡Haz clic en "Agregar" para añadirlos a tu carrito!',
          ['Ver más productos', 'Horarios de entrega'],
          products
        );
      } else {
        addBotMessage(
          'Tenemos una gran variedad de frutas y verduras frescas del Eje Cafetero. ¿Te gustaría ver nuestro catálogo completo?',
          ['Ver todos los productos', 'Aguacates', 'Frutas tropicales']
        );
      }
    } else if (lowerText.includes('pedido') || lowerText.includes('comprar') || lowerText.includes('cómo')) {
      addBotMessage(
        'Hacer un pedido es muy fácil:\n\n1. Explora nuestros productos\n2. Agrega lo que te guste al carrito\n3. Ve al carrito y completa tus datos\n4. ¡Listo! Nos pondremos en contacto contigo\n\n¿Quieres ver nuestros productos?',
        ['Ver productos', 'Ver aguacates', 'Horarios de entrega']
      );
    } else if (lowerText.includes('aguacate')) {
      // Buscar aguacates
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .ilike('name', '%aguacate%')
        .limit(4);

      if (products && products.length > 0) {
        addBotMessage(
          '¡Nuestros deliciosos aguacates del Eje Cafetero!',
          ['Ver más productos', 'Hacer un pedido'],
          products
        );
      }
    } else {
      addBotMessage(
        'No estoy seguro de cómo ayudarte con eso, pero aquí hay algunas cosas que puedo hacer por ti:',
        [
          'Ver productos populares',
          'Horarios de entrega',
          'Métodos de pago',
          'Zonas de entrega'
        ]
      );
    }

    setIsTyping(false);
  };

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply);
  };

  const handleAddToCart = (product: Product) => {
    addItem(product);
    addBotMessage(
      `¡${product.name} agregado al carrito! ¿Algo más que te gustaría agregar?`,
      ['Ver más productos', 'Ir al carrito', 'Finalizar pedido']
    );
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-verde-bosque hover:bg-verde-bosque-600 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110"
        aria-label="Abrir chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="gradient-verde text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold">Asistente Tus Aguacates</h3>
            <p className="text-xs text-white/80">En línea</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-white/20 p-2 rounded-full transition-colors"
          aria-label="Cerrar chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96 bg-gray-50">
        {messages.map((message) => (
          <div key={message.id}>
            <div
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.sender === 'user'
                    ? 'bg-verde-bosque text-white'
                    : 'bg-white text-gray-800 shadow-sm'
                }`}
              >
                <p className="text-sm whitespace-pre-line">{message.text}</p>
              </div>
            </div>

            {/* Products */}
            {message.products && message.products.length > 0 && (
              <div className="mt-3 space-y-2">
                {message.products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg shadow-sm p-3 flex items-center gap-3"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0">
                      {product.main_image_url && (
                        <img
                          src={product.main_image_url}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900 truncate">
                        {product.name}
                      </h4>
                      <p className="text-sm font-bold text-verde-bosque">
                        ${(product.discount_price || product.price).toLocaleString('es-CO')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="bg-verde-bosque hover:bg-verde-bosque-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      Agregar
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Replies */}
            {message.quickReplies && message.quickReplies.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {message.quickReplies.map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickReply(reply)}
                    className="bg-white hover:bg-gray-50 text-verde-bosque border border-verde-bosque px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputValue);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Escribe tu mensaje..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-verde-bosque focus:border-transparent text-sm"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="bg-verde-bosque hover:bg-verde-bosque-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 rounded-full transition-colors"
            aria-label="Enviar mensaje"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
