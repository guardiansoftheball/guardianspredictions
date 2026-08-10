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
import { useActiveMarketIds } from "../../hooks/useActiveMarketIds";

// Flags of national teams competing in the 2026 FIFA World Cup
const flag = (isoCode) => `https://flagcdn.com/w160/${isoCode}.png`;

export const CARDS = [
  {
    type: "match",
    home: { name: "Argentina", logo: flag("ar"), pct: 62 },
    away: { name: "Brazil", logo: flag("br"), pct: 25 },
    draw: { pct: 13 },
    pool: "$48,200.00",
    status: "active", event: "matches", league: "AFA",
    teams: ["Argentina", "Brazil"],
    popularity: 9800, createdAt: "2026-07-28",
  },
  {
    type: "question",
    question: "Will Argentina defend their 2026 World Cup title?",
    pct: 71,
    pool: "$12,400.00",
    logo: flag("ar"),
    status: "active", event: "standings", league: "AFA",
    teams: ["Argentina"],
    popularity: 7200, createdAt: "2026-07-15",
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
    status: "active", event: "knockouts", league: "LPF",
    teams: ["Spain", "France"],
    popularity: 8500, createdAt: "2026-08-01",
  },
  {
    type: "match",
    home: { name: "Mexico", logo: flag("mx"), pct: 55 },
    away: { name: "United States", logo: flag("us"), pct: 33 },
    draw: { pct: 12 },
    pool: "$19,500.00",
    status: "active", event: "matches", league: "LPF",
    teams: ["Mexico", "United States"],
    popularity: 6100, createdAt: "2026-08-02",
  },
  {
    type: "question",
    question: "Will the United States reach the semifinals as hosts?",
    pct: 58,
    pool: "$9,800.00",
    status: "active", event: "knockouts", league: "LPF",
    teams: ["United States"],
    popularity: 5400, createdAt: "2026-07-20",
  },
  {
    type: "prediction",
    question: "Who advances further, Colombia or Uruguay?",
    options: [
      { label: "Colombia", pct: 45 },
      { label: "Uruguay", pct: 55 },
    ],
    pool: "$7,300.00",
    status: "active", event: "knockouts", league: "AFA",
    teams: ["Colombia", "Uruguay"],
    popularity: 3200, createdAt: "2026-07-25",
  },
  {
    type: "match",
    home: { name: "Germany", logo: flag("de"), pct: 48 },
    away: { name: "Netherlands", logo: flag("nl"), pct: 38 },
    draw: { pct: 14 },
    pool: "$22,100.00",
    status: "active", event: "matches", league: "JDT",
    teams: ["Germany", "Netherlands"],
    popularity: 7800, createdAt: "2026-08-03",
  },
  {
    type: "question",
    question: "Will there be a goal-scoring record at the 2026 World Cup?",
    pct: 44,
    pool: "$5,600.00",
    logo: flag("us"),
    status: "active", event: "standings", league: "JDT",
    teams: [],
    popularity: 2100, createdAt: "2026-06-10",
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
    status: "active", event: "standings", league: "LPF",
    teams: ["Portugal", "Morocco"],
    popularity: 4900, createdAt: "2026-07-30",
  },
  {
    type: "match",
    home: { name: "Morocco", logo: flag("ma"), pct: 52 },
    away: { name: "Croatia", logo: flag("hr"), pct: 29 },
    draw: { pct: 19 },
    pool: "$11,300.00",
    status: "resolved", event: "matches", league: "AFA",
    teams: ["Morocco", "Croatia"],
    popularity: 3800, createdAt: "2026-06-20",
  },
  {
    type: "question",
    question:
      "Will Cape Verde make it past the group stage in their World Cup debut?",
    pct: 33,
    pool: "$3,200.00",
    status: "resolved", event: "standings", league: "JDT",
    teams: ["Cape Verde"],
    popularity: 900, createdAt: "2026-05-15",
  },
  {
    type: "match",
    home: { name: "Boca Juniors", logo: flag("ar"), pct: 67 },
    away: { name: "Independiente", logo: flag("ar"), pct: 21 },
    draw: { pct: 12 },
    pool: "$27,600.00",
    status: "active", event: "matches", league: "Boca Juniors",
    teams: ["Boca Juniors", "Independiente"],
    popularity: 9200, createdAt: "2026-08-01",
  },
  {
    type: "prediction",
    question: "Who wins the anticipated final between these powerhouses?",
    options: [
      { label: "Portugal", pct: 53 },
      { label: "Germany", pct: 47 },
    ],
    pool: "$8,400.00",
    status: "active", event: "knockouts", league: "LPF",
    teams: ["Portugal", "Germany"],
    popularity: 4100, createdAt: "2026-07-29",
  },
  {
    type: "question",
    question:
      "Will Huracan finish in the top 4 this season?",
    pct: 27,
    pool: "$2,900.00",
    logo: flag("ar"),
    status: "active", event: "standings", league: "Huracan",
    teams: ["Huracan"],
    popularity: 1800, createdAt: "2026-07-10",
  },
  {
    type: "match",
    home: { name: "Belgrano Cordoba", logo: flag("ar"), pct: 41 },
    away: { name: "Central Cordoba", logo: flag("ar"), pct: 42 },
    draw: { pct: 17 },
    pool: "$16,800.00",
    status: "active", event: "matches", league: "Belgrano Cordoba",
    teams: ["Belgrano Cordoba", "Central Cordoba"],
    popularity: 2600, createdAt: "2026-08-02",
  },
  {
    type: "prediction",
    question: "Who advances further, Newell's or Aldosivi?",
    options: [
      { label: "Newell's", pct: 65 },
      { label: "Aldosivi", pct: 35 },
    ],
    pool: "$10,200.00",
    logo: flag("ar"),
    status: "active", event: "knockouts", league: "Newell's",
    teams: ["Newell's", "Aldosivi"],
    popularity: 2200, createdAt: "2026-07-22",
  },
  {
    type: "match",
    home: { name: "Barrancas Central", logo: flag("ar"), pct: 55 },
    away: { name: "Argentino Juniors", logo: flag("ar"), pct: 28 },
    draw: { pct: 17 },
    pool: "$9,100.00",
    status: "resolved", event: "matches", league: "Barrancas Central",
    teams: ["Barrancas Central", "Argentino Juniors"],
    popularity: 1500, createdAt: "2026-06-15",
  },
  {
    type: "question",
    question:
      "Will Boca Juniors win the Copa Argentina this year?",
    pct: 61,
    pool: "$6,500.00",
    logo: flag("ar"),
    status: "active", event: "knockouts", league: "Boca Juniors",
    teams: ["Boca Juniors"],
    popularity: 8100, createdAt: "2026-07-18",
  },
  {
    type: "prediction",
    question: "Who wins the clasico, Independiente or Huracan?",
    options: [
      { label: "Independiente", pct: 55 },
      { label: "Huracan", pct: 45 },
    ],
    pool: "$5,100.00",
    status: "active", event: "matches", league: "Independiente",
    teams: ["Independiente", "Huracan"],
    popularity: 3400, createdAt: "2026-08-03",
  },
  {
    type: "match",
    home: { name: "Canada", logo: flag("ca"), pct: 45 },
    away: { name: "New Zealand", logo: flag("nz"), pct: 35 },
    draw: { pct: 20 },
    pool: "$21,500.00",
    status: "active", event: "matches", league: "JDT",
    teams: ["Canada", "New Zealand"],
    popularity: 3000, createdAt: "2026-07-31",
  },
  {
    type: "question",
    question:
      "Will the 2026 World Cup take place without major organizational incidents?",
    pct: 80,
    pool: "$4,300.00",
    status: "active", event: "press", league: "LPF",
    teams: [],
    popularity: 5800, createdAt: "2026-06-01",
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
    status: "resolved", event: "knockouts", league: "AFA",
    teams: ["Ecuador", "Paraguay"],
    popularity: 2700, createdAt: "2026-06-25",
  },
  {
    type: "match",
    home: { name: "Iran", logo: flag("ir"), pct: 50 },
    away: { name: "Jordan", logo: flag("jo"), pct: 32 },
    draw: { pct: 18 },
    pool: "$13,700.00",
    status: "resolved", event: "matches", league: "JDT",
    teams: ["Iran", "Jordan"],
    popularity: 1200, createdAt: "2026-06-18",
  },
  {
    type: "question",
    question:
      "Will Aldosivi avoid relegation this season?",
    pct: 55,
    pool: "$7,800.00",
    logo: flag("ar"),
    status: "active", event: "standings", league: "Aldosivi",
    teams: ["Aldosivi"],
    popularity: 1600, createdAt: "2026-07-05",
  },
  {
    type: "prediction",
    question: "Who wins the Caribbean showdown?",
    options: [
      { label: "Haiti", pct: 82 },
      { label: "Curaçao", pct: 18 },
    ],
    pool: "$3,900.00",
    status: "resolved", event: "matches", league: "JDT",
    teams: ["Haiti", "Curaçao"],
    popularity: 700, createdAt: "2026-05-20",
  },
];

// Number of cards to show per row-count at each breakpoint:
// mobile 1 col × 3 rows = 3, tablet 2 col × 3 rows = 6, desktop 3+ col × 3 rows = 9
function getHomeCardLimit() {
  return 15;
}

const NewHome = () => {
  const { t } = useTranslation();
  const [cardLimit] = useState(getHomeCardLimit);
  const homeCards = CARDS.slice(0, cardLimit);
  const { marketIds } = useActiveMarketIds(homeCards.length);
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
                  to={`/markets/${marketId}`}
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
