export interface CustomerAddress {
  address: string;
  label?: string; // ej: "Casa", "Oficina", "Finca"
  isDefault?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  addresses: CustomerAddress[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerInput {
  name: string;
  email?: string;
  phone: string;
  addresses?: CustomerAddress[];
  notes?: string;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
  id: string;
}
