'use client';

import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { importProductsFromCSV } from '@/lib/productStorage';

export function CSVImporter() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setMessage('Importando...');

      const products = await importProductsFromCSV(file);

      if (products.length > 0) {
        setMessage(`✅ ${products.length} productos importados exitosamente`);
      } else {
        setMessage('❌ Error: No se pudieron importar los productos');
      }
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        disabled={loading}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 disabled:opacity-50"
      >
        <Upload size={18} />
        {loading ? 'Importando...' : 'Importar CSV'}
      </button>
      {message && <span className="text-sm">{message}</span>}
    </div>
  );
}