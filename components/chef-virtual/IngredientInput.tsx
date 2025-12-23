'use client';

import { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';

interface IngredientInputProps {
  ingredients: string[];
  onIngredientsChange: (ingredients: string[]) => void;
  maxIngredients?: number;
}

// 20 ingredientes sugeridos con emojis
const SUGGESTED_INGREDIENTS = [
  { name: 'Aguacate', emoji: '🥑' },
  { name: 'Tomate', emoji: '🍅' },
  { name: 'Cebolla', emoji: '🧅' },
  { name: 'Limón', emoji: '🍋' },
  { name: 'Cilantro', emoji: '🌿' },
  { name: 'Ajo', emoji: '🧄' },
  { name: 'Banano', emoji: '🍌' },
  { name: 'Mango', emoji: '🥭' },
  { name: 'Fresas', emoji: '🍓' },
  { name: 'Lechuga', emoji: '🥬' },
  { name: 'Huevos', emoji: '🥚' },
  { name: 'Pollo', emoji: '🍗' },
  { name: 'Arroz', emoji: '🍚' },
  { name: 'Frijoles', emoji: '🫘' },
  { name: 'Papa', emoji: '🥔' },
  { name: 'Plátano', emoji: '🍌' },
  { name: 'Leche', emoji: '🥛' },
  { name: 'Queso', emoji: '🧀' },
  { name: 'Pan', emoji: '🍞' },
  { name: 'Pimienta', emoji: '🫙' }
];

export function IngredientInput({
  ingredients,
  onIngredientsChange,
  maxIngredients = 20
}: IngredientInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = inputValue
    ? SUGGESTED_INGREDIENTS.filter(s =>
        s.name.toLowerCase().includes(inputValue.toLowerCase())
      )
    : SUGGESTED_INGREDIENTS;

  const addIngredient = (ingredient: string) => {
    const trimmed = ingredient.trim();
    if (trimmed && !ingredients.includes(trimmed)) {
      if (ingredients.length >= maxIngredients) {
        alert(`Máximo ${maxIngredients} ingredientes permitidos`);
        return;
      }
      onIngredientsChange([...ingredients, trimmed]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const removeIngredient = (ingredient: string) => {
    onIngredientsChange(ingredients.filter(i => i !== ingredient));
  };

  const toggleIngredient = (ingredient: string) => {
    if (ingredients.includes(ingredient)) {
      removeIngredient(ingredient);
    } else {
      addIngredient(ingredient);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addIngredient(inputValue);
    }
  };

  const isSelected = (ingredient: string) => ingredients.includes(ingredient);

  return (
    <div className="w-full">
      {/* Input field */}
      <div className="relative mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowSuggestions(e.target.value.length > 0);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Escribe un ingrediente y presiona Enter..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-verde-aguacate focus:border-verde-aguacate transition-all"
              disabled={ingredients.length >= maxIngredients}
            />
            {ingredients.length >= maxIngredients && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                Máximo alcanzado
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => inputValue && addIngredient(inputValue)}
            disabled={!inputValue.trim() || ingredients.length >= maxIngredients}
            className="px-5 py-3 bg-gradient-to-r from-verde-aguacate to-verde-bosque text-white rounded-xl hover:from-verde-bosque hover:to-verde-bosque transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Sugerencias dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion.name}
                type="button"
                onClick={() => addIngredient(suggestion.name)}
                className={`w-full px-4 py-3 text-left hover:bg-verde-aguacate/10 transition-colors flex items-center gap-3 ${
                  isSelected(suggestion.name) ? 'bg-verde-aguacate/20 text-verde-bosque' : ''
                }`}
              >
                <span className="text-xl">{suggestion.emoji}</span>
                <span>{suggestion.name}</span>
                {isSelected(suggestion.name) && (
                  <span className="ml-auto text-verde-bosque text-sm">✓ Seleccionado</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tags de ingredientes seleccionados */}
      {ingredients.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          {ingredients.map((ingredient) => (
            <span
              key={ingredient}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-verde-aguacate/20 to-verde-bosque/20 text-verde-bosque rounded-full text-sm font-medium border-2 border-verde-aguacate/30 animate-in fade-in zoom-in-95 duration-200"
            >
              {ingredient}
              <button
                type="button"
                onClick={() => removeIngredient(ingredient)}
                className="hover:text-red-600 transition-colors hover:scale-110 transform"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          ))}
          <span className="text-sm text-gray-500 flex items-center">
            {ingredients.length} / {maxIngredients}
          </span>
        </div>
      )}

      {/* Sugerencias rápidas - Botones visuales */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="text-lg">✨</span>
          Ingredientes populares (toca para seleccionar):
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {SUGGESTED_INGREDIENTS.map((item) => {
            const selected = isSelected(item.name);
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => toggleIngredient(item.name)}
                className={`
                  relative overflow-hidden group px-3 py-3 rounded-xl font-medium text-sm
                  transition-all duration-300 transform hover:scale-105 hover:shadow-md
                  ${selected
                    ? 'bg-gradient-to-br from-verde-aguacate to-verde-bosque text-white shadow-md'
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-verde-aguacate hover:bg-verde-aguacate/5'
                  }
                `}
              >
                <span className="relative z-10 flex flex-col items-center gap-1">
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-xs">{item.name}</span>
                </span>
                {/* Efecto de brillo en hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />

                {/* Indicador de seleccionado */}
                {selected && (
                  <div className="absolute top-1 right-1 w-5 h-5 bg-white/30 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
}
