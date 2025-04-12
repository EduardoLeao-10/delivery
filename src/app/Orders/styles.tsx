import styled, { css } from "styled-components";

//--- Theme Variables ---//
export const colors = {
    primary: "#007bff",      // Azul primário
    secondary: "#6c757d",    // Cinza secundário
    light: "#f8f9fa",        // Fundo claro
    dark: "#343a40",         // Texto escuro
    white: "#fff",           // Branco
    gray: "#e9ecef",         // Cinza claro para bordas/fundos
    mediumGray: "#adb5bd",   // Cinza médio para textos secundários
    success: "#28a745",      // Verde sucesso
    danger: "#dc3545",       // Vermelho perigo
    warning: "#ffc107",      // Amarelo aviso (bom para 'Cancelar')
    info: "#17a2b8",         // Azul informação (bom para status 'Aberto')
};

export const spacing = {
    xsmall: "4px",
    small: "8px",
    medium: "16px",
    large: "24px",
    xlarge: "32px",
};

export const fontSize = {
    xsmall: "12px",
    small: "14px",
    medium: "16px",
    large: "18px",
    xlarge: "20px",
    title: "28px",
    subtitle: "22px",
};

export const borderRadius = {
    small: "4px",
    medium: "8px",
    large: "12px",
    pill: "50px", // Para badges
};

export const boxShadow = {
    small: "0px 2px 4px rgba(0, 0, 0, 0.08)",
    medium: "0px 4px 8px rgba(0, 0, 0, 0.12)",
};

export const transition = {
    fast: "0.2s ease-in-out",
    normal: "0.3s ease-in-out",
};


//--- Styled Components ---//

export const Container = styled.div`
  height: 100vh; /* Altura total da viewport */
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: ${colors.light};
  padding: ${spacing.medium};
  box-sizing: border-box;
  overflow: hidden; /* Evita scroll no container principal */
`;

export const Title = styled.h1`
  font-size: ${fontSize.title};
  color: ${colors.dark};
  margin-bottom: ${spacing.large};
  font-weight: 600;
  text-align: center;
`;

export const OrdersListContainer = styled.div`
  flex-grow: 1; /* Ocupa o espaço vertical disponível */
  width: 100%;
  max-width: 800px; /* Largura máxima para melhor leitura */
  overflow-y: auto; /* Habilita scroll APENAS nesta área */
  padding: 0 ${spacing.small}; /* Espaçamento lateral */
  margin-bottom: ${spacing.medium};

  /* Estilização da barra de rolagem (Webkit - Chrome/Safari/Edge) */
  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-track {
    background: ${colors.gray};
    border-radius: ${borderRadius.pill};
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${colors.primary};
    border-radius: ${borderRadius.pill};
    border: 2px solid ${colors.gray};
  }
  &::-webkit-scrollbar-thumb:hover {
    background-color: #0056b3; /* Azul mais escuro */
  }
`;

export const OrderItemContainer = styled.div`
  background-color: ${colors.white};
  padding: ${spacing.medium};
  margin-bottom: ${spacing.medium};
  border-radius: ${borderRadius.medium};
  border: 1px solid ${colors.gray};
  box-shadow: ${boxShadow.small};
  transition: transform ${transition.fast}, box-shadow ${transition.fast};
  width: 100%; /* Garante ocupar a largura do container pai */
  box-sizing: border-box;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${boxShadow.medium};
  }
`;

export const OrderIdText = styled.p`
  font-size: ${fontSize.medium};
  color: ${colors.primary};
  font-weight: 600;
  margin-bottom: ${spacing.small};
  word-break: break-all; /* Quebra IDs longos se necessário */
`;

export const OrderItemDetailsText = styled.p`
  font-size: ${fontSize.medium};
  color: ${colors.dark};
  margin-bottom: ${spacing.xsmall};
  line-height: 1.5;
`;

export const OrderTotalText = styled.p`
  font-size: ${fontSize.large};
  color: ${colors.dark};
  font-weight: 600;
  margin-top: ${spacing.medium};
  text-align: right;
`;

export const ButtonsContainer = styled.div`
  display: flex;
  flex-wrap: wrap; /* Permite que botões quebrem linha em telas menores */
  justify-content: flex-end; /* Alinha botões à direita */
  gap: ${spacing.small}; /* Espaço entre botões */
  margin-top: ${spacing.medium};
  padding-top: ${spacing.medium};
  border-top: 1px solid ${colors.gray}; /* Linha separadora */
`;

