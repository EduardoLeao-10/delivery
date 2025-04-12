// src/app/Orders/index.tsx
// src/app/Orders/index.tsx

// Adicionar useRef e useCallback aos imports do React
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { database } from '../../services/firebaseConfig';
import { ref, onValue, remove, update } from 'firebase/database';
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
    OrdersListContainer,
    OrderStatusContainer,
    TimeBadge,
    PaymentBadge,
    StatusBadge,
    colors,
    fontSize,
    spacing, // <<< IMPORTAR spacing SE NECESSÁRIO PARA MARGENS
    StyledTextArea, // <<< IMPORTAR O NOVO ESTILO
} from './styles';
// Importa os tipos CORRIGIDOS de '../types' - Order já deve ter 'observation'
import { Order, OrderItem } from '../types';

// --- Interfaces ---
// Esta interface estende a 'Order' corrigida e adiciona observation
interface OrderWithPayment extends Order {
    paymentValue?: number;
    createdAt?: string | null;
    status?: 'aberto' | 'entregue' | 'cancelado' | string;
    totalOrderValue?: number;
    observation?: string; // <<< ADICIONADO AQUI
}

// --- Funções Utilitárias (sem alterações) ---
// ... (formatCurrency, formatPhoneNumber, etc. permanecem iguais) ...
const formatCurrency = (value: number | null | undefined): string => {
    const numericValue = value ?? 0;
    return numericValue.toLocaleString("pt-BR", {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const formatPhoneNumber = (value: string | undefined | null): string => {
    if (!value) return "";
    const digitsOnly = value.replace(/\D/g, "");
    if (!digitsOnly) return "";

    if (digitsOnly.length <= 10) {
        const match = digitsOnly.match(/^(\d{2})(\d{4})(\d{4})$/);
        if (match) return `(${match[1]}) ${match[2]}-${match[3]}`;
    } else {
        const match = digitsOnly.slice(0, 11).match(/^(\d{2})(\d{5})(\d{4})$/);
        if (match) return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    if (digitsOnly.length > 2) {
        return `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2)}`;
    }
    return digitsOnly;
};

const calculateMinutesElapsed = (isoDateString: string | null | undefined): number | null => {
    if (!isoDateString) return null;
    try {
        const pastDate = new Date(isoDateString);
        const now = new Date();
        if (isNaN(pastDate.getTime())) {
           console.warn("Data inválida recebida:", isoDateString);
           return null;
        }
        const diffMs = now.getTime() - pastDate.getTime();
        if (diffMs < 0) return null;
        return Math.floor(diffMs / (1000 * 60));
    } catch (e) {
        console.error("Erro ao parsear data para cálculo de minutos:", isoDateString, e);
        return null;
    }
};

const formatTimeElapsed = (minutes: number | null): string => {
    if (minutes === null) return "Tempo Indisp.";
    if (minutes < 1) return "Agora";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}min`;
};
// --- Fim Funções Utilitárias ---


// --- Componente ObservationInput --- <<< NOVO COMPONENTE INTERNO
interface ObservationInputProps {
    orderId: string;
    initialValue: string; // Valor inicial vindo do Firebase
}

const ObservationInput: React.FC<ObservationInputProps> = ({ orderId, initialValue }) => {
    const [text, setText] = useState(initialValue);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Atualiza o estado local se o valor inicial (do Firebase) mudar externamente
    useEffect(() => {
        setText(initialValue);
    }, [initialValue]);

    // Função para salvar no Firebase (será debounced)
    const saveObservation = useCallback(async (newText: string) => {
        console.log(`[ObservationInput] Salvando observação para ${orderId}: "${newText}"`);
        try {
            const orderRef = ref(database, `pedidos/${orderId}`);
            await update(orderRef, { observation: newText });
            console.log(`[ObservationInput] Observação para ${orderId} salva com sucesso.`);
        } catch (error) {
            console.error(`[ObservationInput] Erro ao salvar observação para ${orderId}:`, error);
            // Poderia adicionar um feedback visual de erro aqui
        }
    }, [orderId]); // Depende apenas do orderId

    // Efeito para lidar com o debouncing
    useEffect(() => {
        // Limpa o timeout anterior se o texto mudar novamente antes de salvar
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // Só agenda o salvamento se o texto atual for diferente do inicial
        // Isso evita salvar na montagem inicial ou se o texto não mudou
        if (text !== initialValue) {
            debounceTimeoutRef.current = setTimeout(() => {
                saveObservation(text);
            }, 1500); // Salva 1.5 segundo (1500ms) após parar de digitar
        }

        // Limpa o timeout ao desmontar o componente ou antes do próximo efeito
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [text, initialValue, saveObservation]); // Depende do texto atual, valor inicial e da função de salvar

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(event.target.value); // Atualiza o estado local imediatamente
    };

    return (
        <StyledTextArea
            value={text}
            onChange={handleChange}
            placeholder="Adicionar observação..."
            rows={3} // Sugestão de altura inicial
        />
    );
};
// --- FIM DO COMPONENTE ObservationInput ---


// --- Componente Principal Orders ---
const Orders = () => {
    const [orders, setOrders] = useState<OrderWithPayment[]>([]);
    const router = useRouter();

    // Efeito para buscar os pedidos do Firebase em tempo real
    useEffect(() => {
        const ordersRef = ref(database, 'pedidos');
        console.log("[Orders] Iniciando listener para /pedidos");

        const unsubscribe = onValue(ordersRef, (snapshot) => {
            console.log("[Orders] Dados recebidos do Firebase");
            if (snapshot.exists()) {
                const data = snapshot.val();

                const mappedList = Object.entries(data)
                  .map(([orderId, orderData]: [string, any]): OrderWithPayment | null => {
                    if (!orderData || typeof orderData !== 'object') {
                        console.warn(`[Orders] Ignorando dado inválido para orderId ${orderId}:`, orderData);
                        return null;
                    }

                    // Mapeia os itens
                    const items: OrderItem[] = orderData.itens && typeof orderData.itens === 'object'
                        ? Object.values(orderData.itens).map((item: any): OrderItem => ({
                            id: item?.id ?? Math.random().toString(36).substring(7),
                            name: item?.name ?? 'Item Desconhecido',
                            quantity: item?.quantity ?? 0,
                            unitPrice: item?.unitPrice ?? 0,
                            total: item?.total ?? 0,
                            category: item?.category ?? 'Sem Categoria',
                        }))
                        : [];

                    // Calcula totais e outros campos
                    const calculatedTotalFromItems = items.reduce((sum, item) => sum + (item?.total ?? 0), 0);
                    const total = typeof orderData.totalOrderValue === 'number' && orderData.totalOrderValue >= 0
                                     ? orderData.totalOrderValue
                                     : calculatedTotalFromItems;
                    const paymentValue = typeof orderData.paymentValue === 'number' ? orderData.paymentValue : 0;
                    const createdAt = orderData.createdAt || null;
                    const status = orderData.status || 'aberto';
                    const observation = orderData.observation || ''; // <<< LER A OBSERVAÇÃO DO FIREBASE

                    // Monta o objeto OrderWithPayment
                    return {
                        orderId: orderId,
                        items: items,
                        total: total,
                        customerName: orderData.customerName || 'Não informado',
                        customerAddress: orderData.customerAddress || 'Não informado',
                        customerPhone: orderData.customerPhone || '',
                        paymentValue: paymentValue,
                        createdAt: createdAt,
                        status: status,
                        totalOrderValue: total,
                        observation: observation, // <<< INCLUIR NO OBJETO
                    };
                  });

                const filteredList: OrderWithPayment[] = mappedList
                    .filter((order: OrderWithPayment | null): order is OrderWithPayment => order !== null);

                // Ordena a lista
                filteredList.sort((a, b) => {
                    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return timeB - timeA; // Mais recentes primeiro
                });

                console.log(`[Orders] Processados ${filteredList.length} pedidos.`);
                setOrders(filteredList);

            } else {
                console.log("[Orders] Nenhum pedido encontrado no Firebase.");
                setOrders([]);
            }
        }, (error) => {
            console.error("[Orders] Erro ao buscar pedidos:", error);
            alert("Erro ao carregar pedidos. Verifique o console.");
            setOrders([]);
        });

        // Função de limpeza para remover o listener ao desmontar
        return () => {
            console.log("[Orders] Removendo listener de /pedidos");
            unsubscribe();
        };
    }, []); // Array de dependências vazio, executa apenas na montagem

    // --- Funções Handler (sem alterações necessárias aqui) ---
    const handleDeleteOrder = async (orderId: string) => {
        // ... (código existente)
         console.log(`[DEBUG] Iniciando handleDeleteOrder para ID: ${orderId}`);
        if (!orderId) {
            console.warn("[DEBUG] Tentativa de deletar pedido sem ID.");
            alert("ID do pedido inválido.");
            return;
        }
        const confirmDelete = window.confirm(`Tem certeza que deseja EXCLUIR o pedido ${orderId}? Esta ação não pode ser desfeita.`);
        if (confirmDelete) {
            try {
                const orderRef = ref(database, `pedidos/${orderId}`);
                await remove(orderRef);
                console.log("[DEBUG] Pedido excluído com sucesso:", orderId);
                alert("Pedido excluído com sucesso!");
            } catch (error) {
                console.error("[DEBUG] Erro ao excluir pedido:", orderId, error);
                alert("Erro ao excluir pedido. Verifique o console e suas permissões do Firebase.");
            }
        } else {
            console.log("[DEBUG] Exclusão cancelada.");
        }
    };

    const handleEditOrder = (orderId: string) => {
        // ... (código existente)
          console.log(`[DEBUG] Iniciando handleEditOrder para ID: ${orderId}`);
         if (!orderId) {
            console.warn("[DEBUG] Tentativa de editar pedido sem ID.");
            alert("ID do pedido inválido.");
            return;
        }
        try {
            router.push({
                pathname: '/OrderView', // Confirme se a rota está correta
                params: { orderId: orderId },
            });
        } catch (error) {
            console.error("[DEBUG] Erro ao navegar para OrderView:", error);
            alert("Erro ao tentar navegar para a edição do pedido.");
        }
    };

    const handleChangeOrderStatus = async (orderId: string, newStatus: 'aberto' | 'entregue' | 'cancelado') => {
        // ... (código existente)
        console.log(`[DEBUG] Iniciando handleChangeOrderStatus para ID: ${orderId}, Novo Status: ${newStatus}`);
        if (!orderId) {
            console.warn("[DEBUG] Tentativa de mudar status sem ID.");
            alert("ID do pedido inválido.");
            return;
        }
        try {
            const orderRef = ref(database, `pedidos/${orderId}`);
            await update(orderRef, { status: newStatus });
            console.log(`[DEBUG] Status do pedido ${orderId} atualizado para ${newStatus}.`);
        } catch (error) {
            console.error(`[DEBUG] Erro ao atualizar status do pedido ${orderId} para ${newStatus}:`, error);
            alert("Erro ao atualizar status do pedido.");
        }
    };

    const handleMarkAsPaid = async (orderId: string, totalAmount: number) => {
        // ... (código existente)
        console.log(`[DEBUG] Iniciando handleMarkAsPaid para ID: ${orderId}, Valor: ${totalAmount}`);
        if (!orderId) {
            console.warn("[DEBUG] Tentativa de marcar como pago sem ID.");
            alert("ID do pedido inválido.");
            return;
        }
        if (typeof totalAmount !== 'number' || totalAmount < 0) {
             console.warn(`[DEBUG] Tentativa de marcar como pago com valor total inválido: ${totalAmount}`);
             alert("Valor total do pedido inválido para marcar como pago.");
             return;
        }
        try {
            const orderRef = ref(database, `pedidos/${orderId}`);
            await update(orderRef, { paymentValue: totalAmount });
            console.log(`[DEBUG] Pedido ${orderId} marcado como PAGO (paymentValue = ${totalAmount}).`);
        } catch (error) {
            console.error(`[DEBUG] Erro ao marcar pedido ${orderId} como PAGO:`, error);
            alert("Erro ao marcar pedido como pago. Verifique o console.");
        }
    };

    const handleMarkAsOwed = async (orderId: string) => {
        // ... (código existente)
        console.log(`[DEBUG] Iniciando handleMarkAsOwed para ID: ${orderId}`);
        if (!orderId) {
            console.warn("[DEBUG] Tentativa de marcar como devido sem ID.");
            alert("ID do pedido inválido.");
            return;
        }
        try {
            const orderRef = ref(database, `pedidos/${orderId}`);
            await update(orderRef, { paymentValue: 0 });
            console.log(`[DEBUG] Pedido ${orderId} marcado como DEVIDO (paymentValue = 0).`);
        } catch (error) {
            console.error(`[DEBUG] Erro ao marcar pedido ${orderId} como DEVIDO:`, error);
            alert("Erro ao marcar pedido como devido. Verifique o console.");
        }
    };
    // --- Fim Funções Handler ---


    // --- Função de Renderização de Item da Lista (COM A MODIFICAÇÃO) ---
    const renderItem = ({ item: order }: { item: OrderWithPayment }) => {
        // Cálculos de tempo, status de pagamento, etc. (sem alterações)
        const minutesElapsed = calculateMinutesElapsed(order.createdAt);
        const timeElapsedText = formatTimeElapsed(minutesElapsed);
        const orderTotal = order.total ?? 0;
        const paymentValue = order.paymentValue ?? 0;
        const isPaid = orderTotal > 0 && paymentValue >= orderTotal;
        const isOwed = orderTotal > 0 && paymentValue < orderTotal;
        const paymentStatusText = isPaid ? "Pago" : (isOwed ? "Pendente" : (orderTotal === 0 ? "Sem Valor" : "Pendente"));
        const orderStatus = order.status || 'aberto';

        return (
            <OrderItemContainer key={order.orderId}>
                <OrderIdText>Pedido: {order.orderId}</OrderIdText>

                {/* Badges de Status */}
                <OrderStatusContainer>
                    <TimeBadge timeDifferenceMinutes={minutesElapsed}>{timeElapsedText}</TimeBadge>
                    <PaymentBadge isPaid={isPaid && orderTotal > 0}>{paymentStatusText}</PaymentBadge>
                    <StatusBadge status={orderStatus}>{orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}</StatusBadge>
                </OrderStatusContainer>

                 {/* Alertas de tempo */}
                 {/* ... (código existente) ... */}
                  {minutesElapsed !== null && minutesElapsed >= 60 && isOwed && orderStatus === 'aberto' && (
                    <OrderItemDetailsText style={{ color: colors.danger, fontWeight: 'bold', marginTop: '5px' }}>
                        ALERTA: Aberto há mais de 1 hora e Pendente!
                    </OrderItemDetailsText>
                 )}
                 {minutesElapsed !== null && minutesElapsed >= 30 && minutesElapsed < 60 && isOwed && orderStatus === 'aberto' && (
                    <OrderItemDetailsText style={{ color: colors.warning, fontWeight: 'bold', marginTop: '5px' }}>
                        Aviso: Aberto há mais de 30 min e Pendente.
                    </OrderItemDetailsText>
                 )}

                {/* Detalhes do Cliente */}
                <OrderItemDetailsText>Cliente: {order.customerName}</OrderItemDetailsText>
                <OrderItemDetailsText>Endereço: {order.customerAddress}</OrderItemDetailsText>
                <OrderItemDetailsText>Telefone: {formatPhoneNumber(order.customerPhone)}</OrderItemDetailsText>

                {/* --- CAMPO DE OBSERVAÇÃO ADICIONADO --- */}
                <StyledView style={{ marginTop: spacing.medium }}> {/* Adiciona espaço acima */}
                     <StyledText style={{ fontWeight: 'bold', marginBottom: spacing.xsmall }}>Observação:</StyledText>
                     <ObservationInput
                         orderId={order.orderId}
                         initialValue={order.observation || ''} // Passa o valor atual ou string vazia
                     />
                </StyledView>
                {/* --- FIM DO CAMPO DE OBSERVAÇÃO --- */}

                {/* Lista de Itens */}
                {order.items && order.items.length > 0 && (
                     <StyledText style={{ marginTop: spacing.medium, fontWeight: 'bold', borderTop: `1px solid ${colors.gray}`, paddingTop: spacing.small }}>Itens:</StyledText>
                )}
                {order.items && order.items.length > 0 ? (
                    order.items.map((item: OrderItem, index: number) => (
                        <StyledView key={item.id || `item-${index}`} style={{ marginLeft: '10px', fontSize: fontSize.small }}>
                            <OrderItemDetailsText>
                                - {item.name} ({item.quantity}x R$ {formatCurrency(item.unitPrice ?? 0)}) = R$ {formatCurrency(item.total ?? 0)}
                                {item.category ? ` [${item.category}]` : ''}
                            </OrderItemDetailsText>
                        </StyledView>
                    ))
                ) : (
                    <StyledText style={{ fontStyle: 'italic', color: colors.secondary, marginTop: '5px' }}>Nenhum item neste pedido.</StyledText>
                )}

                {/* Total e Status de Pagamento Detalhado */}
                 {/* ... (código existente) ... */}
                 <OrderTotalText style={{ marginTop: '15px' }}>
                    Total do Pedido: R$ {formatCurrency(orderTotal)}
                </OrderTotalText>
                {paymentValue > 0 && (
                    <OrderItemDetailsText>Valor Pago: R$ {formatCurrency(paymentValue)}</OrderItemDetailsText>
                )}
                 {orderTotal > 0 && (
                     <OrderItemDetailsText style={{ fontWeight: 'bold', color: isPaid ? colors.success : (isOwed ? colors.danger : colors.dark) }}>
                        {isPaid
                            ? `Troco: R$ ${formatCurrency(paymentValue - orderTotal)}`
                            : (isOwed ? `Falta: R$ ${formatCurrency(orderTotal - paymentValue)}` : 'Status Pagamento Indefinido')
                        }
                     </OrderItemDetailsText>
                 )}


                {/* Container de Botões */}
                <ButtonsContainer>
                    {/* Botões de Status de Entrega (mantidos) */}
                    {order.status === 'aberto' && (
                        <>
                            <StyledButton variant="success" onClick={() => handleChangeOrderStatus(order.orderId, 'entregue')}>Entregue</StyledButton>
                            <StyledButton variant="warning" onClick={() => handleChangeOrderStatus(order.orderId, 'cancelado')}>Cancelar</StyledButton>
                        </>
                    )}
                    {order.status === 'entregue' && (
                         <StyledButton variant="secondary" onClick={() => handleChangeOrderStatus(order.orderId, 'aberto')} title="Reverter status para 'Aberto'">Marcar Aberto</StyledButton>
                    )}

                    {/* Botões de Pagamento (mantidos) */}
                    {!isPaid && orderTotal > 0 && order.status !== 'cancelado' && (
                         <StyledButton variant="success" onClick={() => handleMarkAsPaid(order.orderId, orderTotal)} title={`Marcar R$ ${formatCurrency(orderTotal)} como pago`}>Pago</StyledButton>
                    )}
                    {paymentValue > 0 && order.status !== 'cancelado' && (
                         <StyledButton variant="warning" onClick={() => handleMarkAsOwed(order.orderId)} title="Marcar como devido (Zerar valor pago)">Devido</StyledButton>
                    )}

                    {/* Botões Gerais (mantidos) */}
                    <StyledButton variant="danger" onClick={() => handleDeleteOrder(order.orderId)}>Excluir</StyledButton>
                    <StyledButton variant="primary" onClick={() => handleEditOrder(order.orderId)}>Ver / Editar</StyledButton>
                </ButtonsContainer>
            </OrderItemContainer>
        );
    };

    // --- Renderização Principal do Componente ---
    return (
        <Container>
            <Title>Histórico de Pedidos</Title>

            <OrdersListContainer>
                {orders.length > 0 ? (
                     orders.map(order => renderItem({ item: order }))
                 ) : (
                     <StyledText style={{ textAlign: 'center', marginTop: '30px', color: colors.secondary }}>
                         Nenhum pedido encontrado ou carregando...
                     </StyledText>
                 )}
            </OrdersListContainer>

            {/* Botão Voltar */}
            <StyledView style={{ marginTop: 'auto', paddingTop: '20px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                <StyledButton
                    variant="secondary"
                    onClick={() => {
                      console.log("[DEBUG] Clicou em Voltar para Home");
                      router.push('/Home'); // Ajuste a rota se necessário
                    }}
                 >
                    Voltar
                </StyledButton>
            </StyledView>
        </Container>
    );
};

export default Orders;