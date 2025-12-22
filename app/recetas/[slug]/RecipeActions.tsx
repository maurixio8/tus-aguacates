'use client';

import { Printer, Share2 } from 'lucide-react';

interface RecipeActionsProps {
    title: string;
}

export function RecipeActions({ title }: RecipeActionsProps) {
    const handlePrint = () => {
        window.print();
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: title,
                url: window.location.href
            }).catch(err => console.log('Error sharing:', err));
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
