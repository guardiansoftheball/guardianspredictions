import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

// Shared helpers for the market detail charts (BinaryChart / MultiOptionChart).

const SHORT_RANGES = new Set(["1H", "6H", "1D"]);
const pad2 = (v) => String(v).padStart(2, "0");

// Locale-aware date formatters for axis labels, hover tooltip and range selection.
export function useChartDateFormat(range) {
  const { i18n } = useTranslation();
  const locale = i18n.language || "en";

  return useMemo(() => {
    const dayFmt = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" });
    const tipFmt = new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    return {
      fmtX: (d) =>
        SHORT_RANGES.has(range)
          ? `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
          : dayFmt.format(d),
      fmtTip: (d) => tipFmt.format(d),
      fmtDay: (d) => dayFmt.format(d),
    };
  }, [locale, range]);
}

// Localized label for a range button ("1W" → "1S", "ALL" → "Todo" in Spanish).
export function useRangeLabel() {
  const { t } = useTranslation();
  return (r) => t(`chart.ranges.${r}`, { defaultValue: r });
}

// Touch scrubbing that keeps vertical page scroll working (pair with touchAction: "pan-y")
// and clears the hover state when the finger lifts.
export function chartTouchHandlers({ getFrac, disabled, winStart, windowMs, setHoverT }) {
  const scrub = (e) => {
    if (!disabled) setHoverT(winStart + getFrac(e) * windowMs);
  };
  const clear = () => setHoverT(null);
  return {
    onTouchStart: scrub,
    onTouchMove: scrub,
    onTouchEnd: clear,
    onTouchCancel: clear,
  };
}

// Tracks an element's rendered width so axis labels can be spaced in real pixels.
export function useElementWidth(ref) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

// Drops X-axis labels that would overlap, based on the chart's pixel width and
// an estimate of each label's text width (11px font ≈ 6.5px per character).
export function thinXLabels(labels, widthPx, format) {
  if (!widthPx || labels.length <= 1) return labels;
  const kept = [];
  let lastRight = -Infinity;
  for (const lbl of labels) {
    const half = (format(new Date(lbl.t)).length * 6.5) / 2;
    const center = (lbl.leftPct / 100) * widthPx;
    if (center - half < 0 || center + half > widthPx) continue;
    if (center - half >= lastRight + 10) {
      kept.push(lbl);
      lastRight = center + half;
    }
  }
  return kept;
}

export function rangeButtonStyle({ active, isMobile, font }) {
  return {
    padding: isMobile ? "0 11px" : "5px 10px",
    minHeight: isMobile ? "44px" : undefined,
    minWidth: isMobile ? "40px" : undefined,
    border: "none",
    cursor: "pointer",
    font: `700 ${isMobile ? 12 : 11}px ${font}`,
    letterSpacing: ".02em",
    background: "transparent",
    color: active ? "#ffffff" : "rgba(255,255,255,0.3)",
    transition: "color .15s",
  };
}
