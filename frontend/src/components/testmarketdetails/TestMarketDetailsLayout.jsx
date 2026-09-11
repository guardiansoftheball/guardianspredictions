import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import Navbar from "../navbar/Navbar";
import Footer from "../footer/Footer";
import NewMarketChart from "../charts/NewMarketChart";
import ActivityTabs from "../tabs/ActivityTabs";
import NewTradePanel from "./NewTradePanel";
import ResolveModalButton from "../modals/resolution/ResolveModalDark";
import ResolutionAlert from "../resolutions/ResolutionAlert";
import { stewardUsernameFor } from "../markets/StewardTag";
import formatResolutionDate from "../../helpers/formatResolutionDate";
import { CARD, FONT, FONT_HEAD, COLOR } from "../../styles/darkTokens";
import { getMarketGroupDetails } from "../../api/marketsApi";
import {
  submitBet,
  fetchUserShares,
  fetchSaleQuote,
  submitSale,
} from "../layouts/trade/TradeUtils";
import { USER_CREDIT_REFRESH_EVENT } from "../utils/userFinanceTools/FetchUserCredit";
import { API_URL } from "../../config";
import { useToast } from "../../hooks/useToast";
import ShareModal from "../modals/share/ShareModal";
import LoginModal from "../modals/login/LoginModal";
import ForgotPasswordModal from "../modals/forgotpassword/ForgotPasswordModal";
import { useAuth } from "../../helpers/AuthContent";
import { listMarketTags } from "../../api/marketTagsApi";

// ─── design tokens ────────────────────────────────────────────────────────────
const FONT_BODY = FONT;
const YES_GREEN = COLOR.yes;
const YES_TEXT = COLOR.yesText;
const NO_RED = COLOR.no;
const NO_TEXT = COLOR.noText;
const MUTED = COLOR.muted;
const MUTED2 = COLOR.muted2;
const MUTED3 = COLOR.muted3;
const TEXT = COLOR.text;
const MARKET_CARD = { ...CARD, background: "#0e121d" };

// Per-option theme: first=green, last=red, middles=neutral/purple/orange/teal…
const OPTION_THEMES = [
  {
    color: "#BAD659",
    text: "#C6E06C",
    bg: "rgba(186,214,89,0.10)",
    border: "rgba(186,214,89,0.28)",
    activeBorder: "rgba(186,214,89,0.55)",
    gradient: "linear-gradient(180deg,#BAD659,#AABA49)",
    shadow: "0 8px 22px rgba(186,214,89,0.30)",
  },
  {
    color: "#fb5b6b",
    text: "#fb8b96",
    bg: "rgba(251,91,107,0.10)",
    border: "rgba(251,91,107,0.25)",
    activeBorder: "rgba(251,91,107,0.55)",
    gradient: "linear-gradient(180deg,#fb5b6b,#e11d48)",
    shadow: "0 8px 22px rgba(244,63,94,0.28)",
  },
  {
    color: "#6b7f96",
    text: "#8ca0b6",
    bg: "rgba(107,127,150,0.09)",
    border: "rgba(107,127,150,0.22)",
    activeBorder: "rgba(107,127,150,0.50)",
    gradient: "linear-gradient(180deg,#6b7f96,#4a5e72)",
    shadow: "0 8px 22px rgba(107,127,150,0.22)",
  },
  {
    color: "#a78bfa",
    text: "#c4b5fd",
    bg: "rgba(167,139,250,0.10)",
    border: "rgba(167,139,250,0.26)",
    activeBorder: "rgba(167,139,250,0.52)",
    gradient: "linear-gradient(180deg,#a78bfa,#7c3aed)",
    shadow: "0 8px 22px rgba(167,139,250,0.28)",
  },
  {
    color: "#f6ad55",
    text: "#fbd38d",
    bg: "rgba(246,173,85,0.10)",
    border: "rgba(246,173,85,0.24)",
    activeBorder: "rgba(246,173,85,0.50)",
    gradient: "linear-gradient(180deg,#f6ad55,#d97706)",
    shadow: "0 8px 22px rgba(246,173,85,0.26)",
  },
  {
    color: "#4fd1c5",
    text: "#81e6d9",
    bg: "rgba(79,209,197,0.10)",
    border: "rgba(79,209,197,0.24)",
    activeBorder: "rgba(79,209,197,0.50)",
    gradient: "linear-gradient(180deg,#4fd1c5,#0d9488)",
    shadow: "0 8px 22px rgba(79,209,197,0.24)",
  },
];

function getOptionTheme(index, total) {
  if (total === 1) return OPTION_THEMES[0];
  if (index === 0) return OPTION_THEMES[0];
  if (index === total - 1) return OPTION_THEMES[1];
  const midSlot = ((index - 1) % (OPTION_THEMES.length - 2)) + 2;
  return OPTION_THEMES[midSlot];
}

const PRESETS = [10, 50, 100];

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(Math.round(n));
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
function formatTick(ts) {
  const d = new Date(ts);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
function formatTooltipDate(ts) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${hh}:${mm}`;
}

function getAnswerProb(answer) {
  const raw = Array.isArray(answer?.probabilityChanges)
    ? answer.probabilityChanges
    : Array.isArray(answer?.summary?.probabilityChanges)
      ? answer.summary.probabilityChanges
      : [];
  if (raw.length > 0) {
    // Sort by timestamp to guarantee we get the most recent value
    const sorted = [...raw].sort((a, b) => {
      const ta = new Date(a.timestamp || a.Timestamp).getTime();
      const tb = new Date(b.timestamp || b.Timestamp).getTime();
      return ta - tb;
    });
    const last = sorted[sorted.length - 1];
    const p = Number(last.probability ?? last.Probability);
    if (Number.isFinite(p)) return p;
  }
  const fallback =
    answer?.market?.lastProbability ??
    answer?.summary?.lastProbability ??
    answer?.market?.market?.initialProbability ??
    0.5;
  return Number.isFinite(Number(fallback)) ? Number(fallback) : 0.5;
}

function buildChartData(answers, timeFilter, now = Date.now()) {
  const cutoffMs = {
    LIVE: 7_200_000,
    "1H": 3_600_000,
    "1D": 86_400_000,
    "1W": 604_800_000,
  };
  const cutoff = timeFilter === "ALL" ? 0 : now - (cutoffMs[timeFilter] || 0);

  const series = answers.map((a) => {
    const changes = Array.isArray(a.probabilityChanges)
      ? a.probabilityChanges
      : Array.isArray(a.summary?.probabilityChanges)
        ? a.summary.probabilityChanges
        : [];
    return changes
      .map((c) => ({
        t: new Date(c.timestamp || c.Timestamp).getTime(),
        p: Number(c.probability ?? c.Probability),
      }))
      .filter((c) => Number.isFinite(c.t) && Number.isFinite(c.p))
      .sort((a, b) => a.t - b.t);
  });

  // For each series, find the last known value before cutoff to use as anchor
  const anchors = series.map((s, i) => {
    if (cutoff === 0) return null;
    const before = s.filter((c) => c.t < cutoff);
    if (!before.length) return null;
    return { t: cutoff, p: before[before.length - 1].p };
  });

  const initialProbs = answers.map((a) => getAnswerProb(a));

  const getValAt = (s, init, t) => {
    for (let j = s.length - 1; j >= 0; j--) {
      if (s[j].t <= t) return s[j].p;
    }
    return init;
  };

  // Build series augmented with anchor points
  const augmented = series.map((s, i) =>
    anchors[i]
      ? [anchors[i], ...s.filter((c) => c.t >= cutoff)]
      : s.filter((c) => cutoff === 0 || c.t >= cutoff),
  );

  const tsSet = new Set();
  augmented.forEach((s) => s.forEach((p) => tsSet.add(p.t)));
  tsSet.add(now);
  const sortedTs = [...tsSet].sort((a, b) => a - b);

  return sortedTs.map((t) => {
    const point = { t };
    augmented.forEach((s, i) => {
      point[`o${i}`] = Math.round(getValAt(s, initialProbs[i], t) * 1000) / 10;
    });
    return point;
  });
}

// ─── responsive hook ─────────────────────────────────────────────────────────
function useIsMobile(bp = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < bp);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp - 1}px)`);
    const h = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", h);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener("change", h);
  }, [bp]);
  return isMobile;
}

// ─── Live pulse dot ──────────────────────────────────────────────────────────
const LivePulse = () => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
    <span style={{ position: "relative", width: "8px", height: "8px" }}>
      <span style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: "#4ade80", animation: "gp-pulse 2s ease-in-out infinite",
      }} />
      <span style={{
        position: "absolute", inset: "-3px", borderRadius: "50%",
        border: "1.5px solid #4ade80", opacity: 0,
        animation: "gp-pulse-ring 2s ease-out infinite",
      }} />
    </span>
    <span style={{ font: `600 11px ${FONT_BODY}`, color: "#4ade80", letterSpacing: ".04em" }}>LIVE</span>
    <style>{`
      @keyframes gp-pulse { 0%,100%{opacity:.7;transform:scale(.9)} 50%{opacity:1;transform:scale(1)} }
      @keyframes gp-pulse-ring { 0%{opacity:.6;transform:scale(.8)} 100%{opacity:0;transform:scale(2)} }
      @keyframes gp-mcBrandPulse { 0%,100%{box-shadow:0 0 20px rgba(156,201,241,0.35),0 4px 12px rgba(0,0,0,0.3)} 50%{box-shadow:0 0 28px rgba(156,201,241,0.5),0 6px 16px rgba(0,0,0,0.3)} }
      @keyframes mcPulse { 0%,100%{width:10px;height:10px;opacity:0.55} 50%{width:30px;height:30px;opacity:0} }
    `}</style>
  </span>
);

