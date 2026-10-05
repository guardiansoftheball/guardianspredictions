import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../../../config";
import { useAuth } from "../../../helpers/AuthContent";
import { unwrapApiResponse } from "../../../utils/apiResponse";
import LoadingSpinner from "../../loaders/LoadingSpinner";
import { CARD, FONT, FONT_HEAD, COLOR } from "../../../styles/darkTokens";
import { StatCard, EmptyState, ErrorBanner, SectionLabel } from "./ProfileUiKit";

// Kept low: the API rate limit can be as tight as ~1 req/s with a small burst.
const CONCURRENCY = 3;
const MAX_RETRIES = 4;
const COLLAPSED_ROWS = 10;

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// Retries rate-limited (429) responses with growing backoff.
async function fetchWithRetry(url, options) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, options);
    if (res.status !== 429 || attempt >= MAX_RETRIES) return res;
    const retryAfter = Number(res.headers.get("Retry-After"));
    const waitMs = retryAfter > 0 ? retryAfter * 1000 : 1000 * (attempt + 1);
    await new Promise((r) => setTimeout(r, waitMs));
  }
}

const formatSigned = (n) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toLocaleString()}`;

// Per-market P&L = current value (mark-to-market, or payout once resolved)
// minus net amount spent (buys minus sale proceeds), as computed by the backend.
function usePerformance(username) {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [failedCount, setFailedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchWithRetry(`${API_URL}/v0/portfolio/${username}`, { headers });
        if (!res.ok) throw new Error(res.statusText || `HTTP ${res.status}`);
        const portfolio = unwrapApiResponse(await res.json());
        const items = portfolio?.portfolioItems || [];

        const positions = await mapWithConcurrency(items, CONCURRENCY, async (item) => {
          try {
            const r = await fetchWithRetry(
              `${API_URL}/v0/markets/positions/${item.marketId}/${encodeURIComponent(username)}`,
              { headers },
            );
            if (!r.ok) return null;
            const p = unwrapApiResponse(await r.json());
            const value = Number(p?.value) || 0;
            const spent = Number(p?.totalSpent) || 0;
            return {
              marketId: item.marketId,
              title: item.questionTitle,
              lastBetPlaced: item.lastBetPlaced,
              value,
              spent,
              pnl: value - spent,
              isResolved: !!p?.isResolved,
              hasShares: (Number(p?.yesSharesOwned) || 0) + (Number(p?.noSharesOwned) || 0) > 0,
            };
          } catch {
            return null;
          }
        });

        if (!cancelled) {
          const loaded = positions.filter(Boolean);
          setRows(loaded);
          setFailedCount(positions.length - loaded.length);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (username && token) {
      load();
    } else {
      setRows([]);
      setLoading(false);
    }
    return () => { cancelled = true; };
  }, [username, token]);

  return { rows, failedCount, loading, error };
}

function summarize(rows) {
  const totalPnl = rows.reduce((s, r) => s + r.pnl, 0);
  const deployed = rows.reduce((s, r) => s + Math.max(r.spent, 0), 0);
  const resolved = rows.filter((r) => r.isResolved);
  const wins = resolved.filter((r) => r.pnl > 0).length;
  return {
    totalPnl,
    roi: deployed > 0 ? totalPnl / deployed : null,
    winRate: resolved.length ? wins / resolved.length : null,
    wins,
    resolvedCount: resolved.length,
    openCount: rows.filter((r) => !r.isResolved && r.hasShares).length,
  };
}

const PnlBar = ({ row, maxAbs, t }) => {
  const [hover, setHover] = useState(false);
  const pct = maxAbs > 0 ? (Math.abs(row.pnl) / maxAbs) * 50 : 0;
  const positive = row.pnl >= 0;
  const color = positive ? COLOR.yes : COLOR.no;

  return (
    <Link
      to={`/markets/${row.marketId}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_88px] items-center gap-x-4 gap-y-1.5 rounded-xl px-3 py-2 no-underline"
      style={{ background: hover ? "rgba(255,255,255,0.05)" : "transparent", transition: "background .15s" }}
    >
      <div className="min-w-0 flex items-center gap-2">
        <span
          title={row.title}
          className="truncate"
          style={{ font: `600 13px ${FONT}`, color: COLOR.text }}
        >
          {row.title || t("profile.unknownMarket")}
        </span>
        {!row.isResolved && (
          <span
            className="shrink-0 rounded-full px-1.5 py-px"
            style={{ font: `700 9.5px ${FONT}`, letterSpacing: ".06em", color: COLOR.muted, border: "1px solid rgba(255,255,255,0.14)" }}
          >
            {t("performance.open")}
          </span>
        )}
      </div>

      {/* Diverging track: losses grow left from the zero line, gains grow right. */}
      <div className="relative h-[14px]" aria-hidden="true">
        <div className="absolute inset-y-0 left-1/2 w-px" style={{ background: "rgba(255,255,255,0.22)" }} />
        <div
          className="absolute top-[2px] bottom-[2px]"
          style={{
            background: color,
            opacity: hover ? 1 : 0.85,
            width: `${Math.max(pct, row.pnl === 0 ? 0 : 0.6)}%`,
            ...(positive
              ? { left: "calc(50% + 1px)", borderRadius: "0 4px 4px 0" }
              : { right: "calc(50% + 1px)", borderRadius: "4px 0 0 4px" }),
          }}
        />
        {hover && (
          <div
            role="tooltip"
            className="absolute z-10 bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg px-3 py-2"
            style={{ background: "#0c1a2c", border: "1px solid rgba(255,255,255,0.14)", boxShadow: "0 8px 24px rgba(0,0,0,.4)", font: `500 12px ${FONT}`, color: COLOR.muted }}
          >
            <div>{t("performance.spent")}: <span style={{ color: COLOR.text }}>{row.spent.toLocaleString()}</span></div>
            <div>{row.isResolved ? t("performance.payout") : t("performance.currentValue")}: <span style={{ color: COLOR.text }}>{row.value.toLocaleString()}</span></div>
          </div>
        )}
      </div>

      <span
        className="sm:text-right tabular-nums"
        style={{ font: `700 13px ${FONT_HEAD}`, color: positive ? COLOR.yesText : COLOR.noText }}
      >
        {formatSigned(row.pnl)}
      </span>
    </Link>
  );
};

