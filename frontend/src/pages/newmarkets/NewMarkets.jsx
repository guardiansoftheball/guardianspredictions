import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import Filtros, { INITIAL_FILTERS } from "../../components/filtros/Filtros";
import MarketCard from "../../components/cards/MarketCard";
import GhostCard from "../../components/cards/GhostCard";
import BlueGlow from "../../components/ui/BlueGlow";
import { skeletonForType } from "../../components/cards/SkeletonCard";
import { useMarkets } from "../../hooks/useMarkets";
import { usePaginatedCards } from "../../hooks/usePaginatedCards";
import { listMarketTags } from "../../api/marketTagsApi";
import { useWatchlist } from "../../hooks/useWatchlist";

const normalize = (str) =>
  (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

// `watchedIds` is null for the "All" view, or the followed ids for "Following".
function filterAndSortCards(cards, filters, watchedIds) {
  let result = cards;

  // Watchlist
  if (watchedIds) {
    const watched = new Set(watchedIds);
    result = result.filter((card) => card.id != null && watched.has(String(card.id)));
  }

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
    result = [...result].sort(
      (a, b) => (b.popularity || 0) - (a.popularity || 0),
    );
  } else if (filters.sort === "newest") {
    result = [...result].sort((a, b) =>
      (b.createdAt || "").localeCompare(a.createdAt || ""),
    );
  } else if (filters.sort === "oldest") {
    result = [...result].sort((a, b) =>
      (a.createdAt || "").localeCompare(b.createdAt || ""),
    );
  }

  return result;
}

const SEARCH_DEBOUNCE_MS = 300;

// Query-string keys for each filter. Defaults are omitted to keep URLs short.
const URL_KEYS = { search: "q", status: "status", event: "event", league: "league", sort: "sort" };

function parseFilters(search) {
  const params = new URLSearchParams(search);
  return {
    search: params.get(URL_KEYS.search) || "",
    status: params.get(URL_KEYS.status) || null,
    event: params.get(URL_KEYS.event) || null,
    league: params.get(URL_KEYS.league) || null,
    sort: params.get(URL_KEYS.sort) || INITIAL_FILTERS.sort,
    watchlist: params.get("watchlist") === "1",
  };
}

