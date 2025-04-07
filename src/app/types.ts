// src/app/types.ts
// src/app/types.ts
export interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
}

export interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
    category: string;
    customerName: string;
    customerAddress: string;
    customerPhone: string;
}

export interface Order {
    orderId: string;
    items: OrderItem[];
    total: number;
    customerName: string;
    customerAddress: string;
    customerPhone: string;
}

// ADICIONE ESTA LINHA:
export interface FirebaseOrderItemData {
  name?: string;  // Use '?' para indicar propriedades opcionais
  quantity?: number;
  unitPrice?: number;
  total?: number;
  customerName?: string;
  customerAddress?: string;
  customerPhone?: string;
  category?: string;
}
