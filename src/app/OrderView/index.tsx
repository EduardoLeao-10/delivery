// src/app/OrderView/index.tsx
import React, { useState, useEffect, useRef } from "react";
// 1. ADICIONADO useRouter AQUI
import { useLocalSearchParams, useRouter } from "expo-router";
import { database } from "../../services/firebaseConfig";
import { ref, update, onValue } from "firebase/database";
import {
    Container,
    Title,
    TableRow,
    TableCell,
    TableBody,
    TableHeader,
    TableFooter,
    TotalText,
    StyledButton, // Já estava importado, ótimo!
    CustomerInfoContainer,
    CustomerInfoLabel,
    ScrollableContainer,
} from "./styles";
import { OrderItem, FirebaseOrderItemData } from "../types";
import { TableInput } from "../Home/styles"; // Ou importe de './styles' se ele estiver lá

// --- Funções Utilitárias ---

const formatCurrency = (value: number): string => {
    if (isNaN(value)) return "0,00";
    return value.toLocaleString("pt-BR", {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const parseCurrency = (value: string): number => {
    if (!value) return 0;
    const cleanedValue = value.replace(/\D/g, "");
    if (cleanedValue === "") return 0;
    const numericValue = parseFloat(cleanedValue) / 100;
    return isNaN(numericValue) ? 0 : numericValue;
};

const formatPhoneNumber = (value: string): string => {
    if (!value) return "";
    const digitsOnly = value.replace(/\D/g, "");
    const limitedDigits = digitsOnly.slice(0, 10);
    let formatted = "";
    if (limitedDigits.length > 0) {
      formatted = `(${limitedDigits.slice(0, 2)}`;
    }
    if (limitedDigits.length > 2) {
      formatted += `)${limitedDigits.slice(2, 6)}`;
    }
    if (limitedDigits.length > 6) {
      formatted += `-${limitedDigits.slice(6, 10)}`;
    }
    return formatted;
};


// --- Componente Principal ---
const OrderView = () => {
    const { orderId: orderIdString } = useLocalSearchParams();
    const orderId = String(orderIdString);
    // 2. ADICIONADO O HOOK useRouter
    const router = useRouter();

    // State (código original mantido)
    const [customerName, setCustomerName] = useState<string>("");
    const [customerAddress, setCustomerAddress] = useState<string>("");
    const [customerPhone, setCustomerPhone] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<string>("Dinheiro");
    const [paymentValue, setPaymentValue] = useState<number>(0);
    const [paymentValueFormatted, setPaymentValueFormatted] = useState<string>('0,00');
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const scrollableContainerRef = useRef<HTMLDivElement>(null);


    // --- Effect para buscar dados do pedido (código original mantido) ---
    useEffect(() => {
        if (!orderId) {
            console.warn("OrderView: ID do pedido não fornecido.");
            setCustomerName("");
            setCustomerAddress("");
            setCustomerPhone("");
            setPaymentMethod("Dinheiro");
            setPaymentValue(0);
            setPaymentValueFormatted("0,00");
            setOrderItems([]);
            return;
        };

        console.log("OrderView: Tentando buscar dados para o pedido ID:", orderId);
        const orderRef = ref(database, `pedidos/${orderId}`);

        const unsubscribe = onValue(orderRef, (snapshot) => {
            if (snapshot.exists()) {
                const orderData = snapshot.val();
                console.log("OrderView: Dados recebidos do Firebase:", orderData);

                setCustomerName(orderData.customerName || "");
                setCustomerAddress(orderData.customerAddress || "");
                const phoneFromDB = orderData.customerPhone || "";
                setCustomerPhone(formatPhoneNumber(phoneFromDB));
                setPaymentMethod(orderData.paymentMethod || "Dinheiro");
                const paymentValueFromDB = Number(orderData.paymentValue) || 0;
                setPaymentValue(paymentValueFromDB);
                setPaymentValueFormatted(formatCurrency(paymentValueFromDB));

                if (orderData.itens) {
                    const itemsArray: OrderItem[] = Object.entries(orderData.itens).map(([id, rawItemData]) => {
                        const itemData = rawItemData as FirebaseOrderItemData;
                        const calculatedTotal = (itemData.quantity || 0) * (itemData.unitPrice || 0);
                        return {
                            id,
                            name: itemData.name || "Sem nome",
                            quantity: itemData.quantity || 0,
                            unitPrice: itemData.unitPrice || 0,
                            total: itemData.total != null ? itemData.total : calculatedTotal,
                            customerName: itemData.customerName || "",
                            customerAddress: itemData.customerAddress || "",
                            customerPhone: itemData.customerPhone || "",
                            category: itemData.category || "Sem categoria",
                        };
                    });
                    setOrderItems(itemsArray);
                } else {
                    setOrderItems([]);
                }
            } else {
                console.warn("OrderView: Nenhum pedido encontrado com o ID:", orderId);
                alert(`Pedido com ID ${orderId} não encontrado.`);
                setCustomerName("");
                setCustomerAddress("");
                setCustomerPhone("");
                setPaymentMethod("Dinheiro");
                setPaymentValue(0);
                setPaymentValueFormatted("0,00");
                setOrderItems([]);
            }
        }, (error) => {
            console.error("OrderView: Erro ao buscar dados do pedido:", error);
            alert("Erro ao carregar os dados do pedido. Verifique sua conexão.");
        });

        return () => {
            console.log("OrderView: Desinscrevendo listener para pedido ID:", orderId);
            unsubscribe();
        };
    }, [orderId]);

    // Effect para scroll (código original mantido)
    useEffect(() => {
        if (scrollableContainerRef.current) {
            scrollableContainerRef.current.scrollTop = 0;
        }
    }, [orderId]);

    // --- Funções de Atualização dos Itens (código original mantido) ---
    const updateOrderItem = async (itemId: string, updatedFields: Partial<OrderItem>) => {
        try {
            if (!orderId) {
                console.error("updateOrderItem: ID do pedido não encontrado!");
                return;
            }
            const itemRef = ref(database, `pedidos/${orderId}/itens/${itemId}`);
            await update(itemRef, updatedFields);
            console.log(`Item ${itemId} atualizado no Firebase:`, updatedFields);
            setOrderItems(prevItems =>
                prevItems.map(item =>
                    item.id === itemId ? { ...item, ...updatedFields } : item
                )
            );
        } catch (error) {
            console.error(`Erro ao atualizar o item ${itemId}:`, error);
            alert(`Erro ao atualizar o item. Tente novamente.`);
        }
    };

    const handleItemNameChange = (itemId: string, newName: string) => {
        setOrderItems(prevItems =>
            prevItems.map(item =>
                item.id === itemId ? { ...item, name: newName } : item
            )
        );
        updateOrderItem(itemId, { name: newName });
    };

    const handleItemQuantityChange = (itemId: string, value: string) => {
        const newQuantity = parseInt(value, 10);
        const validQuantity = isNaN(newQuantity) || newQuantity < 0 ? 0 : newQuantity;
        const item = orderItems.find(i => i.id === itemId);
        if (!item) return;
        const newTotal = validQuantity * item.unitPrice;
        setOrderItems(prevItems =>
            prevItems.map(i =>
                i.id === itemId ? { ...i, quantity: validQuantity, total: newTotal } : i
            )
        );
        updateOrderItem(itemId, { quantity: validQuantity, total: newTotal });
    };

    // --- Funções de Atualização dos Dados do Cliente e Pagamento (código original mantido) ---
    const handleCustomerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomerName(e.target.value);
    };

    const handleCustomerAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomerAddress(e.target.value);
    };

    const handleCustomerPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formattedValue = formatPhoneNumber(e.target.value);
        setCustomerPhone(formattedValue);
    };

    const handlePaymentValueChange = (text: string) => {
        const parsedValue = parseCurrency(text);
        setPaymentValue(parsedValue);
        setPaymentValueFormatted(text === '' ? '' : formatCurrency(parsedValue).replace(/^R\$\s*/, ''));
    };

    const handlePaymentValueBlur = () => {
      setPaymentValueFormatted(formatCurrency(paymentValue));
    };

    // --- Função para Salvar Alterações Gerais do Pedido (código original mantido) ---
    const handleSaveChanges = async () => {
        try {
            if (!orderId) {
                console.error("handleSaveChanges: ID do pedido não encontrado!");
                alert("Erro: ID do pedido não encontrado para salvar.");
                return;
            }
            const orderRef = ref(database, `pedidos/${orderId}`);
            const phoneDigitsOnly = customerPhone.replace(/\D/g, '');
            const orderUpdates = {
                customerName: customerName,
                customerAddress: customerAddress,
                customerPhone: phoneDigitsOnly,
                paymentMethod: paymentMethod,
                paymentValue: paymentValue,
                totalOrderValue: orderItems.reduce((sum, item) => sum + (item.total || 0), 0),
                lastUpdatedAt: new Date().toISOString()
            };
            await update(orderRef, orderUpdates);
            console.log("handleSaveChanges: Alterações gerais do pedido salvas com sucesso!", orderUpdates);
            alert("Alterações salvas com sucesso!");
        } catch (error) {
            console.error("Erro ao salvar as alterações gerais do pedido:", error);
            try {
                console.error("Detalhes do erro:", JSON.stringify(error, null, 2));
            } catch (e) {
                console.error("Não foi possível serializar o erro:", error);
            }
            alert("Erro ao salvar as alterações. Verifique o console para detalhes e tente novamente.");
        }
    };

    // --- Cálculos Derivados (código original mantido) ---
    const totalPrice = orderItems.reduce((sum, item) => sum + (item.total || 0), 0);
    const changeAmount = paymentValue - totalPrice;

    // --- Renderização JSX ---
    return (
        <Container>
            {/* Wrapper (código original mantido) */}
            <div style={{ width: '100%', maxWidth: '800px' }}>
                <Title>Editar Pedido (ID: {orderId})</Title>

                {/* 3. ADICIONADO O BOTÃO "VOLTAR PARA HOME" AQUI */}
                <StyledButton
                    variant="primary"
                    onClick={() => router.push('/Home')} // Verifique se a rota '/Home' está correta!
                    style={{ marginBottom: '20px', alignSelf: 'flex-start' }} // Estilo opcional
                >
                    Voltar para Home
                </StyledButton>
                {/* --- FIM DO BOTÃO ADICIONADO --- */}


                {/* Informações do Cliente (código original mantido) */}
                <CustomerInfoContainer>
                    <CustomerInfoLabel htmlFor="customerNameEdit">Nome:</CustomerInfoLabel>
                    <TableInput
                        id="customerNameEdit"
                        type="text"
                        placeholder="Nome do cliente"
                        value={customerName}
                        onChange={handleCustomerNameChange}
                    />
                </CustomerInfoContainer>
                <CustomerInfoContainer>
                    <CustomerInfoLabel htmlFor="customerAddressEdit">Endereço:</CustomerInfoLabel>
                    <TableInput
                        id="customerAddressEdit"
                        type="text"
                        placeholder="Endereço do cliente"
                        value={customerAddress}
                        onChange={handleCustomerAddressChange}
                    />
                </CustomerInfoContainer>
                <CustomerInfoContainer>
                    <CustomerInfoLabel htmlFor="customerPhoneEdit">Telefone:</CustomerInfoLabel>
                    <TableInput
                        id="customerPhoneEdit"
                        type="tel"
                        placeholder="(99)9999-9999"
                        value={customerPhone}
                        onChange={handleCustomerPhoneChange}
                        maxLength={14}
                        inputMode="tel"
                    />
                </CustomerInfoContainer>

                {/* Informações de Pagamento (código original mantido) */}
                <div style={{ marginTop: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                    <div>
                        <span style={{ fontWeight: 'bold', marginRight: '5px' }}>Forma Pagamento:</span>
                        <span>{paymentMethod}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <label htmlFor="paymentValueEdit" style={{ fontWeight: 'bold', marginRight: '5px' }}>Valor Pago:</label>
                        <TableInput
                            id="paymentValueEdit"
                            type="text"
                            inputMode="decimal"
                            style={{ width: '150px' }}
                            placeholder="0,00"
                            value={paymentValueFormatted}
                            onChange={(e) => handlePaymentValueChange(e.target.value)}
                            onBlur={handlePaymentValueBlur}
                        />
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>
                        {changeAmount >= 0 ? (
                            <span style={{ color: '#28a745' }}>Troco: R$ {formatCurrency(changeAmount)}</span>
                        ) : (
                            <span style={{ color: '#dc3545' }}>Falta: R$ {formatCurrency(Math.abs(changeAmount))}</span>
                        )}
                    </div>
                </div>

                {/* Tabela de Itens Editável (código original mantido) */}
                 <TableHeader style={{ background: '#f2f2f2', padding: '10px', borderBottom: '1px solid #ddd', gap: '10px', display: 'flex' }}>
                    <TableCell style={{ flex: 3, textAlign: 'left', fontWeight: 'bold' }}>Item</TableCell>
                    <TableCell style={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>Qtde</TableCell>
                    <TableCell style={{ flex: 1.5, textAlign: 'center', fontWeight: 'bold' }}>Unit. (R$)</TableCell>
                    <TableCell style={{ flex: 1.5, textAlign: 'right', fontWeight: 'bold' }}>Total (R$)</TableCell>
                </TableHeader>

                <ScrollableContainer ref={scrollableContainerRef}>
                    <TableBody>
                        {orderItems.length > 0 ? orderItems.map((item) => (
                             <TableRow key={item.id} style={{ borderBottom: '1px solid #eee', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', boxShadow: 'none', borderRadius: 0, border: 'none', marginBottom: 0 }}>
                                <TableCell style={{ flex: 3 }}>
                                    <TableInput
                                        type="text"
                                        value={item.name}
                                        onChange={(e) => handleItemNameChange(item.id, e.target.value)}
                                        style={{ border: 'none', background: 'transparent', padding: '5px', width: '100%', textAlign: 'left', boxShadow: 'none' }}
                                    />
                                </TableCell>
                                <TableCell style={{ flex: 1, textAlign: 'center' }}>
                                    <TableInput
                                        type="number"
                                        value={item.quantity.toString()}
                                        onChange={(e) => handleItemQuantityChange(item.id, e.target.value)}
                                        min="0"
                                        style={{ width: '65px', padding: '5px', textAlign: 'center', boxShadow: 'none' }}
                                    />
                                </TableCell>
                                <TableCell style={{ flex: 1.5, textAlign: 'center', padding: '5px' }}>
                                    {formatCurrency(item.unitPrice)}
                                </TableCell>
                                <TableCell style={{ flex: 1.5, textAlign: 'right', padding: '5px', fontWeight: '500' }}>
                                    {formatCurrency(item.total)}
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow style={{ padding: '20px', textAlign: 'center', color: '#777', display: 'flex', justifyContent: 'center', background: 'transparent', boxShadow: 'none', borderRadius: 0, border: 'none', marginBottom: 0 }}>
                                <TableCell style={{ flex: 1, textAlign: 'center' }}>
                                    Nenhum item neste pedido.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </ScrollableContainer>

                {/* Rodapé da Tabela (código original mantido) */}
                <TableFooter style={{ background: '#e9ecef', color: '#212529', padding: '15px 10px', borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '0', borderRadius: '0 0 8px 8px' }}>
                    <TotalText style={{ color: 'inherit' }}>
                        Total Geral do Pedido: R$ {formatCurrency(totalPrice)}
                    </TotalText>
                </TableFooter>
            </div> {/* Fim do div wrapper */}

            {/* Botão de Salvar (código original mantido) */}
            <StyledButton onClick={handleSaveChanges} style={{ marginTop: '25px', width: '100%', maxWidth: '800px', padding: '15px', fontSize: '16px' }}>
                Salvar Alterações do Pedido
            </StyledButton>
        </Container>
    );
};

export default OrderView;