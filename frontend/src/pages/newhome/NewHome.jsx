import React from "react";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import Hero from "../../components/hero/Hero";
import PredictionCard from "../../components/cards/PredictionCard";
import QuestionCard from "../../components/cards/QuestionCard";
import MatchCard from "../../components/cards/MatchCard";
import teamCrest from "../../assets/png/ATM.png";

const logo = teamCrest;

export const CARDS = [
  {
    type: "match",
    home: { name: "Real Madrid", logo, pct: 62 },
    away: { name: "Barcelona", logo, pct: 25 },
    draw: { pct: 13 },
    pool: "$48.200,00",
  },
  {
    type: "question",
    question: "¿Messi ganará el Balón de Oro 2026?",
    pct: 71,
    pool: "$12.400,00",
    logo,
  },
  {
    type: "prediction",
    question: "¿Quién ganará la Eurocopa?",
    options: [
      { label: "España", pct: 38 },
      { label: "Francia", pct: 62 },
    ],
    pool: "$31.900,00",
    logo,
  },
  {
    type: "match",
    home: { name: "PSG", logo, pct: 55 },
    away: { name: "Man City", logo, pct: 33 },
    draw: { pct: 12 },
    pool: "$19.500,00",
  },
  {
    type: "question",
    question: "¿Argentina llegará a la final del Mundial 2026?",
    pct: 58,
    pool: "$9.800,00",
  },
  {
    type: "prediction",
    question: "¿Quién gana la Copa Libertadores?",
    options: [
      { label: "Flamengo", pct: 45 },
      { label: "River", pct: 55 },
    ],
    pool: "$7.300,00",
  },
  {
    type: "match",
    home: { name: "Bayern Munich", logo, pct: 48 },
    away: { name: "Dortmund", logo, pct: 38 },
    draw: { pct: 14 },
    pool: "$22.100,00",
  },
  {
    type: "question",
    question: "¿Habrá récord de goles en Champions esta temporada?",
    pct: 44,
    pool: "$5.600,00",
    logo,
  },
  {
    type: "prediction",
    question: "¿Quién será el máximo goleador de la Premier?",
    options: [
      { label: "Haaland", pct: 61 },
      { label: "Salah", pct: 39 },
    ],
    pool: "$14.750,00",
    logo,
  },
  {
    type: "match",
    home: { name: "Inter Milan", logo, pct: 52 },
    away: { name: "Juventus", logo, pct: 29 },
    draw: { pct: 19 },
    pool: "$11.300,00",
  },
  {
    type: "question",
    question: "¿Neymar volverá a jugar en Europa antes de 2027?",
    pct: 33,
    pool: "$3.200,00",
  },
  {
    type: "match",
    home: { name: "Liverpool", logo, pct: 67 },
    away: { name: "Arsenal", logo, pct: 21 },
    draw: { pct: 12 },
    pool: "$27.600,00",
  },
  {
    type: "prediction",
    question: "¿Quién ganará la Nations League?",
    options: [
      { label: "Portugal", pct: 53 },
      { label: "Alemania", pct: 47 },
    ],
    pool: "$8.400,00",
  },
  {
    type: "question",
    question: "¿El VAR será eliminado en La Liga para 2027?",
    pct: 27,
    pool: "$2.900,00",
    logo,
  },
  {
    type: "match",
    home: { name: "Chelsea", logo, pct: 41 },
    away: { name: "Tottenham", logo, pct: 42 },
    draw: { pct: 17 },
    pool: "$16.800,00",
  },
  {
    type: "prediction",
    question: "¿Quién ganará la Serie A?",
    options: [
      { label: "Napoli", pct: 35 },
      { label: "Inter", pct: 65 },
    ],
    pool: "$10.200,00",
    logo,
  },
  {
    type: "match",
    home: { name: "Atlético Madrid", logo, pct: 55 },
    away: { name: "Sevilla", logo, pct: 28 },
    draw: { pct: 17 },
    pool: "$9.100,00",
  },
  {
    type: "question",
    question: "¿Mbappé ganará el Balón de Oro antes de los 30?",
    pct: 61,
    pool: "$6.500,00",
    logo,
  },
  {
    type: "prediction",
    question: "¿Quién ganará la Bundesliga?",
    options: [
      { label: "Bayern", pct: 70 },
      { label: "Leverkusen", pct: 30 },
    ],
    pool: "$5.100,00",
  },
  {
    type: "match",
    home: { name: "Argentina", logo, pct: 45 },
    away: { name: "Brasil", logo, pct: 35 },
    draw: { pct: 20 },
    pool: "$21.500,00",
  },
  {
    type: "question",
    question: "¿Se jugará el Mundial de Clubes 2025 sin problemas?",
    pct: 80,
    pool: "$4.300,00",
  },
  {
    type: "prediction",
    question: "¿Quién ganará la Copa América 2026?",
    options: [
      { label: "Argentina", pct: 48 },
      { label: "Brasil", pct: 52 },
    ],
    pool: "$18.000,00",
    logo,
  },
  {
    type: "match",
    home: { name: "Napoli", logo, pct: 50 },
    away: { name: "AC Milan", logo, pct: 32 },
    draw: { pct: 18 },
    pool: "$13.700,00",
  },
  {
    type: "question",
    question: "¿Haaland superará los 50 goles en la temporada?",
    pct: 55,
    pool: "$7.800,00",
    logo,
  },
  {
    type: "prediction",
    question: "¿Quién ganará la Ligue 1?",
    options: [
      { label: "PSG", pct: 82 },
      { label: "Monaco", pct: 18 },
    ],
    pool: "$3.900,00",
  },
];

const NewHome = () => (
  <div className="bg-primary-background min-h-screen pb-16 space-y-16 md:pb-0">
    {/* Hero + Navbar superpuesto */}
    <div style={{ position: "relative" }}>
      <Hero />
      <div
        style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 20 }}
      >
        <Navbar />
      </div>
    </div>

    {/* Grid 5×5 */}
    <div className="pt-12 px-10 justify-items-center max-lg:px-0 max-lg:pt-8">
      <div className="flex flex-wrap gap-6 justify-center">
        {CARDS.map((card, i) => {
          if (card.type === "match")
            return (
              <MatchCard
                key={i}
                homeTeam={card.home}
                awayTeam={card.away}
                draw={card.draw}
                poolAmount={card.pool}
              />
            );
          if (card.type === "question")
            return (
              <QuestionCard
                key={i}
                teamLogo={card.logo}
                question={card.question}
                pct={card.pct}
                poolAmount={card.pool}
              />
            );
          return (
            <PredictionCard
              key={i}
              teamLogo={card.logo}
              question={card.question}
              options={card.options}
              poolAmount={card.pool}
            />
          );
        })}
      </div>
    </div>

    <Footer />
  </div>
);

export default NewHome;
