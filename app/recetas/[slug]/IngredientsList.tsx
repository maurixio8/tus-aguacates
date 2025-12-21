'use client';

import type { RecipeIngredient } from '@/data/recipes';
import { AddSingleIngredient } from './AddSingleIngredient';
import { AddIngredientsButton } from './AddIngredientsButton';

interface IngredientsListProps {
  ingredients: RecipeIngredient[];
}

export function IngredientsList({ ingredients }: IngredientsListProps) {
  const shopIngredients = ingredients.filter(ing => ing.productSlug);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span>🥗</span>
        Ingredientes
      </h2>

      <ul className="space-y-3 mb-6">
        {ingredients.map((ingredient, index) => (
          <li key={index} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-verde-aguacate flex-shrink-0 mt-0.5" />
            <div className="flex-grow">
              <div className="flex items-center flex-wrap gap-1">
                <span className="font-medium">{ingredient.quantity} {ingredient.unit}</span>
                {' '}
                <span className="text-gray-700">{ingredient.name}</span>
                {ingredient.isOptional && (
                  <span className="text-gray-400 text-sm">(opcional)</span>
                )}
                {ingredient.productSlug && !ingredient.isOptional && (
                  <AddSingleIngredient ingredient={ingredient} />
                )}
              </div>
              {ingredient.productNote && ingredient.productSlug && (
                <p className="text-xs text-gray-400 mt-0.5">
                  💡 {ingredient.productNote}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Botón de agregar todos los ingredientes al carrito */}
      {shopIngredients.length > 0 && (
        <AddIngredientsButton ingredients={shopIngredients} />
      )}
    </div>
  );
}
