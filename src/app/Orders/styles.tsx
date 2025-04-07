// src/app/Orders/styles.tsx
import styled from "styled-components";

// Variáveis de Estilo (Temas)
const colors = {
    primary: "#007bff",      // Azul primário
    secondary: "#6c757d",    // Cinza secundário
    light: "#f8f9fa",        // Fundo claro
    dark: "#343a40",         // Texto escuro
    white: "#fff",           // Branco
    gray: "#e9ecef",         // Cinza claro
    success: "#28a745",      // Verde sucesso
    danger: "#dc3545",       // Vermelho perigo
    warning: "#ffc107",      // Amarelo aviso
    info: "#17a2b8",         // Azul informação
};

const spacing = {
    xsmall: "4px",
    small: "8px",
    medium: "16px",
    large: "24px",
    xlarge: "32px",
};

const fontSize = {
    xsmall: "12px",
    small: "14px",
    medium: "16px",
    large: "18px",
    xlarge: "20px",
    title: "28px",          // Aumentei o tamanho do título
    subtitle: "22px",
};

const borderRadius = {
    small: "8px",
    medium: "12px",
    large: "16px",
};

const boxShadow = {
    small: "0px 2px 4px rgba(0, 0, 0, 0.1)",
    medium: "0px 4px 8px rgba(0, 0, 0, 0.15)",
};

const transition = {
    fast: "0.2s ease-in-out",
    normal: "0.3s ease-in-out",
    slow: "0.5s ease-in-out",
};

// Container Principal
export const Container = styled.div`
  height: 100vh; /* Garante que ocupa toda a tela */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start; /* Garante que o conteúdo começa do topo */
  padding: ${spacing.large};
  background-color: ${colors.light};
  border-radius: ${borderRadius.medium};
  overflow: hidden; /* Evita scroll duplicado */
`;

// Título
export const Title = styled.h1`
  font-size: ${fontSize.title};
  color: ${colors.dark};
  margin-bottom: ${spacing.large};
  font-weight: bold;
  text-align: center;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1); // Adicionei sombra ao texto
`;

// Novo container para a lista de pedidos com scroll
export const OrdersListContainer = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  width: 100%;
  max-height: calc(100vh - 150px); /* Ajuste conforme necessário */
  padding-right: ${spacing.small};
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-track {
    background: ${colors.gray};
    border-radius: ${borderRadius.small};
  }
  &::-webkit-scrollbar-thumb {
    background: ${colors.primary};
    border-radius: ${borderRadius.small};
  }
  &::-webkit-scrollbar-thumb:hover {
    background: darken(${colors.primary}, 10%);
  }
`;

// Container de Itens do Pedido
export const OrderItemContainer = styled.div`
  background-color: ${colors.white};
  padding: ${spacing.medium};
  margin-bottom: ${spacing.medium};
  border-radius: ${borderRadius.medium};
  box-shadow: ${boxShadow.small};
  width: 100%;
  max-width: 600px;
  border: 1px solid ${colors.gray}; // Adicionei borda sutil
  transition: transform ${transition.fast}; // Adiciona uma pequena animação

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${boxShadow.medium};
  }
`;

// Texto do ID do Pedido
export const OrderIdText = styled.p`
  font-size: ${fontSize.large};
  color: ${colors.primary};
  font-weight: bold;
  margin-bottom: ${spacing.small};
  text-transform: uppercase; // Transformei em maiúsculas
`;

// Texto dos Detalhes do Pedido
export const OrderItemDetailsText = styled.p`
  font-size: ${fontSize.medium};
  color: ${colors.dark};
  margin-bottom: ${spacing.xsmall};
  line-height: 1.5;
`;

// Texto do Total do Pedido
export const OrderTotalText = styled.p`
  font-size: ${fontSize.large};
  color: ${colors.success};
  font-weight: bold;
  margin-top: ${spacing.medium};
`;

// Container dos Botões
export const ButtonsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: ${spacing.medium};
`;

// Botão Estilizado
export const StyledButton = styled.button<{ variant?: "primary" | "danger" | 'secondary' }>`
  background-color: ${(props) =>
        props.variant === "danger" ? colors.danger : colors.primary};
  color: ${colors.white};
  padding: ${spacing.small} ${spacing.medium};
  border: none;
  border-radius: ${borderRadius.small};
  font-size: ${fontSize.medium};
  cursor: pointer;
  transition: background-color ${transition.normal}, transform ${transition.fast}, box-shadow ${transition.fast};
  box-shadow: ${boxShadow.small};
  outline: none; // Removi a borda ao clicar

  &:hover {
    background-color: ${(props) =>
        props.variant === "danger" ? "#c82333" : "#0056b3"};
    box-shadow: ${boxShadow.medium};
  }

  &:active {
    transform: translateY(1px);
    box-shadow: ${boxShadow.small};
  }
`;

// Texto Estilizado
export const StyledText = styled.p`
  font-size: ${fontSize.medium};
  color: ${colors.dark};
  margin: ${spacing.small} 0;
`;

// Container de Visualização
export const StyledView = styled.div`
  margin-bottom: ${spacing.small};
`;