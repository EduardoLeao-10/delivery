//styles.tsx
import styled, { css, DefaultTheme } from "styled-components";
import { ButtonHTMLAttributes } from 'react';

// Variáveis de Estilo (Temas)
const colors = {
    primary: "#1e88e5", // Um azul mais moderno e vibrante
    secondary: "#607d8b", // Um cinza azulado suave
    light: "#eceff1", // Um cinza muito claro para fundos
    dark: "#263238", // Um cinza escuro para textos importantes
    white: "#ffffff",
    gray: "#90a4ae", // Um cinza mais neutro
    success: "#43a047",
    danger: "#d32f2f",
    warning: "#fbc02d",
    info: "#039be5",
};

const spacing = {
    xsmall: "4px",
    small: "8px",
    medium: "16px",
    large: "24px",
    xlarge: "32px",
};

const fontSize = {
    xsmall: "10px",
    small: "12px",
    medium: "14px",
    large: "16px",
    xlarge: "18px",
    title: "36px", // Título maior para mais destaque
    subtitle: "24px",
};

const fontWeight = {
    light: 300,
    regular: 400,
    medium: 500,
    semiBold: 600, // Adicionando um peso de fonte intermediário
    bold: 700,
    black: 900,
};

const borderRadius = {
    none: "0",
    small: "8px",
    medium: "12px",
    large: "16px",
    circle: "50%",
};

const boxShadow = {
    xsmall: "0px 1px 3px rgba(0, 0, 0, 0.12), 0px 1px 2px rgba(0, 0, 0, 0.24)",
    small: "0px 3px 5px rgba(0, 0, 0, 0.14), 0px 1px 8px rgba(0, 0, 0, 0.20)",
    medium: "0px 6px 10px rgba(0, 0, 0, 0.16), 0px 2px 16px rgba(0, 0, 0, 0.12)",
    large: "0px 9px 15px rgba(0, 0, 0, 0.18), 0px 3px 24px rgba(0, 0, 0, 0.10)",
};

const transition = {
    fast: "0.1s ease-in-out", // Transições mais rápidas
    normal: "0.2s ease-in-out",
    slow: "0.3s ease-in-out",
};

export const GlobalStyle = css`
  body {
    font-family: 'Nunito', sans-serif; // Fonte mais moderna e agradável
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    background-color: ${colors.light}; // Cor de fundo global
    color: ${colors.dark};
    line-height: 1.6; // Melhora a legibilidade do texto
    -webkit-font-smoothing: antialiased; // Melhora a renderização da fonte
  }
`;

export const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    min-height: 100vh; /* Garante que a altura total da tela seja usada */
    overflow-y: auto; /* Evita rolagem dupla */
    padding: 16px;
    box-sizing: border-box;
`;

export const Title = styled.h1`
  font-size: ${fontSize.title};
  margin-bottom: ${spacing.large};
  font-weight: ${fontWeight.bold};
  color: ${colors.dark};
  text-shadow: ${boxShadow.xsmall};
  letter-spacing: -1px; // Ajustando o espaçamento entre as letras
`;

export const Subtitle = styled.h2`
  font-size: ${fontSize.subtitle};
  margin-bottom: ${spacing.medium};
  font-weight: ${fontWeight.medium};
  color: ${colors.secondary};
`;

export const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  border-bottom: 2px solid ${colors.gray};
  padding-bottom: ${spacing.small};
  margin-bottom: ${spacing.medium};
  font-weight: ${fontWeight.semiBold}; // Usando o peso semi-negrito
  color: ${colors.dark};
  text-transform: uppercase;
  font-size: ${fontSize.small};
  letter-spacing: 0.5px;
`;

export const TableBody = styled.div`
  width: 100%;
  padding: 0; // Removendo o padding
  background: transparent; // Fundo transparente
  border-radius: ${borderRadius.none};
  box-shadow: none; // Removendo a sombra
`;

export const TableRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  background-color: ${colors.white}; // Cor de fundo branca
  padding: ${spacing.medium};
  border-radius: ${borderRadius.medium}; // Aumentando o arredondamento
  margin-bottom: ${spacing.small};
  box-shadow: ${boxShadow.xsmall};
  transition: background-color ${transition.fast}, box-shadow ${transition.normal};
  border: 1px solid ${colors.gray}; // Adicionando uma borda sutil

  &:hover {
    background-color: ${colors.light}; // Cor de fundo mais clara no hover
    box-shadow: ${boxShadow.small}; // Aumentando a sombra no hover
  }
`;

export const TableCell = styled.div`
  flex: 1;
  text-align: center;
  font-size: ${fontSize.medium};
  color: ${colors.dark};
  font-weight: ${fontWeight.regular};
