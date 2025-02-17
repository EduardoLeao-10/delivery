import styled from "styled-components";

// Cores
const primaryColor = "#FF5733";
const secondaryColor = "#3498DB";
const accentColor = "#FFC300";
const backgroundColor = "#F4F4F4";
const textColor = "#333";

// Fontes
const mainFont = "'Arial', sans-serif";
const titleFont = "'Roboto', sans-serif";

// Espaçamento
const smallSpacing = "8px";
const mediumSpacing = "16px";
const largeSpacing = "24px";

// Sombras
const boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${largeSpacing};
  text-align: center;
  font-family: ${mainFont};
  background-color: ${backgroundColor};
  min-height: 100vh;
  background-image: linear-gradient(to bottom, ${backgroundColor}, #E8E8E8);
  overflow-y: auto;
`;

export const Title = styled.h1`
  font-size: 3.5em;
  margin-bottom: ${largeSpacing};
  color: ${primaryColor};
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-family: ${titleFont};
`;

export const QuestionContainer = styled.div`
  margin-bottom: ${largeSpacing};
  padding: ${largeSpacing};
  border: 2px solid ${secondaryColor};
  border-radius: 20px;
  background-color: #fff;
  width: 90%;
  max-width: 800px;
  box-shadow: ${boxShadow};
  transition: transform 0.3s ease-in-out;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }
`;

export const QuestionText = styled.p`
  font-size: 1.4em;
  margin-bottom: ${mediumSpacing};
  color: ${textColor};
  font-weight: 500;
  line-height: 1.6;
`;

export const AnswerButton = styled.button`
  padding: ${mediumSpacing} ${largeSpacing};
  background-color: ${secondaryColor};
  color: white;
  border: none;
  border-radius: 12px;
  margin: ${smallSpacing};
  cursor: pointer;
  font-size: 1.1em;
  transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: ${boxShadow};
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &:hover {
    background-color: #2471A3;
    transform: translateY(-3px);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.25);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
`;

export const AnswerText = styled.p`
  font-size: 1.2em;
  color: ${textColor};
`;

export const ResultContainer = styled.div`
  margin-top: ${largeSpacing};
  padding: ${largeSpacing};
  background-color: #fff;
  border: 2px solid ${accentColor};
  border-radius: 20px;
  width: 90%;
  max-width: 800px;
  box-shadow: ${boxShadow};
`;

export const ResultText = styled.p`
  font-size: 1.2em;
  text-align: left;
  color: ${textColor};
  line-height: 1.7;
`;