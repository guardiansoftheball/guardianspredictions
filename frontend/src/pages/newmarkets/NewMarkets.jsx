import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import Filtros, { INITIAL_FILTERS } from "../../components/filtros/Filtros";
import PredictionCard from "../../components/cards/PredictionCard";
import QuestionCard from "../../components/cards/QuestionCard";
import MatchCard from "../../components/cards/MatchCard";
import GhostCard from "../../components/cards/GhostCard";
import { skeletonForType } from "../../components/cards/SkeletonCard";
import { useMarkets } from "../../hooks/useMarkets";
import { usePaginatedCards } from "../../hooks/usePaginatedCards";
import { listMarketTags } from "../../api/marketTagsApi";

const normalize = (str) => (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function filterAndSortCards(cards, filters) {
  let result = cards;

  // Search — matches question text, team names, home/away names
  if (filters.search) {
    const q = normalize(filters.search);
    result = result.filter((card) => {
      const texts = [
        card.question,
        ...(card.teams || []),
        card.home?.name,
        card.away?.name,
        card.league,
        ...(card.options || []).map((o) => o.label),
      ];
      return texts.some((t) => t && normalize(t).includes(q));
    });
  }

  // Status
  if (filters.status) {
    result = result.filter((card) => card.status === filters.status);
  }

  // Event type
  if (filters.event) {
    result = result.filter((card) => card.event === filters.event);
  }

  // League / market chip
  if (filters.league) {
    const leagueNorm = normalize(filters.league);
    result = result.filter((card) => {
      if (normalize(card.league).includes(leagueNorm)) return true;
      return (card.teams || []).some((t) => normalize(t).includes(leagueNorm));
    });
  }

  // Sort
  if (filters.sort === "popular") {
    result = [...result].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  } else if (filters.sort === "newest") {
    result = [...result].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  } else if (filters.sort === "oldest") {
    result = [...result].sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
  }

  return result;
}

const NewMarkets = () => {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const { cards: apiCards, loading: marketsLoading } = useMarkets();
  const [marketTags, setMarketTags] = useState([]);

  useEffect(() => {
    listMarketTags().then((res) => {
      const tags = res?.tags || res;
      if (Array.isArray(tags)) {
        setMarketTags(tags.map((t) => t.displayName || t.DisplayName || t.slug || t.Slug));
      }
    }).catch(() => {});
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    if (key === "clear") {
      setFilters(INITIAL_FILTERS);
      return;
    }
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const filteredCards = useMemo(() => filterAndSortCards(apiCards, filters), [apiCards, filters]);

  const { visibleCards, skeletonCount, sentinelRef } =
    usePaginatedCards(filteredCards);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Markets | Guardians Predictions";
  }, []);

  const nextCards = filteredCards.slice(
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
          <Filtros
            filters={filters}
            onFilterChange={handleFilterChange}
            resultCount={filteredCards.length}
            marketChips={marketTags}
          />
        </aside>

        {/* Cards */}
        <div className="flex-1 justify-items-center">
          {filteredCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/50">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-40">
                <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
                <path d="M21 21l-6 -6" />
              </svg>
              <p className="text-lg font-semibold mb-1">No markets found</p>
              <p className="text-sm">Try adjusting your filters or search terms</p>
              <button
                type="button"
                onClick={() => handleFilterChange("clear")}
                className="mt-4 px-4 py-2 rounded-full border border-white/20 text-sm text-white/70 hover:text-white hover:border-white/40 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="relative w-full">
              {/* Layer 1 — Ghost cards */}
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

              {/* Layer 2 — Real cards */}
              <div
                className="grid gap-6 w-full justify-center absolute inset-0"
                style={{
                  zIndex: 2,
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 344px))",
                }}
              >
                {visibleCards.map((card, i) => {
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
                  return (
                    <Link
                      key={i}
                      to={linkTarget}
                      style={{ textDecoration: "none", display: "contents" }}
                    >
                      {cardEl}
                    </Link>
                  );
                })}

                {/* Skeletons */}
                {nextCards.map((card, i) => {
                  const Skeleton = skeletonForType(card.type);
                  return <Skeleton key={`skel-${i}`} />;
                })}
              </div>
            </div>
          )}

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="h-1 w-full" />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default NewMarkets;
