'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { SearchModal } from '../search/SearchModal';

export function SearchTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar productos..."
          onClick={() => setOpen(true)}
          readOnly
          className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none cursor-pointer hover:border-gray-300 transition-colors bg-white text-gray-900 placeholder-gray-400"
        />
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}