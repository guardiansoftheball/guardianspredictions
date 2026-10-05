import React from "react";
import { Link } from "react-router-dom";
import MatchCard from "./MatchCard";
import QuestionCard from "./QuestionCard";
import PredictionCard from "./PredictionCard";

// Picks the card component for a market from useMarkets() and links it to its page.
const MarketCard = ({ card, transparent = true }) => {
  const common = { marketId: card.id, poolAmount: card.pool, transparent };
  const cardEl =
    card.type === "match" ? (
      <MatchCard homeTeam={card.home} awayTeam={card.away} draw={card.draw} {...common} />
    ) : card.type === "question" ? (
      <QuestionCard teamLogo={card.logo} question={card.question} pct={card.pct} {...common} />
    ) : (
      <PredictionCard teamLogo={card.logo} question={card.question} options={card.options} {...common} />
    );

  return (
    <Link to={`/markets/${card.id}`} style={{ textDecoration: "none", display: "contents" }}>
      {cardEl}
    </Link>
  );
};

export default MarketCard;