function serializeFilters(filters) {
  const params = new URLSearchParams();
  for (const [key, param] of Object.entries(URL_KEYS)) {
    const value = filters[key];
    if (value && value !== INITIAL_FILTERS[key]) params.set(param, value);
  }
  if (filters.watchlist) params.set("watchlist", "1");
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

const WatchlistEmpty = ({ t, onBrowse }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center text-white/50">
    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
      <svg width="22" height="30" viewBox="-0.5 -0.5 15.55 20.29" fill="none" aria-hidden="true">
        <path
          d="M0.91 0.5 H13.64 C13.86 0.5 14.05 0.68 14.05 0.91 V18.79 L7.27 12.02 L0.5 18.79 V0.91 C0.5 0.68 0.68 0.5 0.91 0.5 Z"
          stroke="#C6E06C"
          strokeWidth="1"
        />
      </svg>
    </div>
    <p className="text-lg font-semibold text-white mb-1">{t("watchlist.emptyTitle")}</p>
    <p className="text-sm max-w-xs">{t("watchlist.emptyHint")}</p>
    <button
      type="button"
      onClick={onBrowse}
      className="mt-5 px-5 py-2 rounded-full border border-white/20 text-sm text-white/80 hover:text-white hover:border-white/40 transition-colors"
    >
      {t("watchlist.browse")}
    </button>
  </div>
);

const NewMarkets = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const history = useHistory();
  const { ids: watchedIds } = useWatchlist();
  const { cards: apiCards, loading: marketsLoading } = useMarkets();
  const [marketTags, setMarketTags] = useState([]);

  // Every filter lives in the query string, so links are shareable and Back
  // from a market restores the view. Clicks use replace() to keep history clean.
  const urlFilters = useMemo(() => parseFilters(location.search), [location.search]);

  const locationRef = useRef(location);
  locationRef.current = location;
  const writeFilters = useCallback((patch) => {
    const { pathname, search } = locationRef.current;
    const next = serializeFilters({ ...parseFilters(search), ...patch });
    if (next !== search) history.replace({ pathname, search: next });
  }, [history]);

  // Search filters the grid on every keystroke but reaches the URL debounced.
  const [searchInput, setSearchInput] = useState(urlFilters.search);
  const lastWrittenSearch = useRef(urlFilters.search);
  useEffect(() => {
    // Pick up external changes (Back/Forward, clear, navbar links).
    if (urlFilters.search !== lastWrittenSearch.current) {
      lastWrittenSearch.current = urlFilters.search;
      setSearchInput(urlFilters.search);
    }
  }, [urlFilters.search]);
  useEffect(() => {
    if (searchInput === lastWrittenSearch.current) return undefined;
    const id = setTimeout(() => {
      lastWrittenSearch.current = searchInput;
      writeFilters({ search: searchInput });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [searchInput, writeFilters]);

  const filters = useMemo(
    () => ({ ...urlFilters, search: searchInput }),
    [urlFilters, searchInput],
  );

  useEffect(() => {
    listMarketTags()
      .then((res) => {
        const tags = res?.tags || res;
        if (Array.isArray(tags)) {
          setMarketTags(
            tags.map((t) => t.displayName || t.DisplayName || t.slug || t.Slug),
          );
        }
      })
      .catch(() => {});
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    if (key === "clear") {
      lastWrittenSearch.current = "";
      setSearchInput("");
      writeFilters({ ...INITIAL_FILTERS, watchlist: false });
      return;
    }
    if (key === "search") {
      setSearchInput(value);
      return;
    }
    writeFilters({ [key]: value });
  }, [writeFilters]);

  const filteredCards = useMemo(
    () => filterAndSortCards(apiCards, filters, filters.watchlist ? watchedIds : null),
    [apiCards, filters, watchedIds],
  );

  // Restart pagination only when the user changes filters, not when live
  // refreshes or bookmark toggles change the list length.
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);
  const { visibleCards, skeletonCount, sentinelRef } =
    usePaginatedCards(filteredCards, filtersKey);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Markets | Guardians Predictions";
  }, []);

  const nextCards = filteredCards.slice(
    visibleCards.length,
    visibleCards.length + skeletonCount,
  );

  return (
    <div className="bg-primary-background min-h-screen pb-16">
      <BlueGlow />
      <Navbar />

      <div className="flex gap-8 pt-8 px-10 max-lg:px-4 max-lg:flex-col pb-8">
        {/* Panel de filtros */}
        <aside className="w-[280px] z-10 shrink-0 max-lg:w-auto">
          <Filtros
            filters={filters}
            watchedCount={watchedIds.length}
            onFilterChange={handleFilterChange}
            resultCount={filteredCards.length}
            marketChips={marketTags}
          />
        </aside>

        {/* Cards */}
        <div className="flex-1 justify-items-center">
          {filters.watchlist && !watchedIds.length ? (
            <WatchlistEmpty t={t} onBrowse={() => handleFilterChange("watchlist", false)} />
          ) : filteredCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mb-4 opacity-40"
              >
                <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
                <path d="M21 21l-6 -6" />
              </svg>
              <p className="text-lg font-semibold mb-1">
                {t("markets.noResults")}
              </p>
              <p className="text-sm">{t("markets.noResultsHint")}</p>
              <button
                type="button"
                onClick={() => handleFilterChange("clear")}
                className="mt-4 px-4 py-2 rounded-full border border-white/20 text-sm text-white/70 hover:text-white hover:border-white/40 transition-colors"
              >
                {t("markets.clearAllFilters")}
              </button>
            </div>
          ) : (
            <div className="relative w-full">
              {/* Layer 1 — Ghost cards */}
              <div
                className="grid gap-6  w-full justify-center pointer-events-none"
                style={{
                  opacity: 0.35,
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(300px, 344px))",
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
                className="grid gap-6 gap-[0 1.5rem] w-full justify-center absolute inset-0"
                style={{
                  zIndex: 2,
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(300px, 344px))",
                }}
              >
                {visibleCards.map((card, i) => (
                  <MarketCard key={card.id ?? `idx-${i}`} card={card} />
                ))}

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
