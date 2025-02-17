import React, { useState, useEffect } from "react";
import {
  Container,
  Title,
  QuestionContainer,
  QuestionText,
  AnswerButton,
  AnswerText,
  ResultContainer,
  ResultText,
} from "./styles";

interface Question {
  id: number;
  category: string;
  text: string;
  answers: {
    id: number;
    text: string;
    value: number;
  }[];
}

type Category =
  | "amor"
  | "supermario"
  | "ps5"
  | "residentevil"
  | "titanic"
  | "senhordosaneis"
  | "troia"
  | "vingadores"
  | "starwars"
  | "dragonball"
  | "yugioh"
  | "naruto";

const questions: Question[] = [
  // Questões sobre Amor e Romance (5)
  {
    id: 1,
    category: "amor",
    text: "Qual a sua ideia de um encontro romântico perfeito?",
    answers: [
      { id: 1, text: "Um jantar à luz de velas em um restaurante elegante.", value: 3 },
      { id: 2, text: "Um piquenique em um parque ensolarado.", value: 2 },
      { id: 3, text: "Uma noite aconchegante em casa assistindo a filmes.", value: 1 },
    ],
  },
  {
    id: 2,
    category: "amor",
    text: "Qual a qualidade mais importante em um parceiro(a)?",
    answers: [
      { id: 4, text: "Honestidade e lealdade.", value: 3 },
      { id: 5, text: "Senso de humor e espontaneidade.", value: 2 },
      { id: 6, text: "Inteligência e ambição.", value: 1 },
    ],
  },
  {
    id: 3,
    category: "amor",
    text: "Qual a sua linguagem do amor?",
    answers: [
      { id: 7, text: "Palavras de afirmação", value: 3 },
      { id: 8, text: "Tempo de qualidade", value: 2 },
      { id: 9, text: "Toque físico", value: 1 },
    ],
  },
  {
    id: 4,
    category: "amor",
    text: "O que você valoriza mais em um relacionamento a longo prazo?",
    answers: [
      { id: 10, text: "Companheirismo e amizade", value: 3 },
      { id: 11, text: "Paixão e desejo", value: 2 },
      { id: 12, text: "Segurança financeira e estabilidade", value: 1 },
    ],
  },
  {
    id: 5,
    category: "amor",
    text: "Como você demonstra seu amor?",
    answers: [
      { id: 13, text: "Expressando verbalmente seus sentimentos", value: 3 },
      { id: 14, text: "Fazendo pequenos gestos de carinho", value: 2 },
      { id: 15, text: "Dando presentes e demonstrando apoio prático", value: 1 },
    ],
  },

  // Questões sobre Super Mario (5)
  {
    id: 6,
    category: "supermario",
    text: "Qual o nome do irmão de Mario?",
    answers: [
      { id: 16, text: "Luigi", value: 3 },
      { id: 17, text: "Wario", value: 2 },
      { id: 18, text: "Yoshi", value: 1 },
    ],
  },
  {
    id: 7,
    category: "supermario",
    text: "Qual o principal objetivo de Mario nos jogos?",
    answers: [
      { id: 19, text: "Resgatar a Princesa Peach", value: 3 },
      { id: 20, text: "Coletar moedas e power-ups", value: 2 },
      { id: 21, text: "Derrotar Bowser", value: 1 },
    ],
  },
  {
    id: 8,
    category: "supermario",
    text: "Qual o power-up mais icônico de Mario?",
    answers: [
      { id: 22, text: "Super Cogumelo", value: 3 },
      { id: 23, text: "Flor de Fogo", value: 2 },
      { id: 24, text: "Super Estrela", value: 1 },
    ],
  },
  {
    id: 9,
    category: "supermario",
    text: "Qual o principal vilão da série Mario?",
    answers: [
      { id: 25, text: "Bowser", value: 3 },
      { id: 26, text: "Wario", value: 2 },
      { id: 27, text: "Donkey Kong", value: 1 },
    ],
  },
  {
    id: 10,
    category: "supermario",
    text: "Qual o nome do dinossauro amigo de Mario?",
    answers: [
      { id: 28, text: "Yoshi", value: 3 },
      { id: 29, text: "Rex", value: 2 },
      { id: 30, text: "Dino", value: 1 },
    ],
  },

  // Questões sobre Jogos de PS5 (Elder Ring, Bloodborne, Dark Souls 3)
  {
    id: 11,
    category: "ps5",
    text: "Qual o nome do mundo aberto de Elden Ring?",
    answers: [
      { id: 31, text: "The Lands Between", value: 3 },
      { id: 32, text: "Yharnam", value: 2 },
      { id: 33, text: "Lothric", value: 1 },
    ],
  },
  {
    id: 12,
    category: "ps5",
    text: "Qual a principal mecânica de Bloodborne?",
    answers: [
      { id: 34, text: "Rally (recuperar vida ao atacar após receber dano)", value: 3 },
      { id: 35, text: "Parry", value: 2 },
      { id: 36, text: "Magia", value: 1 },
    ],
  },

  // Questões sobre Resident Evil
  {
    id: 13,
    category: "residentevil",
    text: "Qual o nome do vírus em Resident Evil?",
    answers: [
      { id: 37, text: "T-Vírus", value: 3 },
      { id: 38, text: "G-Vírus", value: 2 },
      { id: 39, text: "Las Plagas", value: 1 },
    ],
  },
  {
    id: 14,
    category: "residentevil",
    text: "Qual a cidade onde começa Resident Evil 2?",
    answers: [
      { id: 40, text: "Raccoon City", value: 3 },
      { id: 41, text: "Los Perdidos", value: 2 },
      { id: 42, text: "Dulvey", value: 1 },
    ],
  },

  // Questões sobre Titanic (5)
  {
    id: 15,
    category: "titanic",
    text: "Qual a música tema do filme Titanic?",
    answers: [
      { id: 43, text: "My Heart Will Go On", value: 3 },
      { id: 44, text: "Take My Breath Away", value: 2 },
      { id: 45, text: "I Will Always Love You", value: 1 },
    ],
  },
  {
    id: 16,
    category: "titanic",
    text: "Quem dirigiu Titanic?",
    answers: [
      { id: 46, text: "James Cameron", value: 3 },
      { id: 47, text: "Steven Spielberg", value: 2 },
      { id: 48, text: "Christopher Nolan", value: 1 },
    ],
  },
  {
    id: 17,
    category: "titanic",
    text: "Qual a classe social de Jack Dawson?",
    answers: [
      { id: 49, text: "Terceira classe", value: 3 },
      { id: 50, text: "Primeira classe", value: 2 },
      { id: 51, text: "Segunda classe", value: 1 },
    ],
  },
  {
    id: 18,
    category: "titanic",
    text: "Qual o nome do navio?",
    answers: [
      { id: 52, text: "Titanic", value: 3 },
      { id: 53, text: "Olympic", value: 2 },
      { id: 54, text: "Britannic", value: 1 },
    ],
  },
  {
    id: 19,
    category: "titanic",
    text: "O que Jack desenhou para Rose?",
    answers: [
      { id: 55, text: "Um retrato dela usando o colar 'O Coração do Oceano'", value: 3 },
      { id: 56, text: "Uma paisagem do mar", value: 2 },
      { id: 57, text: "Um retrato dela quando criança", value: 1 },
    ],
  },

  // Questões sobre Senhor dos Anéis
  {
    id: 20,
    category: "senhordosaneis",
    text: "Qual o nome do anel em O Senhor dos Anéis?",
    answers: [
      { id: 58, text: "O Um Anel", value: 3 },
      { id: 59, text: "O Anel de Sauron", value: 3 },
      { id: 60, text: "O Anel do Poder", value: 1 },
    ],
  },
  {
    id: 21,
    category: "senhordosaneis",
    text: "Quem é o portador do anel?",
    answers: [
      { id: 61, text: "Frodo Bolseiro", value: 3 },
      { id: 62, text: "Aragorn", value: 2 },
      { id: 63, text: "Gandalf", value: 1 },
    ],
  },

  // Questões sobre Tróia
  {
    id: 22,
    category: "troia",
    text: "Quem interpretou Aquiles em Tróia?",
    answers: [
      { id: 64, text: "Brad Pitt", value: 3 },
      { id: 65, text: "Orlando Bloom", value: 2 },
      { id: 66, text: "Eric Bana", value: 1 },
    ],
  },
  {
    id: 23,
    category: "troia",
    text: "Por que a guerra de Tróia começou?",
    answers: [
      { id: 67, text: "Por Helena", value: 3 },
      { id: 68, text: "Por territórios", value: 2 },
      { id: 69, text: "Por poder", value: 1 },
    ],
  },

  // Questões sobre Vingadores
  {
    id: 24,
    category: "vingadores",
    text: "Qual a primeira formação dos Vingadores?",
    answers: [
      { id: 70, text: "Homem de Ferro, Capitão América, Thor, Hulk, Viúva Negra e Gavião Arqueiro", value: 3 },
      { id: 71, text: "Homem de Ferro, Capitão América, Thor, Hulk", value: 2 },
      { id: 72, text: "Homem de Ferro, Capitão América", value: 1 },
    ],
  },
  {
    id: 25,
    category: "vingadores",
    text: "Qual o vilão principal em Vingadores: Guerra Infinita e Ultimato?",
    answers: [
      { id: 73, text: "Thanos", value: 3 },
      { id: 74, text: "Loki", value: 2 },
      { id: 75, text: "Ultron", value: 1 },
    ],
  },

  // Questões sobre Star Wars (5)
  {
    id: 26,
    category: "starwars",
    text: "Quem é o pai de Luke Skywalker?",
    answers: [
      { id: 76, text: "Darth Vader", value: 3 },
      { id: 77, text: "Obi-Wan Kenobi", value: 2 },
      { id: 78, text: "Imperador Palpatine", value: 1 },
    ],
  },
  {
    id: 27,
    category: "starwars",
    text: "Qual a famosa frase de Star Wars?",
    answers: [
      { id: 79, text: "Que a Força esteja com você", value: 3 },
      { id: 80, text: "Eu sou seu pai", value: 2 },
      { id: 81, text: "Vida longa e próspera", value: 1 },
    ],
  },
  {
    id: 28,
    category: "starwars",
    text: "Qual o nome da nave de Han Solo?",
    answers: [
      { id: 82, text: "Millennium Falcon", value: 3 },
      { id: 83, text: "X-Wing", value: 2 },
      { id: 84, text: "TIE Fighter", value: 1 },
    ],
  },
  {
    id: 29,
    category: "starwars",
    text: "Qual a cor do sabre de luz de Luke Skywalker em O Retorno de Jedi?",
    answers: [
      { id: 85, text: "Verde", value: 3 },
      { id: 86, text: "Azul", value: 2 },
      { id: 87, text: "Vermelho", value: 1 },
    ],
  },
  {
    id: 30,
    category: "starwars",
    text: "Quem é o mestre de Obi-Wan Kenobi?",
    answers: [
      { id: 88, text: "Qui-Gon Jinn", value: 3 },
      { id: 89, text: "Yoda", value: 2 },
      { id: 90, text: "Mace Windu", value: 1 },
    ],
  },

  // Questões sobre Dragon Ball (5)
  {
    id: 31,
    category: "dragonball",
    text: "Quem derrota Cell na saga de Dragon Ball Z?",
    answers: [
      { id: 91, text: "Gohan", value: 3 },
      { id: 92, text: "Goku", value: 2 },
      { id: 93, text: "Vegeta", value: 1 },
    ],
  },
  {
    id: 32,
    category: "dragonball",
    text: "Qual a forma final de Cell?",
    answers: [
      { id: 94, text: "Cell Perfeito", value: 3 },
      { id: 95, text: "Super Cell", value: 2 },
      { id: 96, text: "Cell Imperfeito", value: 1 },
    ],
  },
  {
    id: 33,
    category: "dragonball",
    text: "Qual o nome do ataque final de Gohan contra Cell?",
    answers: [
      { id: 97, text: "Kamehameha Pai e Filho", value: 3 },
      { id: 98, text: "Final Flash", value: 2 },
      { id: 99, text: "Spirit Bomb", value: 1 },
    ],
  },
  {
    id: 34,
    category: "dragonball",
    text: "Qual o motivo de Cell organizar o Torneio de Cell?",
    answers: [
      { id: 100, text: "Para testar sua força contra os guerreiros da Terra", value: 3 },
      { id: 101, text: "Para dominar o mundo", value: 2 },
      { id: 102, text: "Para se divertir", value: 1 },
    ],
  },
  {
    id: 35,
    category: "dragonball",
    text: "Quem ajudou Gohan a derrotar Cell?",
    answers: [
      { id: 103, text: "Goku, com seu espírito", value: 3 },
      { id: 104, text: "Vegeta", value: 2 },
      { id: 105, text: "Piccolo", value: 1 },
    ],
  },

  // Questões sobre Yu-Gi-Oh
  {
    id: 36,
    category: "yugioh",
    text: "Qual o nome do protagonista de Yu-Gi-Oh! Duelo de Monstros?",
    answers: [
      { id: 106, text: "Yugi Muto", value: 3 },
      { id: 107, text: "Seto Kaiba", value: 2 },
      { id: 108, text: "Joey Wheeler", value: 1 },
    ],
  },
  {
    id: 37,
    category: "yugioh",
    text: "Qual o monstro mais famoso de Yugi?",
    answers: [
      { id: 109, text: "Mago Negro", value: 3 },
      { id: 110, text: "Dragão Branco de Olhos Azuis", value: 2 },
      { id: 111, text: "Exodia", value: 1 },
    ],
  },

  // Questões sobre Naruto (5)
  {
    id: 38,
    category: "naruto",
    text: "Quem é o sensei do Time 7 em Naruto Clássico?",
    answers: [
      { id: 112, text: "Kakashi Hatake", value: 3 },
      { id: 113, text: "Iruka Umino", value: 2 },
      { id: 114, text: "Jiraiya", value: 1 },
    ],
  },
  {
    id: 39,
    category: "naruto",
    text: "Qual o sonho de Naruto?",
    answers: [
      { id: 115, text: "Ser Hokage", value: 3 },
      { id: 116, text: "Ser o mais forte", value: 2 },
      { id: 117, text: "Ter amigos", value: 1 },
    ],
  },
  {
    id: 40,
    category: "naruto",
    text: "Qual o nome da técnica mais famosa de Naruto?",
    answers: [
      { id: 118, text: "Rasengan", value: 3 },
      { id: 119, text: "Chidori", value: 2 },
      { id: 120, text: "Kage Bunshin no Jutsu (Técnica do Clone das Sombras)", value: 1 },
    ],
  },
  {
    id: 41,
    category: "naruto",
    text: "Qual o nome da organização criminosa liderada por Pain?",
    answers: [
      { id: 121, text: "Akatsuki", value: 3 },
      { id: 122, text: "Anbu", value: 2 },
      { id: 123, text: "Raiz", value: 1 },
    ],
  },
  {
    id: 42,
    category: "naruto",
    text: "Qual o nome do melhor amigo e rival de Naruto?",
    answers: [
      { id: 124, text: "Sasuke Uchiha", value: 3 },
      { id: 125, text: "Sakura Haruno", value: 2 },
      { id: 126, text: "Kakashi Hatake", value: 1 },
    ],
  },
];

