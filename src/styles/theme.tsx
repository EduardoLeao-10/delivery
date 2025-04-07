// src/styles/theme.tsx
// src/styles/theme.tsx
import { DefaultTheme } from 'styled-components';

const theme: DefaultTheme = {
    fontFamily: 'Arial, sans-serif',
    fontSize: {
        xsmall: '12px',
        small: '14px',
        medium: '16px',
        large: '18px',
        xlarge: '20px',
        title: '24px',
        subtitle: '20px',
        body: '16px',
        label: '14px',
    },
    fontWeight: {
        light: 300,
        regular: 400,
        medium: 500,
        bold: 700,
        black: 900,
        normal: 400,
        semibold: 600,
    },
    border: {
        width: '1px',
        radius: {
            small: '4px',
            medium: '8px',
            large: '12px',
        },
        color: '#ccc',
    },
    input: {
        padding: '10px',
        fontSize: '16px',
        borderColor: '#ccc',
        borderRadius: '4px',
        focusBorderColor: '#007bff',
    },
    colors: {
        primary: '#007bff',
        secondary: '#6c757d',
        light: '#f8f9fa',
        dark: '#343a40',
        white: '#fff',
        gray: '#ccc',
        success: '#28a745',
        danger: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8',
    },
    spacing: {
        xsmall: '4px',
        small: '8px',
        medium: '16px',
        large: '24px',
        xlarge: '32px',
    },
    boxShadow: {
        xsmall: '0 1px 2px rgba(0,0,0,0.1)',
        small: '0 2px 4px rgba(0,0,0,0.1)',
        medium: '0 4px 8px rgba(0,0,0,0.1)',
        large: '0 8px 16px rgba(0,0,0,0.1)',
    },
    transition: {
        fast: '0.2s ease-in-out',
        normal: '0.3s ease-in-out',
        slow: '0.5s ease-in-out',
    },
    media: {
        small: '@media (max-width: 576px)',
        medium: '@media (max-width: 768px)',
        large: '@media (max-width: 992px)',
    },
};

export default theme;