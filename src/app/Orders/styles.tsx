import styled, { css } from "styled-components";

//--- Variáveis de Tema (Cores, Espaçamentos, Fontes, etc.) ---//
export const colors = {
    primary: "#007bff",      // Azul Principal
    secondary: "#6c757d",    // Cinza Secundário
    light: "#f8f9fa",        // Fundo Claro (Página)
    dark: "#343a40",         // Texto Escuro Principal
    white: "#ffffff",        // Branco
    gray: "#dee2e6",         // Cinza Claro (Bordas, Separadores)
    mediumGray: "#adb5bd",   // Cinza Médio (Textos secundários, Placeholders)
    success: "#28a745",      // Verde Sucesso (Pago, Entregue)
    danger: "#dc3545",       // Vermelho Perigo (Pendente, Cancelado, Excluir, Débito)
    warning: "#ffc107",      // Amarelo Aviso (Parcialmente Pago, Cancelar Ação)
    info: "#17a2b8",         // Azul Informação (Aberto)
};

export const spacing = {
    xsmall: "4px",
    small: "8px",
    medium: "16px",
    large: "24px",
    xlarge: "32px",
};

export const fontSize = {
    xsmall: "12px", // Itens do pedido, talvez?
    small: "14px",  // Badges, Datas, Detalhes menores
    medium: "16px", // Texto padrão, Botões, ID Pedido
    large: "18px",  // Detalhes Cliente, Total Pedido
    xlarge: "20px", // Títulos menores
    subtitle: "22px",
    title: "28px",  // Título Principal da Página
};

export const borderRadius = {
    small: "4px",
    medium: "8px",  // Padrão para containers e botões
    large: "12px",
    pill: "50px", // Para Badges
};

export const boxShadow = {
    small: "0 1px 3px rgba(0, 0, 0, 0.1)",
    medium: "0 4px 8px rgba(0, 0, 0, 0.12)",
    large: "0 6px 12px rgba(0, 0, 0, 0.15)",
};

export const transition = {
    fast: "0.2s ease-in-out",
    normal: "0.3s ease-in-out",
};


//--- Componentes Estilizados ---//

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh; /* Garante que ocupe pelo menos a altura da tela */
  background-color: ${colors.light};
  padding: ${spacing.medium};
  box-sizing: border-box;
`;

export const Title = styled.h1`
  font-size: ${fontSize.title};
  color: ${colors.dark};
  margin-bottom: ${spacing.large};
  font-weight: 600;
  text-align: center;
`;

export const OrdersListContainer = styled.div`
  width: 100%;
  max-width: 900px; /* Aumenta um pouco a largura máxima */
  margin-bottom: ${spacing.large}; /* Mais espaço antes do botão Voltar */
  overflow-y: auto; /* Scroll vertical apenas se necessário */
  flex-grow: 1; /* Permite que esta área cresça para preencher o espaço */
  padding: 0 ${spacing.small};

  /* Estilização da barra de rolagem (Opcional, para Webkit) */
  &::-webkit-scrollbar {
    width: 10px;
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
  width: 100%;
  box-sizing: border-box;

  &:hover {
    /* Efeito sutil de elevação */
    /* transform: translateY(-2px); */
    box-shadow: ${boxShadow.medium};
  }
`;

export const OrderIdText = styled.p`
  font-size: ${fontSize.medium};
  color: ${colors.primary};
  font-weight: 700; /* Mais destaque para o ID */
  margin-bottom: ${spacing.small};
  word-break: break-all;
`;

export const OrderItemDetailsText = styled.p`
  font-size: ${fontSize.medium}; /* Aumentado para melhor leitura dos detalhes */
  color: ${colors.dark};
  margin-bottom: ${spacing.small}; /* Espaço entre linhas de detalhe */
  line-height: 1.5; /* Espaçamento entre linhas */

  strong {
    font-weight: 600; /* Destaque para labels */
    color: ${colors.secondary}; /* Cor diferente para labels */
    margin-right: ${spacing.xsmall};
  }
`;

export const OrderTotalText = styled.p`
  font-size: ${fontSize.large}; /* Tamanho grande para o total */
  color: ${colors.dark};
  font-weight: 700; /* Bem destacado */
  margin-top: ${spacing.small};
  margin-bottom: ${spacing.small};
  text-align: right; /* Alinhado à direita */
`;

export const ButtonsContainer = styled.div`
  display: flex;
  flex-wrap: wrap; /* Quebra linha em telas menores */
  justify-content: flex-end; /* Alinha botões à direita */
  gap: ${spacing.small}; /* Espaço entre botões */
  margin-top: ${spacing.medium};
  padding-top: ${spacing.medium};
  border-top: 1px solid ${colors.gray}; /* Linha separadora */
`;

// Tipos para as variantes de botão
type ButtonVariant = "primary" | "danger" | 'secondary' | 'success' | 'warning' | 'info';

export const StyledButton = styled.button<{ variant?: ButtonVariant }>`
  background-color: ${props => {
    switch (props.variant) {
      case 'danger': return colors.danger;
      case 'secondary': return colors.secondary;
      case 'success': return colors.success;
      case 'warning': return colors.warning;
      case 'info': return colors.info;
      case 'primary':
      default: return colors.primary;
    }
  }};
  color: ${props => (props.variant === 'warning' ? colors.dark : colors.white)}; /* Texto escuro para warning */

  padding: 8px 16px; /* Padding um pouco menor para não ficar gigante */
  font-size: ${fontSize.small}; /* Fonte ligeiramente menor para botões */
  border: none;
  border-radius: ${borderRadius.medium};
  font-weight: 600; /* Fonte mais forte */
  cursor: pointer;
  transition: background-color ${transition.fast}, opacity ${transition.fast}, box-shadow ${transition.fast};
  box-shadow: ${boxShadow.small};
  outline: none;
  text-align: center;
  white-space: nowrap; /* Evita que o texto do botão quebre linha */
  min-width: 90px; /* Largura mínima para consistência */

  &:hover {
    opacity: 0.85;
    box-shadow: ${boxShadow.medium};
  }

  &:active {
    opacity: 1;
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.2); /* Efeito pressionado */
  }

  &:disabled {
    background-color: ${colors.mediumGray};
    color: ${colors.light};
    cursor: not-allowed;
    opacity: 0.7;
    box-shadow: none;
  }
