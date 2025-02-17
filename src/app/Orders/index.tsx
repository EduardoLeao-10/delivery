// src/app/Orders/index.tsx
import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { FlatList, Button, TextInput, ScrollView, Alert } from "react-native"; // Importe Alert
import { database } from "../../services/firebaseConfig";
import { ref, get, update, remove } from "firebase/database";
import {
    Container,
    Title,
    Subtitle,
    OrderItem,
    OrderDetails,
    OrderItemDetails,
    Total,
    EditModal,
    Input,
    ButtonStyled,
    ButtonText,
    Texto,
    ErrorMessage,
} from "./styles";
import styled from "styled-components/native";

interface OrderItemType {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

interface OrderType {
    orderId: string;
    items: OrderItemType[];
    total: number;
}

const Orders = () => {
    const [orders, setOrders] = useState<OrderType[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null);
    const [editingItem, setEditingItem] = useState<OrderItemType | null>(null);
    const [editedQuantity, setEditedQuantity] = useState<string>('');
    const [quantityError, setQuantityError] = useState<string | null>(null); // Estado para erros de quantidade
    const router = useRouter();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const pedidosRef = ref(database, "pedidos");
            const snapshot = await get(pedidosRef);
            if (snapshot.exists()) {
                const data = snapshot.val();
                const ordersList: OrderType[] = Object.keys(data).map(key => {
                    const orderData = data[key];
                    const items: OrderItemType[] = orderData.itens ? Object.values(orderData.itens) : [];
                    const total = items.reduce((sum, item) => sum + item.total, 0);
                    return {
                        orderId: key,
                        items: items,
                        total: total
                    };
                });
                setOrders(ordersList);
            } else {
                console.log("Nenhum pedido encontrado.");
                setOrders([]);
            }
        } catch (error) {
            console.error("Erro ao buscar pedidos:", error);
            Alert.alert("Erro", "Erro ao buscar pedidos. Tente novamente."); // Usando Alert
        }
    };

    const handleSelectOrder = (order: OrderType) => {
        setSelectedOrder(order);
    };

    const handleEditItem = (item: OrderItemType) => {
        setEditingItem(item);
        setEditedQuantity(item.quantity.toString());
        setQuantityError(null); // Limpa o erro ao iniciar a edição
    };

    const validateQuantity = (quantity: string): boolean => {
        const num = Number(quantity);
        if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
            setQuantityError("Quantidade inválida. Digite um número inteiro maior que zero.");
            return false;
        }
        setQuantityError(null);
        return true;
    };

    const handleUpdateQuantity = async () => {
        if (!editingItem || !selectedOrder) return;

        if (!validateQuantity(editedQuantity)) {
            return;
        }

        const newQuantity = parseInt(editedQuantity, 10);

        try {
            const itemRef = ref(database, `pedidos/${selectedOrder.orderId}/itens/${editingItem.id}`);
            const updatedItem = { ...editingItem, quantity: newQuantity, total: newQuantity * editingItem.unitPrice };
            await update(itemRef, updatedItem);

            // Atualizar o estado local de forma imutável
            setOrders(prevOrders => {
                return prevOrders.map(order => {
                    if (order.orderId === selectedOrder.orderId) {
                        const updatedItems = order.items.map(item => {
                            if (item.id === editingItem.id) {
                                return { ...updatedItem }; // Cria uma nova referência para o item
                            }
                            return item;
                        });

                        const updatedTotal = updatedItems.reduce((sum, item) => sum + item.total, 0);

                        return {
                            ...order,
                            items: updatedItems,
                            total: updatedTotal
                        };
                    }
                    return order;
                });
            });

            // Atualizar selectedOrder também de forma imutável
            setSelectedOrder(prevOrder => {
                if (!prevOrder) return null;
                const updatedItems = prevOrder.items.map(item =>
                    item.id === editingItem.id ? { ...updatedItem } : item
                );
                const updatedTotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
                return { ...prevOrder, items: updatedItems, total: updatedTotal };
            });

            setEditingItem(null);
            setEditedQuantity('');
            Alert.alert("Sucesso", "Quantidade atualizada com sucesso!");
        } catch (error) {
            console.error("Erro ao atualizar a quantidade:", error);
            Alert.alert("Erro", "Erro ao atualizar a quantidade. Tente novamente.");
        }
    };

    const handleDeleteItem = async (item: OrderItemType) => {
        if (!selectedOrder) return;

        Alert.alert(
            "Excluir Item",
            `Deseja realmente excluir o item "${item.name}"?`,
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Excluir",
                    onPress: async () => {
                        try {
                            const itemRef = ref(database, `pedidos/${selectedOrder.orderId}/itens/${item.id}`);
                            await remove(itemRef);

                            // Atualizar o estado local
                            setOrders(prevOrders =>
                                prevOrders.map(order =>
                                    order.orderId === selectedOrder.orderId
                                        ? {
                                            ...order,
                                            items: order.items.filter(i => i.id !== item.id),
                                            total: order.items.filter(i => i.id !== item.id).reduce((sum, item) => sum + item.total, 0)
                                        }
                                        : order
                                )
                            );

                            setSelectedOrder(prevOrder => {
                                if (!prevOrder) return null;
                                return {
                                    ...prevOrder,
                                    items: prevOrder.items.filter(i => i.id !== item.id),
                                    total: prevOrder.items.filter(i => i.id !== item.id).reduce((sum, item) => sum + item.total, 0)
                                };
                            });

                            Alert.alert("Sucesso", "Item removido com sucesso!");
                        } catch (error) {
                            console.error("Erro ao remover o item:", error);
                            Alert.alert("Erro", "Erro ao remover o item. Tente novamente.");
                        }
                    },
                }
            ],
            { cancelable: false }
        );
    };

    const handleDeleteOrder = async () => {
        if (!selectedOrder) return;

        Alert.alert(
            "Excluir Pedido",
            `Deseja realmente excluir o pedido ${selectedOrder.orderId}?`,
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Excluir",
                    onPress: async () => {
                        try {
                            const orderRef = ref(database, `pedidos/${selectedOrder.orderId}`);
                            await remove(orderRef);

                            // Atualizar o estado local
                            setOrders(prevOrders => prevOrders.filter(order => order.orderId !== selectedOrder.orderId));
                            setSelectedOrder(null);

                            Alert.alert("Sucesso", "Pedido removido com sucesso!");
                        } catch (error) {
                            console.error("Erro ao remover o pedido:", error);
                            Alert.alert("Erro", "Erro ao remover o pedido. Tente novamente.");
                        }
                    },
                }
            ],
            { cancelable: false }
        );
    };

    const renderItem = ({ item }: { item: OrderType }) => (
        <OrderItem onPress={() => handleSelectOrder(item)}>
            <Texto>Pedido: {item.orderId}</Texto>
            <Texto>Total: R$ {item.total.toFixed(2)}</Texto>
        </OrderItem>
    );

    return (
        <Container>
            <ScrollView>
                <Title>Pedidos Anteriores</Title>

                <FlatList
                    data={orders}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.orderId}
                />

                {selectedOrder && (
                    <OrderDetails>
                        <Subtitle>Detalhes do Pedido: {selectedOrder.orderId}</Subtitle>
                        {selectedOrder.items.map(item => (
                            <OrderItemDetails key={item.id}>
                                <Texto>{item.name} - Qtde: {item.quantity} - Unit: R$ {item.unitPrice.toFixed(2)} - Total: R$ {item.total.toFixed(2)}</Texto>
                                <Button title="Editar" onPress={() => handleEditItem(item)} />
                                <Button title="Excluir" onPress={() => handleDeleteItem(item)} />
                            </OrderItemDetails>
                        ))}
                        <Total>Total do Pedido: R$ {selectedOrder.total.toFixed(2)}</Total>
                        <Button title="Excluir Pedido" onPress={handleDeleteOrder} />
                    </OrderDetails>
                )}

                {editingItem && (
                    <EditModal>
                        <Texto>Editar Quantidade para: {editingItem.name}</Texto>
                        <Input
                            value={editedQuantity}
                            onChangeText={setEditedQuantity}
                            keyboardType="number-pad"
                        />
                        {quantityError && <ErrorMessage>{quantityError}</ErrorMessage>}
                        <Button title="Atualizar Quantidade" onPress={handleUpdateQuantity} />
                    </EditModal>
                )}
            </ScrollView>
        </Container>
    );
};

export default Orders;