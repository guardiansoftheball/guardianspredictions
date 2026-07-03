import React from "react";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import Hero from "../../components/hero/Hero";
import PredictionCard from "../../components/cards/PredictionCard";
import QuestionCard from "../../components/cards/QuestionCard";
import MatchCard from "../../components/cards/MatchCard";

// Flags of national teams competing in the 2026 FIFA World Cup
const flag = (isoCode) => `https://flagcdn.com/w160/${isoCode}.png`;

export const CARDS = [
  {
    type: "match",
    home: { name: "Argentina", logo: flag("ar"), pct: 62 },
    away: { name: "Brazil", logo: flag("br"), pct: 25 },
    draw: { pct: 13 },
    pool: "$48,200.00",
  },
  {
    type: "question",
    question: "Will Argentina defend their 2026 World Cup title?",
    pct: 71,
    pool: "$12,400.00",
    logo: flag("ar"),
  },
  {
    type: "prediction",
    question: "Who will go further in the 2026 World Cup?",
    options: [
      { label: "Spain", pct: 38 },
      { label: "France", pct: 62 },
    ],
    pool: "$31,900.00",
    logo: flag("es"),
  },
  {
    type: "match",
    home: { name: "Mexico", logo: flag("mx"), pct: 55 },
    away: { name: "United States", logo: flag("us"), pct: 33 },
    draw: { pct: 12 },
    pool: "$19,500.00",
  },
  {
    type: "question",
    question: "Will the United States reach the semifinals as hosts?",
    pct: 58,
    pool: "$9,800.00",
  },
  {
    type: "prediction",
    question: "Who advances further, Colombia or Uruguay?",
    options: [
      { label: "Colombia", pct: 45 },
      { label: "Uruguay", pct: 55 },
    ],
    pool: "$7,300.00",
  },
  {
    type: "match",
    home: { name: "Germany", logo: flag("de"), pct: 48 },
    away: { name: "Netherlands", logo: flag("nl"), pct: 38 },
    draw: { pct: 14 },
    pool: "$22,100.00",
  },
  {
    type: "question",
    question: "Will there be a goal-scoring record at the 2026 World Cup?",
    pct: 44,
    pool: "$5,600.00",
    logo: flag("us"),
  },
  {
    type: "prediction",
    question: "Who will have the tournament's top scorer?",
    options: [
      { label: "Portugal", pct: 61 },
      { label: "Morocco", pct: 39 },
    ],
    pool: "$14,750.00",
    logo: flag("pt"),
  },
  {
    type: "match",
    home: { name: "Morocco", logo: flag("ma"), pct: 52 },
    away: { name: "Croatia", logo: flag("hr"), pct: 29 },
    draw: { pct: 19 },
    pool: "$11,300.00",
  },
  {
    type: "question",
    question: "Will Cape Verde make it past the group stage in their World Cup debut?",
    pct: 33,
    pool: "$3,200.00",
  },
  {
    type: "match",
    home: { name: "England", logo: flag("gb-eng"), pct: 67 },
    away: { name: "France", logo: flag("fr"), pct: 21 },
    draw: { pct: 12 },
    pool: "$27,600.00",
  },
  {
    type: "prediction",
    question: "Who wins the anticipated final between these powerhouses?",
    options: [
      { label: "Portugal", pct: 53 },
      { label: "Germany", pct: 47 },
    ],
    pool: "$8,400.00",
  },
  {
    type: "question",
    question: "Will Uzbekistan win at least one match in their first World Cup?",
    pct: 27,
    pool: "$2,900.00",
    logo: flag("uz"),
  },
  {
    type: "match",
    home: { name: "Belgium", logo: flag("be"), pct: 41 },
    away: { name: "Spain", logo: flag("es"), pct: 42 },
    draw: { pct: 17 },
    pool: "$16,800.00",
  },
  {
    type: "prediction",
    question: "Who advances further, Japan or South Korea?",
    options: [
      { label: "Japan", pct: 35 },
      { label: "South Korea", pct: 65 },
    ],
    pool: "$10,200.00",
    logo: flag("jp"),
  },
  {
    type: "match",
    home: { name: "Egypt", logo: flag("eg"), pct: 55 },
    away: { name: "Tunisia", logo: flag("tn"), pct: 28 },
    draw: { pct: 17 },
    pool: "$9,100.00",
  },
  {
    type: "question",
    question: "Will Ghana surpass their best World Cup performance (2010 quarterfinals)?",
    pct: 61,
    pool: "$6,500.00",
    logo: flag("gh"),
  },
  {
    type: "prediction",
    question: "Who wins the African showdown?",
    options: [
      { label: "Senegal", pct: 70 },
      { label: "Algeria", pct: 30 },
    ],
    pool: "$5,100.00",
  },
  {
    type: "match",
    home: { name: "Canada", logo: flag("ca"), pct: 45 },
    away: { name: "New Zealand", logo: flag("nz"), pct: 35 },
    draw: { pct: 20 },
    pool: "$21,500.00",
  },
  {
    type: "question",
    question: "Will the 2026 World Cup take place without major organizational incidents?",
    pct: 80,
    pool: "$4,300.00",
  },
  {
    type: "prediction",
    question: "Who advances further, Ecuador or Paraguay?",
    options: [
      { label: "Ecuador", pct: 48 },
      { label: "Paraguay", pct: 52 },
    ],
    pool: "$18,000.00",
    logo: flag("ec"),
  },
  {
    type: "match",
    home: { name: "Iran", logo: flag("ir"), pct: 50 },
    away: { name: "Jordan", logo: flag("jo"), pct: 32 },
    draw: { pct: 18 },
    pool: "$13,700.00",
  },
  {
    type: "question",
    question: "Will Panama advance past the group stage for the first time in their World Cup history?",
    pct: 55,
    pool: "$7,800.00",
    logo: flag("pa"),
  },
  {
    type: "prediction",
    question: "Who wins the Caribbean showdown?",
    options: [
      { label: "Haiti", pct: 82 },
      { label: "Curaçao", pct: 18 },
    ],
    pool: "$3,900.00",
  },
];

const NewHome = () => (
  <div className="bg-primary-background min-h-screen pb-16 space-y-16 md:pb-0">
    {/* Hero + Navbar overlay */}
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
