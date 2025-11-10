'use client';

import { useEffect, useRef, useState } from 'react';

interface AddressAutocompleteProps {
  onAddressSelect: (address: {
    fullAddress: string;
    street: string;
    number: string;
    city: string;
    state: string;
    postalCode: string;
  }) => void;
  value: string;
  error?: string;
}

export function AddressAutocomplete({ onAddressSelect, value, error }: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    // Cargar el script de Google Maps si no está cargado
    if (typeof window !== 'undefined' && !window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&language=es`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsLoaded(true);
      document.head.appendChild(script);
    } else if (window.google) {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && inputRef.current && window.google && !autocompleteRef.current) {
      // Inicializar el autocompletado
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'co' },
        fields: ['address_components', 'formatted_address', 'geometry'],
        types: ['address']
      });

      // Escuchar cambios en el lugar seleccionado
      autocompleteRef.current.addListener('place_changed', () => {
        if (autocompleteRef.current) {
          const place = autocompleteRef.current.getPlace();
          
          if (place.address_components) {
            let street = '';
            let number = '';
            let city = '';
            let state = '';
            let postalCode = '';

            place.address_components.forEach((component) => {
              const types = component.types;
              
              if (types.includes('route')) {
                street = component.long_name;
              }
              if (types.includes('street_number')) {
                number = component.long_name;
              }
              if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                city = component.long_name;
              }
              if (types.includes('administrative_area_level_1')) {
                state = component.long_name;
              }
              if (types.includes('postal_code')) {
                postalCode = component.long_name;
              }
            });

            onAddressSelect({
              fullAddress: place.formatted_address || '',
              street: street,
              number: number,
              city: city || 'Bogotá',
              state: state || 'Cundinamarca',
              postalCode: postalCode
            });
          }
        }
      });
    }
  }, [isLoaded, onAddressSelect]);

  if (!isLoaded) {
    return (
      <div>
        <input
          type="text"
          disabled
          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
          placeholder="Cargando..."
        />
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        defaultValue={value}
        className={`w-full px-4 py-3 border ${
          error ? 'border-red-500' : 'border-gray-300'
        } rounded-lg focus:ring-2 focus:ring-verde-bosque focus:border-transparent`}
        placeholder="Calle 123, Bogotá..."
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
