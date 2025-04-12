// src/app/types.ts
// src/app/types.ts
// src/app/types.ts - VERSÃO CORRIGIDA

// src/app/types.ts - VERSÃO CORRIGIDA COM ADIÇÃO

export interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
}

// --- INTERFACE OrderItem CORRIGIDA ---
export interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
    category: string;
}
// --- FIM DA CORREÇÃO ---

// --- Interface Order (COM ADIÇÃO DO CAMPO observation) ---
export interface Order {
    orderId: string;
    items: OrderItem[];
    total: number;
    customerName: string;
    customerAddress: string;
    customerPhone: string;

    // Outros campos importantes do pedido
    paymentValue?: number;
    createdAt?: string | null;
    status?: 'aberto' | 'entregue' | 'cancelado' | string;
    totalOrderValue?: number;
    paymentMethod?: string; // Exemplo
    observation?: string; // <<< NOVO CAMPO ADICIONADO
}

// Interface auxiliar (opcional)
export interface FirebaseOrderItemData {
  id?: string;
  name?: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
  customerName?: string;
  customerAddress?: string;
  customerPhone?: string;
  category?: string;
}