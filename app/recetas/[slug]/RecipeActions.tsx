'use client';

import { Printer, Share2 } from 'lucide-react';

interface RecipeActionsProps {
  recipeTitle: string;
}

export function RecipeActions({ recipeTitle }: RecipeActionsProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipeTitle,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Printer className="w-4 h-4" />
        Imprimir
      </button>
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Share2 className="w-4 h-4" />
        Compartir
      </button>
    </div>
  );
}
