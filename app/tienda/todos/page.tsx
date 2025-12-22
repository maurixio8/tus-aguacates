import { permanentRedirect } from 'next/navigation';

// Redirección permanente (301) desde /tienda/todos hacia /tienda
export default function TodosProductosPage() {
  permanentRedirect('/tienda');
}