// ─── Chart tooltip (all options) ─────────────────────────────────────────────
const MultiAllTooltip = ({ active, payload, label, answers, timeFilter }) => {
  if (!active || !payload?.length) return null;
  const d = new Date(label);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const timeStr = timeFilter === "LIVE" ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`;
  return (
    <div
      style={{
        background: "rgba(10,20,36,0.97)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "12px",
        padding: "12px 16px",
        fontFamily: FONT_BODY,
        minWidth: "160px",
      }}
    >
      <div
        style={{
          font: `600 11px ${FONT_BODY}`,
          color: MUTED2,
          marginBottom: "10px",
        }}
      >
        {timeStr}
      </div>
      {answers.map((a, i) => {
        const t = getOptionTheme(i, answers.length);
        const entry = payload.find((p) => p.dataKey === `o${i}`);
        const val = entry?.value;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: i < answers.length - 1 ? "7px" : 0,
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: t.color,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                font: `500 12px ${FONT_BODY}`,
                color: "#b7c6d6",
                flex: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "110px",
              }}
            >
              {a.answerLabel}
            </span>
            <span
              style={{
                font: `800 13px ${FONT_HEAD}`,
                color: t.color,
                marginLeft: "auto",
              }}
            >
              {val != null ? `${val.toFixed(1)}%` : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Multi-option chart (pure SVG, real data) ────────────────────────────────
const MC_RANGES = ["1H", "6H", "1D", "1W", "1M", "ALL"];
const MC_WINDOW_MS = {
  "1H": 3600_000,
  "6H": 6 * 3600_000,
  "1D": 86400_000,
  "1W": 7 * 86400_000,
  "1M": 30 * 86400_000,
  ALL: 0,
};
const MC_LABEL_STEP = {
  "1H": 15 * 60_000,
  "6H": 60 * 60_000,
  "1D": 4 * 3600_000,
  "1W": 86400_000,
  "1M": 5 * 86400_000,
  ALL: 7 * 86400_000,
};

function mcAvoidCollisions(rawTops, minGap = 20, maxTop = 82) {
  const arr = rawTops.map((t, i) => ({ t, i })).sort((a, b) => a.t - b.t);
  for (let iter = 0; iter < 60; iter++) {
    let moved = false;
    for (let j = 1; j < arr.length; j++) {
      if (arr[j].t - arr[j - 1].t < minGap) {
        const mid = (arr[j].t + arr[j - 1].t) / 2;
        arr[j - 1].t = mid - minGap / 2;
        arr[j].t = mid + minGap / 2;
        moved = true;
      }
    }
    if (!moved) break;
  }
  if (arr[arr.length - 1].t > maxTop) {
    const excess = arr[arr.length - 1].t - maxTop;
    arr.forEach((a) => {
      a.t -= excess;
    });
  }
  const out = new Array(rawTops.length);
  arr.forEach(({ t, i }) => {
    out[i] = t;
  });
  return out;
}

function MultiOptionChart({ answers, selectedIdx, onSelectIdx }) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [range, setRange] = useState("ALL");
  const [hoverT, setHoverT] = useState(null);
  const chartRef = useRef(null);

  const [liveNow, setLiveNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setLiveNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  // Fixed Y-axis 0-100%
  const CHART_H = 280;
  const W = 1000;
  const yOf = (p) => CHART_H - p * CHART_H;
  const Y_TICKS = [1, 0.75, 0.5, 0.25, 0];

  // Parse all series
  const allSeriesChanges = useMemo(() =>
    answers.map((a) => {
      const raw = Array.isArray(a.probabilityChanges)
        ? a.probabilityChanges
        : Array.isArray(a.summary?.probabilityChanges)
          ? a.summary.probabilityChanges
          : [];
      return raw
        .map((c) => ({
          t: new Date(c.timestamp || c.Timestamp).getTime(),
          p: Number(c.probability ?? c.Probability),
        }))
        .filter((c) => Number.isFinite(c.t) && Number.isFinite(c.p))
        .sort((a, b) => a.t - b.t);
    }),
    [answers],
  );

  // Compute window
  const allTimestamps = useMemo(() => {
    const ts = [];
    allSeriesChanges.forEach(s => s.forEach(c => ts.push(c.t)));
    return ts.sort((a, b) => a - b);
  }, [allSeriesChanges]);

  const windowMs = range === "ALL"
    ? (allTimestamps.length > 1 ? liveNow - allTimestamps[0] + 3600_000 : 7 * 86400_000)
    : MC_WINDOW_MS[range];
  const winStart = liveNow - windowMs;

  const seriesData = useMemo(() =>
    answers.map((a, i) => {
      const changes = allSeriesChanges[i];
      const curP = Math.max(0.001, Math.min(0.999, getAnswerProb(a)));
      const before = changes.filter((c) => c.t < winStart);
      const within = changes.filter((c) => c.t >= winStart && c.t < liveNow);
      const anchorP = before.length
        ? before[before.length - 1].p
        : within.length ? within[0].p : curP;
      return [{ t: winStart, p: anchorP }, ...within, { t: liveNow, p: curP }];
    }),
    [answers, allSeriesChanges, winStart, liveNow],
  );

  const lastProbs = seriesData.map((s) => s[s.length - 1]?.p ?? 0.5);

  const xOf = (t) => Math.min(W, Math.max(0, ((t - winStart) / windowMs) * W));

  const getValAt = (series, t) => {
    let v = series[0]?.p ?? 0.5;
    for (const c of series) {
      if (c.t <= t) v = c.p;
      else break;
    }
    return v;
  };

  // Step path builder
  const ptsToD = (pts) => {
    if (pts.length < 2) return "";
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++)
      d += ` H${pts[i][0].toFixed(1)} V${pts[i][1].toFixed(1)}`;
    return d;
  };

  const paths = seriesData.map((series) => {
    const pts = series.map((c) => [xOf(c.t), yOf(c.p)]);
    return { d: ptsToD(pts), last: pts[pts.length - 1] };
  });

  // Hover + drag-select
  const [dragState, setDragState] = useState(null);
  const [rangeSelect, setRangeSelect] = useState(null);
  const dragStartRef = useRef(null);

  useEffect(() => { setRangeSelect(null); setDragState(null); }, [range]);

  const getFrac = (e) => {
    const el = chartRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  const onMove = (e) => {
    const frac = getFrac(e);
    if (dragStartRef.current != null) {
      setDragState({ f1: dragStartRef.current, f2: frac });
      setHoverT(null);
      return;
    }
    if (!rangeSelect) setHoverT(winStart + frac * windowMs);
  };
  const onTouchStart = (e) => { e.preventDefault(); if (!rangeSelect) setHoverT(winStart + getFrac(e) * windowMs); };
  const onTouchMove = (e) => { e.preventDefault(); if (!rangeSelect) setHoverT(winStart + getFrac(e) * windowMs); };
  const onLeave = () => { if (!dragStartRef.current) setHoverT(null); };

  const onDown = (e) => {
    if (e.button !== 0) return;
    const frac = getFrac(e);
    dragStartRef.current = frac;
    setDragState({ f1: frac, f2: frac });
    setRangeSelect(null);
    setHoverT(null);
    e.preventDefault();
    const moveG = (ev) => setDragState({ f1: dragStartRef.current, f2: getFrac(ev) });
    const upG = (ev) => {
      const f = getFrac(ev);
      const s = dragStartRef.current;
      dragStartRef.current = null;
      const lo = Math.min(s, f), hi = Math.max(s, f);
      if (hi - lo < 0.01) { setDragState(null); setRangeSelect(null); }
      else { setDragState(null); setRangeSelect({ f1: lo, f2: hi }); }
      window.removeEventListener("mousemove", moveG);
      window.removeEventListener("mouseup", upG);
    };
    window.addEventListener("mousemove", moveG);
    window.addEventListener("mouseup", upG);
  };

  const activeRange = dragState || rangeSelect;
  const rangeInfo = activeRange ? (() => {
    const lo = Math.min(activeRange.f1, activeRange.f2);
    const hi = Math.max(activeRange.f1, activeRange.f2);
    const t1 = winStart + lo * windowMs;
    const t2 = winStart + hi * windowMs;
    return {
      t1, t2, x1: lo * W, x2: hi * W,
      deltas: seriesData.map((s) => {
        const p1 = getValAt(s, t1), p2 = getValAt(s, t2);
        return { pEnd: p2, delta: p2 - p1 };
      }),
    };
  })() : null;

  const hover = hoverT == null ? null : (() => {
    const hx = xOf(hoverT);
    const hProbs = seriesData.map((s) => getValAt(s, hoverT));
    return { x: hx, frac: hx / W, probs: hProbs, ys: hProbs.map(yOf), time: hoverT };
  })();

  // Time labels
  const pad2 = (v) => String(v).padStart(2, "0");
  const MONTHS_SHORT = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const fmtX = (d) => {
    if (range === "1H" || range === "6H" || range === "1D")
      return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
  };
  const fmtTip = (d) => {
    const mon = MONTHS_SHORT[d.getMonth()];
    const day = d.getDate();
    const h = d.getHours(), m = pad2(d.getMinutes());
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${mon} ${day}, ${h12}:${m} ${ampm}`;
  };

  const labelStepMs = range === "ALL"
    ? (windowMs > 60 * 86400_000 ? 30 * 86400_000 : windowMs > 14 * 86400_000 ? 7 * 86400_000 : 86400_000)
    : MC_LABEL_STEP[range];
  const firstT = Math.ceil(winStart / labelStepMs) * labelStepMs;
  const rawXLabels = [];
  for (let t = firstT; t <= liveNow + labelStepMs * 0.1; t += labelStepMs) {
    const frac = (t - winStart) / windowMs;
    if (frac >= 0 && frac <= 1) rawXLabels.push({ t, leftPct: frac * 100 });
  }
  // Thin out X labels so they don't overlap — keep every Nth label on mobile
  const xLabels = (() => {
    if (rawXLabels.length <= 1) return rawXLabels;
    const avgGap = rawXLabels.length > 1 ? (rawXLabels[rawXLabels.length - 1].leftPct - rawXLabels[0].leftPct) / (rawXLabels.length - 1) : 100;
    const minGap = isMobile ? 14 : 8;
    if (avgGap >= minGap) return rawXLabels;
    const step = Math.ceil(minGap / avgGap);
    return rawXLabels.filter((_, i) => i % step === 0);
  })();

  // End label collision avoidance — big enough gap so 24px number doesn't cover neighbor's name
  const labelH = 52;
  const endItems = answers.map((a, i) => ({
    idx: i,
    label: a.answerLabel.length > 16 ? a.answerLabel.slice(0, 15) + "…" : a.answerLabel,
    prob: lastProbs[i],
    y: yOf(lastProbs[i]),
    theme: getOptionTheme(i, answers.length),
  }));
  const sortedEnd = [...endItems].sort((a, b) => a.y - b.y);
  for (let i = 1; i < sortedEnd.length; i++) {
    if (sortedEnd[i].y - sortedEnd[i - 1].y < labelH) {
      sortedEnd[i].y = sortedEnd[i - 1].y + labelH;
    }
  }
  sortedEnd.forEach(s => { s.y = Math.max(0, Math.min(CHART_H - labelH, s.y - labelH / 2)); });

  return (
    <div style={{ userSelect: "none", WebkitUserSelect: "none" }}>
      <style>{`
        @keyframes mcPulse2{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.7}50%{transform:translate(-50%,-50%) scale(2.2);opacity:0}}
      `}</style>

      {/* Range selector */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "flex-end",
        marginBottom: "12px",
      }}>
        <div style={{ display: "flex", gap: "0" }}>
          {MC_RANGES.map((r) => (
            <button key={r}
              onClick={() => { setRange(r); setHoverT(null); }}
              style={{
                padding: "5px 10px", border: "none", cursor: "pointer",
                font: `700 11px ${FONT_BODY}`, letterSpacing: ".02em",
                background: "transparent",
                color: r === range ? "#ffffff" : "rgba(255,255,255,0.3)",
                transition: "color .15s",
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div style={{ display: "flex", position: "relative" }}>
        <div
          style={{ flex: 1, minWidth: 0, position: "relative", touchAction: "none", cursor: "crosshair" }}
          ref={chartRef}
          onMouseMove={onMove}
          onMouseDown={onDown}
          onMouseLeave={onLeave}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
        >
          <svg
            viewBox={`0 0 ${W} ${CHART_H}`}
            preserveAspectRatio="none"
            style={{ width: "100%", height: isMobile ? "200px" : "260px", display: "block", overflow: "visible" }}
          >
            {/* Range highlight */}
            {rangeInfo && (
              <rect x={rangeInfo.x1} y="0" width={rangeInfo.x2 - rangeInfo.x1} height={CHART_H}
                fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
            )}

            {/* Grid */}
            {Y_TICKS.map((tick) => (
              <line key={tick} x1="0" y1={yOf(tick)} x2={W} y2={yOf(tick)}
                stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            ))}

            <defs>
              {hover && (
                <clipPath id="mc-left-clip">
                  <rect x="0" y="0" width={hover.x} height={CHART_H} />
                </clipPath>
              )}
              {rangeInfo && (
                <clipPath id="mc-range-clip">
                  <rect x={rangeInfo.x1} y="0" width={rangeInfo.x2 - rangeInfo.x1} height={CHART_H} />
                </clipPath>
              )}
            </defs>

            {/* Lines */}
            {paths.map((p, i) => {
              const theme = getOptionTheme(i, answers.length);
              const isSel = i === selectedIdx;
              const sw = isSel ? 2.8 : 2;
              const isGreyed = hover || !!rangeInfo;
              const clipId = hover ? "url(#mc-left-clip)" : rangeInfo ? "url(#mc-range-clip)" : undefined;
              return (
                <g key={i} style={{ cursor: "pointer" }} onClick={() => onSelectIdx(i)}>
                  <path d={p.d} fill="none" strokeLinejoin="round"
                    stroke={isGreyed ? "rgba(255,255,255,0.12)" : theme.color}
                    strokeWidth={sw} strokeOpacity={isGreyed ? 1 : isSel ? 1 : 0.7} />
                  {clipId && (
                    <path d={p.d} fill="none" strokeLinejoin="round"
                      stroke={theme.color} strokeWidth={sw + 0.5}
                      strokeOpacity={isSel ? 1 : 0.85} clipPath={clipId} />
                  )}
                </g>
              );
            })}

            {/* Hover crosshair */}
            {hover && (
              <line x1={hover.x} y1="0" x2={hover.x} y2={CHART_H}
                stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="4 4" />
            )}
          </svg>

          {/* Pulsing end dots */}
          {!hover && !rangeInfo && paths.map((p, i) => {
            const theme = getOptionTheme(i, answers.length);
            if (!p.last) return null;
            const leftPct = (p.last[0] / W) * 100;
            const topPct = (p.last[1] / CHART_H) * 100;
            return (
              <div key={`mc-pulse-${i}`} style={{
                position: "absolute", left: `${leftPct}%`, top: `${topPct}%`,
                transform: "translate(-50%, -50%)", pointerEvents: "none",
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: theme.color }} />
                <div style={{
                  position: "absolute", top: "50%", left: "50%",
                  width: 8, height: 8, borderRadius: "50%",
                  border: `2px solid ${theme.color}`,
                  animation: "mcPulse2 2s infinite",
                }} />
              </div>
            );
          })}

          {/* Hover dots */}
          {hover && hover.probs.map((prob, i) => {
            const theme = getOptionTheme(i, answers.length);
            return (
              <div key={`hdot-${i}`} style={{
                position: "absolute",
                left: `${(hover.x / W) * 100}%`,
                top: `${(hover.ys[i] / CHART_H) * 100}%`,
                transform: "translate(-50%, -50%)",
                width: i === selectedIdx ? 10 : 8,
                height: i === selectedIdx ? 10 : 8,
                borderRadius: "50%",
                background: "#0e121d",
                border: `2.5px solid ${theme.color}`,
                pointerEvents: "none",
              }} />
            );
          })}

          {/* Hover tooltip */}
          {hover && (
            <div style={{
              position: "absolute", top: -24,
              left: hover.frac > 0.6 ? "auto" : `${(hover.x / W) * 100}%`,
              right: hover.frac > 0.6 ? `${(1 - hover.x / W) * 100}%` : "auto",
              transform: hover.frac > 0.6 ? "none" : "translateX(-50%)",
              font: `600 12px ${FONT_BODY}`, color: "#8ca0b6",
              whiteSpace: "nowrap", pointerEvents: "none",
              background: "rgba(14,18,29,0.85)", padding: "3px 8px",
              borderRadius: "6px", zIndex: 20,
            }}>
              {fmtTip(new Date(hover.time))}
            </div>
          )}

          {/* Range date + close button */}
          {rangeInfo && !dragState && (() => {
            const midPct = ((rangeInfo.x1 + rangeInfo.x2) / 2 / W) * 100;
            return (
              <div style={{
                position: "absolute", top: "-24px",
                left: `${midPct}%`, transform: "translateX(-50%)",
                display: "flex", alignItems: "center", gap: "6px",
                pointerEvents: "auto", zIndex: 20,
                background: "rgba(14,18,29,0.85)", padding: "3px 8px",
                borderRadius: "6px", whiteSpace: "nowrap",
              }}>
                <span style={{ font: `600 12px ${FONT_BODY}`, color: "#8ca0b6" }}>
                  {new Date(rangeInfo.t1).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  {" – "}
                  {new Date(rangeInfo.t2).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <button onClick={() => { setRangeSelect(null); setDragState(null); }}
                  style={{ background: "none", border: "none", color: "#5d7189",
                    font: `700 12px ${FONT_BODY}`, cursor: "pointer", padding: "0 2px", lineHeight: 1 }}>
                  ✕
                </button>
              </div>
            );
          })()}

          {/* Labels — follow hover/range or stick to end */}
          {(() => {
            const useRange = rangeInfo && !hover;
            // Compute probs and position
            const probs = hover
              ? hover.probs
              : useRange
                ? rangeInfo.deltas.map(d => d.pEnd)
                : lastProbs;
            const yPositions = probs.map(p => yOf(p));

            // Collision avoidance
            const items = answers.map((a, i) => ({
              idx: i, y: yPositions[i],
              label: a.answerLabel.length > 16 ? a.answerLabel.slice(0, 15) + "…" : a.answerLabel,
              theme: getOptionTheme(i, answers.length),
            }));
            const sorted = [...items].sort((a, b) => a.y - b.y);
            const lblH = 56;
            for (let i = 1; i < sorted.length; i++) {
              if (sorted[i].y - sorted[i - 1].y < lblH) sorted[i].y = sorted[i - 1].y + lblH;
            }
            sorted.forEach(s => { s.y = Math.max(0, Math.min(CHART_H - lblH, s.y - lblH / 2)); });

            // Left position
            const leftPos = hover
              ? `calc(${(hover.x / W) * 100}% + 14px)`
              : useRange
                ? `calc(${(rangeInfo.x2 / W) * 100}% + 14px)`
                : undefined; // right-aligned

            return items.map((item) => {
              const adj = sorted.find(s => s.idx === item.idx);
              const yPos = adj ? adj.y : item.y;
              const prob = probs[item.idx];
              const pctStr = prob >= 0.01 ? `${Math.round(prob * 100)}%` : `${(prob * 100).toFixed(1)}%`;
              const delta = useRange ? rangeInfo.deltas[item.idx].delta : null;
              const deltaPct = delta != null ? Math.round(delta * 1000) / 10 : null;
              return (
                <div key={item.idx} style={{
                  position: "absolute",
                  ...(leftPos
                    ? { left: leftPos }
                    : { right: 0, transform: "translateX(calc(100% + 14px))" }),
                  top: `${(yPos / CHART_H) * 100}%`,
                  whiteSpace: "nowrap", pointerEvents: "none", zIndex: 5,
                  transition: hover ? "none" : "top 0.3s ease, left 0.3s ease",
                }}>
                  <div style={{ font: `600 12px ${FONT_BODY}`, color: item.theme.color, lineHeight: 1.2 }}>
                    {item.label}
                  </div>
                  <div style={{ font: `800 24px ${FONT_HEAD}`, color: item.theme.color, lineHeight: 1.1 }}>
                    {pctStr}
                  </div>
                  {deltaPct != null && (
                    <div style={{
                      font: `700 11px ${FONT_BODY}`,
                      color: deltaPct >= 0 ? "rgba(255,255,255,0.9)" : "#ff6b7a",
                    }}>
                      {deltaPct >= 0 ? "▲" : "▼"} {Math.abs(deltaPct)}%
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>

        {/* Y-axis */}
        <div style={{
          flexShrink: 0, width: "44px",
          height: isMobile ? "200px" : "260px",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          paddingLeft: "10px",
          marginLeft: isMobile ? "60px" : "80px",
        }}>
          {Y_TICKS.map((tick) => (
            <span key={tick} style={{
              font: `500 11px ${FONT_BODY}`,
              color: "rgba(255,255,255,0.28)",
              lineHeight: 1,
            }}>
              {Math.round(tick * 100)}%
            </span>
          ))}
        </div>
      </div>

      {/* X-axis */}
      <div style={{
        position: "relative", height: "22px", marginTop: "8px",
        marginRight: isMobile ? "104px" : "124px",
      }}>
        {xLabels.map(({ t, leftPct }) => (
          <span key={t} style={{
            position: "absolute", left: `${leftPct}%`,
            transform: "translateX(-50%)",
            font: `500 11px ${FONT_BODY}`, color: "rgba(255,255,255,0.3)",
            whiteSpace: "nowrap",
          }}>
            {fmtX(new Date(t))}
          </span>
        ))}
      </div>

    </div>
  );
}

// ─── sell helpers ─────────────────────────────────────────────────────────────
function buildMCSaleSuccessMessage(data) {
  const dust = Number(data?.dust) || 0;
  const netProceeds = Number(data?.netProceeds ?? data?.saleValue) || 0;
  const base = `Sale successful! Sold ${data.sharesSold} shares and credited ${netProceeds} credits.`;
  if (dust <= 0) return base;
  return `${base} Dust assessed: ${dust} credit${dust === 1 ? "" : "s"} retained by the market due to whole-share rounding.`;
}

function MCNormalizeShares(data) {
  if (!data) return { yesSharesOwned: 0, value: 0 };
  if (Array.isArray(data)) return MCNormalizeShares(data[0]);
  return {
    yesSharesOwned: data.yesSharesOwned ?? data.YesSharesOwned ?? 0,
    value: data.value ?? data.Value ?? 0,
  };
}

function MCSellQuotePanel({ quote, quoteError, isLoading, onSelectAmount }) {
  const { t } = useTranslation();
  if (isLoading)
    return (
      <div
        style={{
          padding: "10px 12px",
          borderRadius: "10px",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.04)",
          font: `500 12px ${FONT_BODY}`,
          color: MUTED2,
        }}
      >
        Calculating sale preview...
      </div>
    );
  if (quoteError)
    return (
      <div
        style={{
          background: "rgba(251,91,107,0.12)",
          border: "1px solid rgba(251,91,107,0.3)",
          borderRadius: "8px",
          padding: "10px 12px",
          font: `500 12px ${FONT_BODY}`,
          color: "#fb8b96",
        }}
      >
        {quoteError}
      </div>
    );
  if (!quote) return null;

  const panelColor = quote.allowed
    ? { border: "rgba(186,214,89,0.3)", bg: "rgba(186,214,89,0.07)" }
    : { border: "rgba(255,193,7,0.35)", bg: "rgba(255,193,7,0.07)" };

  return (
    <div
      style={{
        borderRadius: "10px",
        border: `1px solid ${panelColor.border}`,
        background: panelColor.bg,
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ font: `700 13px ${FONT_BODY}`, color: TEXT }}>
          Sale Preview
        </span>
        <span
          style={{
            font: `600 11px ${FONT_BODY}`,
            color: quote.allowed ? "#C6E06C" : "#ffc107",
            background: "rgba(255,255,255,0.07)",
            borderRadius: "6px",
            padding: "2px 8px",
          }}
        >
          {quote.allowed ? "Allowed" : "Adjust amount"}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          font: `600 12px ${FONT_BODY}`,
        }}
      >
        <span style={{ color: MUTED2 }}>Sale order</span>
        <span style={{ color: TEXT }}>{quote.requestedCredits}</span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          font: `600 12px ${FONT_BODY}`,
        }}
      >
        <span style={{ color: MUTED2 }}>Credits received</span>
        <span style={{ color: "#C6E06C" }}>
          {quote.netProceeds ?? quote.saleValue}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          font: `600 12px ${FONT_BODY}`,
        }}
      >
        <span style={{ color: MUTED2 }}>{t('marketDetails.sharesSold')}</span>
        <span style={{ color: TEXT }}>{quote.sharesSold}</span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          font: `600 12px ${FONT_BODY}`,
        }}
      >
        <span style={{ color: MUTED2 }}>Value per share</span>
        <span style={{ color: TEXT }}>{quote.valuePerShare}</span>
      </div>
      {quote.message && (
        <div style={{ font: `500 11px ${FONT_BODY}`, color: MUTED2 }}>
          {quote.message}
        </div>
      )}
      {!quote.allowed && quote.suggestedAmounts?.length > 0 && (
        <div>
          <div
            style={{
              font: `600 11px ${FONT_BODY}`,
              color: MUTED2,
              marginBottom: "6px",
            }}
          >
            TRY A VALID AMOUNT
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {quote.suggestedAmounts.map((s) => (
              <button
                key={s}
                onClick={() => onSelectAmount(s)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: "rgba(255,255,255,0.10)",
                  border: "none",
                  color: TEXT,
                  font: `600 12px ${FONT_BODY}`,
                  cursor: "pointer",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MCYesNoButton({ label, active, onClick }) {
  const isYes = label === "YES";
  const accentText = isYes ? "#C6E06C" : "#fb8b96";

  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "11px 16px",
        cursor: "pointer",
        font: `700 14px ${FONT_BODY}`,
        transition: "all .15s",
        border: "none",
        borderRadius: "999px",
        background: active
          ? isYes
            ? "linear-gradient(180deg,#BAD659,#AABA49)"
            : "linear-gradient(180deg,#fb5b6b,#e11d48)"
          : isYes
            ? "rgba(186,214,89,0.08)"
            : "rgba(244,63,94,0.08)",
        color: active ? "#000" : accentText,
      }}
    >
      {label}
    </button>
  );
}

// ─── Multi-choice trade panel ─────────────────────────────────────────────────
function MultiChoiceTradePanel({
  answers,
  selectedIdx,
  onSelectIdx,
  token,
  isLoggedIn,
  isMarketOpen,
  onSuccess,
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const { login } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [tab, setTab] = useState("buy");
  const [buyOutcome, setBuyOutcome] = useState("YES");
  const [amount, setAmount] = useState(10);
  const [projection, setProjection] = useState(null);
  const [projLoading, setProjLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const debounceRef = useRef(null);

  // sell state
  const [sellShares, setSellShares] = useState({ yesSharesOwned: 0, value: 0 });
  const [sellSharesLoading, setSellSharesLoading] = useState(false);
  const [sellAmount, setSellAmount] = useState(1);
  const [saleQuote, setSaleQuote] = useState(null);
  const [quoteError, setQuoteError] = useState("");
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [isSellSubmitting, setIsSellSubmitting] = useState(false);

  const selectedAnswer = answers[selectedIdx];
  const currentProb = selectedAnswer ? getAnswerProb(selectedAnswer) : 0.5;
  const priceCents = Math.round(currentProb * 100);

  // Fetch projection on answer or amount change
  useEffect(() => {
    if (!selectedAnswer || !amount || amount < 1) {
      setProjection(null);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setProjLoading(true);
      try {
        const res = await fetch(
          `${API_URL}/v0/marketprojection/${selectedAnswer.marketId}/${amount}/${buyOutcome}/`,
        );
        if (res.ok) setProjection(await res.json());
        else setProjection(null);
      } catch {
        setProjection(null);
      } finally {
        setProjLoading(false);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [selectedIdx, amount, buyOutcome, selectedAnswer]);

  // Load shares for selected answer when switching to sell tab
  useEffect(() => {
    if (tab !== "sell" || !token || !selectedAnswer) {
      setSellShares({ yesSharesOwned: 0, value: 0 });
      setSaleQuote(null);
      setQuoteError("");
      return;
    }
    setSellSharesLoading(true);
    fetchUserShares(selectedAnswer.marketId, token)
      .then((data) => {
        setSellShares(MCNormalizeShares(data));
        setSellAmount(Math.max(1, Number(MCNormalizeShares(data).value) || 1));
        setSaleQuote(null);
        setQuoteError("");
      })
      .catch(() => {
        setSellShares({ yesSharesOwned: 0, value: 0 });
      })
      .finally(() => setSellSharesLoading(false));
  }, [tab, selectedIdx, selectedAnswer, token]);

  const handleRequestQuote = () => {
    if (!selectedAnswer) return;
    setIsQuoteLoading(true);
    setQuoteError("");
    fetchSaleQuote(
      { marketId: selectedAnswer.marketId, outcome: "YES", amount: sellAmount },
      token,
    )
      .then((q) => setSaleQuote(q))
      .catch((err) => {
        setSaleQuote(null);
        setQuoteError(err.message);
      })
      .finally(() => setIsQuoteLoading(false));
  };

  const handleSell = () => {
    if (!selectedAnswer) return;
    setIsSellSubmitting(true);
    const saleData = {
      marketId: selectedAnswer.marketId,
      outcome: "YES",
      amount: sellAmount,
    };
    fetchSaleQuote(saleData, token)
      .then((quote) => {
        setSaleQuote(quote);
        if (!quote.allowed) {
          toast.error(quote.message || "Sale not allowed. Try a different amount.");
          setIsSellSubmitting(false);
          return;
        }
        submitSale(
          saleData,
          token,
          (data) => {
            toast.success(buildMCSaleSuccessMessage(data));
            setSellShares({ yesSharesOwned: 0, value: 0 });
            setSellAmount(1);
            setSaleQuote(null);
            setIsSellSubmitting(false);
            window.dispatchEvent(new Event(USER_CREDIT_REFRESH_EVENT));
            onSuccess?.();
          },
          (err) => {
            toast.error(`Sale failed: ${err.message}`);
            setIsSellSubmitting(false);
          },
        );
      })
      .catch((err) => {
        toast.error(`Sale quote failed: ${err.message}`);
        setIsSellSubmitting(false);
      });
  };

  const handleSelect = (idx) => {
    onSelectIdx(idx);
    setProjection(null);
    setError("");
    setSuccess("");
    setSaleQuote(null);
    setQuoteError("");
  };

  const handleBuy = () => {
    if (!selectedAnswer) return;
    setError("");
    setSuccess("");
    setSubmitting(true);
    submitBet(
      { marketId: selectedAnswer.marketId, amount, outcome: buyOutcome },
      token,
      (data) => {
        setSubmitting(false);
        setSuccess(
          `Bet placed! $${data.amount || amount} on ${selectedAnswer.answerLabel}.`,
        );
        window.dispatchEvent(new Event(USER_CREDIT_REFRESH_EVENT));
        onSuccess?.();
      },
      (err) => {
        setSubmitting(false);
        setError(err.message || "Error placing bet.");
      },
    );
  };

  const selectedTheme = getOptionTheme(selectedIdx, answers.length);

  // Stats — adjust for YES vs NO
  const outcomeProb = buyOutcome === "YES" ? currentProb : 1 - currentProb;
  const priceCentsOutcome = Math.round(outcomeProb * 100);
  const shares =
    amount > 0 && outcomeProb > 0 ? (amount / outcomeProb).toFixed(2) : "—";
  const potReturn =
    amount > 0 && outcomeProb > 0 ? (amount / outcomeProb).toFixed(2) : "—";

  if (!isLoggedIn) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {answers.map((a, i) => (
          <OptionRow
            key={a.marketId || i}
            answer={a}
            index={i}
            total={answers.length}
            selected={false}
            onClick={() => {}}
          />
        ))}
        <div
          onClick={() => setIsLoginModalOpen(true)}
          style={{
            marginTop: "8px",
            padding: "18px 16px",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            textAlign: "center",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              font: `700 14px ${FONT_BODY}`,
              color: TEXT,
              marginBottom: "4px",
            }}
          >
            Sign in to trade
          </div>
          <div style={{ font: `500 12px ${FONT_BODY}`, color: MUTED3 }}>
            You need an account to participate
          </div>
        </div>
        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLogin={login} onForgotPassword={() => { setIsLoginModalOpen(false); setIsForgotPasswordOpen(true); }} />
        <ForgotPasswordModal isOpen={isForgotPasswordOpen} onClose={() => setIsForgotPasswordOpen(false)} onSwitchToLogin={() => { setIsForgotPasswordOpen(false); setIsLoginModalOpen(true); }} />
      </div>
    );
  }

  if (!isMarketOpen) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {answers.map((a, i) => (
          <OptionRow
            key={a.marketId || i}
            answer={a}
            index={i}
            total={answers.length}
            selected={false}
            onClick={() => {}}
          />
        ))}
        <div
          style={{
            marginTop: "8px",
            padding: "16px",
            borderRadius: "14px",
            background: "rgba(255,193,7,0.07)",
            border: "1px solid rgba(255,193,7,0.22)",
            textAlign: "center",
            font: `600 13px ${FONT_BODY}`,
            color: "#ffc107",
          }}
        >
          Market closed — awaiting resolution
        </div>
      </div>
    );
  }

  const maxSellCredits = Math.max(0, Number(sellShares.value) || 0);
  const isSellActionDisabled =
    sellSharesLoading || isSellSubmitting || isQuoteLoading;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {/* Option rows */}
      {answers.map((a, i) => (
        <OptionRow
          key={a.marketId || i}
          answer={a}
          index={i}
          total={answers.length}
          selected={selectedIdx === i}
          onClick={() => handleSelect(i)}
        />
      ))}

      {/* Buy / Sell tab bar */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          marginTop: "10px",
        }}
      >
        {[
          ["buy", t('marketDetails.buy')],
          ["sell", t('marketDetails.sell')],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "none",
              cursor: "pointer",
              background: "transparent",
              font: `700 13px ${FONT_BODY}`,
              color: tab === key ? TEXT : MUTED2,
              transition: "color .15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "buy" ? (
        <>
          {/* YES / NO toggle */}
          <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
            {["YES", "NO"].map((o) => (
              <MCYesNoButton
                key={o}
                label={o}
                active={buyOutcome === o}
                onClick={() => setBuyOutcome(o)}
              />
            ))}
          </div>

          <div style={{ marginTop: "10px" }}>
            <div
              style={{
                font: `600 12px ${FONT_BODY}`,
                color: MUTED2,
                marginBottom: "7px",
              }}
            >
              {t('marketDetails.amount')}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "rgba(0,0,0,0.28)",
                borderRadius: "999px",
                padding: "4px 10px",
              }}
            >
              <button
                onClick={() =>
                  setAmount((v) => clamp((parseInt(v) || 0) - 10, 1, 99999))
                }
                style={{
                  width: "34px",
                  height: "34px",
                  border: "none",
                  background: "transparent",
                  color: MUTED,
                  font: `700 20px ${FONT_BODY}`,
                  cursor: "pointer",
                }}
              >
                −
              </button>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "2px",
                }}
              >
                <span style={{ font: `700 17px ${FONT_BODY}`, color: MUTED }}>
                  $
                </span>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setAmount(isNaN(v) ? "" : v);
                  }}
                  style={{
                    width: "72px",
                    background: "transparent",
                    border: "none",
                    color: TEXT,
                    font: `800 22px ${FONT_HEAD}`,
                    textAlign: "center",
                    outline: "none",
                    MozAppearance: "textfield",
                  }}
                />
              </div>
              <button
                onClick={() => setAmount((v) => (parseInt(v) || 0) + 10)}
                style={{
                  width: "34px",
                  height: "34px",
                  border: "none",
                  background: "transparent",
                  color: MUTED,
                  font: `700 20px ${FONT_BODY}`,
                  cursor: "pointer",
                }}
              >
                +
              </button>
            </div>
            <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setAmount((v) => (parseInt(v) || 0) + p)}
                  style={{
                    flex: 1,
                    padding: "7px 0",
                    borderRadius: "999px",
                    border: "none",
                    background: "rgba(255,255,255,0.06)",
                    color: "#b7c6d6",
                    font: `700 12px ${FONT_BODY}`,
                    cursor: "pointer",
                  }}
                >
                  +{p}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.08)",
              paddingTop: "12px",
              marginTop: "4px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <StatRow label={t('marketDetails.avgPrice')} value={`${priceCentsOutcome}¢`} />
            <StatRow
              label={t('marketDetails.newProbability')}
              value={
                projLoading
                  ? "..."
                  : projection?.projectedProbability != null
                    ? `${Math.round(projection.projectedProbability * 100)}%`
                    : "—"
              }
            />
            <StatRow label={t('marketDetails.shares')} value={shares} />
            <StatRow
              label={t('marketDetails.potentialReturn')}
              value={potReturn !== "—" ? `$${potReturn}` : "—"}
              valueColor={YES_TEXT}
            />
          </div>

          {error && (
            <div
              style={{
                background: "rgba(251,91,107,0.12)",
                border: "1px solid rgba(251,91,107,0.3)",
                borderRadius: "8px",
                padding: "10px 12px",
                font: `500 12px ${FONT_BODY}`,
                color: NO_TEXT,
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              style={{
                background: "rgba(186,214,89,0.12)",
                border: "1px solid rgba(186,214,89,0.3)",
                borderRadius: "8px",
                padding: "10px 12px",
                font: `600 13px ${FONT_BODY}`,
                color: YES_TEXT,
              }}
            >
              {success}
            </div>
          )}

          <button
            onClick={handleBuy}
            disabled={submitting || !amount || amount < 1}
            style={{
              position: "relative",
              width: "100%",
              padding: "15px 20px",
              borderRadius: "999px",
              border: "none",
              font: `800 15px ${FONT_HEAD}`,
              letterSpacing: ".01em",
              cursor: submitting || !amount ? "not-allowed" : "pointer",
              background:
                submitting || !amount
                  ? "rgba(255,255,255,0.06)"
                  : "linear-gradient(135deg, #9cc9f1 0%, #6aabde 100%)",
              color:
                submitting || !amount
                  ? MUTED2
                  : "#0a1628",
              marginTop: "4px",
              opacity: submitting ? 0.7 : 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              animation: submitting || !amount ? "none" : "gp-mcBrandPulse 3s ease-in-out infinite",
            }}
            title={submitting ? undefined : `${t('marketDetails.buy')} ${buyOutcome} — ${selectedAnswer?.answerLabel || "Option"}`}
            onMouseEnter={(e) => { if (!(submitting || !amount)) e.currentTarget.style.filter = "brightness(0.9)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = ""; }}
          >
            {submitting
              ? t('marketDetails.processing')
              : `${t('marketDetails.buy')} ${buyOutcome} — ${selectedAnswer?.answerLabel || "Option"}`}
          </button>
        </>
      ) : (
        /* ── SELL TAB ── */
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "10px",
          }}
        >
          {!selectedAnswer ? (
            <div
              style={{
                textAlign: "center",
                font: `500 13px ${FONT_BODY}`,
                color: MUTED2,
                padding: "16px 0",
              }}
            >
              {t('marketDetails.selectOption')}
            </div>
          ) : sellSharesLoading ? (
            <div
              style={{
                textAlign: "center",
                font: `500 13px ${FONT_BODY}`,
                color: MUTED2,
                padding: "16px 0",
              }}
            >
              {t('marketDetails.loadingPositions')}
            </div>
          ) : sellShares.yesSharesOwned < 1 ? (
            <div
              style={{
                textAlign: "center",
                font: `500 13px ${FONT_BODY}`,
                color: MUTED2,
                padding: "16px 0",
              }}
            >
              {t('marketDetails.noShares', { label: selectedAnswer.answerLabel })}
            </div>
          ) : (
            <>
              {/* Shares badge */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    padding: "8px 16px",
                    borderRadius: "10px",
                    background: "rgba(186,214,89,0.12)",
                    border: "1px solid rgba(186,214,89,0.3)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      font: `700 11px ${FONT_BODY}`,
                      color: YES_TEXT,
                      letterSpacing: ".06em",
                    }}
                  >
                    {selectedAnswer.answerLabel}
                  </div>
                  <div style={{ font: `800 18px ${FONT_HEAD}`, color: TEXT }}>
                    {t('marketDetails.sharesCount', { count: sellShares.yesSharesOwned })}
                  </div>
                  <div style={{ font: `600 12px ${FONT_BODY}`, color: MUTED2 }}>
                    {t('marketDetails.value', { value: sellShares.value })}
                  </div>
                </div>
              </div>

              {/* Sale order input */}
              <div>
                <div
                  style={{
                    font: `600 12px ${FONT_BODY}`,
                    color: MUTED2,
                    marginBottom: "7px",
                  }}
                >
                  {t('marketDetails.saleOrder')}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "rgba(0,0,0,0.28)",
                    borderRadius: "999px",
                    padding: "4px 10px",
                  }}
                >
                  <button
                    onClick={() =>
                      setSellAmount((v) => Math.max(1, (parseInt(v) || 0) - 1))
                    }
                    style={{
                      width: "34px",
                      height: "34px",
                      border: "none",
                      background: "transparent",
                      color: MUTED,
                      font: `700 20px ${FONT_BODY}`,
                      cursor: "pointer",
                    }}
                  >
                    −
                  </button>
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "2px",
                    }}
                  >
                    <span
                      style={{ font: `700 17px ${FONT_BODY}`, color: MUTED }}
                    >
                      $
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={sellAmount}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10) || 0;
                        setSaleQuote(null);
                        setQuoteError("");
                        setSellAmount(
                          maxSellCredits > 0 ? Math.min(v, maxSellCredits) : v,
                        );
                      }}
                      style={{
                        width: "72px",
                        background: "transparent",
                        border: "none",
                        color: TEXT,
                        font: `800 22px ${FONT_HEAD}`,
                        textAlign: "center",
                        outline: "none",
                        MozAppearance: "textfield",
                      }}
                    />
                  </div>
                  <button
                    onClick={() =>
                      setSellAmount((v) =>
                        maxSellCredits > 0
                          ? Math.min((parseInt(v) || 0) + 1, maxSellCredits)
                          : (parseInt(v) || 0) + 1,
                      )
                    }
                    style={{
                      width: "34px",
                      height: "34px",
                      border: "none",
                      background: "transparent",
                      color: MUTED,
                      font: `700 20px ${FONT_BODY}`,
                      cursor: "pointer",
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              <MCSellQuotePanel
                quote={saleQuote}
                quoteError={quoteError}
                isLoading={isQuoteLoading}
                onSelectAmount={(a) => {
                  setSellAmount(a);
                  setSaleQuote(null);
                }}
              />

              {/* Action buttons */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  borderRadius: "28px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  padding: "10px",
                }}
              >
                <button
                  onClick={handleSell}
                  disabled={isSellActionDisabled}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "999px",
                    border: "none",
                    font: `800 16px ${FONT_HEAD}`,
                    cursor: isSellActionDisabled ? "not-allowed" : "pointer",
                    background: isSellActionDisabled
                      ? "rgba(255,255,255,0.08)"
                      : "linear-gradient(180deg,#BAD659,#AABA49)",
                    color: isSellActionDisabled ? MUTED2 : "#1a1a00",
                    boxShadow: isSellActionDisabled
                      ? "none"
                      : "0 8px 22px rgba(186,214,89,0.28)",
                    transition: "all .15s",
                    opacity: isSellSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSellSubmitting
                    ? t('marketDetails.processing')
                    : t('marketDetails.confirmSale', { label: selectedAnswer.answerLabel })}
                </button>
                <button
                  onClick={handleRequestQuote}
                  disabled={isSellActionDisabled}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "999px",
                    border: "1px solid rgba(186,214,89,0.40)",
                    background: "transparent",
                    color: isSellActionDisabled ? MUTED2 : YES_TEXT,
                    font: `700 13px ${FONT_HEAD}`,
                    cursor: isSellActionDisabled ? "not-allowed" : "pointer",
                    opacity: isSellActionDisabled ? 0.5 : 1,
                    transition: "all .15s",
                  }}
                >
                  {isQuoteLoading ? t('marketDetails.loadingTerms') : t('marketDetails.terms')}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function OptionRow({ answer, index, total, selected, onClick }) {
  const prob = getAnswerProb(answer);
  const priceCents = Math.round(prob * 100);
  const theme = getOptionTheme(index, total);

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "13px 20px",
        borderRadius: "999px",
        border: selected
          ? `1px solid ${theme.activeBorder}`
          : `1px solid ${theme.border}`,
        background: selected ? theme.bg : "rgba(255,255,255,0.02)",
        cursor: "pointer",
        transition: "all .2s cubic-bezier(.4,0,.2,1)",
        textAlign: "left",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden", minWidth: 0, flex: 1 }}>
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: theme.color,
            flexShrink: 0,
          }}
        />
        <span
          title={answer.answerLabel}
          style={{
            font: `600 14px ${FONT_BODY}`,
            color: selected ? theme.text : TEXT,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
          }}
        >
          {answer.answerLabel}
        </span>
      </div>
      <span
        style={{
          font: `700 14px ${FONT_HEAD}`,
          color: selected ? theme.color : TEXT,
        }}
      >
        {priceCents}¢
      </span>
    </button>
  );
}

