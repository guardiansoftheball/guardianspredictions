import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MarketCard from "../../cards/MarketCard";
import GhostCard from "../../cards/GhostCard";
import { useMarkets } from "../../../hooks/useMarkets";
import { useWatchlist } from "../../../hooks/useWatchlist";
import { EmptyState } from "../../layouts/profile/ProfileUiKit";
import LoadingSpinner from "../../loaders/LoadingSpinner";

const ProfileFavorites = () => {
  const { t } = useTranslation();
  const { ids } = useWatchlist();
  const { cards, loading } = useMarkets();

  if (!ids.length) {
    return (
      <EmptyState>
        <div className="mb-1 text-[15px] font-semibold text-white">{t("watchlist.emptyTitle")}</div>
        <div className="mx-auto max-w-xs">{t("watchlist.emptyHint")}</div>
        <Link to="/new-markets" className="mt-4 inline-block rounded-full border border-white/20 px-5 py-2 text-[13px] text-white/80 no-underline hover:border-white/40 hover:text-white">
          {t("watchlist.browse")}
        </Link>
      </EmptyState>
    );
  }
  if (loading && !cards.length) return <LoadingSpinner />;

  const watched = new Set(ids);
  const favorites = cards.filter((card) => card.id != null && watched.has(String(card.id)));

  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 344px))" }}>
      {favorites.map((card) => (
        // Same look as /new-markets: a faded card shell behind a transparent card.
        <div key={card.id} className="relative grid">
          <div className="pointer-events-none absolute inset-0 grid opacity-35" aria-hidden="true">
            <GhostCard />
          </div>
          <div className="relative grid">
            <MarketCard card={card} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProfileFavorites;
