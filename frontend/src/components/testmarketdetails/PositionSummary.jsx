import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const YES_COLOR = "#BAD659";
const NO_COLOR = "#fb5b6b";

export const normalizePosition = (data) => {
  const d = Array.isArray(data) ? data[0] : data;
  if (!d) return null;
  return {
    yes: Number(d.yesSharesOwned ?? d.YesSharesOwned ?? 0),
    no: Number(d.noSharesOwned ?? d.NoSharesOwned ?? 0),
    value: Number(d.value ?? d.Value ?? 0),
    spent: Number(d.totalSpentInPlay ?? d.TotalSpentInPlay ?? d.totalSpent ?? d.TotalSpent ?? 0),
  };
};

const money = (n) => `$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;

const InfoTip = ({ text, label }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex h-4 w-4 items-center justify-center rounded-full border border-white/25 text-[10px] font-bold leading-none text-white/50 hover:text-white/80"
      >
        i
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full -left-2 z-20 mb-2 w-max max-w-[220px] rounded-lg bg-[#1b2233] px-3 py-2 text-[12px] font-normal leading-snug text-white/85 shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
};

const PositionSummary = ({ position, yesLabel = "Yes", noLabel = "No", optionLabel, dotColor }) => {
  const { t } = useTranslation();
  if (!position || position.spent <= 0) return null;

  const hasShares = position.yes > 0 || position.no > 0;
  const pnl = position.value - position.spent;
  const pnlPct = position.spent > 0 ? Math.round((pnl / position.spent) * 100) : 0;
  const pnlClass = pnl > 0 ? "bg-[rgba(186,214,89,0.12)] text-[#C6E06C]" : pnl < 0 ? "bg-[rgba(251,91,107,0.12)] text-[#fb8b96]" : "bg-white/[0.06] text-white/50";
  const sharesText = [position.yes > 0 && `${position.yes} ${yesLabel}`, position.no > 0 && `${position.no} ${noLabel}`]
    .filter(Boolean)
    .join(" · ");
  const dot = dotColor || (position.yes >= position.no ? YES_COLOR : NO_COLOR);

  return (
    <div className="rounded-2xl bg-white/[0.04] px-4 py-3.5">
      <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-white/50">
        {t("marketDetails.yourPosition")}
        <InfoTip text={t("marketDetails.positionHelp")} label={t("marketDetails.positionHelpLabel")} />
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 text-[15px] font-semibold text-white">
          {hasShares && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: dot }} />}
          <span className="truncate">
            {hasShares ? sharesText : <span className="font-normal text-white/50">{t("marketDetails.sharesPendingShort")}</span>}
            {hasShares && optionLabel && <span className="font-normal text-white/45"> · {optionLabel}</span>}
          </span>
        </span>
        {hasShares && <span className="shrink-0 text-[22px] font-bold leading-none text-white">{money(position.value)}</span>}
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-3 text-[12px]">
        <span className="text-white/45">{t("marketDetails.investedOf", { amount: money(position.spent) })}</span>
        {hasShares && (
          <span className={`rounded-full px-2 py-0.5 font-semibold ${pnlClass}`}>
            {pnl > 0 ? "+" : pnl < 0 ? "−" : ""}{money(pnl)} ({pnl > 0 ? "+" : ""}{pnlPct}%)
          </span>
        )}
      </div>
    </div>
  );
};

export default PositionSummary;