const suggestions: {
  [key in Category]: {
    [level: number]: string;
  };
} = {
  amor: {
    3: "Você é um romântico(a) incurável! Continue cultivando o amor em sua vida.",
    2: "Você aprecia o romance, mas pode se abrir mais para novas experiências.",
    1: "O amor está esperando por você, explore suas emoções e se entregue a um relacionamento.",
  },
  supermario: {
    3: "Você é um expert em Super Mario! Conhece cada fase, power-up e inimigo.",
    2: "Você se diverte com os jogos do Mario, mas ainda tem muito a explorar.",
    1: "Dê uma chance ao mundo de Super Mario, a diversão é garantida!",
  },
  ps5: {
    3: "Você é um verdadeiro gamer de PS5! Adora explorar mundos sombrios e desafiadores.",
    2: "Você curte jogos de PS5, mas pode experimentar novos títulos e gêneros.",
    1: "Entre no universo dos jogos de PS5 e descubra gráficos incríveis e histórias envolventes.",
  },
  residentevil: {
    3: "Você é um sobrevivente em Resident Evil! Conhece cada criatura e estratégia para escapar.",
    2: "Você se aventura em Raccoon City, mas pode se aprofundar na história da Umbrella Corporation.",
    1: "Prepare-se para o horror e a ação de Resident Evil, uma experiência inesquecível!",
  },
  titanic: {
    3: "Você é um fã de romance épico! Reveja Titanic e prepare os lenços.",
    2: "Você conhece o filme, mas pode se aprofundar na história e nos personagens.",
    1: "Titanic é um clássico, assista e descubra o romance no mar.",
  },
  senhordosaneis: {
    3: "Você é um mestre da Terra Média! Continue explorando esse mundo mágico.",
    2: "Você conhece bem a saga, mas sempre há mais para descobrir sobre a Terra Média.",
    1: "Entre na Sociedade do Anel e descubra a aventura de Frodo.",
  },
  troia: {
    3: "Você é um guerreiro de Tróia! Relembre os épicos combates e a paixão de Helena.",
    2: "Você conhece a história, mas pode se aprofundar nos mitos gregos.",
    1: "Tróia é um filme épico, assista e descubra a guerra por Helena.",
  },
  vingadores: {
    3: "Você é um Vingador de carteirinha! Continue salvando o mundo com seus heróis favoritos.",
    2: "Você conhece bem o universo Marvel, mas sempre há mais para acompanhar.",
    1: "Reúna os Vingadores e prepare-se para salvar o mundo.",
  },
  starwars: {
    3: "Que a Força esteja com você, fã de Star Wars! Continue explorando a galáxia.",
    2: "Você conhece a saga, mas sempre há mais para aprender sobre a Força.",
    1: "Entre para a Aliança Rebelde e descubra a saga Star Wars.",
  },
  dragonball: {
    3: "Você é um Saiyajin de Elite! Continue treinando e superando seus limites.",
    2: "Você conhece bem a saga, mas sempre há mais para aprender sobre os Guerreiros Z.",
    1: "Reúna as Esferas do Dragão e descubra o mundo de Dragon Ball.",
  },
  yugioh: {
    3: "É HORA DO DUELO! Você conhece bem os monstros de duelo e as estratégias de Yugi.",
    2: "Você conhece bem o anime, mas sempre há mais para aprender sobre as cartas.",
    1: "Pegue seu baralho e descubra o mundo de Yu-Gi-Oh! Duelo de Monstros.",
  },
  naruto: {
    3: "Você é um ninja da Folha! Continue acompanhando as aventuras de Naruto.",
    2: "Você conhece bem o anime, mas sempre há mais para aprender sobre os jutsus.",
    1: "Entre para a Academia Ninja e descubra o mundo de Naruto.",
  },
};

