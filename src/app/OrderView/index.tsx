// src/app/OrderView/index.tsx
import React from "react";
import { useLocalSearchParams } from "expo-router";
import {
  Container,
  Title,
  TableRow,
  TableCell,
  TableBody,
  TableHeader,
  TableFooter,
  TotalText,
} from "./styles";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export default function OrderView() {
  const params = useLocalSearchParams();

  // Recuperar os itens do pedido dos parâmetros de navegação
  const orderItems: OrderItem[] = params.orderItems ? JSON.parse(params.orderItems as string) : [];
  const totalPrice = orderItems.reduce((sum, item) => sum + item.total, 0);

  return (
    <Container>
      <Title>Visualização do Pedido</Title>

      {/* Tabela de Itens do Pedido */}
      <TableHeader>
        <TableCell>Item</TableCell>
        <TableCell>Qtde</TableCell>
        <TableCell>Unit.</TableCell>
        <TableCell>Total</TableCell>
      </TableHeader>

      <TableBody>
        {orderItems.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.name}</TableCell>
            <TableCell>{item.quantity}</TableCell>
            <TableCell>R$ {item.unitPrice.toFixed(2).replace(".", ",")}</TableCell>
            <TableCell>R$ {item.total.toFixed(2).replace(".", ",")}</TableCell>
          </TableRow>
        ))}
      </TableBody>

      {/* Total do Pedido */}
      <TableFooter>
        <TotalText>Total: R$ {totalPrice.toFixed(2).replace(".", ",")}</TotalText>
      </TableFooter>
    </Container>
  );
}