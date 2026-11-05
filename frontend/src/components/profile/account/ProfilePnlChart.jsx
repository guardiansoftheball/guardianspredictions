import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { API_URL } from "../../../config";
import { CARD } from "../../../styles/darkTokens";

const DAY = 86400000;
const RANGES = [
  { key: "1d", ms: DAY },
  { key: "1w", ms: 7 * DAY },
  { key: "1m", ms: 30 * DAY },
  { key: "all", ms: null },
];
// Same green/red as every P&L number on the page.
const GREEN = "#C6E06C";
const RED = "#fb8b96";

const money = (n) => {
  const v = Math.round(Number(n) || 0);
  return `${v > 0 ? "+" : v < 0 ? "-" : ""}$${Math.abs(v).toLocaleString("en-US")}`;
};

// There is no stored P&L history, so the curve is rebuilt from what we know:
// each resolved market books its P&L on its resolution date, and open markets
// are marked to market at "now".
function buildEvents(rows, resolvedAt) {
  // Markets resolved the same day collapse into one point, so the line has no notches.
  const byDay = new Map();
  rows
    .filter((r) => r.isResolved && resolvedAt[r.marketId])
    .forEach((r) => {
      const day = Math.floor(resolvedAt[r.marketId] / DAY) * DAY + DAY / 2;
      byDay.set(day, (byDay.get(day) || 0) + r.pnl);
    });
  const events = [...byDay].map(([t, pnl]) => ({ t, pnl })).sort((a, b) => a.t - b.t);
  const openPnl = rows.filter((r) => !r.isResolved).reduce((s, r) => s + r.pnl, 0);
  const firstBet = Math.min(...rows.map((r) => new Date(r.lastBetPlaced).getTime()).filter(Number.isFinite));
  return { events, openPnl, origin: Number.isFinite(firstBet) ? Math.min(firstBet, events[0]?.t ?? firstBet) : Date.now() };
}

function buildSeries({ events, openPnl, origin }, rangeMs) {
  const now = Date.now();
  const start = rangeMs ? now - rangeMs : origin;
  let total = events.filter((e) => e.t < start).reduce((s, e) => s + e.pnl, 0);
  const points = [{ t: start, v: total }];
  events.forEach((e) => {
    if (e.t < start) return;
    total += e.pnl;
    points.push({ t: e.t, v: total });
  });
  points.push({ t: now, v: total + openPnl });
  return points;
}

const ProfilePnlChart = ({ rows, loading, showHint = true }) => {
  const { t, i18n } = useTranslation();
  const [range, setRange] = useState("all");
  const [resolvedAt, setResolvedAt] = useState({});

  const resolvedIds = useMemo(
    () => rows.filter((r) => r.isResolved).map((r) => r.marketId).join(","),
    [rows],
  );

  useEffect(() => {
    if (!resolvedIds) return undefined;
    let cancelled = false;
    Promise.all(
      resolvedIds.split(",").map((id) =>
        fetch(`${API_URL}/v0/markets/${id}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((json) => {
            const m = json?.result?.market ?? json?.market;
            const ts = new Date(m?.finalResolutionDateTime || m?.resolutionDateTime).getTime();
            return [id, Number.isFinite(ts) ? ts : null];
          })
          .catch(() => [id, null]),
      ),
    ).then((pairs) => {
      if (!cancelled) setResolvedAt(Object.fromEntries(pairs.filter(([, ts]) => ts)));
    });
    return () => { cancelled = true; };
  }, [resolvedIds]);

  const timeline = useMemo(() => buildEvents(rows, resolvedAt), [rows, resolvedAt]);
  const points = useMemo(
    () => buildSeries(timeline, RANGES.find((r) => r.key === range).ms),
    [timeline, range],
  );

  const change = points.length ? points[points.length - 1].v - points[0].v : 0;
  const color = change >= 0 ? GREEN : RED;
  const fmtDate = (ts) => new Date(ts).toLocaleDateString(i18n.language, { month: "short", day: "numeric" });
  const ticks = points.length > 1
    ? [0, 1, 2, 3].map((i) => points[0].t + ((points[points.length - 1].t - points[0].t) * i) / 3)
    : [];

  return (
    <section style={CARD} className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[14px] text-white/60">{t("account.pnlTitle")}</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[32px] font-semibold leading-none tabular-nums" style={{ color: loading ? "rgba(255,255,255,0.4)" : color }}>
              {loading ? "—" : money(change)}
            </span>
            <span className="text-[13px] text-white/40">{t(`account.range_${range}`)}</span>
          </div>
        </div>
        <div className="flex rounded-lg bg-white/[0.05] p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              aria-pressed={range === r.key}
              className={`rounded-md px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                range === r.key ? "bg-white/[0.12] text-white" : "text-white/50 hover:text-white"
              }`}
            >
              {t(`account.rangeShort_${r.key}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 h-[260px]">
        {!loading && rows.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="gpPnl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                ticks={ticks}
                interval={0}
                padding={{ left: 18, right: 18 }}
                tickFormatter={fmtDate}
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                width={44}
                tickFormatter={(v) => `${v < 0 ? "-" : ""}$${Math.abs(Math.round(v))}`}
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickCount={4}
              />
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
              <Tooltip
                cursor={{ stroke: "rgba(255,255,255,0.2)" }}
                contentStyle={{ background: "#0c1a2c", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 10, padding: "8px 12px", fontFamily: "inherit", fontSize: 12 }}
                labelStyle={{ color: "rgba(255,255,255,0.55)", marginBottom: 2 }}
                itemStyle={{ color: "#fff", fontWeight: 600, padding: 0 }}
                labelFormatter={fmtDate}
                formatter={(v) => [money(v), t("account.pnlTooltip")]}
              />
              <Area type="monotone" dataKey="v" baseValue="dataMin" stroke={color} strokeWidth={2.5} fill="url(#gpPnl)" dot={false} activeDot={{ r: 4, fill: color, stroke: "#0b1020", strokeWidth: 2 }} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-[13px] text-white/40">
            {loading ? "…" : t("account.noPositions")}
          </div>
        )}
      </div>
      {showHint && <p className="m-0 mt-2 text-[11px] text-white/35">{t("account.pnlHint")}</p>}
    </section>
  );
};

export default ProfilePnlChart;
