import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import Filtros from "../../components/filtros/Filtros";
import PredictionCard from "../../components/cards/PredictionCard";
import QuestionCard from "../../components/cards/QuestionCard";
import MatchCard from "../../components/cards/MatchCard";
import { CARDS } from "../newhome/NewHome";
import { useActiveMarketIds } from "../../hooks/useActiveMarketIds";

const NewMarkets = () => {
  const { marketIds } = useActiveMarketIds(CARDS.length);
  return (
    <div className="bg-primary-background min-h-screen pb-16 md:pb-0">
      <div
        style={{
          position: "fixed",
          width: "75vw",
          height: "100vh",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          // background: "#51ADF6",// opacity: 0.3,
          background:
            "linear-gradient(135deg, rgb(81 173 246 / 35%) 0%, rgb(30 144 255 / 30%) 0%)",
          filter: "blur(250px)",
          pointerEvents: "none",
          zIndex: 0,
          borderRadius: "50%",
        }}
      />
      <Navbar />

      <div className="flex gap-8 pt-8 px-10 max-lg:px-4 max-lg:flex-col pb-8">
        {/* Panel de filtros */}
        <aside className="w-[280px] z-10 shrink-0 max-lg:w-full">
          <Filtros />
        </aside>

        {/* Cards */}
        <div className="flex-1 justify-items-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full justify-items-center">
            {CARDS.map((card, i) => {
              const marketId =
                marketIds.length > 0 ? marketIds[i % marketIds.length] : i + 1;
              const cardEl =
                card.type === "match" ? (
                  <MatchCard
                    key={i}
                    homeTeam={card.home}
                    awayTeam={card.away}
                    draw={card.draw}
                    poolAmount={card.pool}
                  />
                ) : card.type === "question" ? (
                  <QuestionCard
                    key={i}
                    teamLogo={card.logo}
                    question={card.question}
                    pct={card.pct}
                    poolAmount={card.pool}
                  />
                ) : (
                  <PredictionCard
                    key={i}
                    teamLogo={card.logo}
                    question={card.question}
                    options={card.options}
                    poolAmount={card.pool}
                  />
                );
              return (
                <Link
                  key={i}
                  to={`/test/markets/${marketId}`}
                  style={{ textDecoration: "none", display: "contents" }}
                >
                  {cardEl}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default NewMarkets;
