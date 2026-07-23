import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip as RTooltip,
  ResponsiveContainer, ReferenceLine,
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
import { submitBet, fetchUserShares, fetchSaleQuote, submitSale } from "../layouts/trade/TradeUtils";
import { USER_CREDIT_REFRESH_EVENT } from "../utils/userFinanceTools/FetchUserCredit";
import { API_URL } from "../../config";

// ─── design tokens ────────────────────────────────────────────────────────────
const FONT_BODY = FONT;
const YES_GREEN  = COLOR.yes;
const YES_TEXT   = COLOR.yesText;
const NO_RED     = COLOR.no;
const NO_TEXT    = COLOR.noText;
const MUTED      = COLOR.muted;
const MUTED2     = COLOR.muted2;
const MUTED3     = COLOR.muted3;
const TEXT       = COLOR.text;
const MARKET_CARD = { ...CARD, background: '#0e121d' };

// Per-option theme: first=green, last=red, middles=neutral/purple/orange/teal…
const OPTION_THEMES = [
  { color: "#BAD659", text: "#C6E06C", bg: "rgba(186,214,89,0.10)",   border: "rgba(186,214,89,0.28)",   activeBorder: "rgba(186,214,89,0.55)",   gradient: "linear-gradient(180deg,#BAD659,#AABA49)", shadow: "0 8px 22px rgba(186,214,89,0.30)"   },
  { color: "#fb5b6b", text: "#fb8b96", bg: "rgba(251,91,107,0.10)",  border: "rgba(251,91,107,0.25)",  activeBorder: "rgba(251,91,107,0.55)",  gradient: "linear-gradient(180deg,#fb5b6b,#e11d48)", shadow: "0 8px 22px rgba(244,63,94,0.28)"   },
  { color: "#6b7f96", text: "#8ca0b6", bg: "rgba(107,127,150,0.09)", border: "rgba(107,127,150,0.22)", activeBorder: "rgba(107,127,150,0.50)", gradient: "linear-gradient(180deg,#6b7f96,#4a5e72)", shadow: "0 8px 22px rgba(107,127,150,0.22)" },
  { color: "#a78bfa", text: "#c4b5fd", bg: "rgba(167,139,250,0.10)", border: "rgba(167,139,250,0.26)", activeBorder: "rgba(167,139,250,0.52)", gradient: "linear-gradient(180deg,#a78bfa,#7c3aed)", shadow: "0 8px 22px rgba(167,139,250,0.28)" },
  { color: "#f6ad55", text: "#fbd38d", bg: "rgba(246,173,85,0.10)",  border: "rgba(246,173,85,0.24)",  activeBorder: "rgba(246,173,85,0.50)",  gradient: "linear-gradient(180deg,#f6ad55,#d97706)", shadow: "0 8px 22px rgba(246,173,85,0.26)"  },
  { color: "#4fd1c5", text: "#81e6d9", bg: "rgba(79,209,197,0.10)",  border: "rgba(79,209,197,0.24)",  activeBorder: "rgba(79,209,197,0.50)",  gradient: "linear-gradient(180deg,#4fd1c5,#0d9488)", shadow: "0 8px 22px rgba(79,209,197,0.24)"  },
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

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
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
  const raw = Array.isArray(answer?.probabilityChanges) ? answer.probabilityChanges
    : Array.isArray(answer?.summary?.probabilityChanges) ? answer.summary.probabilityChanges
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
    answer?.market?.market?.initialProbability ?? 0.5;
  return Number.isFinite(Number(fallback)) ? Number(fallback) : 0.5;
}

