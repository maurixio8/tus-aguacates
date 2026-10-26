export type ComboComponent = { name: string; quantity: number; unit?: string; variant?: string };

export const COMBO_COMPONENTS_BY_NAME: Record<string, ComboComponent[]> = {
  'combo ahorro #1': [
    { name: 'Caja de 24 unidades hass mediano', quantity: 1, unit: 'caja', variant: '24 unidades' },
    { name: 'Arándanos Orgánicos', quantity: 1, unit: 'paq', variant: 'X250grs' },
  ],
  'combo ahorro #2': [
    { name: 'Kiwis', quantity: 2, unit: 'bandeja', variant: '450g' },
    { name: 'Fresas premium', quantity: 1, unit: 'kg', variant: '1kg' },
  ],
  'combo ahorro #3': [
    { name: 'Fresas premium', quantity: 1, unit: 'contenedor', variant: '500g' },
    { name: 'Arándanos Orgánicos', quantity: 1, unit: 'paq', variant: 'X250grs' },
    { name: 'Paquete 4 Unidades injerto', quantity: 1, unit: 'paq', variant: '4 unidades' },
  ],
  'combo aceite y caja de aguacate': [
    { name: 'Botella de aceite', quantity: 1, unit: 'unidad', variant: '250 ml' },
    { name: 'Caja de 24 unidades hass mediano', quantity: 1, unit: 'caja', variant: '24 unidades' },
  ],
  'combo premium': [
    { name: 'Botella de aceite', quantity: 1, unit: 'unidad', variant: '250 ml' },
    { name: 'Caja de 12 unidades Premium', quantity: 1, unit: 'caja', variant: '12 unidades' },
  ],
  'nuevo combo 4': [
    { name: 'Arándanos Orgánicos', quantity: 1, unit: 'paq', variant: 'X250grs' },
    { name: 'Fresas premium', quantity: 1, unit: 'kg', variant: '1000 gr' },
    { name: 'Caja de 24 unidades hass mediano', quantity: 1, unit: 'caja', variant: '24 unidades' },
  ],
  'combo mercado semanal completo': [
    { name: 'Caja de 24 unidades hass mediano', quantity: 1, unit: 'caja', variant: '24 unidades' },
    { name: 'Fresa Económica', quantity: 1, unit: 'paq', variant: '500grs' },
    { name: 'Banano criollo', quantity: 1, unit: 'kg', variant: '1 Kilo' },
    { name: 'Tomate chonto', quantity: 1, unit: 'lb', variant: '500 gr' },
    { name: 'Cebolla cabezona', quantity: 1, unit: 'lb', variant: '500 gr' },
    { name: 'Papa Sabanera', quantity: 1, unit: 'lb', variant: 'X 500 grs' },
    { name: 'Zanahoria', quantity: 1, unit: 'lb', variant: '500 gr' },
    { name: 'Pasta de Ajo', quantity: 1, unit: 'unidad', variant: 'x100 gr' },
    { name: 'Arándanos Orgánicos', quantity: 1, unit: 'paq', variant: 'X125grs' },
    { name: 'Uva isabelina', quantity: 1, unit: 'bandeja', variant: '400grs' },
    { name: 'Duraznos', quantity: 1, unit: 'lb', variant: '500 gr' },
    { name: 'Limón Tahiti', quantity: 1, unit: 'kg', variant: '1000 gr' },
  ],
  'combo navideño premium': [
    { name: 'Caja de 12 unidades Premium', quantity: 1, unit: 'caja', variant: '12 unidades' },
    { name: 'Uva chilena importada', quantity: 1, unit: 'paq', variant: '500 grs' },
    { name: 'Cerezas', quantity: 1, unit: 'paq', variant: '125 grs' },
  ],
};

export function comboComponentsFor(productId: string | undefined, name: string): ComboComponent[] | null {
  const key = name.trim().toLowerCase();
  return COMBO_COMPONENTS_BY_NAME[key] || Object.entries(COMBO_COMPONENTS_BY_NAME).find(([known]) => key.includes(known) || known.includes(key))?.[1] || null;
}
