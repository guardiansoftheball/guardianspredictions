import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "../../../helpers/AuthContent";
import { CARD } from "../../../styles/darkTokens";
import { loadUserActivity } from "./ProfileActivity";

const DAY = 86400000;
const RANGES = [
  { key: "1w", ms: 7 * DAY },
  { key: "1m", ms: 30 * DAY },
  { key: "all", ms: null },
];

// Cumulative credits put into buys over time, starting at the range's left edge.
function buildSeries(buys, rangeMs) {
  if (!buys.length) return [];
  const now = Date.now();
  const start = rangeMs ? now - rangeMs : new Date(buys[0].placedAt).getTime();
  let total = buys
    .filter((b) => new Date(b.placedAt).getTime() < start)
    .reduce((s, b) => s + b.amount, 0);
  const points = [{ t: start, v: total }];
  buys.forEach((b) => {
    const t = new Date(b.placedAt).getTime();
    if (t < start) return;
    total += b.amount;
    points.push({ t, v: total });
  });
  points.push({ t: now, v: total });
  return points;
}

const ProfileVolumeChart = ({ username }) => {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();
  const [buys, setBuys] = useState(null);
  const [range, setRange] = useState("all");

  useEffect(() => {
    if (!username) return undefined;
    let cancelled = false;
    loadUserActivity(username, token)
      .then((list) => {
        if (cancelled) return;
        setBuys(list.filter((i) => i.action === "buy").sort((a, b) => new Date(a.placedAt) - new Date(b.placedAt)));
      })
      .catch(() => { if (!cancelled) setBuys([]); });
    return () => { cancelled = true; };
  }, [username, token]);

  const points = useMemo(
    () => buildSeries(buys ?? [], RANGES.find((r) => r.key === range).ms),
    [buys, range],
  );
  const inRange = points.length ? points[points.length - 1].v - points[0].v : 0;
  const ticks = points.length > 1
    ? [0, 1, 2, 3].map((i) => points[0].t + ((points[points.length - 1].t - points[0].t) * i) / 3)
    : [];
  const fmtDate = (ts) => new Date(ts).toLocaleDateString(i18n.language, { month: "short", day: "numeric" });

  return (
    <div style={CARD} className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[13px] text-white/60">{t("account.volumeTitle")}</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[24px] font-semibold tabular-nums text-white">
              ${Math.round(inRange).toLocaleString("en-US")}
            </span>
            <span className="text-[12px] text-white/40">{t(`account.range_${range}`)}</span>
          </div>
        </div>
        <div className="flex rounded-lg bg-white/[0.05] p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              aria-pressed={range === r.key}
              className={`rounded-md px-3 py-1 text-[12px] font-semibold transition-colors ${
                range === r.key ? "bg-white/[0.12] text-white" : "text-white/50 hover:text-white"
              }`}
            >
              {t(`account.rangeShort_${r.key}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 h-[200px]">
        {buys && points.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gpVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
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
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide domain={["dataMin", "auto"]} />
              <Tooltip
                cursor={{ stroke: "rgba(255,255,255,0.2)" }}
                contentStyle={{ background: "#0c1a2c", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 10, padding: "8px 12px", fontFamily: "inherit", fontSize: 12 }}
                labelStyle={{ color: "rgba(255,255,255,0.55)", marginBottom: 2 }}
                itemStyle={{ color: "#fff", fontWeight: 600, padding: 0 }}
                labelFormatter={fmtDate}
                formatter={(v) => [`$${Math.round(v).toLocaleString("en-US")}`, t("account.volumeTooltip")]}
              />
              <Area type="stepAfter" dataKey="v" stroke="#60a5fa" strokeWidth={2} fill="url(#gpVolume)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-[13px] text-white/40">
            {buys ? t("account.noActivity") : "…"}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileVolumeChart;