const corrections: {
  [key in Category]: {
    [level: number]: string;
  };
} = {
  amor: {
    3: "Aproveite cada momento com seu amor e construa uma história linda juntos.",
    2: "Saia da rotina e surpreenda seu parceiro(a) com gestos românticos.",
    1: "Não tenha medo de se apaixonar, o amor pode trazer muita alegria e felicidade.",
  },
  supermario: {
    3: "Continue pulando e coletando moedas, você é um campeão!",
    2: "Explore todos os mundos de Mario, cada um é único e cheio de surpresas.",
    1: "Comece sua aventura com Mario, você não vai se arrepender!",
  },
  ps5: {
    3: "Domine todos os chefes e conquiste a glória nos jogos de PS5!",
    2: "Experimente novos jogos e descubra novas paixões no mundo do PS5.",
    1: "Prepare-se para gráficos incríveis e histórias épicas no seu PS5.",
  },
  residentevil: {
    3: "Use suas habilidades para sobreviver aos horrores de Resident Evil!",
    2: "Aprenda mais sobre os vírus e as conspirações da Umbrella Corporation.",
    1: "Prepare-se para os sustos e a ação de Resident Evil, uma experiência única!",
  },
  titanic: {
    3: "My Heart Will Go On embala o romance épico de Jack e Rose.",
    2: "Titanic é um filme de James Cameron, conhecido por seus filmes de ação e aventura.",
    1: "Titanic é um filme sobre um romance que acontece durante o naufrágio do Titanic.",
  },
  senhordosaneis: {
    3: "O Um Anel deve ser destruído na Montanha da Perdição.",
    2: "Frodo precisa destruir o anel para salvar a Terra Média.",
    1: "O Senhor dos Anéis conta a história de uma jornada para destruir um anel.",
  },
  troia: {
    3: "A beleza de Helena foi a faísca para a Guerra de Tróia.",
    2: "A Guerra de Tróia durou 10 anos e envolveu muitos heróis gregos.",
    1: "Tróia é um filme sobre uma guerra que aconteceu na Grécia Antiga.",
  },
  vingadores: {
    3: "A primeira formação dos Vingadores se uniu para lutar contra Loki.",
    2: "Thanos é um dos vilões mais poderosos do universo Marvel.",
    1: "Os Vingadores são um grupo de super-heróis que se unem para salvar o mundo.",
  },
  starwars: {
    3: "Darth Vader revela a Luke que ele é seu pai em O Império Contra-Ataca.",
    2: "Que a Força esteja com você é uma saudação comum na galáxia Star Wars.",
    1: "Star Wars é uma saga sobre a luta entre o bem e o mal em uma galáxia muito, muito distante.",
  },
  dragonball: {
    3: "Gohan libera seu poder máximo para derrotar Cell com um Kamehameha.",
    2: "Cell é um bio-androide criado pelo Dr. Gero com as células dos guerreiros mais fortes.",
    1: "Dragon Ball é um anime sobre a busca pelas Esferas do Dragão e lutas épicas.",
  },
  yugioh: {
    3: "O Mago Negro é o monstro de duelo mais fiel de Yugi Muto.",
    2: "Existem várias cartas poderosas no mundo de Yugioh! Duelo de Monstros",
    1: "Yugioh! Duelo de Monstros, se passa em um mundo de Duelos de Cartas.",
  },
  naruto: {
    3: "Naruto quer se tornar Hokage para ser reconhecido por todos.",
    2: "Kakashi é um dos ninjas mais habilidosos da Vila da Folha.",
    1: "Naruto é um anime sobre um jovem ninja que sonha em se tornar Hokage.",
  },
};

