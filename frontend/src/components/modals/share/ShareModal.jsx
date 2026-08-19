import React, { useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useToast } from "../../../hooks/useToast";
import { FONT, FONT_HEAD, COLOR } from "../../../styles/darkTokens";
import logoSrc from "../../../assets/logo/logo.png";

const OPTION_COLORS = [
  "#BAD659", "#fb5b6b", "#6b7f96", "#a78bfa", "#f6ad55", "#4fd1c5",
];

function getColor(index, total) {
  if (total === 1) return OPTION_COLORS[0];
  if (index === 0) return OPTION_COLORS[0];
  if (index === total - 1) return OPTION_COLORS[1];
  return OPTION_COLORS[((index - 1) % (OPTION_COLORS.length - 2)) + 2];
}

function getAnswerProb(answer) {
  const raw = Array.isArray(answer?.probabilityChanges)
    ? answer.probabilityChanges
    : Array.isArray(answer?.summary?.probabilityChanges)
      ? answer.summary.probabilityChanges
      : [];
  if (raw.length > 0) {
    const last = raw[raw.length - 1];
    const p = Number(last.probability ?? last.Probability);
    if (Number.isFinite(p)) return Math.max(0.01, Math.min(0.99, p));
  }
  const fallbacks = [
    answer?.probability,
    answer?.market?.lastProbability,
    answer?.summary?.lastProbability,
  ];
  for (const f of fallbacks) {
    const p = Number(f);
    if (Number.isFinite(p)) return Math.max(0.01, Math.min(0.99, p));
  }
  return 0.5;
}

