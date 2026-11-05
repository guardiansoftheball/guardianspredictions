import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_URL } from "../../../config";
import { useAuth } from "../../../helpers/AuthContent";
import { CARD } from "../../../styles/darkTokens";
import { EmptyState, ErrorBanner } from "../../layouts/profile/ProfileUiKit";
import LoadingSpinner from "../../loaders/LoadingSpinner";

const PAGE = 20;
const FILTERS = ["all", "buy", "sell"];

function timeAgo(date, locale) {
  const secs = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "always", style: "narrow" });
  if (secs < 60) return rtf.format(-Math.floor(secs), "second");
  if (secs < 3600) return rtf.format(-Math.floor(secs / 60), "minute");
  if (secs < 86400) return rtf.format(-Math.floor(secs / 3600), "hour");
  return rtf.format(-Math.floor(secs / 86400), "day");
}

// Built from the user's portfolio markets and each market's public bet list.
export async function loadUserActivity(username, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_URL}/v0/portfolio/${username}`, { headers });
  if (!res.ok) throw new Error(res.statusText);
  const markets = (await res.json()).portfolioItems ?? [];

  const perMarket = await Promise.all(
    markets.map(async (m) => {
      const r = await fetch(`${API_URL}/v0/markets/bets/${m.marketId}`, { headers });
      if (!r.ok) return [];
      const bets = (await r.json()).result ?? [];
      return bets
        .filter((b) => b.username === username)
        .map((b, i) => ({
          key: `${m.marketId}-${b.placedAt}-${i}`,
          marketId: m.marketId,
          title: m.questionTitle,
          action: b.amount < 0 ? "sell" : "buy",
          amount: Math.abs(b.amount),
          outcome: b.outcome,
          price: Math.round((b.outcome === "YES" ? b.probability : 1 - b.probability) * 100),
          placedAt: b.placedAt,
        }));
    }),
  );
  return perMarket.flat().sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt));
}

const ActivityRow = ({ item, locale, t, thirdPerson }) => {
  const isYes = item.outcome === "YES";
  const isSell = item.action === "sell";
  return (
    <Link
      to={`/markets/${item.marketId}`}
      className="flex items-center gap-3 border-t border-white/[0.06] px-4 py-3.5 no-underline transition-colors first:border-t-0 hover:bg-white/[0.03]"
    >
      <span
        className={`w-[60px] shrink-0 rounded-md py-1 text-center text-[11px] font-semibold uppercase tracking-wide ${
          isSell ? "bg-[#f6ad55]/10 text-[#f6c38a]" : "bg-[#60a5fa]/10 text-[#93c5fd]"
        }`}
      >
        {t(isSell ? "account.badgeSell" : "account.badgeBuy")}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-semibold text-white">{item.title}</div>
        <div className="truncate text-[13px] text-white/55">
          {t(`account.activity${isSell ? "Sold" : "Bought"}${thirdPerson ? "Other" : ""}`)}{" "}
          <span className={isYes ? "text-[#C6E06C]" : "text-[#fb8b96]"}>{t(isYes ? "activity.yes" : "activity.no")}</span>
          {" · "}{t("account.activityAt", { price: item.price })}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-[14px] font-semibold tabular-nums text-white">
          {isSell ? t("account.activityShares", { count: item.amount }) : `$${item.amount.toLocaleString("en-US")}`}
        </div>
        <div className="text-[12px] text-white/40">{timeAgo(item.placedAt, locale)}</div>
      </div>
    </Link>
  );
};

const ProfileActivity = ({ username, thirdPerson = false }) => {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [visible, setVisible] = useState(PAGE);

  useEffect(() => {
    if (!username) return undefined;
    let cancelled = false;
    loadUserActivity(username, token)
      .then((list) => { if (!cancelled) setItems(list); })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [username, token]);

  const filtered = useMemo(
    () => (items ?? []).filter((i) => filter === "all" || i.action === filter),
    [items, filter],
  );

  const labels = { all: t("account.filterAll"), buy: t("account.filterBuys"), sell: t("account.filterSells") };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => { setFilter(f); setVisible(PAGE); }}
            aria-pressed={filter === f}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
              filter === f ? "bg-white/[0.12] text-white" : "text-white/50 hover:text-white"
            }`}
          >
            {labels[f]}
          </button>
        ))}
      </div>
      {error ? (
        <ErrorBanner message={error} />
      ) : !items ? (
        <LoadingSpinner />
      ) : !filtered.length ? (
        <EmptyState>{t("account.noActivity")}</EmptyState>
      ) : (
        <>
          <div style={{ ...CARD, padding: 0, overflow: "hidden" }}>
            {filtered.slice(0, visible).map((item) => (
              <ActivityRow key={item.key} item={item} locale={i18n.language} t={t} thirdPerson={thirdPerson} />
            ))}
          </div>
          {visible < filtered.length && (
            <button
              type="button"
              onClick={() => setVisible((v) => v + PAGE)}
              className="mx-auto rounded-full border border-white/15 px-5 py-2 text-[13px] text-white/75 hover:border-white/35 hover:text-white"
            >
              {t("account.showMore")}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default ProfileActivity;