`;

export const TableFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin-top: ${spacing.large};
  padding: ${spacing.medium};
  background: ${colors.primary};
  color: ${colors.danger};
  border-radius: ${borderRadius.medium};
  font-size: ${fontSize.large};
  font-weight: ${fontWeight.bold};
  box-shadow: ${boxShadow.small};
  border: 2px solid ${colors.primary}; // Adicionando uma borda
`;

export const TotalText = styled.p`
  font-size: ${fontSize.large};
  font-weight: ${fontWeight.bold};
  letter-spacing: 0.5px;
`;

export const StyledInput = styled.input`
  padding: ${spacing.medium};
  border: 1px solid ${colors.gray};
  border-radius: ${borderRadius.medium};
  font-size: ${fontSize.medium};
  width: 100%;
  box-sizing: border-box;
  transition: border-color ${transition.fast}, box-shadow ${transition.fast};
  font-weight: ${fontWeight.medium};
  color: ${colors.dark};
  background-color: ${colors.white};

  &:focus {
    outline: none;
    border-color: ${colors.primary};
    box-shadow: 0 0 0 2px ${colors.primary}40; // Adicionando um efeito de foco
  }

  &::placeholder {
    color: ${colors.gray};
    font-style: italic;
  }
`;

interface StyledButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "success" | "danger" | "warning" | "info";
    size?: "small" | "medium" | "large";
    fullWidth?: boolean;
    rounded?: boolean; // Adicionando uma prop para botões arredondados
}

export const StyledButton = styled.button<StyledButtonProps>`
  background-color: ${colors.primary};
  color: ${colors.white};
  padding: ${spacing.medium} ${spacing.xlarge};
  border: none;
  border-radius: ${(props) => props.rounded ? borderRadius.circle : borderRadius.medium}; // Arredondamento condicional
  cursor: pointer;
  font-size: ${fontSize.medium};
  transition: background-color ${transition.normal}, transform ${transition.fast}, box-shadow ${transition.fast};
  font-weight: ${fontWeight.semiBold};
  box-shadow: ${boxShadow.small};
  letter-spacing: 0.5px;
  width: ${(props) => props.fullWidth ? '100%' : 'auto'};
  border: 2px solid ${colors.primary};
  outline: none; // Removendo a borda padrão ao focar

  &:hover {
    background-color: ${colors.primary}cc; // Cor mais escura no hover
    box-shadow: ${boxShadow.medium};
    transform: translateY(-2px); // Elevando o botão no hover
  }

  &:active {
    transform: translateY(0); // Removendo a elevação ao clicar
    box-shadow: ${boxShadow.xsmall};
  }

  &:focus {
    box-shadow: 0 0 0 3px ${colors.primary}40; // Adicionando um contorno sutil no foco
  }

  /* Estilos condicionais baseados nas props */
  ${(props) =>
        props.variant === "secondary" &&
        css`
          background-color: ${colors.secondary};
          border-color: ${colors.secondary};
          &:hover {
            background-color: ${colors.secondary}cc;
            border-color: ${colors.secondary}cc;
          }
        `}

  ${(props) =>
        props.size === "small" &&
        css`
          padding: ${spacing.small} ${spacing.medium};
          font-size: ${fontSize.small};
        `}
`;

export const Text = styled.p`
  font-size: ${fontSize.medium};
  color: ${colors.dark};
  font-weight: ${fontWeight.regular};
  line-height: 1.6;
`;

export const Link = styled.a`
  color: ${colors.primary};
  text-decoration: none;
  font-weight: ${fontWeight.semiBold};
  transition: color ${transition.fast};

  &:hover {
    color: ${colors.primary}cc;
    text-decoration: underline;
  }
`;

export const media = {
    small: `@media (max-width: 600px)`,
    medium: `@media (max-width: 960px)`,
    large: `@media (max-width: 1280px)`,
};

// Novo Componente: Container para informações do cliente
export const CustomerInfoContainer = styled.div`
  width: 100%;
  margin-bottom: ${spacing.medium};
  text-align: left;
`;

// Novo Componente: Label para informações do cliente
export const CustomerInfoLabel = styled.label`
  display: block;
  font-size: ${fontSize.small};
  color: ${colors.secondary};
  margin-bottom: ${spacing.small};
  font-weight: ${fontWeight.semiBold};
`;

// Novo Componente: Container com barra de rolagem
export const ScrollableContainer = styled.div`
    max-height: 60vh; /* Define um tamanho máximo para rolagem */
    overflow-y: auto; /* Habilita a rolagem vertical */
    padding: ${spacing.medium};
    border: 1px solid ${colors.gray};
    background-color: ${colors.white};
    border-radius: ${borderRadius.small};
`;

export const FooterContainer = styled.div`
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    background-color: ${colors.light};
    padding: ${spacing.medium};
    display: flex;
    justify-content: center;
    gap: ${spacing.small};
    box-shadow: 0px -2px 4px rgba(0, 0, 0, 0.1);
`;