// ─── Country code mapping for team flags ────────────────────────────────────
const TEAM_COUNTRY_CODE = {
  argentina: "ar", brazil: "br", mexico: "mx", "united states": "us", usa: "us",
  germany: "de", netherlands: "nl", spain: "es", france: "fr", colombia: "co",
  uruguay: "uy", england: "gb-eng", portugal: "pt", italy: "it", japan: "jp",
  "south korea": "kr", australia: "au", canada: "ca", croatia: "hr", belgium: "be",
  morocco: "ma", senegal: "sn", switzerland: "ch", denmark: "dk", poland: "pl",
  sweden: "se", norway: "no", chile: "cl", peru: "pe", ecuador: "ec",
  paraguay: "py", bolivia: "bo", venezuela: "ve", "costa rica": "cr",
  panama: "pa", honduras: "hn", jamaica: "jm", qatar: "qa", "saudi arabia": "sa",
  iran: "ir", "czech republic": "cz", czechia: "cz", austria: "at", turkey: "tr",
  wales: "gb-wls", scotland: "gb-sct", ireland: "ie", iceland: "is",
  serbia: "rs", ukraine: "ua", romania: "ro", ghana: "gh", nigeria: "ng",
  cameroon: "cm", egypt: "eg", tunisia: "tn", algeria: "dz",
  "new zealand": "nz", china: "cn", india: "in", russia: "ru",
  hungary: "hu", greece: "gr", slovakia: "sk", slovenia: "si",
  "bosnia and herzegovina": "ba", albania: "al", montenegro: "me",
  "north macedonia": "mk", finland: "fi", draw: null,
};