function buildChartData(answers, timeFilter, now = Date.now()) {
  const cutoffMs = { "LIVE": 7_200_000, "1H": 3_600_000, "1D": 86_400_000, "1W": 604_800_000 };
  const cutoff = timeFilter === "ALL" ? 0 : now - (cutoffMs[timeFilter] || 0);

  const series = answers.map((a) => {
    const changes = Array.isArray(a.probabilityChanges) ? a.probabilityChanges
      : Array.isArray(a.summary?.probabilityChanges) ? a.summary.probabilityChanges
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
    anchors[i] ? [anchors[i], ...s.filter((c) => c.t >= cutoff)] : s.filter((c) => cutoff === 0 || c.t >= cutoff)
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

// ─── StatCard ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value }) => (
  <div style={{ ...MARKET_CARD, padding: "13px 15px" }}>
    <div style={{ font: `600 11px ${FONT_BODY}`, color: MUTED2 }}>{label}</div>
    <div style={{ font: `800 17px ${FONT_HEAD}`, marginTop: "3px", color: TEXT }}>{value}</div>
  </div>
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
    <div style={{
      background: "rgba(10,20,36,0.97)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: "12px", padding: "12px 16px", fontFamily: FONT_BODY,
      minWidth: "160px",
    }}>
      <div style={{ font: `600 11px ${FONT_BODY}`, color: MUTED2, marginBottom: "10px" }}>
        {timeStr}
      </div>
      {answers.map((a, i) => {
        const t = getOptionTheme(i, answers.length);
        const entry = payload.find((p) => p.dataKey === `o${i}`);
        const val = entry?.value;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: i < answers.length - 1 ? "7px" : 0 }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: t.color, flexShrink: 0 }} />
            <span style={{ font: `500 12px ${FONT_BODY}`, color: "#b7c6d6", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "110px" }}>
              {a.answerLabel}
            </span>
            <span style={{ font: `800 13px ${FONT_HEAD}`, color: t.color, marginLeft: "auto" }}>
              {val != null ? `${val.toFixed(1)}%` : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Multi-option chart (pure SVG, real data) ────────────────────────────────
const MC_RANGES     = ["Live", "1h", "1d", "1w", "1m"];
const MC_WINDOW_MS  = { Live: 5*60_000, "1h": 3600_000, "1d": 86400_000, "1w": 7*86400_000, "1m": 30*86400_000 };
const MC_LABEL_STEP = { Live: 60_000, "1h": 10*60_000, "1d": 3*3600_000, "1w": 86400_000, "1m": 5*86400_000 };

function mcAvoidCollisions(rawTops, minGap = 14, maxTop = 82) {
  const arr = rawTops.map((t, i) => ({ t, i })).sort((a, b) => a.t - b.t);
  for (let iter = 0; iter < 60; iter++) {
    let moved = false;
    for (let j = 1; j < arr.length; j++) {
      if (arr[j].t - arr[j - 1].t < minGap) {
        const mid = (arr[j].t + arr[j - 1].t) / 2;
        arr[j - 1].t = mid - minGap / 2;
        arr[j].t     = mid + minGap / 2;
        moved = true;
      }
    }
    if (!moved) break;
  }
  if (arr[arr.length - 1].t > maxTop) {
    const excess = arr[arr.length - 1].t - maxTop;
    arr.forEach(a => { a.t -= excess; });
  }
  const out = new Array(rawTops.length);
  arr.forEach(({ t, i }) => { out[i] = t; });
  return out;
}

function MultiOptionChart({ answers, selectedIdx, onSelectIdx }) {
  const [range, setRange] = useState("Live");
  const [hoverT, setHoverT] = useState(null);
  const chartRef = useRef(null);

  const [liveNow, setLiveNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setLiveNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const W = 780, SVG_H = 380, TOP = 20, BOT = 360;
  const windowMs = MC_WINDOW_MS[range];
  const winStart = liveNow - windowMs;

  // Parse + anchor each answer's history so it always spans the full window
  const seriesData = useMemo(() => answers.map(a => {
    const raw = Array.isArray(a.probabilityChanges) ? a.probabilityChanges
      : Array.isArray(a.summary?.probabilityChanges) ? a.summary.probabilityChanges : [];
    const changes = raw
      .map(c => ({ t: new Date(c.timestamp || c.Timestamp).getTime(), p: Number(c.probability ?? c.Probability) }))
      .filter(c => Number.isFinite(c.t) && Number.isFinite(c.p))
      .sort((a, b) => a.t - b.t);
    const curP   = Math.max(0.01, Math.min(0.99, getAnswerProb(a)));
    const before = changes.filter(c => c.t < winStart);
    const within = changes.filter(c => c.t >= winStart && c.t < liveNow);
    // Always anchor at winStart so the line fills left to right
    const anchorP = before.length ? before[before.length - 1].p
      : within.length ? within[0].p : curP;
    return [{ t: winStart, p: anchorP }, ...within, { t: liveNow, p: curP }];
  }), [answers, winStart, liveNow]);

  // Union timestamps for snapping hover
  const allTs = useMemo(() => {
    const s = new Set();
    seriesData.forEach(sd => sd.forEach(c => s.add(c.t)));
    return [...s].sort((a, b) => a - b);
  }, [seriesData]);

  const getValAt = (series, t) => {
    let v = series[0]?.p ?? 0.5;
    for (const c of series) { if (c.t <= t) v = c.p; else break; }
    return v;
  };

  // Dynamic Y range
  const allProbs = seriesData.flat().map(c => c.p).filter(Number.isFinite);
  const dataMin  = allProbs.length ? Math.min(...allProbs) : 0;
  const dataMax  = allProbs.length ? Math.max(...allProbs) : 1;
  const pad5     = Math.max(0.05, (dataMax - dataMin) * 0.25);
  const yMin     = Math.max(0, dataMin - pad5);
  const yMax     = Math.min(1, dataMax + pad5);
  const yrng     = yMax - yMin || 1;
  const yOf      = p => BOT - ((p - yMin) / yrng) * (BOT - TOP);
  const yTicks   = [yMax, yMin + yrng*0.667, yMin + yrng*0.333, yMin].map(v => Math.round(v*100) + "%");

  const xOf = t => ((t - winStart) / windowMs) * W;

  const MC_OVERLAP_THRESH = 0.05;

  const mcPtsToD = pts => {
    if (pts.length < 2) return "";
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) d += ` H${pts[i][0].toFixed(1)} V${pts[i][1].toFixed(1)}`;
    return d;
  };

  const mcSplitPath = (pts, closeFlags) => {
    let solidSegs = [], dashSegs = [], cur = [], curClose = closeFlags[0];
    for (let i = 0; i < pts.length; i++) {
      const c = closeFlags[i];
      if (c !== curClose) {
        cur.push(pts[i]);
        (curClose ? dashSegs : solidSegs).push([...cur]);
        cur = [pts[i]];
        curClose = c;
      }
      cur.push(pts[i]);
    }
    (curClose ? dashSegs : solidSegs).push(cur);
    return { solidD: solidSegs.map(mcPtsToD).join(" "), dashD: dashSegs.map(mcPtsToD).join(" ") };
  };

  const paths = seriesData.map((series, i) => {
    const pts = series.map(c => [xOf(c.t), yOf(c.p)]);
    const closeFlags = series.map((c, idx) => {
      const minGap = Math.min(...seriesData
        .filter((_, j) => j !== i)
        .map(other => Math.abs(c.p - getValAt(other, c.t))));
      if (minGap >= MC_OVERLAP_THRESH) return false;
      const nextC = series[idx + 1];
      if (!nextC) return false;
      const nextMinGap = Math.min(...seriesData
        .filter((_, j) => j !== i)
        .map(other => Math.abs(nextC.p - getValAt(other, nextC.t))));
      return nextMinGap <= minGap + 0.03;
    });
    const { solidD, dashD } = mcSplitPath(pts, closeFlags);
    const d = mcPtsToD(pts);
    return { d, pts, last: pts[pts.length - 1], solidD, dashD };
  });

  const lastProbs = seriesData.map(s => s[s.length - 1]?.p ?? 0.5);

  // X-axis
  const pad = v => String(v).padStart(2, "0");
  const fmtX = d => {
    if (range === "Live" || range === "1h" || range === "1d") return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return `${d.getMonth()+1}/${d.getDate()}`;
  };
  const fmtTip = d => {
    if (range === "Live" || range === "1h" || range === "1d") return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return `${d.getMonth()+1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const labelStepMs = MC_LABEL_STEP[range];
  const firstT      = Math.ceil(winStart / labelStepMs) * labelStepMs;
  const slideLabels = [];
  for (let t = firstT; t <= liveNow + labelStepMs * 0.1; t += labelStepMs) {
    const frac = (t - winStart) / windowMs;
    if (frac >= -0.02 && frac <= 1.02) slideLabels.push({ t, leftPct: frac * 100 });
  }

  const rawTops   = lastProbs.map(p => (yOf(p) / SVG_H) * 100 - 4);
  const labelTops = mcAvoidCollisions(rawTops);
  const labelLeft = `${(W / 1000) * 100 + 1}%`;

  const onMove = e => {
    const el = chartRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / (rect.width * W / 1000)));
    setHoverT(winStart + frac * windowMs);
  };

  const hover = hoverT == null ? { active: false } : (() => {
    let bt = allTs[0] ?? liveNow;
    for (const t of allTs) { if (Math.abs(t - hoverT) < Math.abs(bt - hoverT)) bt = t; }
    const hx     = xOf(bt);
    const hProbs = seriesData.map(s => getValAt(s, bt));
    return {
      active:  true,
      x:       hx.toFixed(1),
      ys:      hProbs.map(p => yOf(p).toFixed(1)),
      tipLeft: `${(hx / 1000 * 100).toFixed(1)}%`,
      time:    fmtTip(new Date(bt)),
      probs:   hProbs.map(p => Math.round(p * 100)),
    };
  })();

  return (
    <div>
      {/* Header: volume + range tabs */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <span style={{ font: `600 13px ${FONT_BODY}`, color: "#93a7bd" }}>
          Volume: <b style={{ color: TEXT, fontWeight: 800 }}>—</b>
        </span>
        <div style={{ display: "flex", gap: "2px" }}>
          {MC_RANGES.map(r => (
            <button key={r} onClick={() => { setRange(r); setHoverT(null); }} style={{
              padding: "5px 11px", borderRadius: "7px", border: "none", cursor: "pointer",
              font: `700 12px ${FONT_BODY}`,
              background: r === range ? "rgba(255,255,255,0.14)" : "transparent",
              color: r === range ? "#ffffff" : "#8397ad",
            }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart + Y-axis column */}
      <div style={{ display: "flex", gap: "40px", paddingRight: "16px" }}>

        {/* SVG plot area */}
        <div style={{ flex: 1, minWidth: 0, position: "relative" }}
          ref={chartRef} onMouseMove={onMove} onMouseLeave={() => setHoverT(null)}>

          <svg viewBox="0 0 1000 380" preserveAspectRatio="none"
            style={{ width: "100%", height: "260px", display: "block", cursor: "crosshair", shapeRendering: "geometricPrecision", overflow: "visible" }}>

            {/* Dashed grid lines */}
            {[20, 110, 200, 290, 360].map(y => (
              <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="rgba(255,255,255,0.22)" strokeDasharray="4 4" />
            ))}

            {hover.active && (
              <defs>
                <clipPath id="mc-left-clip">
                  <rect x="0" y="0" width={hover.x} height="380" />
                </clipPath>
              </defs>
            )}

            {/* Lines — solid where apart, dashed interleaved where overlapping */}
            {paths.map((p, i) => {
              const t     = getOptionTheme(i, answers.length);
              const isSel = i === selectedIdx;
              const sw    = isSel ? 3 : 2.5;
              const seg   = 16;
              const off   = -(i * seg);
              const greyColor = "rgba(255,255,255,0.15)";
              return (
                <g key={i} style={{ cursor: "pointer" }} onClick={() => onSelectIdx(i)}>
                  {/* Solid segments */}
                  <path d={p.solidD} fill="none" strokeLinejoin="round"
                    stroke={hover.active ? greyColor : t.color} strokeWidth={sw}
                    strokeOpacity={hover.active ? 1 : (isSel ? 1 : 0.85)} />
                  {hover.active && <path d={p.solidD} fill="none" strokeLinejoin="round"
                    stroke={t.color} strokeWidth={sw} clipPath="url(#mc-left-clip)" />}
                  {/* Dashed overlap segments */}
                  <path d={p.dashD} fill="none" strokeLinejoin="round"
                    stroke={hover.active ? greyColor : t.color} strokeWidth={sw}
                    strokeDasharray={`${seg} ${seg}`} strokeDashoffset={off}
                    strokeOpacity={hover.active ? 1 : (isSel ? 1 : 0.85)} />
                  {hover.active && <path d={p.dashD} fill="none" strokeLinejoin="round"
                    stroke={t.color} strokeWidth={sw}
                    strokeDasharray={`${seg} ${seg}`} strokeDashoffset={off}
                    clipPath="url(#mc-left-clip)" />}
                </g>
              );
            })}

            {/* Pulsing dot — hidden during hover */}
            {!hover.active && paths.map((p, i) => {
              const t  = getOptionTheme(i, answers.length);
              if (!p.last) return null;
              const ex = p.last[0].toFixed(1);
              const ey = p.last[1].toFixed(1);
              return (
                <g key={i}>
                  <circle cx={ex} cy={ey} r="5" fill="none" stroke={t.color} strokeWidth="2" opacity="0.6">
                    <animate attributeName="r"       values="5;15;5"        dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.55;0;0.55"   dur="1.8s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={ex} cy={ey} r="5" fill={t.color} />
                </g>
              );
            })}

            {/* Hover crosshair + intercept dots */}
            {hover.active && (
              <g>
                <line x1={hover.x} y1="0" x2={hover.x} y2="380"
                  stroke="rgba(255,255,255,0.35)" strokeDasharray="3 4" />
                {paths.map((p, i) => {
                  const t = getOptionTheme(i, answers.length);
                  return (
                    <circle key={i} cx={hover.x} cy={hover.ys[i]}
                      r={i === selectedIdx ? 5 : 4}
                      fill="#0c1a2c" stroke={t.color} strokeWidth="2.5" />
                  );
                })}
              </g>
            )}
          </svg>

          {/* Hover date label (HTML so it doesn't scale with SVG) */}
          {hover.active && (
            <div style={{
              position: "absolute", top: 0,
              left: parseFloat(hover.x) > 700 ? "auto" : hover.tipLeft,
              right: parseFloat(hover.x) > 700 ? `${100 - parseFloat(hover.tipLeft)}%` : "auto",
              font: `600 11px ${FONT_BODY}`, color: "#5d7189",
              whiteSpace: "nowrap", pointerEvents: "none", userSelect: "none",
              padding: "2px 4px",
            }}>{hover.time}</div>
          )}

          {/* Unified labels — exact position when static, collision-avoided when hovering */}
          {(() => {
            const SVG_H = 380;
            const rawTops = paths.map((p, i) => {
              const svgY = hover.active ? parseFloat(hover.ys[i]) : yOf(lastProbs[i]);
              return (svgY / SVG_H) * 100 - 4;
            });
            // Only apply collision avoidance during hover
            const tops = hover.active ? mcAvoidCollisions(rawTops) : rawTops;
            const probs = hover.active ? hover.probs : answers.map((a, i) => Math.round(lastProbs[i] * 100));
            const leftPos = hover.active ? `calc(${hover.tipLeft} + 12px)` : labelLeft;
            return answers.map((a, i) => {
              const t    = getOptionTheme(i, answers.length);
              const name = a.answerLabel.length > 14 ? a.answerLabel.slice(0, 13) + "…" : a.answerLabel;
              return (
                <div key={i} style={{
                  position: "absolute", left: leftPos, top: `${tops[i]}%`,
                  whiteSpace: "nowrap", pointerEvents: "none", zIndex: 5,
                  transition: "top 0.35s ease, left 0.35s ease",
                }}>
                  <div style={{ font: `700 12px ${FONT_BODY}`, color: t.color }}>{name}</div>
                  <div style={{ font: `800 14px ${FONT_HEAD}`, color: t.color }}>{probs[i]}%</div>
                </div>
              );
            });
          })()}

          {/* X-axis — sliding timeline, labels drift left as liveNow advances */}
          <div style={{ position: "relative", height: "18px", marginTop: "8px", overflow: "hidden" }}>
            {slideLabels.map(({ t, leftPct }) => (
              <span key={Math.round(t / labelStepMs)} style={{
                position: "absolute",
                left: `${leftPct}%`,
                transform: "translateX(-50%)",
                transition: "left 1s linear",
                font: `600 11px ${FONT_BODY}`,
                color: "#5d7189",
                whiteSpace: "nowrap",
                userSelect: "none",
              }}>
                {fmtX(new Date(t))}
              </span>
            ))}
          </div>
        </div>

        {/* Right Y-axis column */}
        <div style={{ flexShrink: 0, width: "38px", height: "260px", display: "flex", flexDirection: "column", justifyContent: "space-between", font: `600 11px ${FONT_BODY}`, color: "#5d7189", textAlign: "right" }}>
          {yTicks.map((t, i) => <span key={i}>{t}</span>)}
        </div>
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
  if (isLoading) return (
    <div style={{ padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", font: `500 12px ${FONT_BODY}`, color: MUTED2 }}>
      Calculating sale preview...
    </div>
  );
  if (quoteError) return (
    <div style={{ background: "rgba(251,91,107,0.12)", border: "1px solid rgba(251,91,107,0.3)", borderRadius: "8px", padding: "10px 12px", font: `500 12px ${FONT_BODY}`, color: "#fb8b96" }}>
      {quoteError}
    </div>
  );
  if (!quote) return null;

  const panelColor = quote.allowed
    ? { border: "rgba(186,214,89,0.3)", bg: "rgba(186,214,89,0.07)" }
    : { border: "rgba(255,193,7,0.35)", bg: "rgba(255,193,7,0.07)" };

  return (
    <div style={{ borderRadius: "10px", border: `1px solid ${panelColor.border}`, background: panelColor.bg, padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ font: `700 13px ${FONT_BODY}`, color: TEXT }}>Sale Preview</span>
        <span style={{ font: `600 11px ${FONT_BODY}`, color: quote.allowed ? "#C6E06C" : "#ffc107", background: "rgba(255,255,255,0.07)", borderRadius: "6px", padding: "2px 8px" }}>
          {quote.allowed ? "Allowed" : "Adjust amount"}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", font: `600 12px ${FONT_BODY}` }}>
        <span style={{ color: MUTED2 }}>Sale order</span><span style={{ color: TEXT }}>{quote.requestedCredits}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", font: `600 12px ${FONT_BODY}` }}>
        <span style={{ color: MUTED2 }}>Credits received</span><span style={{ color: "#C6E06C" }}>{quote.netProceeds ?? quote.saleValue}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", font: `600 12px ${FONT_BODY}` }}>
        <span style={{ color: MUTED2 }}>Shares sold</span><span style={{ color: TEXT }}>{quote.sharesSold}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", font: `600 12px ${FONT_BODY}` }}>
        <span style={{ color: MUTED2 }}>Value per share</span><span style={{ color: TEXT }}>{quote.valuePerShare}</span>
      </div>
      {quote.message && <div style={{ font: `500 11px ${FONT_BODY}`, color: MUTED2 }}>{quote.message}</div>}
      {!quote.allowed && quote.suggestedAmounts?.length > 0 && (
        <div>
          <div style={{ font: `600 11px ${FONT_BODY}`, color: MUTED2, marginBottom: "6px" }}>TRY A VALID AMOUNT</div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {quote.suggestedAmounts.map(s => (
              <button key={s} onClick={() => onSelectAmount(s)} style={{ padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.10)", border: "none", color: TEXT, font: `600 12px ${FONT_BODY}`, cursor: "pointer" }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Multi-choice trade panel ─────────────────────────────────────────────────
function MultiChoiceTradePanel({ answers, selectedIdx, onSelectIdx, token, isLoggedIn, isMarketOpen, onSuccess }) {
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
    if (!selectedAnswer || !amount || amount < 1) { setProjection(null); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setProjLoading(true);
      try {
        const res = await fetch(`${API_URL}/v0/marketprojection/${selectedAnswer.marketId}/${amount}/${buyOutcome}/`);
        if (res.ok) setProjection(await res.json());
        else setProjection(null);
      } catch { setProjection(null); }
      finally { setProjLoading(false); }
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
      .then(data => {
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
    fetchSaleQuote({ marketId: selectedAnswer.marketId, outcome: "YES", amount: sellAmount }, token)
      .then(q => setSaleQuote(q))
      .catch(err => { setSaleQuote(null); setQuoteError(err.message); })
      .finally(() => setIsQuoteLoading(false));
  };

  const handleSell = () => {
    if (!selectedAnswer) return;
    setIsSellSubmitting(true);
    const saleData = { marketId: selectedAnswer.marketId, outcome: "YES", amount: sellAmount };
    fetchSaleQuote(saleData, token)
      .then(quote => {
        setSaleQuote(quote);
        if (!quote.allowed) {
          alert(quote.message || "Sale not allowed. Try a different amount.");
          setIsSellSubmitting(false);
          return;
        }
        submitSale(
          saleData,
          token,
          (data) => {
            alert(buildMCSaleSuccessMessage(data));
            setSellShares({ yesSharesOwned: 0, value: 0 });
            setSellAmount(1);
            setSaleQuote(null);
            setIsSellSubmitting(false);
            window.dispatchEvent(new Event(USER_CREDIT_REFRESH_EVENT));
            onSuccess?.();
          },
          (err) => {
            alert(`Sale failed: ${err.message}`);
            setIsSellSubmitting(false);
          }
        );
      })
      .catch(err => {
        alert(`Sale quote failed: ${err.message}`);
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
    setError(""); setSuccess("");
    setSubmitting(true);
    submitBet(
      { marketId: selectedAnswer.marketId, amount, outcome: buyOutcome },
      token,
      (data) => {
        setSubmitting(false);
        setSuccess(`Bet placed! $${data.amount || amount} on ${selectedAnswer.answerLabel}.`);
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
  const outcomeProb = buyOutcome === "YES" ? currentProb : (1 - currentProb);
  const priceCentsOutcome = Math.round(outcomeProb * 100);
  const shares = amount > 0 && outcomeProb > 0 ? (amount / outcomeProb).toFixed(2) : "—";
  const potReturn = amount > 0 && outcomeProb > 0 ? (amount / outcomeProb).toFixed(2) : "—";

  if (!isLoggedIn) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {answers.map((a, i) => (
          <OptionRow key={a.marketId || i} answer={a} index={i} total={answers.length} selected={false} onClick={() => {}} />
        ))}
        <div style={{
          marginTop: "8px", padding: "18px 16px", borderRadius: "14px",
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
          textAlign: "center",
        }}>
          <div style={{ font: `700 14px ${FONT_BODY}`, color: TEXT, marginBottom: "4px" }}>Sign in to trade</div>
          <div style={{ font: `500 12px ${FONT_BODY}`, color: MUTED3 }}>You need an account to participate</div>
        </div>
      </div>
    );
  }

  if (!isMarketOpen) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {answers.map((a, i) => (
          <OptionRow key={a.marketId || i} answer={a} index={i} total={answers.length} selected={false} onClick={() => {}} />
        ))}
        <div style={{
          marginTop: "8px", padding: "16px", borderRadius: "14px",
          background: "rgba(255,193,7,0.07)", border: "1px solid rgba(255,193,7,0.22)",
          textAlign: "center", font: `600 13px ${FONT_BODY}`, color: "#ffc107",
        }}>
          Market closed — awaiting resolution
        </div>
      </div>
    );
  }

  const maxSellCredits = Math.max(0, Number(sellShares.value) || 0);
  const isSellActionDisabled = sellSharesLoading || isSellSubmitting || isQuoteLoading;

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
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)", marginTop: "10px" }}>
        {[["buy", "Buy"], ["sell", "Sell"]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1, padding: "10px 0", border: "none", cursor: "pointer",
              background: "transparent", font: `700 13px ${FONT_BODY}`,
              color: tab === key ? TEXT : MUTED2,
              boxShadow: tab === key ? "inset 0 -2px 0 #9cc9f1" : "none",
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
            {["YES", "NO"].map(o => (
              <button key={o} onClick={() => setBuyOutcome(o)} style={{
                flex: 1, padding: "9px 0", borderRadius: "10px", border: "none", cursor: "pointer",
                font: `700 13px ${FONT_BODY}`,
                background: buyOutcome === o
                  ? (o === "YES" ? "rgba(186,214,89,0.18)" : "rgba(251,91,107,0.18)")
                  : "rgba(255,255,255,0.05)",
                color: buyOutcome === o
                  ? "#000"
                  : MUTED2,
                boxShadow: buyOutcome === o
                  ? `inset 0 0 0 1.5px ${o === "YES" ? "#BAD659" : "#fb5b6b"}`
                  : "inset 0 0 0 1px rgba(255,255,255,0.08)",
                transition: "all .15s",
              }}>{o}</button>
            ))}
          </div>

          <div style={{ marginTop: "10px" }}>
            <div style={{ font: `700 11px ${FONT_BODY}`, letterSpacing: ".07em", color: MUTED2, marginBottom: "8px" }}>AMOUNT</div>
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "rgba(0,0,0,0.30)", border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: "11px", padding: "4px 6px",
            }}>
              <button onClick={() => setAmount((v) => clamp((parseInt(v) || 0) - 10, 1, 99999))} style={{ width: "34px", height: "34px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.06)", color: TEXT, font: `700 20px ${FONT_BODY}`, cursor: "pointer" }}>−</button>
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "2px" }}>
                <span style={{ font: `700 17px ${FONT_BODY}`, color: MUTED }}>$</span>
                <input type="number" min="1" value={amount} onChange={(e) => { const v = parseInt(e.target.value, 10); setAmount(isNaN(v) ? "" : v); }} style={{ width: "72px", background: "transparent", border: "none", color: TEXT, font: `800 22px ${FONT_HEAD}`, textAlign: "center", outline: "none", MozAppearance: "textfield" }} />
              </div>
              <button onClick={() => setAmount((v) => (parseInt(v) || 0) + 10)} style={{ width: "34px", height: "34px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.06)", color: TEXT, font: `700 20px ${FONT_BODY}`, cursor: "pointer" }}>+</button>
            </div>
            <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
              {PRESETS.map((p) => (
                <button key={p} onClick={() => setAmount(v => (parseInt(v) || 0) + p)} style={{ flex: 1, padding: "7px 0", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.04)", color: "#b7c6d6", font: `700 12px ${FONT_BODY}`, cursor: "pointer" }}>+{p}</button>
              ))}
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "12px", marginTop: "4px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <StatRow label="Avg price" value={`${priceCentsOutcome}¢`} />
            <StatRow label="New probability" value={projLoading ? "..." : projection?.projectedProbability != null ? `${Math.round(projection.projectedProbability * 100)}%` : "—"} />
            <StatRow label="Shares" value={shares} />
            <StatRow label="Potential return" value={potReturn !== "—" ? `$${potReturn}` : "—"} valueColor={YES_TEXT} />
          </div>

          {error && <div style={{ background: "rgba(251,91,107,0.12)", border: "1px solid rgba(251,91,107,0.3)", borderRadius: "8px", padding: "10px 12px", font: `500 12px ${FONT_BODY}`, color: NO_TEXT }}>{error}</div>}
          {success && <div style={{ background: "rgba(186,214,89,0.12)", border: "1px solid rgba(186,214,89,0.3)", borderRadius: "8px", padding: "10px 12px", font: `600 13px ${FONT_BODY}`, color: YES_TEXT }}>{success}</div>}

          <button
            onClick={handleBuy}
            disabled={submitting || !amount || amount < 1}
            style={{
              width: "100%", padding: "14px", borderRadius: "12px", border: "none",
              font: `800 16px ${FONT_HEAD}`,
              cursor: submitting || !amount ? "not-allowed" : "pointer",
              background: submitting || !amount ? "rgba(255,255,255,0.08)" : selectedTheme.gradient,
              color: submitting || !amount ? MUTED2 : (selectedIdx === 0 ? "#001a18" : "#fff"),
              boxShadow: submitting || !amount ? "none" : selectedTheme.shadow,
              transition: "all .15s", marginTop: "4px", opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Processing..." : `Buy ${buyOutcome} — ${selectedAnswer?.answerLabel || "Option"}`}
          </button>
        </>
      ) : (
        /* ── SELL TAB ── */
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px" }}>
          {!selectedAnswer ? (
            <div style={{ textAlign: "center", font: `500 13px ${FONT_BODY}`, color: MUTED2, padding: "16px 0" }}>Select an option above to sell</div>
          ) : sellSharesLoading ? (
            <div style={{ textAlign: "center", font: `500 13px ${FONT_BODY}`, color: MUTED2, padding: "16px 0" }}>Loading positions...</div>
          ) : sellShares.yesSharesOwned < 1 ? (
            <div style={{ textAlign: "center", font: `500 13px ${FONT_BODY}`, color: MUTED2, padding: "16px 0" }}>No shares owned in {selectedAnswer.answerLabel}</div>
          ) : (
            <>
              {/* Shares badge */}
              <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
                <div style={{ padding: "8px 16px", borderRadius: "10px", background: "rgba(186,214,89,0.12)", border: "1px solid rgba(186,214,89,0.3)", textAlign: "center" }}>
                  <div style={{ font: `700 11px ${FONT_BODY}`, color: YES_TEXT, letterSpacing: ".06em" }}>{selectedAnswer.answerLabel}</div>
                  <div style={{ font: `800 18px ${FONT_HEAD}`, color: TEXT }}>{sellShares.yesSharesOwned} shares</div>
                  <div style={{ font: `600 12px ${FONT_BODY}`, color: MUTED2 }}>Value: {sellShares.value}</div>
                </div>
              </div>

              {/* Sale order input */}
              <div>
                <div style={{ font: `700 11px ${FONT_BODY}`, letterSpacing: ".07em", color: MUTED2, marginBottom: "8px" }}>SALE ORDER</div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,0,0,0.30)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "11px", padding: "4px 6px" }}>
                  <button onClick={() => setSellAmount(v => Math.max(1, (parseInt(v) || 0) - 1))} style={{ width: "34px", height: "34px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.06)", color: TEXT, font: `700 20px ${FONT_BODY}`, cursor: "pointer" }}>−</button>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "2px" }}>
                    <span style={{ font: `700 17px ${FONT_BODY}`, color: MUTED }}>$</span>
                    <input
                      type="number" min="1" value={sellAmount}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10) || 0;
                        setSaleQuote(null); setQuoteError("");
                        setSellAmount(maxSellCredits > 0 ? Math.min(v, maxSellCredits) : v);
                      }}
                      style={{ width: "72px", background: "transparent", border: "none", color: TEXT, font: `800 22px ${FONT_HEAD}`, textAlign: "center", outline: "none", MozAppearance: "textfield" }}
                    />
                  </div>
                  <button onClick={() => setSellAmount(v => maxSellCredits > 0 ? Math.min((parseInt(v) || 0) + 1, maxSellCredits) : (parseInt(v) || 0) + 1)} style={{ width: "34px", height: "34px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.06)", color: TEXT, font: `700 20px ${FONT_BODY}`, cursor: "pointer" }}>+</button>
                </div>
              </div>

              <MCSellQuotePanel quote={saleQuote} quoteError={quoteError} isLoading={isQuoteLoading} onSelectAmount={(a) => { setSellAmount(a); setSaleQuote(null); }} />

              {/* Action buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", padding: "10px" }}>
                <button
                  onClick={handleSell}
                  disabled={isSellActionDisabled}
                  style={{
                    width: "100%", padding: "14px", borderRadius: "12px", border: "none",
                    font: `800 16px ${FONT_HEAD}`,
                    cursor: isSellActionDisabled ? "not-allowed" : "pointer",
                    background: isSellActionDisabled ? "rgba(255,255,255,0.08)" : "linear-gradient(180deg,#BAD659,#AABA49)",
                    color: isSellActionDisabled ? MUTED2 : "#1a1a00",
                    boxShadow: isSellActionDisabled ? "none" : "0 8px 22px rgba(186,214,89,0.28)",
                    transition: "all .15s", opacity: isSellSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSellSubmitting ? "Processing..." : `Confirm Sale — ${selectedAnswer.answerLabel}`}
                </button>
                <button
                  onClick={handleRequestQuote}
                  disabled={isSellActionDisabled}
                  style={{
                    width: "100%", padding: "10px", borderRadius: "10px",
                    border: "1px solid rgba(186,214,89,0.40)", background: "transparent",
                    color: isSellActionDisabled ? MUTED2 : YES_TEXT,
                    font: `700 13px ${FONT_HEAD}`,
                    cursor: isSellActionDisabled ? "not-allowed" : "pointer",
                    opacity: isSellActionDisabled ? 0.5 : 1, transition: "all .15s",
                  }}
                >
                  {isQuoteLoading ? "Loading Terms..." : "Terms"}
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
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", padding: "13px 16px", borderRadius: "12px",
        border: selected ? `1px solid ${theme.activeBorder}` : `1px solid ${theme.border}`,
        background: selected ? theme.bg : "rgba(255,255,255,0.02)",
        cursor: "pointer", transition: "all .15s", textAlign: "left",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{
          width: "8px", height: "8px", borderRadius: "50%",
          background: theme.color, flexShrink: 0,
        }} />
        <span style={{ font: `600 14px ${FONT_BODY}`, color: selected ? theme.text : TEXT }}>
          {answer.answerLabel}
        </span>
      </div>
      <span style={{ font: `700 14px ${FONT_HEAD}`, color: selected ? theme.color : TEXT }}>
        {priceCents}¢
      </span>
    </button>
  );
}

function StatRow({ label, value, valueColor }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", font: `600 13px ${FONT_BODY}` }}>
      <span style={{ color: MUTED }}>{label}</span>
      <span style={{ color: valueColor || TEXT }}>{value}</span>
    </div>
  );
}

// ─── Multi-choice full layout ─────────────────────────────────────────────────
function MultiChoiceLayout({
  market, creator, numUsers, totalVolume,
  probabilityChanges, marketId, username, token,
  isLoggedIn, refetchData, isMobile,
}) {
  const [groupData, setGroupData] = useState(null);
  const [groupLoading, setGroupLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const groupId = market?.marketGroup?.id;
  const groupTitle = market?.marketGroup?.questionTitle || market?.questionTitle;
  const stewardUsername = stewardUsernameFor(market, market?.creatorUsername);
  const canResolve = !market?.isResolved && String(username || "").trim() === String(stewardUsername || "").trim();
  const closesLabel = market?.isResolved ? "Closed" : formatResolutionDate(market?.resolutionDateTime);
  const isMarketOpen =
    !market?.isResolved &&
    market?.resolutionDateTime &&
    new Date(market.resolutionDateTime) > new Date();

  useEffect(() => {
    if (!groupId) { setGroupLoading(false); return; }
    let cancelled = false;
    setGroupLoading(true);
    getMarketGroupDetails(groupId)
      .then((data) => { if (!cancelled) setGroupData(data); })
      .catch(() => { if (!cancelled) setGroupData(null); })
      .finally(() => { if (!cancelled) setGroupLoading(false); });
    return () => { cancelled = true; };
  }, [groupId]);

  const answers = [...(groupData?.answers || [])]
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const handleSuccess = () => {
    if (refetchData) refetchData();
    setRefreshTrigger((p) => p + 1);
  };

  const creatorUsername = market?.creatorUsername || creator?.username || "unknown";

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{
        font: `600 12px ${FONT_BODY}`, color: MUTED2,
        marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px",
      }}>
        <Link
          to="/new-markets"
          style={{ color: COLOR.accent, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Markets
        </Link>
        {!isMobile && groupTitle && (
          <>
            <span style={{ opacity: 0.4 }}>/</span>
            <span style={{ color: "#93a7bd" }}>{groupTitle.slice(0, 60)}</span>
          </>
        )}
      </div>

      {/* Resolution alert */}
      <ResolutionAlert isResolved={market?.isResolved} resolutionResult={market?.resolutionResult} market={market} />

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: "12px",
        marginBottom: isMobile ? "16px" : "22px",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{
            margin: "0 0 8px",
            font: `800 ${isMobile ? "19px" : "26px"}/1.25 ${FONT_HEAD}`,
            letterSpacing: "-.01em", color: TEXT, wordBreak: "break-word",
          }}>
            {groupTitle}
          </h1>
          <div style={{
            display: "flex", alignItems: "center", gap: "14px",
            font: `600 12.5px ${FONT_BODY}`, color: "#8ca0b6", flexWrap: "wrap",
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8ca0b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              @{creatorUsername}
            </span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span>Closes {closesLabel}</span>
          </div>
        </div>
        {canResolve && (
          <div style={{ flexShrink: 0 }}>
            <ResolveModalButton
              marketId={marketId} token={token} market={market}
              onResolved={handleSuccess} disabled={!token}
            />
          </div>
        )}
      </div>

      {/* 2-col layout */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 340px",
        gap: isMobile ? "16px" : "22px",
        alignItems: "start",
      }}>
        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

          {/* Trade panel on mobile */}
          {isMobile && (
            <div style={{ ...MARKET_CARD, padding: "16px" }}>
              {groupLoading ? (
                <div style={{ textAlign: "center", color: MUTED2, font: `500 13px ${FONT_BODY}`, padding: "24px 0" }}>Loading options...</div>
              ) : answers.length > 0 ? (
                <MultiChoiceTradePanel
                  answers={answers} selectedIdx={selectedIdx} onSelectIdx={setSelectedIdx}
                  token={token} isLoggedIn={isLoggedIn} isMarketOpen={isMarketOpen}
                  onSuccess={handleSuccess}
                />
              ) : null}
            </div>
          )}

          {/* Chart card */}
          <div style={{ ...MARKET_CARD, padding: isMobile ? "14px" : "20px 22px" }}>
            {groupLoading ? (
              <div style={{ height: "240px", display: "flex", alignItems: "center", justifyContent: "center", color: MUTED2 }}>
                Loading chart...
              </div>
            ) : answers.length > 0 ? (
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
            )}
          </div>

          {/* Description */}
          {market?.description ? (
            <div style={{ ...MARKET_CARD, padding: isMobile ? "14px" : "20px 22px" }}>
              <div style={{ font: `700 12px ${FONT_BODY}`, letterSpacing: ".08em", color: MUTED2, marginBottom: "10px" }}>RULES</div>
              <p style={{ margin: 0, font: `400 14px/1.6 ${FONT_BODY}`, color: "#b7c6d6" }}>
                {market.description}
              </p>
            </div>
          ) : null}

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: isMobile ? "8px" : "12px" }}>
            <StatCard label="Volume" value={`$${fmt(totalVolume)}`} />
            <StatCard label="Traders" value={fmt(numUsers)} />
            <StatCard label="Closes" value={closesLabel} />
          </div>

          {/* Activity tabs */}
          <div style={{ ...MARKET_CARD, overflow: "hidden" }}>
            <ActivityTabs marketId={marketId} market={market} refreshTrigger={refreshTrigger} variant="dark" />
          </div>
        </div>

        {/* RIGHT (desktop) */}
        {!isMobile && (
          <div style={{
            ...MARKET_CARD,
            padding: "18px", position: "sticky", top: "16px",
          }}>
            {groupLoading ? (
              <div style={{ textAlign: "center", color: MUTED2, font: `500 13px ${FONT_BODY}`, padding: "24px 0" }}>
                Loading options...
              </div>
            ) : answers.length > 0 ? (
              <MultiChoiceTradePanel
                answers={answers} selectedIdx={selectedIdx} onSelectIdx={setSelectedIdx}
                token={token} isLoggedIn={isLoggedIn} isMarketOpen={isMarketOpen}
                onSuccess={handleSuccess}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Binary chart (real data, always full-width) ──────────────────────────────
const BC_RANGES     = ["Live", "1h", "1d", "1w", "1m"];
const BC_WINDOW_MS  = { Live: 5*60_000, "1h": 3600_000, "1d": 86400_000, "1w": 7*86400_000, "1m": 30*86400_000 };
const BC_LABEL_STEP = { Live: 60_000, "1h": 15*60_000, "1d": 4*3600_000, "1w": 86400_000, "1m": 5*86400_000 };

function BinaryChart({ probabilityChanges, currentProbability: rawProb, yesLabel = "Yes", noLabel = "No", totalVolume = 0 }) {
  const curP     = Math.max(0.01, Math.min(0.99, Number(rawProb) || 0.5));
  const [range, setRange] = useState("Live");
  const [hoverT, setHoverT] = useState(null);
  const chartRef = useRef(null);

  const [liveNow, setLiveNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setLiveNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const W = 780, SVG_H = 380, TOP = 20, BOT = 360;
  const windowMs = BC_WINDOW_MS[range];
  const winStart = liveNow - windowMs;

  const allChanges = useMemo(() => {
    const arr = Array.isArray(probabilityChanges) ? probabilityChanges : [];
    return arr
      .map(c => ({ t: new Date(c.timestamp || c.Timestamp).getTime(), p: Number(c.probability ?? c.Probability) }))
      .filter(c => Number.isFinite(c.t) && Number.isFinite(c.p))
      .sort((a, b) => a.t - b.t);
  }, [probabilityChanges]);

  // Build YES series — always anchor at winStart so line spans full width
  const yesData = useMemo(() => {
    const before = allChanges.filter(c => c.t < winStart);
    const within = allChanges.filter(c => c.t >= winStart && c.t < liveNow);
    const anchorP = before.length ? before[before.length - 1].p
      : within.length ? within[0].p : curP;
    return [{ t: winStart, p: anchorP }, ...within, { t: liveNow, p: curP }];
  }, [allChanges, winStart, liveNow, curP]);

  const noData = useMemo(() => yesData.map(c => ({ t: c.t, p: 1 - c.p })), [yesData]);

  const allProbs = [...yesData.map(c => c.p), ...noData.map(c => c.p)].filter(Number.isFinite);
  const dataMin  = allProbs.length ? Math.min(...allProbs) : 0;
  const dataMax  = allProbs.length ? Math.max(...allProbs) : 1;
  const pad5     = Math.max(0.05, (dataMax - dataMin) * 0.25);
  const yMin     = Math.max(0, dataMin - pad5);
  const yMax     = Math.min(1, dataMax + pad5);
  const yrng     = yMax - yMin || 1;
  const yOf      = p => BOT - ((p - yMin) / yrng) * (BOT - TOP);
  const yTicks   = [yMax, yMin + yrng*0.667, yMin + yrng*0.333, yMin].map(v => Math.round(v*100) + "%");

  const xOf = t => ((t - winStart) / windowMs) * W;

  const CROSS_THRESH = 0.07; // lines within 7% of each other = "crossing region"

  const ptsToD = pts => {
    if (pts.length < 2) return "";
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) d += ` H${pts[i][0].toFixed(1)} V${pts[i][1].toFixed(1)}`;
    return d;
  };

  const splitPath = (pts, closeFlags) => {
    let solidSegs = [], dashSegs = [], cur = [], curClose = closeFlags[0];
    for (let i = 0; i < pts.length; i++) {
      const c = closeFlags[i];
      if (c !== curClose) {
        cur.push(pts[i]); // include transition point in both
        (curClose ? dashSegs : solidSegs).push([...cur]);
        cur = [pts[i]];
        curClose = c;
      }
      cur.push(pts[i]);
    }
    (curClose ? dashSegs : solidSegs).push(cur);
    return { solidD: solidSegs.map(ptsToD).join(" "), dashD: dashSegs.map(ptsToD).join(" ") };
  };

  const buildPath = data => {
    const pts = data.map(c => [xOf(c.t), yOf(c.p)]);
    return { pts, last: pts[pts.length - 1] };
  };
  const yesPts = yesData.map(c => [xOf(c.t), yOf(c.p)]);
  const noPts  = noData.map(c => [xOf(c.t), yOf(c.p)]);
  const closeFlags = yesData.map((c, i) => {
    const gap = Math.abs(c.p - 0.5);
    if (gap >= CROSS_THRESH) return false;
    // If next point is already diverging further, end dash zone immediately
    const nextGap = i + 1 < yesData.length ? Math.abs(yesData[i + 1].p - 0.5) : gap;
    return nextGap <= gap + 0.03; // allow tiny overshoot, but if clearly separating → solid
  });
  const yesSplit = splitPath(yesPts, closeFlags);
  const noSplit  = splitPath(noPts,  closeFlags);
  const paths  = [
    { ...buildPath(yesData), solidD: yesSplit.solidD, dashD: yesSplit.dashD },
    { ...buildPath(noData),  solidD: noSplit.solidD,  dashD: noSplit.dashD  },
  ];
  const themes = [OPTION_THEMES[0], OPTION_THEMES[1]];

  const pad2 = v => String(v).padStart(2, "0");
  const fmtX = d => {
    if (range === "Live" || range === "1h" || range === "1d") return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const fmtTip = d => {
    const mon = MONTHS[d.getMonth()];
    const day = d.getDate();
    const h = d.getHours(), m = pad2(d.getMinutes());
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${mon} ${day}, ${h12}:${m} ${ampm}`;
  };

  const labelStepMs = BC_LABEL_STEP[range];
  const firstT      = Math.ceil(winStart / labelStepMs) * labelStepMs;
  const slideLabels = [];
  for (let t = firstT; t <= liveNow + labelStepMs * 0.1; t += labelStepMs) {
    const frac = (t - winStart) / windowMs;
    if (frac >= -0.02 && frac <= 1.02) slideLabels.push({ t, leftPct: frac * 100 });
  }

  const lastYesP  = curP;
  const lastNoP   = 1 - curP;
  const rawTops   = [lastYesP, lastNoP].map(p => (yOf(p) / SVG_H) * 100 - 4);
  const labelTops = mcAvoidCollisions(rawTops);
  const labelLeft = `${(W / 1000) * 100 + 1}%`;

  const onMove = e => {
    const el = chartRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / (rect.width * W / 1000)));
    setHoverT(winStart + frac * windowMs);
  };

  const getValAt = (series, t) => {
    let v = series[0]?.p ?? 0.5;
    for (const c of series) { if (c.t <= t) v = c.p; else break; }
    return v;
  };

  const hover = hoverT == null ? { active: false } : (() => {
    const allTs = [...new Set([...yesData.map(c => c.t)])].sort((a, b) => a - b);
    let bt = allTs[0] ?? liveNow;
    for (const t of allTs) { if (Math.abs(t - hoverT) < Math.abs(bt - hoverT)) bt = t; }
    const hx = xOf(bt);
    const yp = getValAt(yesData, bt);
    return {
      active:  true,
      x:       hx.toFixed(1),
      ys:      [yOf(yp).toFixed(1), yOf(1 - yp).toFixed(1)],
      tipLeft: `${(hx / 1000 * 100).toFixed(1)}%`,
      time:    fmtTip(new Date(bt)),
      probs:   [Math.round(yp * 100), Math.round((1 - yp) * 100)],
    };
  })();

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <span style={{ font: `600 13px ${FONT_BODY}`, color: "#5d7189" }}>
          Volume: <b style={{ color: "#c3d1e0", fontWeight: 700 }}>${Number(totalVolume || 0).toLocaleString()}</b>
        </span>
        <div style={{ display: "flex", gap: "2px" }}>
          {BC_RANGES.map(r => (
            <button key={r} onClick={() => { setRange(r); setHoverT(null); }} style={{
              padding: "5px 11px", borderRadius: "7px", border: "none", cursor: "pointer",
              font: `700 12px ${FONT_BODY}`,
              background: r === range ? "rgba(255,255,255,0.14)" : "transparent",
              color: r === range ? "#ffffff" : "#8397ad",
            }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart + Y-axis */}
      <div style={{ display: "flex", gap: "40px", paddingRight: "16px" }}>
        <div style={{ flex: 1, minWidth: 0, position: "relative" }}
          ref={chartRef} onMouseMove={onMove} onMouseLeave={() => setHoverT(null)}>

          <svg viewBox="0 0 1000 380" preserveAspectRatio="none"
            style={{ width: "100%", height: "260px", display: "block", cursor: "crosshair", shapeRendering: "geometricPrecision", overflow: "visible" }}>

            {[20, 110, 200, 290, 360].map(y => (
              <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="rgba(255,255,255,0.22)" strokeDasharray="4 4" />
            ))}

            {hover.active && (
              <defs>
                <clipPath id="bc-left-clip">
                  <rect x="0" y="0" width={hover.x} height="380" />
                </clipPath>
              </defs>
            )}

            {/* Grey full lines (shown when hovering) or colored full lines (no hover) */}
            {paths.map((p, i) => {
              const fullD = p.pts.length < 2 ? "" : "M" + p.pts.map(pt => `${pt[0].toFixed(1)},${pt[1].toFixed(1)}`).join(" L");
              return (
                <g key={i}>
                  {/* Solid segment */}
                  <path d={p.solidD} fill="none" strokeLinejoin="round"
                    stroke={hover.active ? "rgba(255,255,255,0.15)" : themes[i].color}
                    strokeWidth="2.5" />
                  {/* Dashed crossing segment */}
                  <path d={p.dashD} fill="none" strokeLinejoin="round"
                    stroke={hover.active ? "rgba(255,255,255,0.15)" : themes[i].color}
                    strokeWidth="2.5" strokeDasharray="16 16" strokeDashoffset={-(i * 16)} />
                  {/* Colored overlay clipped to left of crosshair */}
                  {hover.active && <>
                    <path d={p.solidD} fill="none" strokeLinejoin="round"
                      stroke={themes[i].color} strokeWidth="2.5"
                      clipPath="url(#bc-left-clip)" />
                    <path d={p.dashD} fill="none" strokeLinejoin="round"
                      stroke={themes[i].color} strokeWidth="2.5"
                      strokeDasharray="16 16" strokeDashoffset={-(i * 16)}
                      clipPath="url(#bc-left-clip)" />
                  </>}
                </g>
              );
            })}

            {!hover.active && paths.map((p, i) => {
              if (!p.last) return null;
              const [ex, ey] = p.last;
              return (
                <g key={i}>
                  <circle cx={ex.toFixed(1)} cy={ey.toFixed(1)} r="5" fill="none" stroke={themes[i].color} strokeWidth="2" opacity="0.6">
                    <animate attributeName="r"       values="5;15;5"      dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.55;0;0.55" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={ex.toFixed(1)} cy={ey.toFixed(1)} r="5" fill={themes[i].color} />
                </g>
              );
            })}

            {hover.active && (
              <g>
                <line x1={hover.x} y1="0" x2={hover.x} y2="380" stroke="rgba(255,255,255,0.35)" strokeDasharray="3 4" />
                {paths.map((p, i) => (
                  <circle key={i} cx={hover.x} cy={hover.ys[i]} r="5" fill="#0c1a2c" stroke={themes[i].color} strokeWidth="2.5" />
                ))}
              </g>
            )}
          </svg>

          {/* Hover date label (HTML so it doesn't scale with SVG) */}
          {hover.active && (
            <div style={{
              position: "absolute", top: 0,
              left: parseFloat(hover.x) > 700 ? "auto" : hover.tipLeft,
              right: parseFloat(hover.x) > 700 ? `${100 - parseFloat(hover.tipLeft)}%` : "auto",
              font: `600 11px ${FONT_BODY}`, color: "#5d7189",
              whiteSpace: "nowrap", pointerEvents: "none", userSelect: "none",
              padding: "2px 4px",
            }}>{hover.time}</div>
          )}

          {/* Unified labels — follow dot on both X and Y axes */}
          {(() => {
            const SVG_H = 380;
            const rawTops = hover.active
              ? paths.map((p, i) => (parseFloat(hover.ys[i]) / SVG_H) * 100 - 4)
              : [lastYesP, lastNoP].map(p => (yOf(p) / SVG_H) * 100 - 4);
            const tops = mcAvoidCollisions(rawTops);
            const probs = hover.active
              ? hover.probs
              : [Math.round(lastYesP * 100), Math.round(lastNoP * 100)];
            const leftPos = hover.active ? `calc(${hover.tipLeft} + 12px)` : labelLeft;
            return [yesLabel, noLabel].map((lb, i) => (
              <div key={i} style={{
                position: "absolute",
                left: leftPos,
                top: `${tops[i]}%`,
                whiteSpace: "nowrap", pointerEvents: "none", zIndex: 5,
                transition: "top 0.35s ease, left 0.35s ease",
              }}>
                <div style={{ font: `700 12px ${FONT_BODY}`, color: themes[i].color }}>{lb}</div>
                <div style={{ font: `800 14px ${FONT_HEAD}`, color: themes[i].color }}>{probs[i]}%</div>
              </div>
            ));
          })()}

          {/* Sliding X-axis */}
          <div style={{ position: "relative", height: "18px", marginTop: "8px", overflow: "hidden" }}>
            {slideLabels.map(({ t, leftPct }) => (
              <span key={Math.round(t / labelStepMs)} style={{
                position: "absolute", left: `${leftPct}%`, transform: "translateX(-50%)",
                font: `600 11px ${FONT_BODY}`, color: "#5d7189", whiteSpace: "nowrap", userSelect: "none",
              }}>
                {fmtX(new Date(t))}
              </span>
            ))}
          </div>
        </div>

        {/* Y-axis */}
        <div style={{ flexShrink: 0, width: "38px", height: "260px", display: "flex", flexDirection: "column", justifyContent: "space-between", font: `600 11px ${FONT_BODY}`, color: "#5d7189", textAlign: "right" }}>
          {yTicks.map((t, i) => <span key={i}>{t}</span>)}
        </div>
      </div>
    </div>
  );
}

// ─── Binary layout (existing layout, unchanged) ───────────────────────────────
function BinaryLayout({
  market, creator, numUsers, totalVolume,
  currentProbability, probabilityChanges, marketId,
  username, token, isLoggedIn, refetchData, isMobile,
}) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const safeMarket = market ?? {};
  const creatorUsername = safeMarket.creatorUsername ?? creator?.username ?? "unknown";
  const stewardUsername = stewardUsernameFor(safeMarket, creatorUsername);
  const yesPct = Math.round(currentProbability * 100);
  const noPct = 100 - yesPct;
  const yesLabel = safeMarket.yesLabel || "Yes";
  const noLabel = safeMarket.noLabel || "No";
  const isMarketOpen = !safeMarket.isResolved && safeMarket.resolutionDateTime && new Date(safeMarket.resolutionDateTime) > new Date();
  const canResolve = !safeMarket.isResolved && String(username || "").trim() === String(stewardUsername || "").trim();
  const closesLabel = safeMarket.isResolved ? "Closed" : formatResolutionDate(safeMarket.resolutionDateTime);

  const handleTransactionSuccess = () => { if (refetchData) refetchData(); setRefreshTrigger((p) => p + 1); };
  const handleMarketResolved = () => { if (refetchData) refetchData(); setRefreshTrigger((p) => p + 1); };

  const tradePanelProps = {
    safeMarket, yesLabel, noLabel, yesPct, noPct,
    isMarketOpen, isLoggedIn, marketId, token,
    currentProbability, username, onSuccess: handleTransactionSuccess,
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ font: `600 12px ${FONT_BODY}`, color: MUTED2, marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
        <Link
          to="/new-markets"
          style={{ color: COLOR.accent, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Markets
        </Link>
        {!isMobile && (
          <>
            <span style={{ opacity: 0.4 }}>/</span>
            <span style={{ color: "#93a7bd" }}>{safeMarket.questionTitle?.slice(0, 50)}</span>
          </>
        )}
      </div>

      <ResolutionAlert isResolved={safeMarket.isResolved} resolutionResult={safeMarket.resolutionResult} market={safeMarket} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: isMobile ? "16px" : "22px" }}>
        {!isMobile && (
          <div style={{
            width: "52px", height: "56px", flexShrink: 0, borderRadius: "10px",
            background: "linear-gradient(160deg,#1d3a5f,#0f2138)",
            border: "1px solid rgba(255,255,255,0.10)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="26" height="26" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill="#eaf0f7" d="M255.03 33.813c-1.834-.007-3.664-.007-5.5.03-6.73.14-13.462.605-20.155 1.344.333.166.544.32.47.438L204.78 75.063l73.907 49.437-.125.188 70.625.28L371 79.282 342.844 52c-15.866-6.796-32.493-11.776-49.47-14.78-12.65-2.24-25.497-3.36-38.343-3.407zM190.907 88.25l-73.656 36.78-13.813 98.407 51.344 33.657 94.345-43.438 14.875-76.5-73.094-48.906zm196.344.344l-21.25 44.5 36.75 72.72 62.063 38.905 11.312-21.282c.225.143.45.403.656.75-.77-4.954-1.71-9.893-2.81-14.782-6.446-28.59-18.59-55.962-35.5-79.97-9.07-12.872-19.526-24.778-31.095-35.5l-20.125-5.342zm-302.656 23c-6.906 8.045-13.257 16.56-18.938 25.5-15.676 24.664-26.44 52.494-31.437 81.312C31.783 232.446 30.714 246.73 31 261l20.25 5.094 33.03-40.5L98.75 122.53l-14.156-10.936zm312.719 112.844l-55.813 44.75-3.47 101.093 39.626 21.126 77.188-49.594 4.406-78.75-.094.157-61.844-38.783zm-140.844 6.406l-94.033 43.312-1.218 76.625 89.155 57.376 68.938-36.437 3.437-101.75-66.28-39.126zm-224.22 49.75c.91 8.436 2.29 16.816 4.156 25.094 6.445 28.59 18.62 55.96 35.532 79.968 3.873 5.5 8.02 10.805 12.374 15.938l-9.374-48.156.124-.032-27.03-68.844-15.782-3.968zm117.188 84.844l-51.532 8.156 10.125 52.094c8.577 7.49 17.707 14.332 27.314 20.437 14.612 9.287 30.332 16.88 46.687 22.594l62.626-13.69-4.344-31.124-90.875-58.47zm302.437.5l-64.22 41.25-42 47.375 4.408 6.156c12.027-5.545 23.57-12.144 34.406-19.72 23.97-16.76 44.604-38.304 60.28-62.97 2.51-3.947 4.87-7.99 7.125-12.092zm-122.78 97.656l-79.94 9.625-25.968 5.655c26.993 4 54.717 3.044 81.313-2.813 9.412-2.072 18.684-4.79 27.75-8.062l-3.156-4.406z" />
            </svg>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{
            margin: "0 0 8px",
            font: `800 ${isMobile ? "19px" : "26px"}/1.25 ${FONT_HEAD}`,
            letterSpacing: "-.01em", color: TEXT, wordBreak: "break-word",
          }}>
            {safeMarket.questionTitle}
          </h1>
          <div style={{
            display: "flex", alignItems: "center", gap: isMobile ? "8px" : "14px",
            font: `600 ${isMobile ? "11.5px" : "12.5px"} ${FONT_BODY}`,
            color: "#8ca0b6", flexWrap: "wrap",
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8ca0b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              @{creatorUsername}
            </span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span>Closes {closesLabel}</span>
          </div>
        </div>
        {canResolve && (
          <div style={{ flexShrink: 0 }}>
            <ResolveModalButton marketId={marketId} token={token} market={market} onResolved={handleMarketResolved} disabled={!token} />
          </div>
        )}
      </div>

      {/* 2-col */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 336px",
        gap: isMobile ? "16px" : "22px",
        alignItems: "start",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "14px" : "18px" }}>
          {isMobile && (
            <div style={{ ...MARKET_CARD, padding: "16px" }}>
              <BinaryTradePanelContent {...tradePanelProps} />
            </div>
          )}

          {/* Chart card */}
          <div style={{ ...MARKET_CARD, padding: isMobile ? "14px" : "20px 22px" }}>
            <BinaryChart
              probabilityChanges={probabilityChanges}
              currentProbability={currentProbability}
              yesLabel={yesLabel} noLabel={noLabel}
              totalVolume={totalVolume}
            />
          </div>
          {safeMarket.description ? (
            <div style={{ ...MARKET_CARD, padding: isMobile ? "14px" : "20px 22px" }}>
              <div style={{ font: `700 12px ${FONT_BODY}`, letterSpacing: ".08em", color: MUTED2, marginBottom: "10px" }}>RULES</div>
              <p style={{ margin: "0 0 14px", font: `400 14px/1.6 ${FONT_BODY}`, color: "#b7c6d6" }}>{safeMarket.description}</p>
            </div>
          ) : null}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: isMobile ? "8px" : "12px" }}>
            <StatCard label="Volume" value={`$${fmt(totalVolume)}`} />
            <StatCard label="Traders" value={fmt(numUsers)} />
            <StatCard label="Closes" value={closesLabel} />
          </div>
          <div style={{ ...MARKET_CARD, overflow: "hidden" }}>
            <ActivityTabs marketId={marketId} market={safeMarket} refreshTrigger={refreshTrigger} variant="dark" />
          </div>
        </div>

        {!isMobile && (
          <div style={{
            ...MARKET_CARD,
            padding: "18px", position: "sticky", top: "16px",
          }}>
            <BinaryTradePanelContent {...tradePanelProps} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Binary trade panel ───────────────────────────────────────────────────────
function BinaryTradePanelContent({
  safeMarket, yesLabel, noLabel, yesPct, noPct,
  isMarketOpen, isLoggedIn, marketId, token,
  currentProbability, username, onSuccess,
}) {
  if (safeMarket.isResolved) {
    return <ResolvedPanel result={safeMarket.resolutionResult} yesLabel={yesLabel} noLabel={noLabel} yesPct={yesPct} noPct={noPct} />;
  }
  if (!isMarketOpen) {
    return <ClosedPanel yesLabel={yesLabel} noLabel={noLabel} yesPct={yesPct} noPct={noPct} />;
  }
  if (isLoggedIn) {
    return <NewTradePanel marketId={marketId} market={safeMarket} token={token} currentProbability={currentProbability} username={username} onSuccess={onSuccess} />;
  }
  return <NotLoggedInPanel yesLabel={yesLabel} noLabel={noLabel} yesPct={yesPct} noPct={noPct} />;
}

// ─── Resolved panel ───────────────────────────────────────────────────────────
function ResolvedPanel({ result, yesLabel, noLabel, yesPct, noPct }) {
  const isYes = result?.toUpperCase() === "YES";
  const isNA = result?.toUpperCase() === "N/A" || result?.toUpperCase() === "NA";
  const winLabel = isNA ? "N/A" : isYes ? yesLabel : noLabel;
  const winColor = isNA ? "#8ca0b6" : isYes ? "#BAD659" : "#fb5b6b";
  const winBg = isNA ? "rgba(140,160,182,0.10)" : isYes ? "rgba(186,214,89,0.10)" : "rgba(251,91,107,0.10)";
  const winBorder = isNA ? "rgba(140,160,182,0.25)" : isYes ? "rgba(186,214,89,0.30)" : "rgba(251,91,107,0.30)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ borderRadius: "14px", padding: "20px 16px", background: winBg, border: `1px solid ${winBorder}`, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
        <span style={{ font: `700 11px ${FONT_BODY}`, letterSpacing: ".1em", color: winColor }}>MARKET RESOLVED</span>
        <span style={{ font: `800 32px ${FONT_HEAD}`, color: winColor }}>{winLabel}</span>
        <span style={{ font: `500 12px ${FONT_BODY}`, color: MUTED3 }}>{isNA ? "Cancelled — bets refunded" : `${winLabel} won`}</span>
      </div>
      <div style={{ display: "flex", gap: "9px" }}>
        {[
          { label: yesLabel, pct: yesPct, active: isYes, color: YES_TEXT, bg: isYes ? "rgba(186,214,89,0.12)" : "rgba(255,255,255,0.04)", border: isYes ? "rgba(186,214,89,0.30)" : "rgba(255,255,255,0.08)" },
          { label: noLabel, pct: noPct, active: !isYes && !isNA, color: NO_TEXT, bg: !isYes && !isNA ? "rgba(251,91,107,0.12)" : "rgba(255,255,255,0.04)", border: !isYes && !isNA ? "rgba(251,91,107,0.30)" : "rgba(255,255,255,0.08)" },
        ].map(({ label, pct, color, bg, border }) => (
          <div key={label} style={{ flex: 1, padding: "11px 8px", borderRadius: "12px", textAlign: "center", background: bg, border: `1px solid ${border}` }}>
            <div style={{ font: `700 13px ${FONT_BODY}`, color }}>{label}</div>
            <div style={{ font: `800 17px ${FONT_HEAD}`, color }}>{pct}¢</div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", font: `500 11px ${FONT_BODY}`, color: MUTED3 }}>Payouts have been credited automatically</div>
    </div>
  );
}

// ─── Closed panel ─────────────────────────────────────────────────────────────
function ClosedPanel({ yesLabel, noLabel, yesPct, noPct }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ borderRadius: "14px", padding: "20px 16px", background: "rgba(255,193,7,0.08)", border: "1px solid rgba(255,193,7,0.25)", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
        <span style={{ font: `700 11px ${FONT_BODY}`, letterSpacing: ".1em", color: "#ffc107" }}>MARKET CLOSED</span>
        <span style={{ font: `800 20px ${FONT_HEAD}`, color: "#eaf0f7" }}>Awaiting resolution</span>
        <span style={{ font: `500 12px ${FONT_BODY}`, color: MUTED3 }}>The market steward needs to resolve this</span>
      </div>
      <div style={{ display: "flex", gap: "9px" }}>
        {[{ label: yesLabel, pct: yesPct, color: YES_TEXT }, { label: noLabel, pct: noPct, color: NO_TEXT }].map(({ label, pct, color }) => (
          <div key={label} style={{ flex: 1, padding: "11px 8px", borderRadius: "12px", textAlign: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
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
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", gap: "9px" }}>
        {[
          { label: yesLabel, pct: yesPct, color: YES_TEXT, bg: "rgba(186,214,89,0.08)", border: "rgba(186,214,89,0.22)" },
          { label: noLabel, pct: noPct, color: NO_TEXT, bg: "rgba(244,63,94,0.08)", border: "rgba(244,63,94,0.18)" },
        ].map(({ label, pct, color, bg, border }) => (
          <div key={label} style={{ flex: 1, padding: "11px 8px", borderRadius: "12px", textAlign: "center", background: bg, border: `1px solid ${border}` }}>
            <div style={{ font: `700 13px ${FONT_BODY}`, color }}>{label}</div>
            <div style={{ font: `800 17px ${FONT_HEAD}`, color }}>{pct}¢</div>
          </div>
        ))}
      </div>
      <div style={{ borderRadius: "14px", padding: "20px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", textAlign: "center" }}>
        <div style={{ font: `700 14px ${FONT_BODY}`, color: TEXT, marginBottom: "6px" }}>Sign in to trade</div>
        <div style={{ font: `500 12px ${FONT_BODY}`, color: MUTED3 }}>You need an account to participate</div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
function TestMarketDetailsLayout({
  market, creator, numUsers, totalVolume,
  currentProbability, probabilityChanges,
  marketId, username, token, isLoggedIn, refetchData,
}) {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (document.getElementById("gp-fonts")) return;
    const link = document.createElement("link");
    link.id = "gp-fonts";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@700;800&display=swap";
    document.head.appendChild(link);
  }, []);

  const isGroupMember = !!market?.marketGroup?.id;

  const commonProps = {
    market, creator, numUsers, totalVolume,
    marketId, username, token, isLoggedIn, refetchData, isMobile,
  };

  return (
    <div className="pb-16" style={{ minHeight: "100vh", color: TEXT, fontFamily: FONT_BODY }}>
      <div style={{
        position: "absolute", width: "100%", height: "100%",
        left: "50%", top: "0%", transform: "translate(-50%, -50%)",
        background: "linear-gradient(135deg,rgb(81 173 246/5%) 0%,rgb(30 144 255/10%) 0%)",
        filter: "blur(150px)", pointerEvents: "none", zIndex: 1, borderRadius: "50%",
      }} />
      <div style={{ position: "relative", zIndex: 20 }}>
        <Navbar />
      </div>
      <div style={{ zIndex: 10, maxWidth: "1180px", margin: "0 auto", padding: isMobile ? "16px 16px 60px" : "22px 40px 60px" }}>
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

export default TestMarketDetailsLayout;