`;

export const StyledText = styled.p`
  font-size: ${fontSize.medium};
  color: ${colors.dark};
  margin: ${spacing.small} 0;
  line-height: 1.5;
`;

export const StyledView = styled.div`
  /* Usado como um container genérico para espaçamento e agrupamento */
  /* Exemplo: margin-bottom: ${spacing.small}; */
`;

// --- Estilos para Badges de Status --- //

export const OrderStatusContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: ${spacing.small};
    margin-bottom: ${spacing.medium}; /* Espaço abaixo dos badges */
    align-items: center; /* Alinha verticalmente se quebrar linha */
`;

const BaseBadge = styled.div`
    padding: 5px 12px; /* Padding interno do badge */
    font-size: ${fontSize.xsmall}; /* Fonte pequena para badges */
    border-radius: ${borderRadius.pill}; /* Formato de pílula */
    font-weight: 700; /* Negrito */
    color: ${colors.white}; /* Cor padrão do texto */
    text-align: center;
    white-space: nowrap;
    line-height: 1.3; /* Ajuste fino da altura da linha */
    text-transform: uppercase; /* Opcional: deixa em maiúsculas */
    letter-spacing: 0.5px; /* Opcional: espaçamento leve entre letras */
`;

export const TimeBadge = styled(BaseBadge)<{ timeDifferenceMinutes: number | null }>`
    background-color: ${props => {
        const minutes = props.timeDifferenceMinutes;
        if (minutes === null) return colors.mediumGray;
        if (minutes >= 120) return colors.danger; // Mais de 2h = Vermelho
        if (minutes >= 60) return colors.warning; // Mais de 1h = Amarelo
        return colors.info; // Menos de 1h = Azul Info
    }};
    color: ${props => props.timeDifferenceMinutes !== null && props.timeDifferenceMinutes >= 60 ? colors.dark : colors.white}; /* Texto escuro em amarelo */
`;

// O 'isPaid' aqui pode ser usado para um estilo base, mas a cor dinâmica no index.tsx prevalecerá
export const PaymentBadge = styled(BaseBadge)<{ isPaid: boolean }>`
    background-color: ${props => props.isPaid ? colors.success : colors.danger};
    /* A cor será sobrescrita pelo 'style' inline no componente Orders */
`;

export const StatusBadge = styled(BaseBadge)<{ status: string }>`
    background-color: ${props => {
        switch(props.status?.toLowerCase()) {
            case 'entregue': return colors.success;
            case 'cancelado': return colors.danger;
            case 'aberto': return colors.info;
            default: return colors.secondary; // Cor padrão para status desconhecidos
        }
    }};
`;

// --- Estilo para o campo de Observação --- //
export const StyledTextArea = styled.textarea`
  width: 100%;
  min-height: 60px;
  padding: ${spacing.small};
  border: 1px solid ${colors.gray};
  border-radius: ${borderRadius.medium};
  font-size: ${fontSize.small};
  color: ${colors.dark};
  background-color: ${colors.white};
  box-sizing: border-box;
  resize: vertical; /* Permite redimensionar só verticalmente */
  line-height: 1.4;
  transition: border-color ${transition.fast}, box-shadow ${transition.fast};

  &:focus {
    outline: none;
    border-color: ${colors.primary};
    box-shadow: 0 0 0 3px ${colors.primary}40; /* Sombra suave azul no foco */
  }

  &::placeholder {
    color: ${colors.mediumGray};
    font-style: italic;
  }
`;