// ─── Static mini chart (no interactivity) ─────────────────────────────────────
function MiniChart({ answers }) {
  const W = 400, H = 140, TOP = 8, BOT = 125;

  const now = Date.now();
  const windowMs = 60 * 60_000; // 1 hour window
  const winStart = now - windowMs;

  const seriesData = useMemo(() =>
    answers.map((a) => {
      const raw = Array.isArray(a.probabilityChanges)
        ? a.probabilityChanges
        : Array.isArray(a.summary?.probabilityChanges)
          ? a.summary.probabilityChanges
          : [];
      const changes = raw
        .map((c) => ({
          t: new Date(c.timestamp || c.Timestamp).getTime(),
          p: Number(c.probability ?? c.Probability),
        }))
        .filter((c) => Number.isFinite(c.t) && Number.isFinite(c.p))
        .sort((a, b) => a.t - b.t);
      const curP = getAnswerProb(a);
      const before = changes.filter((c) => c.t < winStart);
      const within = changes.filter((c) => c.t >= winStart && c.t < now);
      const anchorP = before.length
        ? before[before.length - 1].p
        : within.length ? within[0].p : curP;
      return [{ t: winStart, p: anchorP }, ...within, { t: now, p: curP }];
    }),
  [answers, winStart, now]);

  // Dynamic Y range
  const allProbs = seriesData.flat().map((c) => c.p).filter(Number.isFinite);
  const dataMin = allProbs.length ? Math.min(...allProbs) : 0;
  const dataMax = allProbs.length ? Math.max(...allProbs) : 1;
  const pad5 = Math.max(0.05, (dataMax - dataMin) * 0.25);
  const yMin = Math.max(0, dataMin - pad5);
  const yMax = Math.min(1, dataMax + pad5);
  const yrng = yMax - yMin || 1;
  const yOf = (p) => BOT - ((p - yMin) / yrng) * (BOT - TOP);
  const xOf = (t) => ((t - winStart) / windowMs) * W;

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

  // Y-axis ticks
  const yTicks = [yMax, yMin + yrng * 0.5, yMin];

  // Collision avoidance for labels
  const lastProbs = seriesData.map((s) => s[s.length - 1]?.p ?? 0.5);
  const rawTops = paths.map((p) => {
    if (!p.last) return 50;
    return (p.last[1] / H) * 100;
  });
  // Simple collision avoidance: push labels apart if too close
  const LABEL_H = 18; // approx label height as % of container
  const labelTops = [...rawTops];
  const sorted = labelTops.map((t, i) => ({ t, i })).sort((a, b) => a.t - b.t);
  for (let k = 1; k < sorted.length; k++) {
    const gap = sorted[k].t - sorted[k - 1].t;
    if (gap < LABEL_H) {
      const push = (LABEL_H - gap) / 2;
      sorted[k - 1].t -= push;
      sorted[k].t += push;
    }
  }
  sorted.forEach(({ t, i }) => { labelTops[i] = t; });

  const CHART_H = 100; // px height of the SVG
  const labelPx = lastProbs.map((p) => {
    const svgY = yOf(p);
    return (svgY / H) * CHART_H;
  });
  // Collision avoidance in px — each label is ~14px tall
  const LBL_H_PX = 24;
  const sortedLbl = labelPx.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  for (let k = 1; k < sortedLbl.length; k++) {
    if (sortedLbl[k].y - sortedLbl[k - 1].y < LBL_H_PX) {
      const mid = (sortedLbl[k].y + sortedLbl[k - 1].y) / 2;
      sortedLbl[k - 1].y = mid - LBL_H_PX / 2;
      sortedLbl[k].y = mid + LBL_H_PX / 2;
    }
  }
  const resolvedY = new Array(answers.length);
  sortedLbl.forEach(({ y, i }) => { resolvedY[i] = Math.max(0, Math.min(CHART_H - 12, y - 18)); });

  return (
    <div style={{ display: "flex", gap: "0", pointerEvents: "none" }}>
      {/* SVG chart */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ flex: 1, minWidth: 0, height: `${CHART_H}px`, display: "block", shapeRendering: "geometricPrecision" }}
      >
        {/* Grid lines */}
        {[TOP, (TOP + BOT) / 2, BOT].map((y) => (
          <line key={y} x1="0" y1={y} x2={W} y2={y} stroke="rgba(255,255,255,0.12)" strokeDasharray="3 3" />
        ))}
        {/* Lines */}
        {paths.map((p, i) => {
          const color = getColor(i, answers.length);
          return (
            <g key={i}>
              <path d={p.d} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
              {p.last && <circle cx={p.last[0]} cy={p.last[1]} r="3.5" fill={color} />}
            </g>
          );
        })}
      </svg>
      {/* Right column: labels stacked, positioned to match line endpoints */}
      <div style={{ position: "relative", width: "80px", flexShrink: 0, height: `${CHART_H}px` }}>
        {answers.map((a, i) => {
          const color = getColor(i, answers.length);
          const pctVal = Math.round(lastProbs[i] * 100);
          const name = a.answerLabel.length > 10 ? a.answerLabel.slice(0, 9) + "…" : a.answerLabel;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: "6px",
                top: `${resolvedY[i]}px`,
              }}
            >
              <div style={{ font: `600 8.5px ${FONT}`, color, lineHeight: "1.1", whiteSpace: "nowrap" }}>
                {name}
              </div>
              <div style={{ font: `800 11px ${FONT_HEAD}`, color, lineHeight: "1.1" }}>
                {pctVal}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Static mini chart for binary (Yes/No) markets ───────────────────────────
function BinaryMiniChart({ probabilityChanges, currentProbability }) {
  const W = 400, H = 140, TOP = 8, BOT = 125;
  const now = Date.now();
  const windowMs = 60 * 60_000; // 1 hour window
  const winStart = now - windowMs;

  const raw = Array.isArray(probabilityChanges) ? probabilityChanges : [];
  const changes = raw
    .map((c) => ({
      t: new Date(c.timestamp || c.Timestamp).getTime(),
      p: Number(c.probability ?? c.Probability),
    }))
    .filter((c) => Number.isFinite(c.t) && Number.isFinite(c.p))
    .sort((a, b) => a.t - b.t);

  const curP = currentProbability ?? 0.5;
  const before = changes.filter((c) => c.t < winStart);
  const within = changes.filter((c) => c.t >= winStart && c.t < now);
  const anchorP = before.length ? before[before.length - 1].p : within.length ? within[0].p : curP;
  const series = [{ t: winStart, p: anchorP }, ...within, { t: now, p: curP }];

  // Include both Yes and No (inverted) probabilities in Y range
  const allProbs = series.flatMap((c) => [c.p, 1 - c.p]);
  const dataMin = Math.min(...allProbs);
  const dataMax = Math.max(...allProbs);
  const pad5 = Math.max(0.02, (dataMax - dataMin) * 0.1);
  const yMin = Math.max(0, dataMin - pad5);
  const yMax = Math.min(1, dataMax + pad5);
  const yrng = yMax - yMin || 1;
  const yOf = (p) => BOT - ((p - yMin) / yrng) * (BOT - TOP);
  const xOf = (t) => ((t - winStart) / windowMs) * W;

  const pts = series.map((c) => [xOf(c.t), yOf(c.p)]);
  let d = "";
  if (pts.length >= 2) {
    d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++)
      d += ` H${pts[i][0].toFixed(1)} V${pts[i][1].toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  const yesPct = Math.round(curP * 100);
  const noPct = 100 - yesPct;

  const CHART_H = 100;
  const yesY = (yOf(curP) / H) * CHART_H;
  const noY = (yOf(1 - curP) / H) * CHART_H;

  // Collision avoidance for Yes/No labels
  const LBL_H_PX = 24;
  let yesLblY = yesY - 18;
  let noLblY = noY - 18;
  if (Math.abs(yesLblY - noLblY) < LBL_H_PX) {
    const mid = (yesLblY + noLblY) / 2;
    if (yesLblY <= noLblY) {
      yesLblY = mid - LBL_H_PX / 2;
      noLblY = mid + LBL_H_PX / 2;
    } else {
      noLblY = mid - LBL_H_PX / 2;
      yesLblY = mid + LBL_H_PX / 2;
    }
  }
  yesLblY = Math.max(0, Math.min(CHART_H - 12, yesLblY));
  noLblY = Math.max(0, Math.min(CHART_H - 12, noLblY));

  // No line: derive from Yes line (inverted probability)
  const noPts = series.map((c) => [xOf(c.t), yOf(1 - c.p)]);
  let noD = "";
  if (noPts.length >= 2) {
    noD = `M${noPts[0][0].toFixed(1)},${noPts[0][1].toFixed(1)}`;
    for (let i = 1; i < noPts.length; i++)
      noD += ` H${noPts[i][0].toFixed(1)} V${noPts[i][1].toFixed(1)}`;
  }
  const noLast = noPts[noPts.length - 1];

  return (
    <div style={{ display: "flex", gap: "0", pointerEvents: "none" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ flex: 1, minWidth: 0, height: `${CHART_H}px`, display: "block", shapeRendering: "geometricPrecision" }}
      >
        {[TOP, (TOP + BOT) / 2, BOT].map((y) => (
          <line key={y} x1="0" y1={y} x2={W} y2={y} stroke="rgba(255,255,255,0.12)" strokeDasharray="3 3" />
        ))}
        {/* Yes line */}
        <path d={d} fill="none" stroke={OPTION_COLORS[0]} strokeWidth="2.5" strokeLinejoin="round" />
        {last && <circle cx={last[0]} cy={last[1]} r="3.5" fill={OPTION_COLORS[0]} />}
        {/* No line */}
        <path d={noD} fill="none" stroke={OPTION_COLORS[1]} strokeWidth="2.5" strokeLinejoin="round" />
        {noLast && <circle cx={noLast[0]} cy={noLast[1]} r="3.5" fill={OPTION_COLORS[1]} />}
      </svg>
      {/* Right column: labels */}
      <div style={{ position: "relative", width: "60px", flexShrink: 0, height: `${CHART_H}px` }}>
        <div style={{ position: "absolute", left: "6px", top: `${yesLblY}px` }}>
          <div style={{ font: `600 8.5px ${FONT}`, color: OPTION_COLORS[0], lineHeight: "1.1", whiteSpace: "nowrap" }}>Yes</div>
          <div style={{ font: `800 11px ${FONT_HEAD}`, color: OPTION_COLORS[0], lineHeight: "1.1" }}>{yesPct}%</div>
        </div>
        <div style={{ position: "absolute", left: "6px", top: `${noLblY}px` }}>
          <div style={{ font: `600 8.5px ${FONT}`, color: OPTION_COLORS[1], lineHeight: "1.1", whiteSpace: "nowrap" }}>No</div>
          <div style={{ font: `800 11px ${FONT_HEAD}`, color: OPTION_COLORS[1], lineHeight: "1.1" }}>{noPct}%</div>
        </div>
      </div>
    </div>
  );
}

export default function ShareModal({
  open,
  onClose,
  title,
  answers = [],
  totalVolume,
  numUsers,
  closesLabel,
  creatorUsername,
  currentProbability,
  probabilityChanges,
  marketId,
}) {
  const toast = useToast();
  const cardRef = useRef(null);

  const marketUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/markets/${marketId}`
      : "";

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(marketUrl).then(
      () => toast.success("Link copied!"),
      () => toast.error("Failed to copy link"),
    );
  }, [marketUrl, toast]);

  const handleCopyImage = useCallback(async () => {
    const el = cardRef.current;
    if (!el) return;
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(el, {
        backgroundColor: "#0b1120",
        scale: 2,
        useCORS: true,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) { toast.error("Failed to generate image"); return; }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          toast.success("Image copied!");
        } catch {
          toast.error("Failed to copy image");
        }
      }, "image/png");
    } catch {
      toast.error("Failed to generate image");
    }
  }, [toast]);

  const handleShareX = useCallback(() => {
    const probText = answers.length > 0
      ? answers.map((a) => `${a.answerLabel} ${Math.round((a.probability ?? getAnswerProb(a)) * 100)}%`).join(" · ")
      : currentProbability != null
        ? `${Math.round(currentProbability * 100)}%`
        : "";
    const text = `${title}\n${probText}\n\n`;
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(marketUrl)}`;
    window.open(url, "_blank", "noopener");
  }, [title, answers, currentProbability, marketUrl]);

  if (!open) return null;

  // For binary markets
  const isBinary = answers.length === 0 && currentProbability != null;
  const pct = isBinary ? Math.round(currentProbability * 100) : null;
  const hasMultiChart = answers.length > 0;
  const hasBinaryChart = isBinary && (Array.isArray(probabilityChanges) && probabilityChanges.length > 0 || currentProbability != null);

  return createPortal(
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)",
        fontFamily: FONT,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "min(95vw, 660px)",
          background: "#0d1525",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "20px",
          overflow: "hidden",
          animation: "shareModalIn .2s ease-out",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          <h2 style={{
            margin: 0,
            font: `700 18px ${FONT_HEAD}`,
            color: COLOR.text,
          }}>
            Share Market
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: COLOR.muted, padding: "4px",
              display: "flex", alignItems: "center",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = COLOR.text}
            onMouseLeave={(e) => e.currentTarget.style.color = COLOR.muted}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Preview card */}
        <div style={{ padding: "20px 24px" }}>
          <div
            ref={cardRef}
            style={{
              display: "flex",
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "#0b1120",
            }}
          >
            {/* Left side — market info + chart */}
            <div style={{
              flex: 1,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minWidth: 0,
            }}>
              {/* Logo */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <img
                  src={logoSrc}
                  alt="GP"
                  style={{ width: "24px", height: "24px", borderRadius: "5px", objectFit: "contain" }}
                  crossOrigin="anonymous"
                />
                <span style={{
                  font: `700 11px ${FONT_HEAD}`,
                  color: COLOR.text,
                  letterSpacing: "0.02em",
                }}>
                  Guardians Predictions
                </span>
              </div>

              {/* Title */}
              <h3 style={{
                margin: "0 0 12px",
                font: `700 ${answers.length > 3 ? "13px" : "15px"}/1.35 ${FONT_HEAD}`,
                color: COLOR.text,
                wordBreak: "break-word",
              }}>
                {title}
              </h3>

              {/* Probabilities */}
              {isBinary ? (
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                  <ProbBadge label="Yes" pct={pct} color={OPTION_COLORS[0]} />
                  <ProbBadge label="No" pct={100 - pct} color={OPTION_COLORS[1]} />
                </div>
              ) : answers.length > 0 ? (
                <div style={{
                  display: "flex", flexWrap: "wrap", gap: "6px",
                  marginBottom: "12px",
                }}>
                  {answers.map((a, i) => (
                    <ProbBadge
                      key={i}
                      label={a.answerLabel}
                      pct={Math.round((a.probability ?? getAnswerProb(a)) * 100)}
                      color={getColor(i, answers.length)}
                    />
                  ))}
                </div>
              ) : null}

              {/* Mini chart */}
              {hasMultiChart && (
                <div style={{ marginBottom: "12px" }}>
                  <MiniChart answers={answers} />
                </div>
              )}
              {hasBinaryChart && (
                <div style={{ marginBottom: "12px" }}>
                  <BinaryMiniChart probabilityChanges={probabilityChanges} currentProbability={currentProbability} />
                </div>
              )}

              {/* Stats row */}
              <div style={{
                display: "flex", gap: "12px", flexWrap: "wrap",
                font: `500 10.5px ${FONT}`,
                color: COLOR.muted2,
              }}>
                {numUsers > 0 && (
                  <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                    {numUsers} traders
                  </span>
                )}
                {totalVolume > 0 && (
                  <span>${totalVolume.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                )}
                {closesLabel && (
                  <span>{closesLabel}</span>
                )}
              </div>
            </div>

            {/* Right side — branding panel */}
            <div style={{
              width: "180px",
              flexShrink: 0,
              background: "linear-gradient(160deg, #1a2744 0%, #0f1c33 40%, #192847 100%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px 14px",
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Glow */}
              <div style={{
                position: "absolute",
                width: "160px", height: "160px",
                background: "radial-gradient(circle, rgba(30,144,255,0.25) 0%, transparent 70%)",
                top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
              }} />
              <img
                src={logoSrc}
                alt="Guardians Predictions"
                style={{ width: "70px", height: "70px", borderRadius: "14px", marginBottom: "14px", position: "relative", objectFit: "contain" }}
                crossOrigin="anonymous"
              />
              <span style={{
                font: `800 15px ${FONT_HEAD}`,
                color: COLOR.text,
                textAlign: "center",
                position: "relative",
                lineHeight: "1.3",
              }}>
                Guardians
              </span>
              <span style={{
                font: `800 15px ${FONT_HEAD}`,
                color: COLOR.text,
                textAlign: "center",
                position: "relative",
                lineHeight: "1.3",
                marginBottom: "6px",
              }}>
                Predictions
              </span>
              <span style={{
                font: `500 9px ${FONT}`,
                color: COLOR.muted,
                textAlign: "center",
                position: "relative",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                lineHeight: "1.5",
              }}>
                Prediction Markets
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{
          display: "flex", gap: "10px",
          padding: "0 24px 22px",
          justifyContent: "center",
        }}>
          <ShareButton onClick={handleCopyLink} variant="secondary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            Copy Link
          </ShareButton>
          <ShareButton onClick={handleCopyImage} variant="secondary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copy Image
          </ShareButton>
          <ShareButton onClick={handleShareX} variant="primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Share
          </ShareButton>
        </div>
      </div>

      <style>{`
        @keyframes shareModalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>,
    document.body,
  );
}

function ProbBadge({ label, pct, color }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "5px",
      background: `${color}15`,
      border: `1px solid ${color}35`,
      borderRadius: "8px",
      padding: "4px 8px",
    }}>
      <span style={{ font: `700 11px ${FONT}`, color }}>
        {label}
      </span>
      <span style={{ font: `800 12px ${FONT_HEAD}`, color }}>
        {pct}%
      </span>
    </div>
  );
}

function ShareButton({ children, onClick, variant }) {
  const isPrimary = variant === "primary";
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "8px",
        padding: "10px 20px",
        borderRadius: "12px",
        border: isPrimary ? "none" : "1px solid rgba(255,255,255,0.12)",
        background: isPrimary
          ? "linear-gradient(135deg, #1e90ff 0%, #e66520 100%)"
          : "rgba(255,255,255,0.05)",
        color: isPrimary ? "#fff" : COLOR.muted,
        font: `600 13px ${FONT}`,
        cursor: "pointer",
        transition: "all .15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        if (!isPrimary) e.currentTarget.style.color = COLOR.text;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        if (!isPrimary) e.currentTarget.style.color = COLOR.muted;
      }}
    >
      {children}
    </button>
  );
}
