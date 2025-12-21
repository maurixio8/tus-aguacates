'use client';

import { Printer, Share2 } from 'lucide-react';

interface RecipeActionsProps {
  title: string;
}

export function RecipeActions({ title }: RecipeActionsProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: window.location.href
        });
      } catch (error) {
        // User cancelled or error
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado al portapapeles');
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
