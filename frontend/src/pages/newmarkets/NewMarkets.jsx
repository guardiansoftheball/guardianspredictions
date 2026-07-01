import React from "react";
import Navbar from "../../components/navbar/Navbar";
import Filtros from "../../components/filtros/Filtros";
import PredictionCard from "../../components/cards/PredictionCard";
import QuestionCard from "../../components/cards/QuestionCard";
import MatchCard from "../../components/cards/MatchCard";
import { CARDS } from "../newhome/NewHome";

const NewMarkets = () => (
  <div className="bg-primary-background min-h-screen pb-16 md:pb-0">
    <Navbar />

    <div className="flex gap-8 pt-8 px-10 max-lg:px-4 max-lg:flex-col">
      {/* Panel de filtros */}
      <aside className="w-[280px] shrink-0 max-lg:w-full">
        <Filtros />
      </aside>

      {/* Cards */}
      <div className="flex-1 justify-items-center">
        <div className="grid grid-cols-4 gap-6 justify-items-center">
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
    </div>
  </div>
);

export default NewMarkets;
