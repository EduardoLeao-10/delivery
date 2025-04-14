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
    OrderItemDetailsText, // Usaremos este para as novas datas
    OrderTotalText,
    ButtonsContainer,
    StyledButton,
    StyledText,
    StyledView,
    OrdersListContainer,
    OrderStatusContainer,
    TimeBadge, // Mantido por enquanto
    PaymentBadge,
    StatusBadge,
    colors,
    fontSize,
    spacing,
    StyledTextArea,
} from './styles';
// Importa os tipos CORRIGIDOS de '../types'
import { Order, OrderItem } from '../types';

// --- Interfaces ---
interface OrderWithPayment extends Order {
    paymentValue?: number;
    createdAt?: string | null;
    closedAt?: string | null; // <<< NOVO CAMPO PARA DATA DE FECHAMENTO
    status?: 'aberto' | 'entregue' | 'cancelado' | string;
    totalOrderValue?: number;
    observation?: string;
}

// --- Funções Utilitárias ---

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
    // (Função original mantida, usada pelo TimeBadge e Alertas)
    if (!isoDateString) return null;
    try {
        const pastDate = new Date(isoDateString);
        const now = new Date();
        if (isNaN(pastDate.getTime())) {
           console.warn("Data inválida recebida para cálculo de minutos:", isoDateString);
           return null;
        }
        const diffMs = now.getTime() - pastDate.getTime();
        if (diffMs < 0) return 0; // Trata como 0 se for futuro
        return Math.floor(diffMs / (1000 * 60));
    } catch (e) {
        console.error("Erro ao parsear data para cálculo de minutos:", isoDateString, e);
        return null;
    }
};

