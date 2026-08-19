import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link, useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import Hero from "../../components/hero/Hero";
import PredictionCard from "../../components/cards/PredictionCard";
import QuestionCard from "../../components/cards/QuestionCard";
import MatchCard from "../../components/cards/MatchCard";
import GhostCard from "../../components/cards/GhostCard";
import { useMarkets } from "../../hooks/useMarkets";

// Number of cards to show per row-count at each breakpoint:
// mobile 1 col × 3 rows = 3, tablet 2 col × 3 rows = 6, desktop 3+ col × 3 rows = 9
function getHomeCardLimit() {
  return 15;
}

const NewHome = () => {
  const { t } = useTranslation();
  const [cardLimit] = useState(getHomeCardLimit);
  const { cards: apiCards } = useMarkets();
  const homeCards = apiCards.slice(0, cardLimit);
  const [scrollY, setScrollY] = useState(0);
  const [cols, setCols] = useState(5);
  const gridRef = useRef(null);
  const history = useHistory();

  const handleScroll = useCallback(() => {
    setScrollY(window.scrollY);
  }, []);

  // Detect column count from the grid
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const detect = () => {
      const style = window.getComputedStyle(grid);
      const c = style.getPropertyValue("grid-template-columns").split(" ").length;
      setCols(c);
    };
    detect();
    const ro = new ResizeObserver(detect);
    ro.observe(grid);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Guardians Predictions";
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div className="bg-primary-background relative z-50 min-h-screen pb-16">
      {/* Navbar — fixed, always on top */}
      <div
        className=" sm:fixed top-0 left-0 right-0 z-50"
      >
        <Navbar />
      </div>

      {/* Hero — parallax: content scrolls over it */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1,
          transform: `translateY(-${scrollY * 0.35}px)`,
          willChange: "transform",
        }}
      >
        <Hero />
      </div>

      {/* Grid — scrolls over the hero */}
      <div
        className="bg-primary-background pt-12 px-10 justify-items-center max-lg:px-0 max-lg:pt-8"
        style={{ position: "relative", zIndex: 2 }}
      >
        {/* Blue glow blob — sticky so it follows scroll but stays inside this section */}
        <div
          style={{
            position: "sticky",
            top: "25%",
            height: 0,
            overflow: "visible",
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          <div
            style={{
              width: "60vw",
              height: "100vh",
              margin: "0 auto",
              transform: "translateY(-15%)",
              background:
                "linear-gradient(135deg, rgb(81 173 246 / 35%) 0%, rgb(30 144 255 / 37%) 0%)",
              filter: "blur(250px)",
              borderRadius: "50%",
            }}
          />
        </div>
        <div className="relative w-full" style={{ zIndex: 1 }}>
          {/* Layer 1 — Ghost cards */}
          <div
            ref={gridRef}
            className="grid gap-6 justify-center pointer-events-none"
            style={{
              opacity: 0.35,
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 344px))",
            }}
          >
            {homeCards.map((_, i) => {
              const lastRowStart = homeCards.length - (homeCards.length % cols || cols);
              const isFaded = i >= lastRowStart;
              return (
                <div key={`ghost-${i}`} style={isFaded ? { opacity: 0.4, maskImage: "linear-gradient(to bottom, white 0%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, white 0%, transparent 100%)" } : undefined}>
                  <GhostCard />
                </div>
              );
            })}
          </div>

          {/* Layer 2 — Real cards */}
          <div
            className="grid gap-6 justify-center absolute inset-0"
            style={{
              zIndex: 2,
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 344px))",
            }}
          >
            {homeCards.map((card, i) => {
              const lastRowStart = homeCards.length - (homeCards.length % cols || cols);
              const isFaded = i >= lastRowStart;
              const linkTarget = `/markets/${card.id || i + 1}`;
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
              const link = (
                <Link
                  key={i}
                  to={linkTarget}
                  style={{ textDecoration: "none", display: "contents" }}
                >
                  {cardEl}
                </Link>
              );
              if (isFaded) {
                return (
                  <div key={i} style={{ opacity: 0.35, maskImage: "linear-gradient(to bottom, white 20%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, white 20%, transparent 100%)" }}>
                    {link}
                  </div>
                );
              }
              return link;
            })}
          </div>

        </div>

        {/* Show more button */}
        <div className="flex justify-center mt-10" style={{ position: "relative", zIndex: 3 }}>
          <button
            type="button"
            onClick={() => history.push("/new-markets")}
            className="group flex items-center gap-2 px-8 py-3 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-all duration-200 hover:scale-105"
            style={{ backdropFilter: "blur(12px)", background: "rgba(255,255,255,0.06)" }}
          >
            <span className="text-[15px] font-medium">{t('home.showMoreMarkets')}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-200 group-hover:translate-x-1"
            >
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-16">
        <Footer />
      </div>
    </div>
  );
};

export default NewHome;
