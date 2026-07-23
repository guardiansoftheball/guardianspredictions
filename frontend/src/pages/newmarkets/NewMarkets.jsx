import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import Filtros from "../../components/filtros/Filtros";
import PredictionCard from "../../components/cards/PredictionCard";
import QuestionCard from "../../components/cards/QuestionCard";
import MatchCard from "../../components/cards/MatchCard";
import GhostCard from "../../components/cards/GhostCard";
import { skeletonForType } from "../../components/cards/SkeletonCard";
import { CARDS } from "../newhome/NewHome";
import { useActiveMarketIds } from "../../hooks/useActiveMarketIds";
import { usePaginatedCards } from "../../hooks/usePaginatedCards";

const NewMarkets = () => {
  const { marketIds } = useActiveMarketIds(CARDS.length);
  const { visibleCards, skeletonCount, sentinelRef } =
    usePaginatedCards(CARDS);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Markets | Guardians Predictions";
  }, []);

  const nextCards = CARDS.slice(
    visibleCards.length,
    visibleCards.length + skeletonCount
  );

  return (
    <div className="bg-primary-background min-h-screen pb-16">
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
        <aside className="w-[280px] z-10 shrink-0 max-lg:w-auto">
          <Filtros />
        </aside>

        {/* Cards */}
        <div className="flex-1 justify-items-center">
          <div className="relative w-full">
            {/* Layer 1 — Ghost cards (solo fondo + borde, sin contenido) */}
            <div
              className="grid gap-6 w-full justify-center pointer-events-none"
              style={{
                opacity: 0.35,
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 344px))",
              }}
            >
              {visibleCards.map((_, i) => (
                <GhostCard key={`ghost-${i}`} />
              ))}
              {nextCards.map((_, i) => (
                <GhostCard key={`ghost-skel-${i}`} />
              ))}
            </div>

            {/* Layer 2 — Cards reales (solo contenido, sin fondo ni borde) */}
            <div
              className="grid gap-6 w-full justify-center absolute inset-0"
              style={{
                zIndex: 2,
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 344px))",
              }}
            >
              {visibleCards.map((card, i) => {
                const marketId =
                  marketIds.length > 0
                    ? marketIds[i % marketIds.length]
                    : i + 1;
                const cardEl =
                  card.type === "match" ? (
                    <MatchCard
                      key={i}
                      homeTeam={card.home}
                      awayTeam={card.away}
                      draw={card.draw}
                      poolAmount={card.pool}
                      transparent
                    />
                  ) : card.type === "question" ? (
                    <QuestionCard
                      key={i}
                      teamLogo={card.logo}
                      question={card.question}
                      pct={card.pct}
                      poolAmount={card.pool}
                      transparent
                    />
                  ) : (
                    <PredictionCard
                      key={i}
                      teamLogo={card.logo}
                      question={card.question}
                      options={card.options}
                      poolAmount={card.pool}
                      transparent
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

              {/* Skeletons for the next page */}
              {nextCards.map((card, i) => {
                const Skeleton = skeletonForType(card.type);
                return <Skeleton key={`skel-${i}`} />;
              })}
            </div>
          </div>

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="h-1 w-full" />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default NewMarkets;
