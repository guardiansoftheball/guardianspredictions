import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CARD } from "../../../styles/darkTokens";
import { EmptyState, ErrorBanner } from "../../layouts/profile/ProfileUiKit";
import { usePerformance } from "../../layouts/profile/PerformanceSection";
import LoadingSpinner from "../../loaders/LoadingSpinner";

const FILTERS = {
  all: () => true,
  open: (r) => !r.isResolved,
  won: (r) => r.isResolved && r.pnl > 0,
  lost: (r) => r.isResolved && r.pnl <= 0,
};

const money = (n) => `$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;

const SideChip = ({ outcome, shares, t }) => {
  const isYes = outcome === "YES";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold ${
        isYes ? "bg-[#BAD659]/10 text-[#C6E06C]" : "bg-[#fb5b6b]/10 text-[#fb8b96]"
      }`}
    >
      {t(isYes ? "activity.yes" : "activity.no")}
      <span className="font-normal opacity-70">· {t("account.activityShares", { count: shares })}</span>
    </span>
  );
};

const PositionRow = ({ row, t }) => {
  const up = row.pnl >= 0;
  const pct = row.spent > 0 ? Math.round((row.pnl / row.spent) * 100) : null;
  return (
    <Link
      to={`/markets/${row.marketId}`}
      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-t border-white/[0.06] px-4 py-3.5 no-underline transition-colors first:border-t-0 hover:bg-white/[0.03] md:grid-cols-[minmax(0,1fr)_90px_90px_110px]"
    >
      <div className="min-w-0">
        <div className="truncate text-[14px] font-semibold text-white">{row.title || t("profile.unknownMarket")}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {row.yesShares > 0 && <SideChip outcome="YES" shares={row.yesShares} t={t} />}
          {row.noShares > 0 && <SideChip outcome="NO" shares={row.noShares} t={t} />}
          {row.isResolved && (
            <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-white/50">{t("account.resolved")}</span>
          )}
        </div>
      </div>
      <div className="hidden text-right text-[13px] tabular-nums text-white/60 md:block">{money(row.spent)}</div>
      <div className="hidden text-right text-[13px] tabular-nums text-white md:block">{money(row.value)}</div>
      <div className="text-right">
        <div className={`text-[14px] font-semibold tabular-nums ${up ? "text-[#C6E06C]" : "text-[#fb8b96]"}`}>
          {up ? "+" : "-"}{money(row.pnl)}
        </div>
        {pct != null && <div className="text-[11px] tabular-nums text-white/40">{up ? "+" : ""}{pct}%</div>}
      </div>
    </Link>
  );
};

const ProfilePositions = ({ username }) => {
  const { t } = useTranslation();
  const { rows, loading, error } = usePerformance(username);
  const [filter, setFilter] = useState("all");

  const sorted = useMemo(
    () => [...rows].sort((a, b) => new Date(b.lastBetPlaced) - new Date(a.lastBetPlaced)),
    [rows],
  );
  const counts = useMemo(
    () => Object.fromEntries(Object.entries(FILTERS).map(([k, fn]) => [k, rows.filter(fn).length])),
    [rows],
  );
  const visible = sorted.filter(FILTERS[filter]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        {Object.keys(FILTERS).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            aria-pressed={filter === key}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
              filter === key ? "bg-white/[0.12] text-white" : "text-white/50 hover:text-white"
            }`}
          >
            {t(`account.positionsFilter_${key}`)}
            <span className="ml-1.5 text-white/40">{counts[key]}</span>
          </button>
        ))}
      </div>

      {!visible.length ? (
        <EmptyState>{t("account.noPositions")}</EmptyState>
      ) : (
        <div style={{ ...CARD, padding: 0, overflow: "hidden" }}>
          <div className="hidden grid-cols-[minmax(0,1fr)_90px_90px_110px] gap-x-4 border-b border-white/[0.06] px-4 py-2.5 text-[12px] text-white/40 md:grid">
            <span>{t("profile.market")}</span>
            <span className="text-right">{t("account.invested")}</span>
            <span className="text-right">{t("account.currentValue")}</span>
            <span className="text-right">{t("account.result")}</span>
          </div>
          {visible.map((row) => (
            <PositionRow key={row.marketId} row={row} t={t} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfilePositions;