function getCountryCode(teamName) {
  if (!teamName) return null;
  return TEAM_COUNTRY_CODE[teamName.toLowerCase().trim()] || null;
}

function getFlagUrl(code) {
  if (!code) return null;
  return `https://flagcdn.com/w160/${code}.png`;
}

// ─── Seeded random for stable "match day" per market ─────────────────────────
function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getMatchDay(marketId) {
  const base = new Date();
  const offset = Math.floor(seededRandom(marketId || 1) * 14) + 1;
  const d = new Date(base.getTime() + offset * 86400000);
  return d;
}

// ─── Match Banner ────────────────────────────────────────────────────────────
function parseMatchTeams(title, answers) {
  // Try "X vs Y" pattern from title
  const vsMatch = title?.match(/^(.+?)\s+vs\.?\s+(.+)$/i);
  if (vsMatch) return [vsMatch[1].trim(), vsMatch[2].trim()];

  // Fallback: use first two non-Draw answers
  if (Array.isArray(answers)) {
    const teams = answers
      .map((a) => a.answerLabel || a.market?.yesLabel || a.label)
      .filter((l) => l && l.toLowerCase() !== "draw");
    if (teams.length >= 2) return [teams[0], teams[1]];
  }
  return null;
}

function MatchBanner({ title, answers, marketId, isMobile }) {
  const teams = parseMatchTeams(title, answers);
  if (!teams) return null;

  const [teamA, teamB] = teams;
  const codeA = getCountryCode(teamA);
  const codeB = getCountryCode(teamB);

  // Only show banner if at least one team has a flag
  if (!codeA && !codeB) return null;

  const matchDay = getMatchDay(marketId);
  const dayNames = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
  const monthNames = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
  const dayLabel = `${dayNames[matchDay.getDay()]} ${matchDay.getDate()} ${monthNames[matchDay.getMonth()]}`;

  const flagSize = isMobile ? 40 : 48;

  const TeamBadge = ({ name, code, align }) => (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: isMobile ? "8px" : "12px",
      flexDirection: align === "left" ? "row" : "row-reverse",
      flex: "1 1 0px",
      minWidth: 0,
      justifyContent: "center",
    }}>
      {code ? (
        <img
          src={getFlagUrl(code)}
          alt={name}
          style={{
            width: flagSize,
            height: flagSize,
            borderRadius: "50%",
            objectFit: "cover",
            flexShrink: 0,
          }}
        />
      ) : (
        <div style={{
          width: flagSize,
          height: flagSize,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <span style={{ font: `700 ${flagSize * 0.35}px ${FONT_HEAD}`, color: "rgba(255,255,255,0.3)" }}>
            {name.charAt(0)}
          </span>
        </div>
      )}
      <span style={{
        font: `700 ${isMobile ? "13px" : "15px"} ${FONT_BODY}`,
        color: TEXT,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {name}
      </span>
    </div>
  );

  return (
    <div style={{
      ...MARKET_CARD,
      padding: isMobile ? "14px" : "20px 22px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: isMobile ? "16px" : "32px",
    }}>
      <TeamBadge name={teamA} code={codeA} align="left" />

      {/* Date + time */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2px",
        flexShrink: 0,
      }}>
        <span style={{
          font: `600 ${isMobile ? "10px" : "11px"} ${FONT_BODY}`,
          color: MUTED,
          letterSpacing: ".06em",
          textTransform: "uppercase",
        }}>
          {dayLabel}
        </span>
        <span style={{
          font: `600 ${isMobile ? "13px" : "15px"} ${FONT_BODY}`,
          color: TEXT,
        }}>
          16:00
        </span>
      </div>

      <TeamBadge name={teamB} code={codeB} align="right" />
    </div>
  );
}

function StatRow({ label, value, valueColor }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        font: `600 13px ${FONT_BODY}`,
      }}
    >
      <span style={{ color: MUTED }}>{label}</span>
      <span style={{ color: valueColor || TEXT }}>{value}</span>
    </div>
  );
}

