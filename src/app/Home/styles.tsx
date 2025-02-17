import styled from "styled-components";

export const Container = styled.div`
  padding: 20px;
  text-align: center;
  overflow-y: auto; /* Adiciona barra de rolagem vertical */
  max-height: 100vh; /* Define a altura máxima como a altura da viewport */
`;

export const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 20px;
`;

export const CategoryContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-bottom: 15px;
  max-width: 100%;
`;

export const CategoryButton = styled.button<{ selected?: boolean }>`
  flex: 1 1 calc(33.33% - 10px);
  max-width: 200px;
  padding: 12px 20px;
  background-color: ${(props) => (props.selected ? "#E91E63" : "#f5f5f5")};
  border-radius: 10px;
  border: 2px solid ${(props) => (props.selected ? "#E91E63" : "#ccc")};
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  color: ${(props) => (props.selected ? "#fff" : "#333")};
  transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: ${(props) => (props.selected ? "3px 3px 10px rgba(233, 30, 99, 0.4)" : "3px 3px 10px rgba(0, 0, 0, 0.1)")};

  &:hover {
    background-color: ${(props) => (props.selected ? "#C2185B" : "#e0e0e0")};
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;

export const CategoryText = styled.p`
  font-size: 16px;
  color: inherit;
`;

export const ProductButton = styled.div`
  padding: 10px;
  background-color: #f5f5f5;
  margin-bottom: 5px;
  border-radius: 5px;
`;

export const ProductText = styled.p`
  font-size: 16px;
  text-align: center;
`;

export const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
  
  div {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  span {
    font-weight: bold;
    margin-bottom: 5px;
  }
`;


export const TableHeaderText = styled.p`
  font-size: 16px;
  font-weight: bold;
  flex: 1;
  text-align: center;
`;

export const TableInput = styled.input`
  flex: 1;
  padding: 8px;
  border: 2px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
  text-align: center;
  outline: none;
  transition: border-color 0.3s ease;

  &:focus {
    border-color: #E91E63;
  }
`;

export const NextButton = styled.button`
  margin-top: 20px;
  padding: 15px;
  background-color: #E91E63;
  border-radius: 10px;
  align-items: center;
  border: none;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #C2185B;
  }
`;

export const NextButtonText = styled.span`
  color: #fff;
  font-size: 18px;
  font-weight: bold;
`;


export const TableRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
`;

export const TableCell = styled.div`
  flex: 1;
  text-align: center;
`;

export const TableBody = styled.div`
  margin-top: 10px;
  max-height: 300px; /* Define uma altura máxima para a tabela */
  overflow-y: auto; /* Adiciona barra de rolagem vertical */
`;

export const TableFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
`;

export const TotalText = styled.p`
  font-size: 18px;
  font-weight: bold;
`;
