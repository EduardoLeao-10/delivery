import React from "react";
import { Container, Title, OrderSummary } from "./styles";

export function Checkout() {
  return (
    <Container>
      <Title>Resumo do Pedido</Title>
      <OrderSummary>
        <p>Item: Pizza de Calabresa</p>
        <p>Quantidade: 1</p>
        <p>Preço Total: R$ 49,90</p>
      </OrderSummary>
    </Container>
  );
}