const PerformanceSection = ({ username, t }) => {
  const { rows, failedCount, loading, error } = usePerformance(username);
  const [expanded, setExpanded] = useState(false);

  const stats = useMemo(() => summarize(rows), [rows]);
  const sorted = useMemo(() => [...rows].sort((a, b) => b.pnl - a.pnl), [rows]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={`${t("performance.loadError")}: ${error}`} />;
  if (!rows.length && failedCount > 0) return <ErrorBanner message={t("performance.loadError")} />;
  if (!rows.length) return <EmptyState>{t("profile.noPositions")}</EmptyState>;

  // Collapsed view keeps the biggest winners and losers, which carry the story.
  const visible = expanded || sorted.length <= COLLAPSED_ROWS
    ? sorted
    : [...sorted.slice(0, COLLAPSED_ROWS / 2), ...sorted.slice(-COLLAPSED_ROWS / 2)];
  const hiddenCount = sorted.length - visible.length;
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.pnl)), 0);

  const pnlColor = stats.totalPnl >= 0 ? COLOR.yesText : COLOR.noText;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {failedCount > 0 && (
        <ErrorBanner message={t("performance.partial", { count: failedCount })} />
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t("performance.totalPnl")} value={formatSigned(stats.totalPnl)} valueColor={pnlColor} />
        <StatCard
          label={t("performance.roi")}
          value={stats.roi == null ? "—" : `${stats.roi >= 0 ? "+" : "−"}${Math.abs(stats.roi * 100).toFixed(1)}%`}
          valueColor={stats.roi == null ? COLOR.text : pnlColor}
        />
        <StatCard
          label={t("performance.winRate")}
          value={stats.winRate == null ? "—" : `${Math.round(stats.winRate * 100)}%`}
        />
        <StatCard label={t("performance.openPositions")} value={stats.openCount} />
      </div>
      {stats.resolvedCount > 0 && (
        <p style={{ margin: "-4px 2px 0", font: `500 12px ${FONT}`, color: COLOR.muted2 }}>
          {t("performance.winRateDetail", { wins: stats.wins, total: stats.resolvedCount })}
        </p>
      )}

      <div style={{ ...CARD, padding: "18px 14px 12px" }}>
        <div className="flex items-baseline justify-between gap-3 px-3 mb-3">
          <SectionLabel>{t("performance.byMarket")}</SectionLabel>
          <span style={{ font: `500 11.5px ${FONT}`, color: COLOR.muted2 }}>{t("performance.pnlHint")}</span>
        </div>
        <div className="flex flex-col">
          {visible.map((row, i) => (
            <React.Fragment key={row.marketId}>
              {!expanded && hiddenCount > 0 && i === COLLAPSED_ROWS / 2 && (
                <div className="px-3 py-1.5 text-center" style={{ font: `500 11.5px ${FONT}`, color: COLOR.muted3 }}>
                  ··· {t("performance.moreMarkets", { count: hiddenCount })} ···
                </div>
              )}
              <PnlBar row={row} maxAbs={maxAbs} t={t} />
            </React.Fragment>
          ))}
        </div>
        {sorted.length > COLLAPSED_ROWS && (
          <div className="flex justify-center mt-2">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="rounded-full border border-white/15 px-4 py-1.5 text-[12.5px] text-white/70 hover:text-white hover:border-white/35 transition-colors"
            >
              {expanded ? t("performance.showLess") : t("performance.showAll", { count: sorted.length })}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceSection;