// Definindo tipos mais explicitos para as variantes de botão
type ButtonVariant = "primary" | "danger" | 'secondary' | 'success' | 'warning';

// Ajustando o StyledButton para aceitar mais variantes ou usar estilo inline
export const StyledButton = styled.button<{ variant?: ButtonVariant }>`
  background-color: ${props => {
    switch (props.variant) {
      case 'danger': return colors.danger;
      case 'secondary': return colors.secondary;
      case 'success': return colors.success;
      case 'warning': return colors.warning;
      case 'primary':
      default: return colors.primary;
    }
  }};
  color: ${props => (props.variant === 'warning' ? colors.dark : colors.white)}; /* Texto escuro para warning */
  padding: ${spacing.small} ${spacing.medium};
  border: none;
  border-radius: ${borderRadius.medium};
  font-size: ${fontSize.small};
  font-weight: 500;
  cursor: pointer;
  transition: background-color ${transition.fast}, transform ${transition.fast}, box-shadow ${transition.fast}, opacity ${transition.fast};
  box-shadow: ${boxShadow.small};
  outline: none;
  min-width: 90px;
  text-align: center;
  white-space: nowrap;

  &:hover {
    opacity: 0.85;
    box-shadow: ${boxShadow.medium};
  }

  &:active {
    transform: translateY(1px);
    box-shadow: none;
    opacity: 1;
  }

  &:disabled {
    background-color: ${colors.mediumGray};
    cursor: not-allowed;
    opacity: 0.6;
    box-shadow: none;
  }
`;

export const StyledText = styled.p`
  font-size: ${fontSize.medium};
  color: ${colors.dark};
  margin: ${spacing.small} 0;
`;

export const StyledView = styled.div`
  margin-bottom: ${spacing.small};
`;

// --- Estilos para Badges de Status --- //

export const OrderStatusContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: ${spacing.small};
    margin-bottom: ${spacing.medium};
`;

const BaseBadge = styled.div`
    padding: ${spacing.xsmall} ${spacing.small};
    border-radius: ${borderRadius.pill};
    font-size: ${fontSize.xsmall};
    font-weight: 600;
    color: ${colors.white};
    text-align: center;
    white-space: nowrap;
    line-height: 1.4;
`;

export const TimeBadge = styled(BaseBadge)<{ timeDifferenceMinutes: number | null }>`
    background-color: ${props => {
        const minutes = props.timeDifferenceMinutes;
        if (minutes === null) return colors.mediumGray;
        if (minutes >= 60) return colors.danger;
        if (minutes >= 30) return colors.warning;
        return colors.success;
    }};
    color: ${props => props.timeDifferenceMinutes !== null && props.timeDifferenceMinutes >= 30 ? colors.dark : colors.white};
`;

export const PaymentBadge = styled(BaseBadge)<{ isPaid: boolean }>`
    background-color: ${props => props.isPaid ? colors.success : colors.danger};
`;

export const StatusBadge = styled(BaseBadge)<{ status: string }>`
    background-color: ${props => {
        switch(props.status?.toLowerCase()) {
            case 'entregue': return colors.success;
            case 'cancelado': return colors.danger;
            case 'aberto': return colors.info;
            default: return colors.secondary;
        }
    }};
`;

// --- Estilo para o campo de Observação --- // <<< NOVO ESTILO ADICIONADO
export const StyledTextArea = styled.textarea`
  width: 100%; /* Ocupa toda a largura disponível */
  min-height: 60px; /* Altura mínima */
  padding: ${spacing.small};
  /* Removido margin-top daqui, será controlado no layout pai */
  border: 1px solid ${colors.gray};
  border-radius: ${borderRadius.medium};
  font-size: ${fontSize.small};
  color: ${colors.dark};
  background-color: ${colors.white};
  box-sizing: border-box;
  resize: vertical; /* Permite redimensionar verticalmente */
  line-height: 1.4;
  transition: border-color ${transition.fast}, box-shadow ${transition.fast};

  &:focus {
    outline: none;
    border-color: ${colors.primary};
    box-shadow: 0 0 0 2px ${colors.primary}30; /* Sombra suave no foco */
  }

  &::placeholder {
    color: ${colors.mediumGray};
    font-style: italic;
  }
`;