import React from "react";
import BookmarkButton from "./BookmarkButton";
import { getOptionTheme } from "../../styles/optionThemes";

const CheckIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

// Binary: pass `result` ("YES" | "NO"). Multi-answer: `options` with one `won: true`.
const ResolvedCard = ({
  logo,
  question,
  result,
  options,
  poolAmount = "$0.00",
  resolvedLabel = "Resolved",
  marketId,
}) => {
  const isBinary = !options?.length;
  const yesWon = result === "YES";

  return (
    <div
      className="w-full max-w-[344px] min-w-0 mx-auto rounded-[41px] p-6 sm:p-5 min-h-[250px] box-border flex flex-col justify-between gap-4 cursor-pointer"
      style={{
        border: "1px solid rgba(180,209,237,0.14)",
        background: "linear-gradient(to bottom, rgba(126,150,208,0.10) 33%, rgba(23,26,43,0.15) 100%), #0c1020",
      }}
    >
      {/* Header: logo + question + resolved tag */}
      <div className="flex items-start gap-3">
        {logo && (
          <img src={logo} alt="" className="w-[46px] h-[34px] sm:w-[52px] sm:h-[38px] shrink-0 object-contain opacity-70" />
        )}
        <p
          title={question}
          className="m-0 flex-1 min-w-0 text-white/75 font-['Roboto',sans-serif] font-medium text-[clamp(14px,4vw,18px)] leading-[1.3] tracking-[0.4px]"
          style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
        >
          {question}
        </p>
        <span className="shrink-0 mt-0.5 px-2.5 py-1 rounded-full bg-white/[0.06] text-white/55 font-['Roboto',sans-serif] text-[11px] font-medium tracking-[0.3px] uppercase">
          {resolvedLabel}
        </span>
      </div>

      {/* Result */}
      {isBinary ? (
        <div
          className="flex items-center justify-center gap-2 h-11 rounded-full font-['Roboto',sans-serif] font-medium text-[15px]"
          style={
            yesWon
              ? { background: "rgba(186,214,89,0.12)", border: "1px solid rgba(186,214,89,0.45)", color: "#C6E06C" }
              : { background: "rgba(248,145,130,0.12)", border: "1px solid rgba(248,145,130,0.45)", color: "#F89182" }
          }
        >
          <CheckIcon />
          {yesWon ? "Yes" : "No"}
        </div>
      ) : (
        <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
          {options.map((opt, i) => {
            const theme = getOptionTheme(i, options.length);
            return (
              <li
                key={opt.label}
                className={`flex items-center gap-2.5 h-9 px-3 rounded-xl font-['Roboto',sans-serif] text-[15px] ${
                  opt.won ? "text-white font-medium" : "text-white/35"
                }`}
                style={opt.won ? { background: theme.bg, border: `1px solid ${theme.activeBorder}` } : { border: "1px solid transparent" }}
              >
                {opt.logo && <img src={opt.logo} alt="" className={`w-6 h-4 object-contain ${opt.won ? "" : "opacity-40"}`} />}
                <span className="flex-1 min-w-0 truncate">{opt.label}</span>
                {opt.won && (
                  <span style={{ color: theme.color }}>
                    <CheckIcon />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-white/50 font-['Roboto',sans-serif] font-light text-[clamp(15px,4vw,18px)] tracking-[0.4px]">
          {poolAmount}
        </span>
        <BookmarkButton marketId={marketId} />
      </div>
    </div>
  );
};

export default ResolvedCard;