const formatTimeElapsed = (minutes: number | null): string => {
    // (Função original mantida, usada pelo TimeBadge e Alertas)
    if (minutes === null) return "Tempo Indisp.";
    if (minutes < 1) return "Agora";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}min`;
};

// <<< NOVA FUNÇÃO: Formatar Data e Hora (dd/MM/yyyy HH:mm) >>>
const formatDateTime = (isoDateString: string | null | undefined): string => {
    if (!isoDateString) return "Data Indisp.";
    try {
        const date = new Date(isoDateString);
        if (isNaN(date.getTime())) {
            console.warn("Data inválida recebida para formatação:", isoDateString);
            return "Data Inválida";
        }
        // Formato: DD/MM/AAAA HH:MM
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // Formato 24h
        });
    } catch (e) {
        console.error("Erro ao formatar data/hora:", isoDateString, e);
        return "Erro na Data";
    }
};

// <<< NOVA FUNÇÃO: Calcular Duração Detalhada (Anos, Meses, Dias) >>>
const calculateDurationDetailed = (startIso: string | null | undefined, endIsoOrNowIso: string | null | undefined): string => {
    if (!startIso || !endIsoOrNowIso) return "Duração Indisp.";

    try {
        const startDate = new Date(startIso);
        const endDate = new Date(endIsoOrNowIso); // Pode ser a data de fechamento ou a data atual

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.warn("Datas inválidas para cálculo de duração detalhada:", startIso, endIsoOrNowIso);
            return "Datas Inválidas";
        }

        let diffMs = endDate.getTime() - startDate.getTime();
        if (diffMs < 0) {
             console.warn("Data final anterior à inicial na duração detalhada:", startIso, endIsoOrNowIso);
             diffMs = 0; // Evitar duração negativa
        }

        if (diffMs === 0) return "Menos de 1 dia"; // Ou "Imediato"

        // Cálculo aproximado de anos, meses e dias
        const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (totalDays === 0) return "Menos de 1 dia"; // Menos de 24h

        const years = Math.floor(totalDays / 365); // Simplificação
        const remainingDaysAfterYears = totalDays % 365;
        const months = Math.floor(remainingDaysAfterYears / 30); // Simplificação
        const days = remainingDaysAfterYears % 30;

        let durationString = "";
        if (years > 0) {
            durationString += `${years} ano${years > 1 ? 's' : ''}`;
        }
        if (months > 0) {
            durationString += `${durationString ? ', ' : ''}${months} mes${months > 1 ? 'es' : ''}`; // Corrigido: 'meses'
        }
        if (days > 0) {
            durationString += `${durationString ? ', ' : ''}${days} dia${days > 1 ? 's' : ''}`;
        }

        return durationString || "Menos de 1 dia"; // Fallback

    } catch (e) {
        console.error("Erro ao calcular duração detalhada:", startIso, endIsoOrNowIso, e);
        return "Erro na Duração";
    }
};
// --- Fim Funções Utilitárias ---


// --- Componente ObservationInput --- (sem alterações)
interface ObservationInputProps {
    orderId: string;
    initialValue: string;
}
const ObservationInput: React.FC<ObservationInputProps> = ({ orderId, initialValue }) => {
    const [text, setText] = useState(initialValue);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setText(initialValue);
    }, [initialValue]);

    const saveObservation = useCallback(async (newText: string) => {
        console.log(`[ObservationInput] Salvando observação para ${orderId}: "${newText}"`);
        try {
            const orderRef = ref(database, `pedidos/${orderId}`);
            await update(orderRef, { observation: newText });
            console.log(`[ObservationInput] Observação para ${orderId} salva com sucesso.`);
        } catch (error) {
            console.error(`[ObservationInput] Erro ao salvar observação para ${orderId}:`, error);
        }
    }, [orderId]);

    useEffect(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        if (text !== initialValue) {
            debounceTimeoutRef.current = setTimeout(() => {
                saveObservation(text);
            }, 1500);
        }
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [text, initialValue, saveObservation]);

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(event.target.value);
    };

    return (
        <StyledTextArea
            value={text}
            onChange={handleChange}
            placeholder="Adicionar observação..."
            rows={3}
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
                    // Mapeamento de itens (sem alterações)
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
                    // Cálculos (sem alterações)
                    const calculatedTotalFromItems = items.reduce((sum, item) => sum + (item?.total ?? 0), 0);
                    const total = typeof orderData.totalOrderValue === 'number' && orderData.totalOrderValue >= 0
                                     ? orderData.totalOrderValue
                                     : calculatedTotalFromItems;
                    const paymentValue = typeof orderData.paymentValue === 'number' ? orderData.paymentValue : 0;

                    // <<< LER createdAt e closedAt >>>
                    const createdAt = orderData.createdAt || null;
                    const closedAt = orderData.closedAt || null; // Lê o novo campo
                    const status = orderData.status || 'aberto';
                    const observation = orderData.observation || '';

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
                        closedAt: closedAt, // <<< INCLUIR NO OBJETO
                        status: status,
                        totalOrderValue: total,
                        observation: observation,
                    };
                  });

                const filteredList: OrderWithPayment[] = mappedList
                    .filter((order: OrderWithPayment | null): order is OrderWithPayment => order !== null);

                // Ordena a lista (sem alterações)
                filteredList.sort((a, b) => {
                    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return timeB - timeA;
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

        // Função de limpeza (sem alterações)
        return () => {
            console.log("[Orders] Removendo listener de /pedidos");
            unsubscribe();
        };
    }, []);

    // --- Funções Handler ---

    // <<< MODIFICAR handleChangeOrderStatus para incluir closedAt >>>
    const handleChangeOrderStatus = async (orderId: string, newStatus: 'aberto' | 'entregue' | 'cancelado') => {
        console.log(`[DEBUG] Iniciando handleChangeOrderStatus para ID: ${orderId}, Novo Status: ${newStatus}`);
        if (!orderId) {
            console.warn("[DEBUG] Tentativa de mudar status sem ID.");
            alert("ID do pedido inválido.");
            return;
        }
        try {
            const orderRef = ref(database, `pedidos/${orderId}`);
            const updateData: { status: string; closedAt?: string | null } = {
                status: newStatus
            };

            if (newStatus === 'entregue' || newStatus === 'cancelado') {
                updateData.closedAt = new Date().toISOString(); // Grava data de fechamento
                console.log(`[DEBUG] Definindo closedAt para ${updateData.closedAt}`);
            } else if (newStatus === 'aberto') {
                updateData.closedAt = null; // Remove data de fechamento ao reabrir
                 console.log(`[DEBUG] Removendo closedAt (definindo como null)`);
            }

            await update(orderRef, updateData);

            console.log(`[DEBUG] Status do pedido ${orderId} atualizado para ${newStatus}.`);
        } catch (error) {
            console.error(`[DEBUG] Erro ao atualizar status do pedido ${orderId} para ${newStatus}:`, error);
            alert("Erro ao atualizar status do pedido.");
        }
    };

    // --- Outras Funções Handler (handleDeleteOrder, handleEditOrder, handleMarkAsPaid, handleMarkAsOwed - sem alterações) ---
    const handleDeleteOrder = async (orderId: string) => {
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
          console.log(`[DEBUG] Iniciando handleEditOrder para ID: ${orderId}`);
         if (!orderId) {
            console.warn("[DEBUG] Tentativa de editar pedido sem ID.");
            alert("ID do pedido inválido.");
            return;
        }
        try {
            router.push({
                pathname: '/OrderView',
                params: { orderId: orderId },
            });
        } catch (error) {
            console.error("[DEBUG] Erro ao navegar para OrderView:", error);
            alert("Erro ao tentar navegar para a edição do pedido.");
        }
    };

     const handleMarkAsPaid = async (orderId: string, totalAmount: number) => {
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


    // --- Função de Renderização de Item da Lista ---
    const renderItem = ({ item: order }: { item: OrderWithPayment }) => {
        // Cálculos existentes
        const minutesElapsed = calculateMinutesElapsed(order.createdAt);
        const timeElapsedText = formatTimeElapsed(minutesElapsed); // Mantido para o badge
        const orderTotal = order.total ?? 0;
        const paymentValue = order.paymentValue ?? 0;
        const isPaid = orderTotal > 0 && paymentValue >= orderTotal;
        const isOwed = orderTotal > 0 && paymentValue < orderTotal;
        const paymentStatusText = isPaid ? "Pago" : (isOwed ? "Pendente" : (orderTotal === 0 ? "Sem Valor" : "Pendente"));
        const orderStatus = order.status || 'aberto';
        const isClosed = order.status === 'entregue' || order.status === 'cancelado';

        // <<< NOVOS CÁLCULOS E FORMATAÇÕES DE DATA/DURAÇÃO >>>
        const formattedCreatedAt = formatDateTime(order.createdAt);
        const formattedClosedAt = isClosed ? formatDateTime(order.closedAt) : null; // Formata só se estiver fechado
        // Para duração, usa closedAt se existir e estiver fechado, senão usa a data/hora atual
        const endDateForCalc = isClosed && order.closedAt ? order.closedAt : new Date().toISOString();
        const durationText = calculateDurationDetailed(order.createdAt, endDateForCalc);

        return (
            <OrderItemContainer key={order.orderId}>
                <OrderIdText>Pedido: {order.orderId}</OrderIdText>

                {/* Badges de Status (Estrutura Original Mantida) */}
                <OrderStatusContainer>
                    <TimeBadge timeDifferenceMinutes={minutesElapsed}>{timeElapsedText}</TimeBadge>
                    <PaymentBadge isPaid={isPaid && orderTotal > 0}>{paymentStatusText}</PaymentBadge>
                    <StatusBadge status={orderStatus}>{orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}</StatusBadge>
                </OrderStatusContainer>

                 {/* <<< EXIBIR DATAS E DURAÇÃO DETALHADA ABAIXO DOS BADGES >>> */}
                 {/* Usando OrderItemDetailsText para manter o estilo base, mas com fonte menor */}
                 <StyledView style={{ marginTop: spacing.small }}> {/* Adiciona um pequeno espaço */}
                    <OrderItemDetailsText style={{ fontSize: fontSize.small, marginBottom: '2px' }}> {/* Fonte pequena e menos margem */}
                        <strong>Criado em:</strong> {formattedCreatedAt}
                    </OrderItemDetailsText>
                    {/* Mostra Fechado em apenas se estiver fechado e tiver a data */}
                    {isClosed && formattedClosedAt && (
                         <OrderItemDetailsText style={{ fontSize: fontSize.small, marginBottom: '2px' }}>
                            <strong>Fechado em:</strong> {formattedClosedAt}
                         </OrderItemDetailsText>
                    )}
                    {/* Mostra a duração calculada (até agora se aberto, total se fechado) */}
                     <OrderItemDetailsText style={{ fontSize: fontSize.small, marginBottom: '2px', fontStyle: 'italic', color: colors.secondary }}>
                        ({isClosed ? 'Tempo total' : 'Tempo aberto'}): {durationText}
                     </OrderItemDetailsText>
                 </StyledView>
                 {/* <<< FIM DATAS E DURAÇÃO >>> */}


                 {/* Alertas de tempo (Estrutura Original Mantida) */}
                 {minutesElapsed !== null && minutesElapsed >= 60 && isOwed && orderStatus === 'aberto' && (
                    <OrderItemDetailsText style={{ color: colors.danger, fontWeight: 'bold', marginTop: spacing.medium }}> {/* Mais espaço acima */}
                        ALERTA: Aberto há mais de 1 hora e Pendente!
                    </OrderItemDetailsText>
                 )}
                 {minutesElapsed !== null && minutesElapsed >= 30 && minutesElapsed < 60 && isOwed && orderStatus === 'aberto' && (
                    <OrderItemDetailsText style={{ color: colors.warning, fontWeight: 'bold', marginTop: spacing.medium }}> {/* Mais espaço acima */}
                        Aviso: Aberto há mais de 30 min e Pendente.
                    </OrderItemDetailsText>
                 )}

                {/* Detalhes do Cliente (Estrutura Original Mantida) */}
                 {/* Adicionar um título/separador para clareza */}
                <StyledText style={{ fontWeight: 'bold', marginTop: spacing.medium, borderTop: `1px dashed ${colors.gray}`, paddingTop: spacing.small }}>
                    Detalhes do Cliente:
                </StyledText>
                <OrderItemDetailsText>Nome: {order.customerName}</OrderItemDetailsText>
                <OrderItemDetailsText>Endereço: {order.customerAddress}</OrderItemDetailsText>
                <OrderItemDetailsText>Telefone: {formatPhoneNumber(order.customerPhone)}</OrderItemDetailsText>


                {/* --- Campo de Observação (Estrutura Original Mantida) --- */}
                <StyledView style={{ marginTop: spacing.medium }}>
                     <StyledText style={{ fontWeight: 'bold', marginBottom: spacing.xsmall }}>Observação:</StyledText>
                     <ObservationInput
                         orderId={order.orderId}
                         initialValue={order.observation || ''}
                     />
                </StyledView>

                {/* Lista de Itens (Estrutura Original Mantida) */}
                {order.items && order.items.length > 0 && (
                     <StyledText style={{ marginTop: spacing.medium, fontWeight: 'bold', borderTop: `1px solid ${colors.gray}`, paddingTop: spacing.small }}>Itens:</StyledText>
                )}
                {order.items && order.items.length > 0 ? (
                    order.items.map((item: OrderItem, index: number) => (
                        // Usando um estilo mais simples para a lista de itens
                        <p key={item.id || `item-${index}`} style={{ fontSize: fontSize.small, margin: `2px 0 2px ${spacing.medium}`, lineHeight: 1.4 }}>
                            - {item.name} ({item.quantity}x R$ {formatCurrency(item.unitPrice ?? 0)}) = R$ {formatCurrency(item.total ?? 0)}
                            {item.category ? ` [${item.category}]` : ''}
                        </p>
                    ))
                ) : (
                    <StyledText style={{ fontStyle: 'italic', color: colors.secondary, marginTop: '5px' }}>Nenhum item neste pedido.</StyledText>
                )}

                {/* Total e Status de Pagamento Detalhado (Estrutura Original Mantida) */}
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


                {/* Container de Botões (Estrutura Original Mantida) */}
                <ButtonsContainer>
                    {order.status === 'aberto' && (
                        <>
                            <StyledButton variant="success" onClick={() => handleChangeOrderStatus(order.orderId, 'entregue')}>Entregue</StyledButton>
                            <StyledButton variant="warning" onClick={() => handleChangeOrderStatus(order.orderId, 'cancelado')}>Cancelar</StyledButton>
                        </>
                    )}
                    {(order.status === 'entregue' || order.status === 'cancelado') && ( // Botão para reabrir
                         <StyledButton variant="secondary" onClick={() => handleChangeOrderStatus(order.orderId, 'aberto')} title="Reverter status para 'Aberto'">Marcar Aberto</StyledButton>
                    )}

                    {!isPaid && orderTotal > 0 && order.status !== 'cancelado' && (
                         <StyledButton variant="success" onClick={() => handleMarkAsPaid(order.orderId, orderTotal)} title={`Marcar R$ ${formatCurrency(orderTotal)} como pago`}>Pago</StyledButton>
                    )}
                    {paymentValue > 0 && order.status !== 'cancelado' && (
                         <StyledButton variant="warning" onClick={() => handleMarkAsOwed(order.orderId)} title="Marcar como devido (Zerar valor pago)">Devido</StyledButton>
                    )}

                    <StyledButton variant="danger" onClick={() => handleDeleteOrder(order.orderId)}>Excluir</StyledButton>
                    <StyledButton variant="primary" onClick={() => handleEditOrder(order.orderId)}>Ver / Editar</StyledButton>
                </ButtonsContainer>
            </OrderItemContainer>
        );
    };

    // --- Renderização Principal do Componente (sem alterações) ---
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