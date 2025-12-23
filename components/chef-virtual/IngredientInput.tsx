'use client';

import { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';

interface IngredientInputProps {
  ingredients: string[];
  onIngredientsChange: (ingredients: string[]) => void;
  maxIngredients?: number;
}

// Sugerencias de ingredientes comunes
const SUGGESTIONS = [
  'Aguacate',
  'Tomate',
  'Cebolla',
  'Limón',
  'Cilantro',
  'Ajo',
  'Banano',
  'Mango',
  'Fresas',
  'Lechuga',
  'Huevos',
  'Pollo',
  'Arroz',
  'Frijoles',
  'Papa',
  'Plátano',
  'Leche',
  'Queso',
  'Pan',
  'Sal',
  'Pimienta'
];

export function IngredientInput({
  ingredients,
  onIngredientsChange,
  maxIngredients = 20
}: IngredientInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = inputValue
    ? SUGGESTIONS.filter(s =>
        s.toLowerCase().includes(inputValue.toLowerCase()) &&
        !ingredients.includes(s)
      )
    : SUGGESTIONS.filter(s => !ingredients.includes(s));

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

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addIngredient(inputValue);
    }
  };

  return (
    <div className="w-full">
      {/* Input field */}
      <div className="relative">
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-aguacate"
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
            className="px-4 py-3 bg-verde-aguacate text-white rounded-lg hover:bg-verde-bosque transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Sugerencias */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addIngredient(suggestion)}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tags de ingredientes seleccionados */}
      {ingredients.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {ingredients.map((ingredient) => (
            <span
              key={ingredient}
              className="inline-flex items-center gap-1 px-3 py-1 bg-verde-aguacate/10 text-verde-bosque rounded-full text-sm"
            >
              {ingredient}
              <button
                type="button"
                onClick={() => removeIngredient(ingredient)}
                className="hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          ))}
          <span className="text-sm text-gray-500">
            {ingredients.length} / {maxIngredients}
          </span>
        </div>
      )}

      {/* Sugerencias rápidas */}
      {ingredients.length === 0 && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Sugerencias rápidas:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.slice(0, 8).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addIngredient(suggestion)}
                className="px-3 py-1 bg-gray-100 hover:bg-verde-aguacate/20 text-gray-700 hover:text-verde-bosque rounded-full text-sm transition-colors"
              >
                + {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
