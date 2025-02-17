// src/app/Orders/styles.tsx
// src/app/Orders/styles.tsx
import styled from 'styled-components/native';
import { Dimensions } from 'react-native';

// Cores - Defina suas cores aqui para facilitar a manutenção
const primary = '#007bff';
const primaryLight = '#63a4ff';
const primaryDark = '#0056b3';
const secondary = '#6c757d';
const secondaryLight = '#9ca3af';
const secondaryDark = '#495057';
const success = '#28a745';
const danger = '#dc3545';
const warning = '#ffc107';
const info = '#17a2b8';
const light = '#f8f9fa';
const dark = '#343a40';
const white = '#fff';
const gray100 = '#f8f9fa';
const gray200 = '#e9ecef';
const gray300 = '#dee2e6';
const gray400 = '#ced4da';
const gray500 = '#adb5bd';
const gray600 = '#6c757d';
const gray700 = '#495057';
const gray800 = '#343a40';
const gray900 = '#212529';

// Espaçamento
const spacingSm = 8;
const spacingMd = 16;
const spacingLg = 24;
const spacingXl = 32;

// Tipografia
const fontSizeSm = 12;
const fontSizeMd = 16;
const fontSizeLg = 20;
const fontSizeXl = 24;

// Sombras (Opcional: adapte conforme necessário)
const shadowSm = '0 1px 2px rgba(0, 0, 0, 0.1)';
const shadowMd = '0 2px 4px rgba(0, 0, 0, 0.15)';
const shadowLg = '0 4px 8px rgba(0, 0, 0, 0.2)';

// Layout Responsivo (Exemplo)
const windowWidth = Dimensions.get('window').width;
const isSmallScreen = windowWidth < 600;
const isMediumScreen = windowWidth >= 600 && windowWidth < 992;

// Container Principal
export const Container = styled.View`
  flex: 1;
  background-color: ${light};
  padding: ${spacingMd}px;
  padding-bottom: 80px; /* Espaço para evitar que o conteúdo seja cortado pela barra inferior */
`;

// Título da Página
export const Title = styled.Text`
  font-size: ${fontSizeXl}px;
  font-weight: bold;
  color: ${dark};
  margin-bottom: ${spacingLg}px;
  text-align: center;
  /* Adicione mais estilos conforme necessário (ex: sombra do texto) */
  text-shadow: 1px 1px 2px ${gray300};
`;

// Subtítulo da Seção
export const Subtitle = styled.Text`
  font-size: ${fontSizeLg}px;
  font-weight: 600;
  color: ${gray700};
  margin-top: ${spacingLg}px;
  margin-bottom: ${spacingMd}px;
  /* Estilo para telas menores (ex: diminuir a fonte) */
  font-size: ${isSmallScreen ? fontSizeMd : fontSizeLg}px;
`;

interface OrderItemProps {
  disabled?: boolean;
}

// Item da Lista de Pedidos
export const OrderItem = styled.TouchableOpacity<OrderItemProps>`
  background-color: ${white};
  padding: ${spacingMd}px;
  border-radius: 10px;
  margin-bottom: ${spacingSm}px;
  box-shadow: ${shadowSm};
  /* Efeito hover (simulado) */
  opacity: ${({ disabled = false }: { disabled?: boolean }) => (disabled ? 0.5 : 1)};
  /* Estilos para telas menores (ex: aumentar a fonte) */
  padding: ${isSmallScreen ? spacingLg : spacingMd}px;
`;

// Detalhes do Pedido (Container)
export const OrderDetails = styled.View`
  margin-top: ${spacingLg}px;
  padding: ${spacingMd}px;
  background-color: ${white};
  border-radius: 10px;
  box-shadow: ${shadowMd};
`;

// Detalhes de um Item do Pedido
export const OrderItemDetails = styled.View`
  margin-bottom: ${spacingSm}px;
  padding: ${spacingMd}px;
  background-color: ${gray100};
  border-radius: 8px;
  border-width: 1px;
  border-color: ${gray300};
`;

// Total do Pedido
export const Total = styled.Text`
  font-size: ${fontSizeLg}px;
  font-weight: bold;
  color: ${dark};
  margin-top: ${spacingMd}px;
`;

// Modal de Edição
export const EditModal = styled.View`
  margin-top: ${spacingLg}px;
  padding: ${spacingLg}px;
  background-color: ${white};
  border-radius: 10px;
  box-shadow: ${shadowMd};
`;

// Input de Texto
export const Input = styled.TextInput`
  border-width: 1px;
  border-color: ${gray400};
  border-radius: 8px;
  padding: ${spacingMd}px;
  margin-bottom: ${spacingLg}px;
  font-size: ${fontSizeMd}px;
  color: ${dark};
  background-color: ${white}; /* Garante que o fundo seja branco */
`;

interface ButtonStyledProps {
  disabled?: boolean;
}

// Botão Estilizado
export const ButtonStyled = styled.TouchableOpacity<ButtonStyledProps>`
  background-color: ${primary};
  padding: ${spacingMd}px ${spacingLg}px;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
  /* Efeito hover (simulado) */
  opacity: ${({ disabled = false }: { disabled?: boolean }) => (disabled ? 0.5 : 1)};
`;

// Texto do Botão
export const ButtonText = styled.Text`
  color: ${white};
  font-size: ${fontSizeMd}px;
  font-weight: bold;
  text-transform: uppercase; /* Opcional: transforma o texto em maiúsculas */
`;

// Texto Genérico
export const Texto = styled.Text`
  font-size: ${fontSizeMd}px;
  color: ${gray800};
  /* Estilos adicionais (ex: alinhamento, margem) */
`;

// Container para Mensagens de Erro (ex: validação de formulário)
export const ErrorMessage = styled.Text`
  color: ${danger};
  font-size: ${fontSizeSm}px;
  margin-top: -${spacingSm}px; /* Ajuste fino para alinhar com o campo */
  margin-bottom: ${spacingSm}px;
`;