// src/app/Orders/index.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { database } from '../../services/firebaseConfig'; // Verifique o caminho
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
    spacing,
    StyledTextArea,
} from './styles'; // Verifique o caminho
import { Order, OrderItem } from '../types'; // Verifique o caminho

// --- Interfaces ---
interface OrderWithPayment extends Order {
    paymentValue?: number; // Valor efetivamente pago
    createdAt?: string | null; // ISO String da data de criação
    closedAt?: string | null; // ISO String da data de fechamento (entrega/cancelamento)
    paymentCompletedDate?: string | null; // ISO String da data de quitação do pagamento
    status?: 'aberto' | 'entregue' | 'cancelado' | string; // Permite outros status se necessário
    totalOrderValue?: number; // Valor total calculado ou definido no pedido
    observation?: string; // Observações sobre o pedido
}

// --- Funções Utilitárias ---

const formatCurrency = (value: number | null | undefined): string => {
    const numericValue = value ?? 0;
    return numericValue.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const formatPhoneNumber = (value: string | undefined | null): string => {
    if (!value) return "Não informado";
    const digitsOnly = value.replace(/\D/g, "");
    if (!digitsOnly) return "Número inválido";

    if (digitsOnly.length <= 10) {
        const match = digitsOnly.match(/^(\d{2})(\d{4})(\d{4})$/);
        if (match) return `(${match[1]}) ${match[2]}-${match[3]}`;
    } else {
        // Ajuste para celular (9º dígito opcional e padrão DDD + 9)
        const match = digitsOnly.slice(0, 11).match(/^(\d{2})(\d{1})(\d{4})(\d{4})$/);
        if (match) return `(${match[1]}) ${match[2]} ${match[3]}-${match[4]}`;
        // Caso não tenha 9º dígito mas tenha 11 dígitos (ex: DDD longo?) - menos comum
        const matchLongDDD = digitsOnly.slice(0, 11).match(/^(\d{3})(\d{4})(\d{4})$/);
         if (matchLongDDD) return `(${matchLongDDD[1]}) ${matchLongDDD[2]}-${matchLongDDD[3]}`;
    }
     // Fallback para números mais curtos ou formatos inesperados
    if (digitsOnly.length > 2) {
        return `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2)}`;
    }
    return digitsOnly; // Retorna só os dígitos se tudo falhar
};


const calculateMinutesElapsed = (isoDateString: string | null | undefined): number | null => {
    if (!isoDateString) return null;
    try {
        const pastDate = new Date(isoDateString);
        const now = new Date();
        // Validação mais robusta
        if (isNaN(pastDate.getTime()) || pastDate.toString() === 'Invalid Date') {
           console.warn("[calculateMinutesElapsed] Data inválida:", isoDateString);
           return null;
        }
        const diffMs = now.getTime() - pastDate.getTime();
        if (diffMs < 0) return 0; // Não retornar tempo negativo
        return Math.floor(diffMs / (1000 * 60));
    } catch (e) {
        console.error("[calculateMinutesElapsed] Erro ao processar data:", isoDateString, e);
        return null;
    }
};

const formatTimeElapsed = (minutes: number | null): string => {
    if (minutes === null) return "Tempo Indisp.";
    if (minutes < 1) return "Agora";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours >= 24) {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        let result = `${days} dia${days > 1 ? 's' : ''}`;
        if (remainingHours > 0) result += ` ${remainingHours}h`;
        return result;
    }
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}min`;
};

const formatDateTime = (isoDateString: string | null | undefined): string => {
    if (!isoDateString) return "Data Indisp.";
    try {
        const date = new Date(isoDateString);
        if (isNaN(date.getTime()) || date.toString() === 'Invalid Date') {
            console.warn("[formatDateTime] Data inválida:", isoDateString);
            return "Data Inválida";
        }
        return date.toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        });
    } catch (e) {
        console.error("[formatDateTime] Erro ao formatar data:", isoDateString, e);
        return "Erro na Data";
    }
};

const formatDateOnly = (isoDateString: string | null | undefined): string => {
    if (!isoDateString) return "Data Indisp.";
    try {
        const date = new Date(isoDateString);
         if (isNaN(date.getTime()) || date.toString() === 'Invalid Date') {
            console.warn("[formatDateOnly] Data inválida:", isoDateString);
            return "Data Inválida";
        }
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    } catch (e) {
        console.error("[formatDateOnly] Erro ao formatar data:", isoDateString, e);
        return "Erro na Data";
    }
};


// Calcula a duração detalhada entre duas datas ISO ou uma data ISO e agora.
// Retorna string formatada (anos, meses, dias) ou (horas, minutos)
const calculateDurationDetailed = (startIso: string | null | undefined, endIsoOrNowIso: string | null | undefined): string => {
    if (!startIso) {
        console.warn("[calculateDurationDetailed] Data inicial (startIso) ausente.");
        return "Duração Indisp.";
    }

    try {
        const startDate = new Date(startIso);
        let endDate: Date;

        // Definir endDate: usa a data atual se endIsoOrNowIso for null ou undefined
        if (endIsoOrNowIso === null || endIsoOrNowIso === undefined) {
            endDate = new Date(); // Usa data/hora ATUAL
        } else {
            endDate = new Date(endIsoOrNowIso);
        }

        // Validar as datas APÓS a tentativa de criação
        if (isNaN(startDate.getTime()) || startDate.toString() === 'Invalid Date') {
            console.warn("[calculateDurationDetailed] Data inicial (startIso) inválida:", startIso);
            return "Data Inicial Inválida";
        }
        if (isNaN(endDate.getTime()) || endDate.toString() === 'Invalid Date') {
            console.warn("[calculateDurationDetailed] Data final (endIsoOrNowIso) inválida:", endIsoOrNowIso);
            // Se a data final for inválida, mas a inicial for válida, talvez calcular até agora? Ou retornar erro?
            // Vamos retornar erro para ser claro.
            return "Data Final Inválida";
        }

        let diffMs = endDate.getTime() - startDate.getTime();
        if (diffMs < 0) {
             // Logar mas permitir cálculo (pode ser útil para ver "atraso" em alguns cenários?)
             // Ou forçar 0 se duração negativa não faz sentido aqui. Vamos forçar 0.
             console.warn("[calculateDurationDetailed] Data final anterior à inicial:", startIso, endIsoOrNowIso);
             diffMs = 0; // Não permitir duração negativa
        }

        if (diffMs < 1000) { // Menos de 1 segundo
            return "Agora";
        }

        // --- Cálculo detalhado (mantido como estava, parece robusto) ---
        let years = endDate.getFullYear() - startDate.getFullYear();
        let months = endDate.getMonth() - startDate.getMonth();
        let days = endDate.getDate() - startDate.getDate();
        let hours = endDate.getHours() - startDate.getHours();
        let minutes = endDate.getMinutes() - startDate.getMinutes();
        // Seconds não são usados na formatação final, mas necessários para o borrow
        let seconds = endDate.getSeconds() - startDate.getSeconds();

        if (seconds < 0) { minutes--; seconds += 60; }
        if (minutes < 0) { hours--; minutes += 60; }
        if (hours < 0) { days--; hours += 24; }
        if (days < 0) {
            months--;
            // Dias no mês anterior ao mês de 'endDate'
            const daysInPrevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0).getDate();
            days += daysInPrevMonth;
        }
        if (months < 0) {
            years--;
            months += 12;
        }
        // --- Fim do Cálculo Detalhado ---

        // --- Construção da String de Saída ---
        let durationParts: string[] = [];
        if (years > 0) durationParts.push(`${years} ano${years !== 1 ? 's' : ''}`);
        if (months > 0) durationParts.push(`${months} ${months !== 1 ? 'meses' : 'mês'}`);
        if (days > 0) durationParts.push(`${days} dia${days !== 1 ? 's' : ''}`);

        // Mostrar horas/minutos APENAS se a duração for menor que 1 dia (anos, meses e dias são 0)
        if (years === 0 && months === 0 && days === 0) {
            if (hours > 0) durationParts.push(`${hours}h`);
            // Mostrar minutos apenas se horas > 0 OU se for a única unidade (e > 0)
            if (minutes > 0 && (hours > 0 || durationParts.length === 0)) {
                 // Evitar "0h 5min", mostrar só "5min" se horas for 0.
                 if (hours > 0 || minutes >= 1) { // Garante que não mostre "0min"
                     durationParts.push(`${minutes}min`);
                 }
            }
        }

        let durationString = durationParts.join(', ');

        // Fallback se nada foi adicionado (duração muito curta, mas > 1s)
        if (durationString === "") {
            if (diffMs < 60000) return "Menos de 1 min"; // Menos de 1 minuto
             // Se for mais de 1 min mas os cálculos resultaram em 0 (arredondamento?), usar formatação simples
             const totalMinutes = Math.floor(diffMs / (1000 * 60));
             if (totalMinutes > 0) return formatTimeElapsed(totalMinutes); // Reutiliza a formatação mais simples
             return "Duração Indisp."; // Último recurso
        }

        return durationString;

    } catch (e) {
        console.error("[calculateDurationDetailed] Erro inesperado no cálculo:", startIso, endIsoOrNowIso, e);
        return "Erro na Duração";
    }
};
// --- Fim Funções Utilitárias ---


// --- Componente ObservationInput ---
interface ObservationInputProps {
    orderId: string;
    initialValue: string;
    disabled?: boolean; // Adicionar propriedade disabled se necessário
}
const ObservationInput: React.FC<ObservationInputProps> = ({ orderId, initialValue, disabled = false }) => {
    const [text, setText] = useState(initialValue);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Atualiza o texto interno se o valor inicial mudar externamente
    useEffect(() => {
        setText(initialValue);
    }, [initialValue]);

    const saveObservation = useCallback(async (newText: string) => {
        // Não salva se estiver desabilitado
        if (disabled) return;
        console.log(`[ObservationInput] Salvando observação para ${orderId}...`);
        try {
            const orderRef = ref(database, `pedidos/${orderId}`);
            await update(orderRef, { observation: newText });
            console.log(`[ObservationInput] Observação salva para ${orderId}.`);
        } catch (error) {
            console.error(`[ObservationInput] Erro ao salvar observação para ${orderId}:`, error);
            // Adicionar feedback visual de erro aqui se desejar
        }
    }, [orderId, disabled]); // Incluir disabled na dependência

    // Debounce para salvar
    useEffect(() => {
        // Só ativa o debounce se o texto mudou E não está desabilitado
        if (text !== initialValue && !disabled) {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
            debounceTimeoutRef.current = setTimeout(() => {
                saveObservation(text);
            }, 1500); // Intervalo de debounce
        }

        // Cleanup: cancela o timeout se o componente desmontar ou o texto/initialValue/saveObservation mudar
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [text, initialValue, saveObservation, disabled]); // Incluir disabled na dependência

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(event.target.value);
    };

    return (
        <StyledTextArea
            value={text}
            onChange={handleChange}
            placeholder={disabled ? "Observação (somente leitura)" : "Adicionar observação..."}
            rows={3}
            disabled={disabled} // Passa o disabled para o elemento HTML
            aria-label={`Observação para o pedido ${orderId}`}
        />
    );
};
// --- FIM DO COMPONENTE ObservationInput ---


// --- Componente Principal Orders ---
const Orders = () => {
    const [orders, setOrders] = useState<OrderWithPayment[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true); // Estado de carregamento
    const [error, setError] = useState<string | null>(null); // Estado de erro
    const router = useRouter();

    // Estado para forçar atualização e recalcular durações dinâmicas
    const [, setTick] = useState(0);
    useEffect(() => {
        const intervalId = setInterval(() => {
            setTick(prevTick => prevTick + 1);
        }, 60000); // Atualiza a cada minuto para recalcular tempos como "5 min atrás"
        return () => clearInterval(intervalId);
    }, []);


    // Efeito para buscar os pedidos do Firebase em tempo real
    useEffect(() => {
        setIsLoading(true); // Inicia carregando
        setError(null); // Limpa erros anteriores
        const ordersRef = ref(database, 'pedidos');
        console.log("[Orders] Iniciando listener para /pedidos");

        const unsubscribe = onValue(ordersRef, (snapshot) => {
            console.log("[Orders] Dados recebidos do Firebase");
            setError(null); // Limpa erro se receber dados
            if (snapshot.exists()) {
                const data = snapshot.val();
                const mappedList = Object.entries(data)
                  .map(([orderId, orderData]: [string, any]): OrderWithPayment | null => {
                    // Validação básica da estrutura do pedido
                    if (!orderData || typeof orderData !== 'object' || !orderId) {
                        console.warn(`[Orders] Ignorando dado inválido ou sem ID:`, orderId, orderData);
                        return null;
                    }

                    // Mapeamento de Itens com mais validação
                    const items: OrderItem[] = Array.isArray(orderData.itens) // Verifica se é array primeiro
                       ? orderData.itens.map((item: any, index: number): OrderItem => ({
                            id: item?.id ?? `${orderId}-item-${index}`, // Gera ID fallback
                            name: item?.name ?? 'Item Desconhecido',
                            quantity: typeof item?.quantity === 'number' ? item.quantity : 0,
                            unitPrice: typeof item?.unitPrice === 'number' ? item.unitPrice : 0,
                            total: typeof item?.total === 'number' ? item.total : ( (item?.quantity ?? 0) * (item?.unitPrice ?? 0) ), // Recalcula se faltar
                            category: item?.category ?? 'Sem Categoria',
                         }))
                       : (orderData.itens && typeof orderData.itens === 'object') // Senão, tenta mapear objeto (legado?)
                           ? Object.entries(orderData.itens).map(([itemId, item]: [string, any]): OrderItem => ({
                               id: itemId,
                               name: item?.name ?? 'Item Desconhecido',
                               quantity: typeof item?.quantity === 'number' ? item.quantity : 0,
                               unitPrice: typeof item?.unitPrice === 'number' ? item.unitPrice : 0,
                               total: typeof item?.total === 'number' ? item.total : ( (item?.quantity ?? 0) * (item?.unitPrice ?? 0) ), // Recalcula se faltar
                               category: item?.category ?? 'Sem Categoria',
                           }))
                           : []; // Default para array vazio se `itens` não existir ou for inválido

                    // Cálculo do Total
                    const calculatedTotalFromItems = items.reduce((sum, item) => sum + (item?.total ?? 0), 0);
                    // Prioriza totalOrderValue se existir e for válido, senão usa a soma dos itens
                    const total = typeof orderData.totalOrderValue === 'number' && orderData.totalOrderValue >= 0
                                     ? orderData.totalOrderValue
                                     : calculatedTotalFromItems;
                    // Garante que paymentValue seja um número >= 0
                    const paymentValue = typeof orderData.paymentValue === 'number' && orderData.paymentValue >= 0 ? orderData.paymentValue : 0;

                    // Tratamento de Datas e Status (com defaults)
                    const createdAt = orderData.createdAt || null; // Assume null se ausente
                    const closedAt = orderData.closedAt || null;
                    const paymentCompletedDate = orderData.paymentCompletedDate || null;
                    const status = orderData.status || 'aberto'; // Default 'aberto'
                    const observation = orderData.observation || ''; // Default string vazia

                    return {
                        orderId: orderId,
                        items: items,
                        total: total, // Total final calculado
                        customerName: orderData.customerName || 'Não informado',
                        customerAddress: orderData.customerAddress || 'Não informado',
                        customerPhone: orderData.customerPhone || '', // Default string vazia
                        paymentValue: paymentValue,
                        createdAt: createdAt,
                        closedAt: closedAt,
                        paymentCompletedDate: paymentCompletedDate,
                        status: status,
                        totalOrderValue: total, // Repete o total final aqui para consistência
                        observation: observation,
                    };
                  });

                // Filtra nulos resultantes de dados inválidos
                const filteredList: OrderWithPayment[] = mappedList
                    .filter((order: OrderWithPayment | null): order is OrderWithPayment => order !== null);

                // Ordena por data de criação (mais recentes primeiro)
                filteredList.sort((a, b) => {
                    // Trata casos onde createdAt pode ser null
                    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    // Se ambos forem 0 (ou inválidos), não muda a ordem relativa
                    if (timeA === 0 && timeB === 0) return 0;
                    // Coloca inválidos/nulos no final
                    if (timeA === 0) return 1;
                    if (timeB === 0) return -1;
                    // Ordena pelos válidos
                    return timeB - timeA; // Decrescente
                });

                console.log(`[Orders] Processados ${filteredList.length} pedidos válidos.`);
                setOrders(filteredList);

            } else {
                console.log("[Orders] Nenhum pedido encontrado no Firebase.");
                setOrders([]); // Limpa a lista se não houver dados
            }
            setIsLoading(false); // Terminou de carregar (com ou sem dados)
        }, (errorObject) => { // Tratamento de erro do listener
            console.error("[Orders] Erro ao buscar pedidos:", errorObject);
            setError(`Erro ao carregar pedidos: ${errorObject.message || 'Verifique a conexão e as regras do Firebase.'}`);
            setOrders([]); // Limpa os pedidos em caso de erro
            setIsLoading(false); // Terminou de carregar (com erro)
            // Considerar um mecanismo de retry ou notificação mais robusta
        });

        // Cleanup: remove o listener quando o componente desmonta
        return () => {
            console.log("[Orders] Removendo listener de /pedidos");
            unsubscribe();
        };
    }, []); // Dependência vazia: executa apenas na montagem e desmontagem

    // --- Funções Handler (Callbacks Otimizados) ---

    const handleChangeOrderStatus = useCallback(async (orderId: string, newStatus: 'aberto' | 'entregue' | 'cancelado') => {
        console.log(`[Handler] Mudando status para ${newStatus} no pedido ${orderId}`);
        if (!orderId) {
            console.warn("[Handler] Tentativa de mudar status com ID inválido.");
            alert("ID do pedido inválido.");
            return;
        }
        try {
            const orderRef = ref(database, `pedidos/${orderId}`);
            const updateData: { status: string; closedAt?: string | null } = {
                status: newStatus
            };

            // Define ou remove a data de fechamento baseado no novo status
            if (newStatus === 'entregue' || newStatus === 'cancelado') {
                 // Define closedAt apenas se não estiver já definido (evita sobrescrever data original se já existia)
                 // Ou sempre define a data atual? Vamos definir a data atual para refletir a ação.
                updateData.closedAt = new Date().toISOString();
                console.log(`[Handler] Definindo closedAt: ${updateData.closedAt}`);
            } else if (newStatus === 'aberto') {
                updateData.closedAt = null; // Remove data de fechamento ao reabrir
                console.log(`[Handler] Removendo closedAt (definindo como null)`);
            }
             // Não mexe em paymentCompletedDate aqui

            await update(orderRef, updateData);
            console.log(`[Handler] Status do pedido ${orderId} atualizado para ${newStatus}.`);
            // Poderia adicionar um feedback visual temporário de sucesso
        } catch (error) {
            console.error(`[Handler] Erro ao atualizar status do pedido ${orderId}:`, error);
            alert(`Erro ao atualizar status do pedido ${orderId}. Verifique o console.`);
        }
    }, []); // Sem dependências externas mutáveis

    const handleDeleteOrder = useCallback(async (orderId: string) => {
        console.log(`[Handler] Solicitando exclusão do pedido ${orderId}`);
        if (!orderId) {
           console.warn("[Handler] Tentativa de excluir com ID inválido.");
           alert("ID do pedido inválido.");
           return;
        }
        // Usar template literal para melhor leitura
        const confirmDelete = window.confirm(`Tem certeza que deseja EXCLUIR o pedido ${orderId}? Esta ação não pode ser desfeita.`);
        if (confirmDelete) {
            console.log(`[Handler] Confirmada exclusão do pedido ${orderId}.`);
            try {
                const orderRef = ref(database, `pedidos/${orderId}`);
                await remove(orderRef);
                console.log("[Handler] Pedido excluído com sucesso:", orderId);
                alert("Pedido excluído com sucesso!"); // Feedback para o usuário
                // A lista será atualizada automaticamente pelo listener `onValue`
            } catch (error) {
                console.error("[Handler] Erro ao excluir pedido:", orderId, error);
                alert(`Erro ao excluir pedido ${orderId}. Verifique o console e suas permissões do Firebase.`);
            }
        } else {
            console.log("[Handler] Exclusão do pedido ${orderId} cancelada pelo usuário.");
        }
    }, []); // Sem dependências externas mutáveis

    const handleEditOrder = useCallback((orderId: string) => {
        console.log(`[Handler] Navegando para editar pedido ${orderId}`);
        if (!orderId) {
            console.warn("[Handler] Tentativa de editar com ID inválido.");
            alert("ID do pedido inválido.");
            return;
        }
        try {
            // Certifique-se que a rota '/OrderView' existe e aceita 'orderId' como parâmetro
            router.push({
                pathname: '/OrderView', // Ajuste se o nome da sua rota for diferente
                params: { orderId: orderId },
            });
        } catch (error) {
            console.error("[Handler] Erro ao navegar para edição:", orderId, error);
            alert("Erro ao tentar navegar para a edição do pedido. Verifique a configuração do Expo Router.");
        }
    }, [router]); // Depende do 'router'

    const handleRecordPayment = useCallback(async (orderId: string, currentPaymentValue: number, totalAmount: number) => {
        console.log(`[Handler] Iniciando registro de pagamento para ${orderId}`);
        if (!orderId) {
            console.warn("[Handler] Tentativa de registrar pagamento com ID inválido.");
            alert("ID do pedido inválido.");
            return;
        }
         // Permite registrar pagamento mesmo se o total for 0 (ex: cortesia), mas avisa se for negativo
         if (typeof totalAmount !== 'number') {
             console.warn(`[Handler] Total do pedido ${orderId} é inválido:`, totalAmount);
             alert("Valor total do pedido inválido. Não é possível registrar pagamento.");
             return;
         }
          if (totalAmount < 0) {
              console.warn(`[Handler] Total do pedido ${orderId} é negativo:`, totalAmount);
              // Permitir ou bloquear? Vamos bloquear para evitar confusão.
              alert("Valor total do pedido é negativo. Verifique os dados do pedido.");
              return;
         }

        // Formata o valor atual para exibir no prompt
        const currentPaymentFormatted = formatCurrency(currentPaymentValue);
        const totalAmountFormatted = formatCurrency(totalAmount);

        const paidAmountStr = window.prompt(
            `Registrar Pagamento (Pedido ${orderId})\n\nTotal do Pedido: ${totalAmountFormatted}\nValor Já Pago: ${currentPaymentFormatted}\n\nDigite o NOVO valor TOTAL que foi pago por este pedido:`,
             // Sugere o valor atual como default no prompt
            currentPaymentValue.toString().replace('.', ',') // Usa vírgula para prompt
        );

        if (paidAmountStr === null) {
            console.log("[Handler] Registro de pagamento cancelado pelo usuário.");
            return; // Usuário cancelou
        }

        // Limpa a string (remove R$, pontos de milhar) e substitui vírgula por ponto
        const cleanedAmountStr = paidAmountStr.replace(/[^0-9,.-]/g, '').replace(',', '.');
        const paidAmount = parseFloat(cleanedAmountStr);

        if (isNaN(paidAmount) || paidAmount < 0) {
            alert(`Valor inválido inserido: "${paidAmountStr}". Use apenas números, vírgula ou ponto para decimais. O valor não pode ser negativo.`);
            return;
        }

         // Confirmação se o valor pago for significativamente maior que o total
         const tolerance = 0.01; // Tolerância para troco pequeno
         if (paidAmount > totalAmount + tolerance) {
             const paidFormatted = formatCurrency(paidAmount);
             if (!window.confirm(`O valor pago (${paidFormatted}) é maior que o total do pedido (${totalAmountFormatted}).\nIsso pode indicar um troco ou erro de digitação.\n\nConfirmar o registro deste valor pago?`)) {
                  console.log("[Handler] Registro de pagamento (valor > total) cancelado após confirmação.");
                 return; // Usuário cancelou após aviso
             }
         }

        // Verifica se o novo valor pago quita o pedido (usando tolerância)
        const isNowFullyPaid = paidAmount >= totalAmount - tolerance;

        const updateData: { paymentValue: number; paymentCompletedDate?: string | null } = {
             paymentValue: paidAmount // Salva o valor numérico limpo
        };

        // Define ou remove a data de quitação
        if (isNowFullyPaid && totalAmount > 0) { // Só marca como quitado se o total for > 0
             // Define a data apenas se não estava quitado antes ou se a data não existe
             // Ou sempre atualiza a data para a data do último pagamento que quitou? Vamos sempre atualizar.
            updateData.paymentCompletedDate = new Date().toISOString();
             console.log(`[Handler] Pedido ${orderId} totalmente pago (ou mais). Definindo paymentCompletedDate: ${updateData.paymentCompletedDate}`);
        } else {
            updateData.paymentCompletedDate = null; // Garante que não há data de quitação se não estiver totalmente pago
             console.log(`[Handler] Pedido ${orderId} com pagamento parcial/zerado/inválido ou total zero. Removendo paymentCompletedDate (null).`);
        }

        try {
            const orderRef = ref(database, `pedidos/${orderId}`);
            await update(orderRef, updateData);
            console.log(`[Handler] Pagamento registrado para ${orderId}:`, updateData);
            alert(`Pagamento de ${formatCurrency(paidAmount)} registrado para o pedido ${orderId}.`);
        } catch (error) {
            console.error(`[Handler] Erro ao registrar pagamento para o pedido ${orderId}:`, error);
            alert(`Erro ao registrar pagamento para o pedido ${orderId}. Verifique o console.`);
        }
    }, []); // formatCurrency não muda, sem dependências

    const handleResetPayment = useCallback(async (orderId: string) => {
        console.log(`[Handler] Iniciando reset de pagamento para ${orderId}`);
        if (!orderId) {
             console.warn("[Handler] Tentativa de resetar pagamento com ID inválido.");
            alert("ID do pedido inválido.");
            return;
        }
         // Confirmação mais explícita
         const confirmReset = window.confirm(`Tem certeza que deseja ZERAR o valor pago para o pedido ${orderId}?\n\nIsso marcará o pedido como NÃO PAGO e removerá a data de quitação, caso exista.\n\nEsta ação é útil para corrigir erros de registro.`);
         if (!confirmReset) {
             console.log("[Handler] Reset de pagamento cancelado pelo usuário para o pedido", orderId);
             return;
         }

        console.log(`[Handler] Confirmado reset de pagamento para ${orderId}.`);
        try {
            const orderRef = ref(database, `pedidos/${orderId}`);
            // Zera o valor pago e remove a data de quitação explicitamente
            await update(orderRef, { paymentValue: 0, paymentCompletedDate: null });
            console.log(`[Handler] Pagamento resetado para ${orderId}.`);
            alert(`Valor pago para o pedido ${orderId} foi zerado com sucesso.`);
        } catch (error) {
            console.error(`[Handler] Erro ao resetar pagamento para o pedido ${orderId}:`, error);
            alert(`Erro ao resetar valor pago para o pedido ${orderId}. Verifique o console.`);
        }
    }, []); // Sem dependências externas mutáveis
    // --- Fim Funções Handler ---


    // --- Função de Renderização de Item da Lista ---
    const renderItem = ({ item: order }: { item: OrderWithPayment }) => {
        // Validação básica do item recebido
        if (!order || !order.orderId) {
             console.warn("[renderItem] Tentando renderizar pedido inválido:", order);
             return null; // Não renderiza nada se o pedido for inválido
        }

        const minutesSinceCreation = calculateMinutesElapsed(order.createdAt);
        const timeElapsedBadgeText = formatTimeElapsed(minutesSinceCreation);
        const orderTotal = order.total ?? 0; // Garante que é número
        const paymentValue = order.paymentValue ?? 0; // Garante que é número
        const orderStatus = order.status || 'aberto'; // Default
        const isClosed = orderStatus === 'entregue' || orderStatus === 'cancelado';

        // Cálculo de Status de Pagamento
        const remainingAmount = orderTotal - paymentValue;
        const tolerance = 0.001; // Tolerância para comparação de float
        // É considerado totalmente pago se o valor pago for maior ou igual ao total (menos a tolerância)
        // E se o total do pedido for maior que zero (pedido de R$ 0,00 não fica "pago")
        const isFullyPaid = orderTotal > tolerance && remainingAmount <= tolerance;
        // Parcialmente pago se pagou algo, mas não tudo, e o total é > 0
        const isPartiallyPaid = orderTotal > tolerance && paymentValue > tolerance && !isFullyPaid;
        // Não pago (pendente) se o total é > 0 e não pagou nada (ou valor insignificante)
        const isUnpaid = orderTotal > tolerance && paymentValue <= tolerance;

        // *** CENÁRIO CRÍTICO: Entregue mas não totalmente pago (e com valor > 0) ***
        const isDeliveredAndOwed = orderStatus === 'entregue' && !isFullyPaid && orderTotal > tolerance;

        // --- Cálculos de Duração Detalhados ---

        // Duração do débito (se entregue e não pago): Desde a CRIAÇÃO até AGORA.
        let debtDurationText: string | null = null;
        if (isDeliveredAndOwed) {
            // Correto: calcula de createdAt até agora (null como segundo argumento)
            debtDurationText = calculateDurationDetailed(order.createdAt, null);
        }

        // Tempo que levou para quitar o pagamento APÓS a entrega (se aplicável)
        let timeToPayAfterDeliveryText: string | null = null;
        if (orderStatus === 'entregue' && isFullyPaid && order.closedAt && order.paymentCompletedDate) {
            // Correto: calcula de closedAt (entrega) até paymentCompletedDate (quitação)
            timeToPayAfterDeliveryText = calculateDurationDetailed(order.closedAt, order.paymentCompletedDate);
        }

        // Duração total do pedido: Desde a CRIAÇÃO até o FECHAMENTO (ou AGORA se ainda aberto)
        const endDateForTotalDuration = isClosed && order.closedAt ? order.closedAt : null; // Usa null para calcular até agora se não fechado
        const totalDurationText = calculateDurationDetailed(order.createdAt, endDateForTotalDuration);
        // --- Fim Cálculos de Duração ---


        // --- Textos e Cores para Status de Pagamento ---
        let paymentStatusText = "N/A"; // Texto descritivo
        let paymentBadgeText = "N/A"; // Texto curto para o badge
        let paymentStatusColor = colors.mediumGray; // Cor default

        if (orderTotal <= tolerance) { // Pedido sem valor ou com valor zero/negativo
            paymentStatusText = "Sem Valor";
            paymentBadgeText = "S/ Valor";
            paymentStatusColor = colors.mediumGray;
        } else if (isFullyPaid) {
            paymentStatusText = "Pago";
            paymentBadgeText = "Pago";
            paymentStatusColor = colors.success;
            // Adiciona informação sobre troco se pagou a mais
            if (remainingAmount < -tolerance) {
                paymentStatusText += ` (Troco: ${formatCurrency(Math.abs(remainingAmount))})`;
            }
        } else if (isPartiallyPaid) {
            paymentStatusText = `Parcial (Falta: ${formatCurrency(remainingAmount)})`;
            paymentBadgeText = "Parcial";
            paymentStatusColor = colors.warning;
        } else { // isUnpaid
            paymentStatusText = `Pendente (Falta: ${formatCurrency(remainingAmount)})`;
            paymentBadgeText = "Pendente";
            paymentStatusColor = colors.danger; // Vermelho para pendente
        }

        // *** Sobrescreve se estiver EM DÉBITO (entregue e não pago) ***
        if (isDeliveredAndOwed) {
            paymentStatusText = `EM DÉBITO (Falta: ${formatCurrency(remainingAmount)})`;
            paymentBadgeText = "Débito"; // Badge claro
            paymentStatusColor = colors.danger; // Mantém vermelho
        }
        // --- Fim Status e Cores ---

        // --- Formatação de Datas ---
        const formattedCreatedAt = formatDateTime(order.createdAt);
        const formattedClosedAt = isClosed ? formatDateTime(order.closedAt) : null;
        const formattedPaymentCompletedDate = order.paymentCompletedDate ? formatDateTime(order.paymentCompletedDate) : null;
        // --- Fim Formatação de Datas ---


        // --- Renderização do Item ---
        return (
            // Aplica estilo de destaque se estiver em débito
            <OrderItemContainer key={order.orderId} style={ isDeliveredAndOwed ? { borderLeft: `5px solid ${colors.danger}`, paddingLeft: spacing.medium } : {} }>

                {/* Cabeçalho: ID e Badges */}
                <OrderIdText>Pedido: {order.orderId}</OrderIdText>
                <OrderStatusContainer>
                    {/* Badge de Tempo desde a criação */}
                    <TimeBadge timeDifferenceMinutes={minutesSinceCreation}>{timeElapsedBadgeText}</TimeBadge>
                    {/* Badge de Status do Pedido */}
                    <StatusBadge status={orderStatus}>
                        {/* Capitaliza o status */}
                        {orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
                    </StatusBadge>
                    {/* Badge de Status de Pagamento */}
                    <PaymentBadge isPaid={isFullyPaid} style={{ backgroundColor: paymentStatusColor }}>
                         {paymentBadgeText}
                    </PaymentBadge>
                </OrderStatusContainer>

                 {/* Seção: Datas e Duração do Pedido */}
                 <StyledView style={{ marginTop: spacing.small, marginBottom: spacing.medium, fontSize: fontSize.small }}>
                    <OrderItemDetailsText>
                        <strong>Criado em:</strong> {formattedCreatedAt}
                    </OrderItemDetailsText>
                    {/* Mostra data de fechamento apenas se estiver fechado */}
                    {isClosed && formattedClosedAt && (
                         <OrderItemDetailsText>
                            <strong>{orderStatus === 'entregue' ? 'Entregue' : 'Cancelado'} em:</strong> {formattedClosedAt}
                         </OrderItemDetailsText>
                    )}
                     {/* Mostra a duração total */}
                     <OrderItemDetailsText style={{ fontStyle: 'italic', color: colors.secondary }}>
                        {isClosed ? 'Duração Total' : 'Tempo em Aberto'}: {totalDurationText}
                     </OrderItemDetailsText>
                 </StyledView>

                 {/* Seção: Informações e Duração do Débito/Pagamento */}
                 <StyledView style={{ marginBottom: spacing.medium, borderTop: `1px dashed ${colors.gray}`, paddingTop: spacing.small, fontSize: fontSize.small }}>
                    {/* Caso 1: Pedido ENTREGUE e EM DÉBITO */}
                    {isDeliveredAndOwed && (
                        <>
                            {/* A data de início do débito é considerada a data de criação */}
                            <OrderItemDetailsText style={{ color: colors.danger }}>
                                <strong>Início do Débito (Criação):</strong> {formatDateOnly(order.createdAt)}
                            </OrderItemDetailsText>
                            {/* Exibe há quanto tempo está em débito (desde a criação até agora) */}
                            <OrderItemDetailsText style={{ color: colors.danger, fontWeight: 'bold' }}>
                                <strong>Tempo em Débito:</strong> {debtDurationText || 'Calculando...'}
                            </OrderItemDetailsText>
                        </>
                    )}
                    {/* Caso 2: Pedido ENTREGUE e PAGO */}
                    {orderStatus === 'entregue' && isFullyPaid && (
                        <>
                            <OrderItemDetailsText style={{ color: colors.success, fontWeight: 'bold' }}>
                                <strong>Pagamento Quitado em:</strong> {formattedPaymentCompletedDate || 'Data Indisp.'}
                            </OrderItemDetailsText>
                            {/* Mostra quanto tempo levou para quitar APÓS a entrega */}
                            {timeToPayAfterDeliveryText && (
                                <OrderItemDetailsText style={{ fontStyle: 'italic', color: colors.secondary }}>
                                    Tempo para Quitar (após entrega): {timeToPayAfterDeliveryText}
                                </OrderItemDetailsText>
                            )}
                        </>
                    )}
                    {/* Caso 3: Outros status (Aberto, Cancelado, ou Entregue mas ainda não pago E não se encaixa no 'em débito' - ex: valor zero) */}
                    {/* Mostra o status de pagamento geral se não for "Entregue e em Débito" nem "Entregue e Pago" */}
                    {!isDeliveredAndOwed && !(orderStatus === 'entregue' && isFullyPaid) && (
                         <OrderItemDetailsText style={{ color: paymentStatusColor }}>
                           <strong>Status Pagamento:</strong> {paymentStatusText}
                        </OrderItemDetailsText>
                    )}
                 </StyledView>

                 {/* Seção: Alertas Visuais */}
                 {/* Alerta: Aberto há muito tempo e pendente */}
                 {minutesSinceCreation !== null && minutesSinceCreation >= 120 && isUnpaid && orderStatus === 'aberto' && ( // Ex: 2 horas
                    <OrderItemDetailsText style={{ color: colors.warning, fontWeight: 'bold', marginBottom: spacing.small }}>
                        ALERTA: Aberto há mais de 2 horas e Pendente! Verificar.
                    </OrderItemDetailsText>
                 )}
                 {/* Alerta Principal: ENTREGUE mas NÃO PAGO */}
                 {isDeliveredAndOwed && (
                     <OrderItemDetailsText style={{ color: colors.danger, fontWeight: 'bold', marginBottom: spacing.medium, borderTop: `1px dashed ${colors.warning}`, paddingTop: spacing.small }}>
                        ATENÇÃO: Pedido ENTREGUE mas pagamento NÃO CONCLUÍDO! ({debtDurationText} em débito)
                    </OrderItemDetailsText>
                 )}

                {/* Seção: Detalhes do Cliente */}
                <StyledView style={{ marginTop: spacing.medium, borderTop: `1px dashed ${colors.gray}`, paddingTop: spacing.small }}>
                    <StyledText style={{ fontWeight: 'bold', marginBottom: spacing.xsmall }}>
                        Cliente:
                    </StyledText>
                    <OrderItemDetailsText>Nome: {order.customerName}</OrderItemDetailsText>
                    <OrderItemDetailsText>Endereço: {order.customerAddress}</OrderItemDetailsText>
                    <OrderItemDetailsText>Telefone: {formatPhoneNumber(order.customerPhone)}</OrderItemDetailsText>
                </StyledView>

                {/* Seção: Observação Editável */}
                <StyledView style={{ marginTop: spacing.medium }}>
                     <StyledText style={{ fontWeight: 'bold', marginBottom: spacing.xsmall }}>Observação:</StyledText>
                     <ObservationInput
                         orderId={order.orderId}
                         initialValue={order.observation || ''}
                         // Poderia desabilitar a edição para pedidos cancelados, por exemplo:
                         // disabled={orderStatus === 'cancelado'}
                     />
                </StyledView>

                {/* Seção: Itens do Pedido */}
                {order.items && order.items.length > 0 && (
                    <StyledView style={{ marginTop: spacing.medium, borderTop: `1px solid ${colors.gray}`, paddingTop: spacing.small }}>
                        <StyledText style={{ fontWeight: 'bold', marginBottom: spacing.xsmall }}>Itens:</StyledText>
                        {/* Usar ul/li para semântica, se possível no React Native Web / Styles */}
                        {order.items.map((item: OrderItem) => (
                            <OrderItemDetailsText key={item.id} style={{ marginLeft: spacing.small, lineHeight: 1.4 }}>
                                - {item.quantity}x {item.name} ({formatCurrency(item.unitPrice)}/un) = {formatCurrency(item.total)}
                                {item.category ? ` [${item.category}]` : ''}
                            </OrderItemDetailsText>
                        ))}
                    </StyledView>
                )}

                {/* Seção: Totais e Status Financeiro Final */}
                <StyledView style={{ marginTop: spacing.medium, borderTop: `1px solid ${colors.gray}`, paddingTop: spacing.small, textAlign: 'right' }}>
                     <OrderTotalText>
                        Total Pedido: {formatCurrency(orderTotal)}
                    </OrderTotalText>
                    <OrderItemDetailsText>
                        Valor Pago: {formatCurrency(paymentValue)}
                    </OrderItemDetailsText>
                     {/* Repete o status final para clareza */}
                     <OrderItemDetailsText style={{ fontWeight: 'bold', color: paymentStatusColor }}>
                         Status Final: {paymentStatusText}
                     </OrderItemDetailsText>
                 </StyledView>


                {/* Seção: Botões de Ação */}
                <ButtonsContainer>
                    {/* Botões de mudança de status */}
                    {orderStatus === 'aberto' && (
                        <>
                            <StyledButton variant="success" onClick={() => handleChangeOrderStatus(order.orderId, 'entregue')} title="Marcar pedido como Entregue">Marcar Entregue</StyledButton>
                            <StyledButton variant="warning" onClick={() => handleChangeOrderStatus(order.orderId, 'cancelado')} title="Marcar pedido como Cancelado">Marcar Cancelado</StyledButton>
                        </>
                    )}
                    {/* Botão para reabrir pedido fechado */}
                    {(orderStatus === 'entregue' || orderStatus === 'cancelado') && (
                         <StyledButton variant="secondary" onClick={() => handleChangeOrderStatus(order.orderId, 'aberto')} title="Reverter status para 'Aberto'">Reabrir Pedido</StyledButton>
                    )}

                    {/* Botões de Pagamento (aparecem se não for cancelado e tiver valor > 0) */}
                    {orderStatus !== 'cancelado' && orderTotal > tolerance && (
                        <>
                             <StyledButton
                                variant={paymentValue > tolerance ? "info" : "success"} // Verde se não pago, azul se já pago algo
                                onClick={() => handleRecordPayment(order.orderId, paymentValue, orderTotal)}
                                title={`Registrar ou atualizar valor pago (Total: ${formatCurrency(orderTotal)})`}
                             >
                                 {/* Texto do botão muda se já existe pagamento */}
                                 {paymentValue > tolerance ? 'Atualizar Pagto' : 'Registrar Pagto'}
                             </StyledButton>
                            {/* Botão para resetar pagamento (aparece apenas se algo já foi pago) */}
                            {paymentValue > tolerance && (
                                <StyledButton
                                    variant="warning"
                                    onClick={() => handleResetPayment(order.orderId)}
                                    title="Zerar valor pago (marcar como totalmente devido)"
                                >
                                    Resetar Pagto
                                </StyledButton>
                            )}
                        </>
                    )}

                    {/* Botões Gerais */}
                    <StyledButton variant="primary" onClick={() => handleEditOrder(order.orderId)} title="Ver detalhes ou editar itens do pedido">Ver / Editar</StyledButton>
                    <StyledButton variant="danger" onClick={() => handleDeleteOrder(order.orderId)} title="Excluir este pedido permanentemente">Excluir</StyledButton>
                </ButtonsContainer>
            </OrderItemContainer>
        );
    }; // --- Fim de renderItem ---

    // --- Renderização Principal do Componente ---
    return (
        <Container>
            <Title>Histórico de Pedidos</Title>

            {/* Exibe estado de carregamento */}
            {isLoading && (
                 <StyledText style={{ textAlign: 'center', marginTop: '40px', color: colors.secondary }}>
                     Carregando pedidos...
                 </StyledText>
            )}

            {/* Exibe estado de erro */}
            {error && !isLoading && (
                 <StyledText style={{ textAlign: 'center', marginTop: '40px', color: colors.danger, fontWeight: 'bold' }}>
                     {error}
                 </StyledText>
            )}

            {/* Lista de Pedidos (só renderiza se não estiver carregando e não houver erro) */}
            {!isLoading && !error && (
                <OrdersListContainer>
                    {orders.length > 0 ? (
                         // Mapeia os pedidos para renderização
                         orders.map(order => renderItem({ item: order }))
                     ) : (
                         // Mensagem se não houver pedidos
                         <StyledText style={{ textAlign: 'center', marginTop: '40px', color: colors.secondary }}>
                             Nenhum pedido encontrado.
                         </StyledText>
                     )}
                </OrdersListContainer>
            )}

            {/* Botão Voltar (sempre visível ou condicional?) */}
            <StyledView style={{ marginTop: 'auto', // Empurra para baixo
                                paddingTop: '20px',
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'center',
                                borderTop: `1px solid ${colors.gray}` // Separador visual
                               }}>
                 <StyledButton
                    variant="secondary"
                    onClick={() => {
                      console.log("[Handler] Navegando de volta para Home");
                      // Certifique-se que '/Home' é a rota correta no seu Expo Router
                      router.push('/Home');
                    }}
                    title="Voltar para a tela inicial"
                 >
                    Voltar para Home
                </StyledButton>
            </StyledView>
        </Container>
    );
};

export default Orders;