// ─── Multi-choice full layout ─────────────────────────────────────────────────
// ─── Shared layout for both binary and multi-choice markets ─────────────────
function MarketLayout({
  title,
  market,
  creatorUsername,
  closesLabel,
  isMarketOpen,
  canResolve,
  marketId,
  token,
  numUsers,
  totalVolume,
  isMobile,
  refreshTrigger,
  onResolved,
  chartContent,
  tradePanelContent,
  loading,
  answers,
  currentProbability,
  probabilityChanges,
}) {
  const { t } = useTranslation();
  const [showShareModal, setShowShareModal] = useState(false);
  const [allTags, setAllTags] = useState([]);

  useEffect(() => {
    listMarketTags().then((res) => {
      const tags = res?.tags || res;
      if (Array.isArray(tags)) setAllTags(tags);
    }).catch(() => {});
  }, []);

  const marketTagSlugs = (market?.tags || []).map((t) => t.slug);

  return (
    <div>
      {/* Breadcrumb */}
      <div
        style={{
          font: `600 12px ${FONT_BODY}`,
          color: MUTED2,
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <Link
          to="/new-markets"
          style={{
            color: COLOR.accent,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.textDecoration = "underline")
          }
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M7.5 2L3.5 6l4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Markets
        </Link>
      </div>

      {/* Resolution alert */}
      <ResolutionAlert
        isResolved={market?.isResolved}
        resolutionResult={market?.resolutionResult}
        market={market}
      />

      {/* ── Header ── */}
      <div style={{ marginBottom: isMobile ? "16px" : "24px" }}>
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "12px",
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                margin: 0,
                font: `800 ${isMobile ? "20px" : "26px"}/1.25 ${FONT_HEAD}`,
                letterSpacing: "-.01em",
                color: TEXT,
                wordBreak: "break-word",
              }}
            >
              {title}
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
            {/* Comment */}
            <button
              style={{ background: "none", border: "none", padding: "4px", cursor: "pointer", display: "flex", opacity: 0.7 }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "0.7"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>
            {/* Share */}
            <button
              onClick={() => setShowShareModal(true)}
              style={{ background: "none", border: "none", padding: "4px", cursor: "pointer", display: "flex", opacity: 0.7 }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "0.7"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </button>
            {/* Bookmark */}
            <button
              style={{ background: "none", border: "none", padding: "4px", cursor: "pointer", display: "flex", opacity: 0.7 }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "0.7"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </button>
            {canResolve && (
              <ResolveModalButton
                marketId={marketId}
                token={token}
                market={market}
                onResolved={onResolved}
                disabled={!token}
              />
            )}
          </div>
        </div>

        {/* Metadata row */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: isMobile ? "12px" : "20px",
          flexWrap: "wrap",
          font: `500 12.5px ${FONT_BODY}`,
          color: MUTED,
        }}>
          <Link to={`/user/${creatorUsername}`} style={{
            color: MUTED, textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: "4px",
          }}
            onMouseEnter={(e) => e.currentTarget.style.color = TEXT}
            onMouseLeave={(e) => e.currentTarget.style.color = MUTED}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            @{creatorUsername}
          </Link>
          <span style={{ opacity: 0.3 }}>·</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            {t('marketDetails.closes')} {closesLabel}
          </span>
          <span style={{ opacity: 0.3 }}>·</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            {fmt(totalVolume)} {t('marketDetails.vol')}
          </span>
          <span style={{ opacity: 0.3 }}>·</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {fmt(numUsers)} {t('marketDetails.traders')}
          </span>
        </div>
      </div>

      {/* ── 3-col layout ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : (!isMobile && allTags.length > 0) ? "200px 1fr 340px" : "1fr 340px",
          gap: isMobile ? "16px" : "28px",
          alignItems: "start",
        }}
      >
        {/* LEFT — tags sidebar (desktop) */}
        {!isMobile && allTags.length > 0 && (
          <div
            style={{
              position: "sticky",
              top: "100px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* All Events link */}
            <Link
              to="/new-markets"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                font: `600 13.5px ${FONT_BODY}`,
                color: TEXT,
                textDecoration: "none",
                borderRadius: "8px",
                transition: "background .15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                {t('filters.allEvents', 'All Events')}
              </span>
            </Link>

            <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", margin: "6px 0" }} />

            {/* Tag list */}
            {allTags.map((tag) => {
              const slug = tag.slug || tag.Slug;
              const name = tag.displayName || tag.DisplayName || slug;
              const isActive = marketTagSlugs.includes(slug);
              return (
                <Link
                  key={slug}
                  to={`/new-markets?league=${encodeURIComponent(name)}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "9px 12px",
                    font: `${isActive ? "600" : "500"} 13px ${FONT_BODY}`,
                    color: isActive ? TEXT : MUTED,
                    textDecoration: "none",
                    borderRadius: "8px",
                    transition: "all .15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    if (!isActive) e.currentTarget.style.color = TEXT;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    if (!isActive) e.currentTarget.style.color = MUTED;
                  }}
                >
                  {name}
                </Link>
              );
            })}
          </div>
        )}

        {/* CENTER */}
        <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "22px" : "30px" }}>
          {/* Trade panel on mobile */}
          {isMobile && (
            <div style={{ ...MARKET_CARD, padding: "16px" }}>
              {loading ? (
                <div style={{ textAlign: "center", color: MUTED2, font: `500 13px ${FONT_BODY}`, padding: "24px 0" }}>
                  {t('marketDetails.loading')}
                </div>
              ) : tradePanelContent}
            </div>
          )}

          {/* Match banner (shows for "X vs Y" markets) */}
          <MatchBanner
            title={title}
            answers={answers}
            marketId={market?.id}
            isMobile={isMobile}
          />

          {/* Chart card */}
          <div style={{ ...MARKET_CARD, padding: isMobile ? "14px" : "20px 22px" }}>
            {loading ? (
              <div style={{ height: "240px", display: "flex", alignItems: "center", justifyContent: "center", color: MUTED2 }}>
                {t('marketDetails.loadingChart')}
              </div>
            ) : chartContent}
          </div>

          {/* Description — editorial style */}
          {market?.description ? (
            <div style={{ padding: isMobile ? "0" : "0 4px" }}>
              <div style={{
                font: `700 11px ${FONT_BODY}`,
                letterSpacing: ".08em",
                color: MUTED2,
                marginBottom: "10px",
              }}>
                {t('marketDetails.resolutionCriteria')}
              </div>
              <p style={{
                margin: 0,
                font: `400 14px/1.7 ${FONT_BODY}`,
                color: "#b7c6d6",
                maxWidth: "65ch",
              }}>
                {market.description}
              </p>
              <div style={{
                marginTop: "16px",
                height: "1px",
                background: "linear-gradient(90deg, rgba(255,255,255,0.08) 0%, transparent 100%)",
              }} />
            </div>
          ) : null}

          {/* Activity */}
          <div style={{ ...MARKET_CARD, overflow: "hidden" }}>
            <ActivityTabs
              marketId={marketId}
              market={market}
              refreshTrigger={refreshTrigger}
              variant="dark"
            />
          </div>
        </div>

        {/* MIDDLE — trade panel (desktop) */}
        {!isMobile && (
          <div
            style={{
              ...MARKET_CARD,
              border: "none",
              padding: "20px",
              paddingTop: "0",
              position: "sticky",
              top: "100px",
            }}
          >
            {loading ? (
              <div style={{ textAlign: "center", color: MUTED2, font: `500 13px ${FONT_BODY}`, padding: "24px 0" }}>
                {t('marketDetails.loading')}
              </div>
            ) : tradePanelContent}
          </div>
        )}

      </div>

      <ShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={title}
        answers={answers}
        currentProbability={currentProbability}
        probabilityChanges={probabilityChanges}
        totalVolume={totalVolume}
        numUsers={numUsers}
        closesLabel={closesLabel}
        creatorUsername={creatorUsername}
        marketId={marketId}
      />
    </div>
  );
}

function MultiChoiceLayout({
  market,
  creator,
  numUsers,
  totalVolume,
  probabilityChanges,
  marketId,
  username,
  token,
  isLoggedIn,
  refetchData,
  isMobile,
}) {
  const [groupData, setGroupData] = useState(null);
  const [groupLoading, setGroupLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const groupId = market?.marketGroup?.id;
  const groupTitle =
    market?.marketGroup?.questionTitle || market?.questionTitle;
  const stewardUsername = stewardUsernameFor(market, market?.creatorUsername);
  const canResolve =
    !market?.isResolved &&
    String(username || "").trim() === String(stewardUsername || "").trim();
  const closesLabel = market?.isResolved
    ? "Closed"
    : formatResolutionDate(market?.resolutionDateTime);
  const isMarketOpen =
    !market?.isResolved &&
    market?.resolutionDateTime &&
    new Date(market.resolutionDateTime) > new Date();

  useEffect(() => {
    if (!groupId) {
      setGroupLoading(false);
      return;
    }
    let cancelled = false;
    setGroupLoading(true);
    getMarketGroupDetails(groupId)
      .then((data) => {
        if (!cancelled) setGroupData(data);
      })
      .catch(() => {
        if (!cancelled) setGroupData(null);
      })
      .finally(() => {
        if (!cancelled) setGroupLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [groupId, refreshTrigger]);

  const answers = [...(groupData?.answers || [])].sort(
    (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0),
  );

  const handleSuccess = () => {
    if (refetchData) refetchData();
    setRefreshTrigger((p) => p + 1);
  };

  const creatorUsername =
    market?.creatorUsername || creator?.username || "unknown";

  const tradePanelContent = answers.length > 0 ? (
    <MultiChoiceTradePanel
      answers={answers}
      selectedIdx={selectedIdx}
      onSelectIdx={setSelectedIdx}
      token={token}
      isLoggedIn={isLoggedIn}
      isMarketOpen={isMarketOpen}
      onSuccess={handleSuccess}
    />
  ) : null;

  const chartContent = answers.length > 0 ? (
    <MultiOptionChart
      answers={answers}
      selectedIdx={selectedIdx}
      onSelectIdx={setSelectedIdx}
    />
  ) : (
    <NewMarketChart
      data={probabilityChanges}
      currentProbability={0.5}
      closeDateTime={market?.resolutionDateTime}
      yesLabel={market?.yesLabel || "Yes"}
      noLabel={market?.noLabel || "No"}
    />
  );

  return (
    <MarketLayout
      title={groupTitle}
      market={market}
      creatorUsername={creatorUsername}
      closesLabel={closesLabel}
      isMarketOpen={isMarketOpen}
      canResolve={canResolve}
      marketId={marketId}
      token={token}
      numUsers={numUsers}
      totalVolume={totalVolume}
      isMobile={isMobile}
      refreshTrigger={refreshTrigger}
      onResolved={handleSuccess}
      loading={groupLoading}
      chartContent={chartContent}
      tradePanelContent={tradePanelContent}
      answers={answers.map((a) => ({ ...a, probability: getAnswerProb(a) }))}
    />
  );
}

// ─── Binary chart (real data, always full-width) ──────────────────────────────
const BC_RANGES = ["1H", "6H", "1D", "1W", "1M", "ALL"];
const BC_WINDOW_MS = {
  "1H": 3600_000,
  "6H": 6 * 3600_000,
  "1D": 86400_000,
  "1W": 7 * 86400_000,
  "1M": 30 * 86400_000,
  ALL: 0,
};
const BC_LABEL_STEP = {
  "1H": 15 * 60_000,
  "6H": 60 * 60_000,
  "1D": 4 * 3600_000,
  "1W": 86400_000,
  "1M": 5 * 86400_000,
  ALL: 7 * 86400_000,
};

function BinaryChart({
  probabilityChanges,
  currentProbability: rawProb,
  yesLabel = "Yes",
  noLabel = "No",
  totalVolume = 0,
}) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const curP = Math.max(0.001, Math.min(0.999, Number(rawProb) || 0.5));
  const [range, setRange] = useState("ALL");
  const [hoverT, setHoverT] = useState(null);
  const chartRef = useRef(null);

  const [liveNow, setLiveNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setLiveNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  // Fixed Y-axis: always 0-100%
  const CHART_H = 280;
  const W = 1000;
  const TOP = 0;
  const BOT = CHART_H;
  const yOf = (p) => BOT - p * (BOT - TOP);
  const Y_TICKS = [1, 0.75, 0.5, 0.25, 0];

  const allChanges = useMemo(() => {
    const arr = Array.isArray(probabilityChanges) ? probabilityChanges : [];
    return arr
      .map((c) => ({
        t: new Date(c.timestamp || c.Timestamp).getTime(),
        p: Number(c.probability ?? c.Probability),
      }))
      .filter((c) => Number.isFinite(c.t) && Number.isFinite(c.p))
      .sort((a, b) => a.t - b.t);
  }, [probabilityChanges]);

  const windowMs = range === "ALL"
    ? (allChanges.length > 1 ? liveNow - allChanges[0].t + 3600_000 : 7 * 86400_000)
    : BC_WINDOW_MS[range];
  const winStart = liveNow - windowMs;

  const yesData = useMemo(() => {
    const before = allChanges.filter((c) => c.t < winStart);
    const within = allChanges.filter((c) => c.t >= winStart && c.t < liveNow);
    const anchorP = before.length
      ? before[before.length - 1].p
      : within.length ? within[0].p : curP;
    return [{ t: winStart, p: anchorP }, ...within, { t: liveNow, p: curP }];
  }, [allChanges, winStart, liveNow, curP]);

  const noData = useMemo(
    () => yesData.map((c) => ({ t: c.t, p: 1 - c.p })),
    [yesData],
  );

  const xOf = (t) => Math.min(W, Math.max(0, ((t - winStart) / windowMs) * W));

  // Step path builder
  const ptsToD = (pts) => {
    if (pts.length < 2) return "";
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++)
      d += ` H${pts[i][0].toFixed(1)} V${pts[i][1].toFixed(1)}`;
    return d;
  };

  const yesPath = ptsToD(yesData.map((c) => [xOf(c.t), yOf(c.p)]));
  const noPath = ptsToD(noData.map((c) => [xOf(c.t), yOf(c.p)]));
  const yesLast = [xOf(liveNow), yOf(curP)];
  const noLast = [xOf(liveNow), yOf(1 - curP)];

  const themes = [OPTION_THEMES[0], OPTION_THEMES[1]];

  // Hover + drag-select
  const getValAt = (series, t) => {
    let v = series[0]?.p ?? 0.5;
    for (const c of series) {
      if (c.t <= t) v = c.p;
      else break;
    }
    return v;
  };

  const [bcDragState, setBcDragState] = useState(null);
  const [bcRangeSelect, setBcRangeSelect] = useState(null);
  const bcDragStartRef = useRef(null);

  useEffect(() => { setBcRangeSelect(null); setBcDragState(null); }, [range]);

  const getFrac = (e) => {
    const el = chartRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  const onMove = (e) => {
    const frac = getFrac(e);
    if (bcDragStartRef.current != null) {
      setBcDragState({ f1: bcDragStartRef.current, f2: frac });
      setHoverT(null);
      return;
    }
    if (!bcRangeSelect) setHoverT(winStart + frac * windowMs);
  };
  const bcOnTouchStart = (e) => { e.preventDefault(); if (!bcRangeSelect) setHoverT(winStart + getFrac(e) * windowMs); };
  const bcOnTouchMove = (e) => { e.preventDefault(); if (!bcRangeSelect) setHoverT(winStart + getFrac(e) * windowMs); };
  const onLeave = () => { if (!bcDragStartRef.current) setHoverT(null); };

  const bcOnDown = (e) => {
    if (e.button !== 0) return;
    const frac = getFrac(e);
    bcDragStartRef.current = frac;
    setBcDragState({ f1: frac, f2: frac });
    setBcRangeSelect(null);
    setHoverT(null);
    e.preventDefault();
    const moveG = (ev) => setBcDragState({ f1: bcDragStartRef.current, f2: getFrac(ev) });
    const upG = (ev) => {
      const f = getFrac(ev);
      const s = bcDragStartRef.current;
      bcDragStartRef.current = null;
      const lo = Math.min(s, f), hi = Math.max(s, f);
      if (hi - lo < 0.01) { setBcDragState(null); setBcRangeSelect(null); }
      else { setBcDragState(null); setBcRangeSelect({ f1: lo, f2: hi }); }
      window.removeEventListener("mousemove", moveG);
      window.removeEventListener("mouseup", upG);
    };
    window.addEventListener("mousemove", moveG);
    window.addEventListener("mouseup", upG);
  };

  const bcActiveRange = bcDragState || bcRangeSelect;
  const bcRangeInfo = bcActiveRange ? (() => {
    const lo = Math.min(bcActiveRange.f1, bcActiveRange.f2);
    const hi = Math.max(bcActiveRange.f1, bcActiveRange.f2);
    const t1 = winStart + lo * windowMs;
    const t2 = winStart + hi * windowMs;
    const p1 = getValAt(yesData, t1), p2 = getValAt(yesData, t2);
    return {
      t1, t2, x1: lo * W, x2: hi * W,
      yesEnd: p2, noEnd: 1 - p2,
      yesDelta: p2 - p1, noDelta: -(p2 - p1),
    };
  })() : null;

  const hover = hoverT == null ? null : (() => {
    const yp = getValAt(yesData, hoverT);
    const hx = xOf(hoverT);
    const frac = hx / W;
    return {
      x: hx, frac,
      yesP: yp, noP: 1 - yp,
      yesY: yOf(yp), noY: yOf(1 - yp),
      time: hoverT,
    };
  })();

  // Time axis labels
  const pad2 = (v) => String(v).padStart(2, "0");
  const MONTHS_SHORT = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const fmtX = (d) => {
    if (range === "1H" || range === "6H" || range === "1D")
      return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
  };
  const fmtTip = (d) => {
    const mon = MONTHS_SHORT[d.getMonth()];
    const day = d.getDate();
    const h = d.getHours(), m = pad2(d.getMinutes());
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${mon} ${day}, ${h12}:${m} ${ampm}`;
  };

  const labelStepMs = range === "ALL"
    ? (windowMs > 60 * 86400_000 ? 30 * 86400_000 : windowMs > 14 * 86400_000 ? 7 * 86400_000 : 86400_000)
    : BC_LABEL_STEP[range];
  const firstT = Math.ceil(winStart / labelStepMs) * labelStepMs;
  const rawXLabels = [];
  for (let t = firstT; t <= liveNow + labelStepMs * 0.1; t += labelStepMs) {
    const frac = (t - winStart) / windowMs;
    if (frac >= 0 && frac <= 1) rawXLabels.push({ t, leftPct: frac * 100 });
  }
  const minXGap = isMobile ? 18 : 10;
  const xLabels = rawXLabels.filter((lbl, i) => {
    if (i === 0) return true;
    return lbl.leftPct - rawXLabels[i - 1].leftPct >= minXGap;
  });

  // End labels positioning
  const lastYesP = curP;
  const lastNoP = 1 - curP;
  const endLabels = [
    { label: yesLabel, prob: lastYesP, theme: themes[0], y: yOf(lastYesP) },
    { label: noLabel, prob: lastNoP, theme: themes[1], y: yOf(lastNoP) },
  ];
  // Collision avoidance for end labels — 56px gap so 26px number doesn't cover neighbor's name
  const labelH = 56;
  const sortedLabels = [...endLabels].sort((a, b) => a.y - b.y);
  if (sortedLabels.length === 2 && Math.abs(sortedLabels[0].y - sortedLabels[1].y) < labelH) {
    const mid = (sortedLabels[0].y + sortedLabels[1].y) / 2;
    sortedLabels[0].y = mid - labelH / 2;
    sortedLabels[1].y = mid + labelH / 2;
  }
  sortedLabels.forEach(s => { s.y = Math.max(0, Math.min(CHART_H - labelH, s.y - labelH / 2)); });

  return (
    <div style={{ userSelect: "none", WebkitUserSelect: "none" }}>
      <style>{`
        @keyframes bcPulse{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.7}50%{transform:translate(-50%,-50%) scale(2.2);opacity:0}}
      `}</style>

      {/* Range selector + volume */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "12px",
      }}>
        <span style={{ font: `600 13px ${FONT_BODY}`, color: "#5d7189" }}>
          + ${Number(totalVolume || 0).toLocaleString()}
        </span>
        <div style={{ display: "flex", gap: "0" }}>
          {BC_RANGES.map((r) => (
            <button key={r}
              onClick={() => { setRange(r); setHoverT(null); }}
              style={{
                padding: "5px 10px", border: "none", cursor: "pointer",
                font: `700 11px ${FONT_BODY}`, letterSpacing: ".02em",
                background: "transparent",
                color: r === range ? "#ffffff" : "rgba(255,255,255,0.3)",
                transition: "color .15s",
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div style={{ display: "flex", position: "relative" }}>
        {/* Main chart */}
        <div
          style={{ flex: 1, minWidth: 0, position: "relative", touchAction: "none", cursor: "crosshair" }}
          ref={chartRef}
          onMouseMove={onMove}
          onMouseDown={bcOnDown}
          onMouseLeave={onLeave}
          onTouchStart={bcOnTouchStart}
          onTouchMove={bcOnTouchMove}
        >
          <svg
            viewBox={`0 0 ${W} ${CHART_H}`}
            preserveAspectRatio="none"
            style={{ width: "100%", height: isMobile ? "200px" : "260px", display: "block", overflow: "visible" }}
          >
            {/* Range highlight */}
            {bcRangeInfo && (
              <rect x={bcRangeInfo.x1} y="0" width={bcRangeInfo.x2 - bcRangeInfo.x1} height={CHART_H}
                fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
            )}

            {/* Grid lines */}
            {Y_TICKS.map((tick) => (
              <line key={tick} x1="0" y1={yOf(tick)} x2={W} y2={yOf(tick)}
                stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            ))}

            <defs>
              {hover && (
                <clipPath id="bc-left-clip">
                  <rect x="0" y="0" width={hover.x} height={CHART_H} />
                </clipPath>
              )}
              {bcRangeInfo && (
                <clipPath id="bc-range-clip">
                  <rect x={bcRangeInfo.x1} y="0" width={bcRangeInfo.x2 - bcRangeInfo.x1} height={CHART_H} />
                </clipPath>
              )}
            </defs>

            {/* Lines — grey when hovering/range, colored inside clip */}
            {[
              { path: yesPath, theme: themes[0] },
              { path: noPath, theme: themes[1] },
            ].map(({ path, theme }, i) => {
              const isGreyed = hover || !!bcRangeInfo;
              const clipId = hover ? "url(#bc-left-clip)" : bcRangeInfo ? "url(#bc-range-clip)" : undefined;
              return (
                <g key={i}>
                  <path d={path} fill="none" strokeLinejoin="round"
                    stroke={isGreyed ? "rgba(255,255,255,0.12)" : theme.color} strokeWidth="2.5" />
                  {clipId && (
                    <path d={path} fill="none" strokeLinejoin="round"
                      stroke={theme.color} strokeWidth="3" clipPath={clipId} />
                  )}
                </g>
              );
            })}

            {/* Hover crosshair */}
            {hover && (
              <line x1={hover.x} y1="0" x2={hover.x} y2={CHART_H}
                stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="4 4" />
            )}
          </svg>

          {/* Pulsing end dots */}
          {!hover && !bcRangeInfo && [
            { pos: yesLast, theme: themes[0] },
            { pos: noLast, theme: themes[1] },
          ].map(({ pos, theme }, i) => {
            const leftPct = (pos[0] / W) * 100;
            const topPct = (pos[1] / CHART_H) * 100;
            return (
              <div key={`pulse-${i}`} style={{
                position: "absolute", left: `${leftPct}%`, top: `${topPct}%`,
                transform: "translate(-50%, -50%)", pointerEvents: "none",
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: theme.color }} />
                <div style={{
                  position: "absolute", top: "50%", left: "50%",
                  width: 8, height: 8, borderRadius: "50%",
                  border: `2px solid ${theme.color}`,
                  animation: "bcPulse 2s infinite",
                }} />
              </div>
            );
          })}

          {/* Hover dots */}
          {hover && [
            { y: hover.yesY, theme: themes[0] },
            { y: hover.noY, theme: themes[1] },
          ].map(({ y, theme }, i) => (
            <div key={`hdot-${i}`} style={{
              position: "absolute",
              left: `${(hover.x / W) * 100}%`,
              top: `${(y / CHART_H) * 100}%`,
              transform: "translate(-50%, -50%)",
              width: 10, height: 10, borderRadius: "50%",
              background: "#0e121d", border: `2.5px solid ${theme.color}`,
              pointerEvents: "none",
            }} />
          ))}

          {/* Hover tooltip */}
          {hover && (
            <div style={{
              position: "absolute", top: -24,
              left: hover.frac > 0.6 ? "auto" : `${(hover.x / W) * 100}%`,
              right: hover.frac > 0.6 ? `${(1 - hover.x / W) * 100}%` : "auto",
              transform: hover.frac > 0.6 ? "none" : "translateX(-50%)",
              font: `600 12px ${FONT_BODY}`, color: "#8ca0b6",
              whiteSpace: "nowrap", pointerEvents: "none",
              background: "rgba(14,18,29,0.85)", padding: "3px 8px",
              borderRadius: "6px", zIndex: 20,
            }}>
              {fmtTip(new Date(hover.time))}
            </div>
          )}

          {/* Range date + close */}
          {bcRangeInfo && !bcDragState && (() => {
            const midPct = ((bcRangeInfo.x1 + bcRangeInfo.x2) / 2 / W) * 100;
            return (
              <div style={{
                position: "absolute", top: "-24px",
                left: `${midPct}%`, transform: "translateX(-50%)",
                display: "flex", alignItems: "center", gap: "6px",
                pointerEvents: "auto", zIndex: 20,
                background: "rgba(14,18,29,0.85)", padding: "3px 8px",
                borderRadius: "6px", whiteSpace: "nowrap",
              }}>
                <span style={{ font: `600 12px ${FONT_BODY}`, color: "#8ca0b6" }}>
                  {new Date(bcRangeInfo.t1).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  {" – "}
                  {new Date(bcRangeInfo.t2).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <button onClick={() => { setBcRangeSelect(null); setBcDragState(null); }}
                  style={{ background: "none", border: "none", color: "#5d7189",
                    font: `700 12px ${FONT_BODY}`, cursor: "pointer", padding: "0 2px", lineHeight: 1 }}>
                  ✕
                </button>
              </div>
            );
          })()}

          {/* Labels — follow hover/range or stick to end */}
          {(() => {
            const useRange = bcRangeInfo && !hover;
            const probs = hover
              ? [hover.yesP, hover.noP]
              : useRange
                ? [bcRangeInfo.yesEnd, bcRangeInfo.noEnd]
                : [lastYesP, lastNoP];
            const deltas = useRange ? [bcRangeInfo.yesDelta, bcRangeInfo.noDelta] : null;
            const yPositions = probs.map(p => yOf(p));

            // Collision avoidance
            const lblH = 60;
            const items = [
              { idx: 0, label: yesLabel, y: yPositions[0], theme: themes[0] },
              { idx: 1, label: noLabel, y: yPositions[1], theme: themes[1] },
            ];
            const sorted = [...items].sort((a, b) => a.y - b.y);
            if (Math.abs(sorted[0].y - sorted[1].y) < lblH) {
              const mid = (sorted[0].y + sorted[1].y) / 2;
              sorted[0].y = mid - lblH / 2;
              sorted[1].y = mid + lblH / 2;
            }
            sorted.forEach(s => { s.y = Math.max(0, Math.min(CHART_H - lblH, s.y - lblH / 2)); });

            const leftPos = hover
              ? `calc(${(hover.x / W) * 100}% + 14px)`
              : useRange
                ? `calc(${(bcRangeInfo.x2 / W) * 100}% + 14px)`
                : undefined;

            return items.map((item) => {
              const adj = sorted.find(s => s.idx === item.idx);
              const yPos = adj ? adj.y : item.y;
              const prob = probs[item.idx];
              const pctStr = prob >= 0.01 ? `${Math.round(prob * 100)}%` : `${(prob * 100).toFixed(1)}%`;
              const deltaPct = deltas ? Math.round(deltas[item.idx] * 1000) / 10 : null;
              return (
                <div key={item.idx} style={{
                  position: "absolute",
                  ...(leftPos
                    ? { left: leftPos }
                    : { right: 0, transform: "translateX(calc(100% + 14px))" }),
                  top: `${(yPos / CHART_H) * 100}%`,
                  whiteSpace: "nowrap", pointerEvents: "none", zIndex: 5,
                  transition: hover ? "none" : "top 0.3s ease, left 0.3s ease",
                }}>
                  <div style={{ font: `600 12px ${FONT_BODY}`, color: item.theme.color, lineHeight: 1.2 }}>
                    {item.label}
                  </div>
                  <div style={{ font: `800 26px ${FONT_HEAD}`, color: item.theme.color, lineHeight: 1.1 }}>
                    {pctStr}
                  </div>
                  {deltaPct != null && (
                    <div style={{
                      font: `700 12px ${FONT_BODY}`,
                      color: deltaPct >= 0 ? "rgba(255,255,255,0.9)" : "#ff6b7a",
                    }}>
                      {deltaPct >= 0 ? "▲" : "▼"} {Math.abs(deltaPct)}%
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>

        {/* Y-axis — fixed right */}
        <div style={{
          flexShrink: 0,
          width: "44px",
          height: isMobile ? "200px" : "260px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          paddingLeft: "10px",
          marginLeft: isMobile ? "60px" : "80px",
        }}>
          {Y_TICKS.map((tick) => (
            <span key={tick} style={{
              font: `500 11px ${FONT_BODY}`,
              color: "rgba(255,255,255,0.28)",
              lineHeight: 1,
            }}>
              {Math.round(tick * 100)}%
            </span>
          ))}
        </div>
      </div>

      {/* X-axis labels */}
      <div style={{
        position: "relative",
        height: "22px",
        marginTop: "8px",
        marginRight: isMobile ? "104px" : "124px",
      }}>
        {xLabels.map(({ t, leftPct }) => (
          <span key={t} style={{
            position: "absolute",
            left: `${leftPct}%`,
            transform: "translateX(-50%)",
            font: `500 11px ${FONT_BODY}`,
            color: "rgba(255,255,255,0.3)",
            whiteSpace: "nowrap",
          }}>
            {fmtX(new Date(t))}
          </span>
        ))}
      </div>

    </div>
  );
}

// ─── Binary layout (existing layout, unchanged) ───────────────────────────────
function BinaryLayout({
  market,
  creator,
  numUsers,
  totalVolume,
  currentProbability,
  probabilityChanges,
  marketId,
  username,
  token,
  isLoggedIn,
  refetchData,
  isMobile,
}) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const safeMarket = market ?? {};
  const creatorUsername =
    safeMarket.creatorUsername ?? creator?.username ?? "unknown";
  const stewardUsername = stewardUsernameFor(safeMarket, creatorUsername);
  const yesPct = Math.round(currentProbability * 100);
  const noPct = 100 - yesPct;
  const yesLabel = safeMarket.yesLabel || "Yes";
  const noLabel = safeMarket.noLabel || "No";
  const isMarketOpen =
    !safeMarket.isResolved &&
    safeMarket.resolutionDateTime &&
    new Date(safeMarket.resolutionDateTime) > new Date();
  const canResolve =
    !safeMarket.isResolved &&
    String(username || "").trim() === String(stewardUsername || "").trim();
  const closesLabel = safeMarket.isResolved
    ? "Closed"
    : formatResolutionDate(safeMarket.resolutionDateTime);

  const handleSuccess = () => {
    if (refetchData) refetchData();
    setRefreshTrigger((p) => p + 1);
  };

  const tradePanelContent = (
    <BinaryTradePanelContent
      safeMarket={safeMarket}
      yesLabel={yesLabel}
      noLabel={noLabel}
      yesPct={yesPct}
      noPct={noPct}
      isMarketOpen={isMarketOpen}
      isLoggedIn={isLoggedIn}
      marketId={marketId}
      token={token}
      currentProbability={currentProbability}
      username={username}
      onSuccess={handleSuccess}
    />
  );

  const chartContent = (
    <BinaryChart
      probabilityChanges={probabilityChanges}
      currentProbability={currentProbability}
      yesLabel={yesLabel}
      noLabel={noLabel}
      totalVolume={totalVolume}
    />
  );

  return (
    <MarketLayout
      title={safeMarket.questionTitle}
      market={safeMarket}
      creatorUsername={creatorUsername}
      closesLabel={closesLabel}
      isMarketOpen={isMarketOpen}
      canResolve={canResolve}
      marketId={marketId}
      token={token}
      numUsers={numUsers}
      totalVolume={totalVolume}
      isMobile={isMobile}
      refreshTrigger={refreshTrigger}
      onResolved={handleSuccess}
      loading={false}
      chartContent={chartContent}
      tradePanelContent={tradePanelContent}
      currentProbability={currentProbability}
      probabilityChanges={probabilityChanges}
    />
  );
}

// ─── Binary trade panel ───────────────────────────────────────────────────────
function BinaryTradePanelContent({
  safeMarket,
  yesLabel,
  noLabel,
  yesPct,
  noPct,
  isMarketOpen,
  isLoggedIn,
  marketId,
  token,
  currentProbability,
  username,
  onSuccess,
}) {
  const { login } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  if (safeMarket.isResolved) {
    return (
      <ResolvedPanel
        result={safeMarket.resolutionResult}
        yesLabel={yesLabel}
        noLabel={noLabel}
        yesPct={yesPct}
        noPct={noPct}
      />
    );
  }
  if (!isMarketOpen) {
    return (
      <ClosedPanel
        yesLabel={yesLabel}
        noLabel={noLabel}
        yesPct={yesPct}
        noPct={noPct}
      />
    );
  }
  if (isLoggedIn) {
    return (
      <NewTradePanel
        marketId={marketId}
        market={safeMarket}
        token={token}
        currentProbability={currentProbability}
        username={username}
        onSuccess={onSuccess}
      />
    );
  }
  return (
    <NotLoggedInPanel
      yesLabel={yesLabel}
      noLabel={noLabel}
      yesPct={yesPct}
      noPct={noPct}
    />
  );
}

// ─── Resolved panel ───────────────────────────────────────────────────────────
function ResolvedPanel({ result, yesLabel, noLabel, yesPct, noPct }) {
  const isYes = result?.toUpperCase() === "YES";
  const isNA =
    result?.toUpperCase() === "N/A" || result?.toUpperCase() === "NA";
  const winLabel = isNA ? "N/A" : isYes ? yesLabel : noLabel;
  const winColor = isNA ? "#8ca0b6" : isYes ? "#BAD659" : "#fb5b6b";
  const winBg = isNA
    ? "rgba(140,160,182,0.10)"
    : isYes
      ? "rgba(186,214,89,0.10)"
      : "rgba(251,91,107,0.10)";
  const winBorder = isNA
    ? "rgba(140,160,182,0.25)"
    : isYes
      ? "rgba(186,214,89,0.30)"
      : "rgba(251,91,107,0.30)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div
        style={{
          borderRadius: "14px",
          padding: "20px 16px",
          background: winBg,
          border: `1px solid ${winBorder}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span
          style={{
            font: `700 11px ${FONT_BODY}`,
            letterSpacing: ".1em",
            color: winColor,
          }}
        >
          MARKET RESOLVED
        </span>
        <span style={{ font: `800 32px ${FONT_HEAD}`, color: winColor }}>
          {winLabel}
        </span>
        <span style={{ font: `500 12px ${FONT_BODY}`, color: MUTED3 }}>
          {isNA ? "Cancelled — bets refunded" : `${winLabel} won`}
        </span>
      </div>
      <div style={{ display: "flex", gap: "9px" }}>
        {[
          {
            label: yesLabel,
            pct: yesPct,
            active: isYes,
            color: YES_TEXT,
            bg: isYes ? "rgba(186,214,89,0.12)" : "rgba(255,255,255,0.04)",
            border: isYes ? "rgba(186,214,89,0.30)" : "rgba(255,255,255,0.08)",
          },
          {
            label: noLabel,
            pct: noPct,
            active: !isYes && !isNA,
            color: NO_TEXT,
            bg:
              !isYes && !isNA
                ? "rgba(251,91,107,0.12)"
                : "rgba(255,255,255,0.04)",
            border:
              !isYes && !isNA
                ? "rgba(251,91,107,0.30)"
                : "rgba(255,255,255,0.08)",
          },
        ].map(({ label, pct, color, bg, border }) => (
          <div
            key={label}
            style={{
              flex: 1,
              padding: "11px 8px",
              borderRadius: "12px",
              textAlign: "center",
              background: bg,
              border: `1px solid ${border}`,
            }}
          >
            <div style={{ font: `700 13px ${FONT_BODY}`, color }}>{label}</div>
            <div style={{ font: `800 17px ${FONT_HEAD}`, color }}>{pct}¢</div>
          </div>
        ))}
      </div>
      <div
        style={{
          textAlign: "center",
          font: `500 11px ${FONT_BODY}`,
          color: MUTED3,
        }}
      >
        Payouts have been credited automatically
      </div>
    </div>
  );
}

// ─── Closed panel ─────────────────────────────────────────────────────────────
function ClosedPanel({ yesLabel, noLabel, yesPct, noPct }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div
        style={{
          borderRadius: "14px",
          padding: "20px 16px",
          background: "rgba(255,193,7,0.08)",
          border: "1px solid rgba(255,193,7,0.25)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span
          style={{
            font: `700 11px ${FONT_BODY}`,
            letterSpacing: ".1em",
            color: "#ffc107",
          }}
        >
          MARKET CLOSED
        </span>
        <span style={{ font: `800 20px ${FONT_HEAD}`, color: "#eaf0f7" }}>
          Awaiting resolution
        </span>
        <span style={{ font: `500 12px ${FONT_BODY}`, color: MUTED3 }}>
          The market steward needs to resolve this
        </span>
      </div>
      <div style={{ display: "flex", gap: "9px" }}>
        {[
          { label: yesLabel, pct: yesPct, color: YES_TEXT },
          { label: noLabel, pct: noPct, color: NO_TEXT },
        ].map(({ label, pct, color }) => (
          <div
            key={label}
            style={{
              flex: 1,
              padding: "11px 8px",
              borderRadius: "12px",
              textAlign: "center",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ font: `700 13px ${FONT_BODY}`, color }}>{label}</div>
            <div style={{ font: `800 17px ${FONT_HEAD}`, color }}>{pct}¢</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Not logged in panel ──────────────────────────────────────────────────────
function NotLoggedInPanel({ yesLabel, noLabel, yesPct, noPct }) {
  const { login } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", gap: "9px" }}>
        {[
          {
            label: yesLabel,
            pct: yesPct,
            color: YES_TEXT,
            bg: "rgba(186,214,89,0.08)",
            border: "rgba(186,214,89,0.22)",
          },
          {
            label: noLabel,
            pct: noPct,
            color: NO_TEXT,
            bg: "rgba(244,63,94,0.08)",
            border: "rgba(244,63,94,0.18)",
          },
        ].map(({ label, pct, color, bg, border }) => (
          <div
            key={label}
            style={{
              flex: 1,
              padding: "11px 8px",
              borderRadius: "12px",
              textAlign: "center",
              background: bg,
              border: `1px solid ${border}`,
            }}
          >
            <div style={{ font: `700 13px ${FONT_BODY}`, color }}>{label}</div>
            <div style={{ font: `800 17px ${FONT_HEAD}`, color }}>{pct}¢</div>
          </div>
        ))}
      </div>
      <div
        onClick={() => setIsLoginModalOpen(true)}
        style={{
          borderRadius: "14px",
          padding: "20px 16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.09)",
          textAlign: "center",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            font: `700 14px ${FONT_BODY}`,
            color: TEXT,
            marginBottom: "6px",
          }}
        >
          Sign in to trade
        </div>
        <div style={{ font: `500 12px ${FONT_BODY}`, color: MUTED3 }}>
          You need an account to participate
        </div>
      </div>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLogin={login} onForgotPassword={() => { setIsLoginModalOpen(false); setIsForgotPasswordOpen(true); }} />
      <ForgotPasswordModal isOpen={isForgotPasswordOpen} onClose={() => setIsForgotPasswordOpen(false)} onSwitchToLogin={() => { setIsForgotPasswordOpen(false); setIsLoginModalOpen(true); }} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
function TestMarketDetailsLayout({
  market,
  creator,
  numUsers,
  totalVolume,
  currentProbability,
  probabilityChanges,
  marketId,
  username,
  token,
  isLoggedIn,
  refetchData,
}) {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (document.getElementById("gp-fonts")) return;
    const link = document.createElement("link");
    link.id = "gp-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@700;800&display=swap";
    document.head.appendChild(link);
  }, []);

  const isGroupMember = !!market?.marketGroup?.id;

  const commonProps = {
    market,
    creator,
    numUsers,
    totalVolume,
    marketId,
    username,
    token,
    isLoggedIn,
    refetchData,
    isMobile,
  };

  return (
    <div
      className="pb-16"
      style={{ minHeight: "100vh", color: TEXT, fontFamily: FONT_BODY }}
    >
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "70%",
          left: "50%",
          top: "-10%",
          transform: "translateX(-50%)",
          background:
            "radial-gradient(ellipse at 30% 0%, rgba(30,144,255,0.12) 0%, transparent 70%), radial-gradient(ellipse at 70% 20%, rgba(186,214,89,0.07) 0%, transparent 60%)",
          filter: "blur(80px)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <div style={{ position: "relative", zIndex: 20 }}>
        <Navbar />
      </div>
      <div
        style={{
          zIndex: 10,
          maxWidth: "1400px",
          margin: "0 auto",
          padding: isMobile ? "16px 16px 60px" : "22px 40px 60px",
        }}
      >
        {isGroupMember ? (
          <MultiChoiceLayout
            {...commonProps}
            currentProbability={currentProbability}
            probabilityChanges={probabilityChanges}
          />
        ) : (
          <BinaryLayout
            {...commonProps}
            currentProbability={currentProbability}
            probabilityChanges={probabilityChanges}
          />
        )}
      </div>
      <Footer />
    </div>
  );
}
console.log("TestMarketDetailsLayout rendered");
export default TestMarketDetailsLayout;