export default function Quiz() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<string | null>(null);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = (value: number) => {
    setAnswers([...answers, value]);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      calculateResult();
    }
  };

  const calculateResult = () => {
    const categoryValues = questions.map((question, index) => {
      const answerValue = answers[index];
      const questionCategory = question.category;
      const questionAnswers = question.answers;
      const selectedAnswer = questionAnswers.find((ans) => ans.id === answerValue);
      return { category: questionCategory, value: selectedAnswer?.value || 0 };
    });

    const categoryAverages: { [category: string]: number } = {};
    categoryValues.forEach((item) => {
      if (!categoryAverages[item.category]) {
        categoryAverages[item.category] = 0;
      }
      categoryAverages[item.category] += item.value;
    });

    let bestCategory = "";
    let bestAverage = 0;
    Object.keys(categoryAverages).forEach((category) => {
      if (categoryAverages[category] > bestAverage) {
        bestCategory = category;
        bestAverage = categoryAverages[category];
      }
    });

    const suggestionLevel = bestAverage > 2 ? 3 : bestAverage > 1 ? 2 : 1;
    const suggestion = suggestions[bestCategory as Category][suggestionLevel];
    const correction = corrections[bestCategory as Category][suggestionLevel];

    setResult(
      `Baseado nas suas respostas, a categoria "${bestCategory}" é mais relevante para você.\n\nSugestão: ${suggestion}\n\nCorreção: ${correction}`
    );
  };

  return (
    <Container>
      <Title>Questionário</Title>
      {result ? (
        <ResultContainer>
          <ResultText>{result}</ResultText>
        </ResultContainer>
      ) : (
        <QuestionContainer>
          <QuestionText>{currentQuestion.text}</QuestionText>
          {currentQuestion.answers.map((answer) => (
            <AnswerButton key={answer.id} onClick={() => handleAnswer(answer.id)}>
              <AnswerText>{answer.text}</AnswerText>
            </AnswerButton>
          ))}
        </QuestionContainer>
      )}
    </Container>
  );
}