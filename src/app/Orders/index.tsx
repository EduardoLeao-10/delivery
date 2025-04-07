// src/app/Orders/index.tsx
// src/app/Orders/index.tsx
import React, { useState, useEffect } from 'react';
import { database } from '../../services/firebaseConfig';
import { ref, onValue, remove } from 'firebase/database';
import { useRouter } from 'expo-router';
import {
    Container,
    Title,
    OrderItemContainer,
    OrderIdText,
    OrderItemDetailsText,
    OrderTotalText,
    ButtonsContainer,
    StyledButton,
    StyledText,
    StyledView,
    OrdersListContainer
} from './styles';
import { Order, OrderItem } from '../types';

interface OrderWithPayment extends Order {
    paymentValue?: number;
}

// --- COLE A FUNÇÃO AQUI ---
/**
 * Formata uma string de número de telefone para o formato (XX)XXXX-XXXX.
 * Lida com strings que podem ou não conter apenas dígitos.
 * Retorna string vazia se a entrada for inválida ou vazia.
 * Limita a 10 dígitos.
 */
const formatPhoneNumber = (value: string | undefined | null): string => {
    if (!value) return ""; // Retorna vazio se for null, undefined ou string vazia

    // 1. Remove tudo que não for dígito
    const digitsOnly = value.replace(/\D/g, "");

    // Retorna vazio se não houver dígitos após a limpeza
    if (!digitsOnly) return "";

    // 2. Limita a 10 dígitos
    const limitedDigits = digitsOnly.slice(0, 10);

    // 3. Aplica a máscara (XX)XXXX-XXXX
    let formatted = "";
    if (limitedDigits.length > 0) {
      formatted = `(${limitedDigits.slice(0, 2)}`;
    }
    // Só adiciona o parêntese de fechamento se houver mais de 2 dígitos
    if (limitedDigits.length > 2) {
      formatted += `)${limitedDigits.slice(2, 6)}`;
    }
    // Só adiciona o hífen se houver mais de 6 dígitos
    if (limitedDigits.length > 6) {
      formatted += `-${limitedDigits.slice(6, 10)}`;
    }

    return formatted;
};
// --- FIM DA FUNÇÃO COLADA ---


const Orders = () => {
    const [orders, setOrders] = useState<OrderWithPayment[]>([]);
    const router = useRouter();

    // Função formatCurrency (pode manter ou mover para utils também)
    const formatCurrency = (value: number): string => {
        return value.toLocaleString("pt-BR", {
            style: "decimal",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    useEffect(() => {
        const ordersRef = ref(database, 'pedidos');

        const unsubscribe = onValue(ordersRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const ordersList: OrderWithPayment[] = Object.entries(data).map(([orderId, orderData]: [string, any]) => {
                    const items: OrderItem[] = orderData.itens ? Object.values(orderData.itens) as OrderItem[] : [];
                    const total = items.reduce((sum, item) => sum + (item.total ?? 0), 0);
                    const paymentValue = orderData.paymentValue || 0;

                    const customerName = orderData.customerName || 'Não informado';
                    const customerAddress = orderData.customerAddress || 'Não informado';
                    // Pega o telefone do banco de dados (pode ser string vazia ou conter números/caracteres)
                    const customerPhone = orderData.customerPhone || ''; // Usar string vazia em vez de 'Não informado' para a função

                    return {
                        orderId: orderId,
                        items: items,
                        total: total,
                        customerName: customerName,
                        customerAddress: customerAddress,
                        customerPhone: customerPhone, // Armazena o valor original (ou vazio)
                        paymentValue: paymentValue,
                    };
                });
                setOrders(ordersList);
            } else {
                setOrders([]);
            }
        }, (error) => {
            console.error("Erro ao buscar pedidos:", error);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const handleDeleteOrder = async (orderId: string) => {
        const confirmDelete = window.confirm("Tem certeza que deseja excluir este pedido?");
        if (confirmDelete) {
            try {
                const orderRef = ref(database, `pedidos/${orderId}`);
                await remove(orderRef);
                alert("Pedido excluído com sucesso!");
            } catch (error) {
                console.error("Erro ao excluir pedido:", error);
                alert("Erro ao excluir pedido.");
            }
        }
    };

    const handleEditOrder = (orderId: string) => {
        router.push({
            pathname: '/OrderView',
            params: { orderId: String(orderId) },
        });
    };

    // --- USE A FUNÇÃO AQUI DENTRO ---
    const renderItem = ({ item: order }: { item: OrderWithPayment }) => (
        <OrderItemContainer>
            <OrderIdText>Pedido: {order.orderId}</OrderIdText>
            <OrderItemDetailsText>Cliente: {order.customerName}</OrderItemDetailsText>
            <OrderItemDetailsText>Endereço: {order.customerAddress}</OrderItemDetailsText>
            {/* --- APLICA A FORMATAÇÃO --- */}
            <OrderItemDetailsText>
                Telefone: {formatPhoneNumber(order.customerPhone)}
            </OrderItemDetailsText>
            {/* -------------------------- */}
            {order.items && order.items.length > 0 ? (
                order.items.map((item: OrderItem) => (
                    <StyledView key={item.id}>
                        <OrderItemDetailsText>{item.name} - Qtde: {item.quantity} - Total: R$ {item.total?.toFixed(2) ?? '0.00'}</OrderItemDetailsText>
                    </StyledView>
                ))
            ) : (
                <StyledText>Nenhum item neste pedido.</StyledText>
            )}
            <OrderTotalText>Total do Pedido: R$ {order.total ? order.total.toFixed(2) : '0.00'}</OrderTotalText>
            {order.paymentValue !== undefined && (
                <>
                    <OrderItemDetailsText>Valor Pago: R$ {order.paymentValue.toFixed(2)}</OrderItemDetailsText>
                    {/* Corrigido cálculo de troco para evitar NaN se total for undefined */}
                    <OrderItemDetailsText>Troco: R$ {(order.paymentValue - (order.total ?? 0)).toFixed(2)}</OrderItemDetailsText>
                </>
            )}
            <ButtonsContainer>
                <StyledButton variant="danger" onClick={() => handleDeleteOrder(order.orderId)}>
                    Excluir
                </StyledButton>
                <StyledButton variant="primary" onClick={() => handleEditOrder(order.orderId)}>
                    Editar
                </StyledButton>
            </ButtonsContainer>
        </OrderItemContainer>
    );
    // --- FIM DO USO DA FUNÇÃO ---

    return (
        <Container>

            <Title>Pedidos Anteriores</Title>
            <OrdersListContainer>
                {orders.map(order => renderItem({ item: order }))}
            </OrdersListContainer>

            <StyledView style={{ marginBottom: 20 }}>
    <StyledButton variant="secondary" onClick={() => router.push('/Home')}>
        Voltar para Home
    </StyledButton>
</StyledView>

        </Container>
    );
};

export default Orders;