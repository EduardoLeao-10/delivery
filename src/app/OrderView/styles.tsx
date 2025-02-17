import styled from "styled-components";

export const Container = styled.div`
  padding: 20px;
  text-align: center;
  height: 100vh; /* Ocupa toda a altura da tela */
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #f8f9fa;
  border-radius: 10px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden; /* Impede que o conteúdo ultrapasse o container */
`;

export const Title = styled.h1`
  font-size: 26px;
  margin-bottom: 20px;
  font-weight: bold;
  color: #333;
`;

export const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 600px;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
  font-weight: bold;
  color: #007bff;
  text-transform: uppercase;
`;

export const TableRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 600px;
  background-color: #fff;
  padding: 10px;
  border-radius: 5px;
  margin-top: 10px;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
`;

export const TableCell = styled.div`
  flex: 1;
  text-align: center;
  font-size: 16px;
  color: #333;
`;

export const TableBody = styled.div`
  margin-top: 10px;
  max-height: calc(100vh - 250px); /* Altura máxima com base na altura da tela */
  overflow-y: auto; /* Habilita a barra de rolagem vertical */
  width: 100%;
  max-width: 600px;
  padding: 10px;
  background: #fff;
  border-radius: 5px;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);

  /* Personalização da barra de rolagem */
  &::-webkit-scrollbar {
    width: 8px; /* Largura da barra de rolagem */
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1; /* Cor de fundo da barra de rolagem */
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #007bff; /* Cor do "ponteiro" da barra de rolagem */
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #0056b3; /* Cor do "ponteiro" ao passar o mouse */
  }
`;

export const TableFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
  max-width: 600px;
  margin-top: auto; /* Fixa o footer na parte inferior */
  padding: 10px;
  background: #007bff;
  color: #fff;
  border-radius: 5px;
  font-size: 18px;
  font-weight: bold;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.2);
`;

export const TotalText = styled.p`
  font-size: 18px;
  font-weight: bold;
`;