import React from "react";

const PredictionCard = ({
  teamLogo,
  question = "Lorem ipsum dolor sit mon amet sin?",
  options = [
    { label: "Option A", pct: 30 },
    { label: "Option B", pct: 70 },
  ],
  poolAmount = "$5,606.90",
  onYes,
  onNo,
}) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full max-w-[344px] min-w-0 mx-auto rounded-[41px] p-px box-border cursor-pointer bg-[conic-gradient(from_0deg,#B4D1ED_0%,#B4D1ED_19%,#5A6B89_36%,#B4D1ED_45%,#B4D1ED_63%,#5A6B89_75%,#B4D1ED_88%,#B4D1ED_100%)]"
    >
      <div
        className="w-full h-full min-h-[210px] sm:min-h-[235px] rounded-[41px] overflow-hidden box-border p-4 sm:p-5 flex flex-col justify-between gap-4"
        style={{
          background:
            "linear-gradient(to bottom, rgba(126,150,208,0.30) 33%, rgba(23,26,43,0.30) 100%), #12152a",
        }}
      >
        {/* Header */}
        <div className="flex items-start gap-4">
          {teamLogo && (
            <img
              src={teamLogo}
              alt="team logo"
              className="w-[42px] h-[30px] sm:w-[46px] sm:h-[34px] shrink-0 object-contain"
            />
          )}
          <p
            title={question}
            className="m-0 flex-1 min-w-0 text-white font-['Roboto',sans-serif] font-medium text-[clamp(15px,4.5vw,20px)] leading-[1.3] tracking-[0.4px] overflow-hidden"
            style={{
              textDecoration: hovered ? "underline" : "none",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {question}
          </p>
        </div>

        {/* Options rows */}
        <div className="flex flex-col gap-3">
          {options.map((opt, i) => (
            <PredictionRow
              key={i}
              label={opt.label}
              pct={opt.pct}
              onYes={onYes}
              onNo={onNo}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-white font-['Roboto',sans-serif] font-light text-[clamp(15px,4vw,18px)] tracking-[0.4px]">
            {poolAmount}
          </span>
          <BookmarkIcon />
        </div>
      </div>
    </div>
  );
};

const PredictionRow = ({ label, pct, onYes, onNo }) => (
  <div className="flex items-center justify-between gap-3">
    <span
      title={label}
      className="flex-1 min-w-0 overflow-hidden whitespace-nowrap text-ellipsis text-white font-['Roboto',sans-serif] font-normal text-[clamp(14px,4vw,18px)] tracking-[0.4px]"
    >
      {label}
    </span>
    <div className="flex items-center gap-2 shrink-0">
      <span className="w-[clamp(30px,8vw,42px)] shrink-0 text-white font-['Roboto',sans-serif] font-medium text-[clamp(14px,4vw,18px)] tracking-[0.4px]">
        {pct}%
      </span>
      <YesNoButton label="Yes" color="#bad659" pct={pct} onClick={onYes} />
      <YesNoButton label="No" color="#f89182" pct={pct} onClick={onNo} />
    </div>
  </div>
);

let _btnCounter = 0;
const YesNoButton = ({ label, color, pct, onClick }) => {
  const [hovered, setHovered] = React.useState(false);
  const isYes = label === "Yes";
  const displayPct = isYes ? pct : 100 - pct;
  const gradientId = React.useRef(`btn-grad-${_btnCounter++}`).current;
  const vbW = 65;
  const vbH = 38;
  const gradientStops = isYes ? (
    <>
      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
      <stop offset="28%" stopColor="#BAD659" stopOpacity="1" />
      <stop offset="37%" stopColor="#AABA49" stopOpacity="1" />
      <stop offset="68%" stopColor="#FFFFFF" stopOpacity="1" />
      <stop offset="96%" stopColor="#BAD659" stopOpacity="1" />
      <stop offset="100%" stopColor="#999999" stopOpacity="0.55" />
    </>
  ) : (
    <>
      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
      <stop offset="15%" stopColor="#F89182" stopOpacity="1" />
      <stop offset="37%" stopColor="#AABA49" stopOpacity="1" />
      <stop offset="68%" stopColor="#FFFFFF" stopOpacity="1" />
      <stop offset="96%" stopColor="#F89182" stopOpacity="1" />
      <stop offset="100%" stopColor="#999999" stopOpacity="0.55" />
    </>
  );

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative w-[clamp(46px,14vw,65px)] h-[34px] sm:h-[38px] shrink-0 bg-transparent border-none p-0 cursor-pointer isolate flex items-center justify-center font-['Roboto',sans-serif] font-medium text-[clamp(12px,3.5vw,18px)] tracking-[0.4px] transition-[color,transform] duration-200 ease-out"
      style={{
        color: hovered ? "#ffffff" : color,
        transform: hovered ? "scale(1.06)" : "scale(1)",
      }}
    >
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full -z-10"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            {gradientStops}
          </linearGradient>
        </defs>
        <rect
          x="0.25"
          y="0.25"
          width={vbW - 0.5}
          height={vbH - 0.5}
          rx="11.75"
          fill={hovered ? color : "white"}
          fillOpacity={hovered ? "0.9" : "0.16"}
          stroke={`url(#${gradientId})`}
          strokeWidth="0.5"
        />
      </svg>
      <span className="relative z-[1]">
        {hovered ? `${displayPct}%` : label}
      </span>
    </button>
  );
};

const BookmarkIcon = () => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <svg
      width="14.5"
      height="20"
      viewBox="-0.5 -0.5 15.55 20.29"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="block shrink-0 cursor-pointer transition-opacity duration-200"
      style={{ opacity: hovered ? 1 : 0.8 }}
    >
      <path
        d="M0.91 0.5 H13.64 C13.86 0.5 14.05 0.68 14.05 0.91 V18.79 L7.27 12.02 L0.5 18.79 V0.91 C0.5 0.68 0.68 0.5 0.91 0.5 Z"
        stroke="#F1EFEF"
        strokeWidth="1"
        fill={hovered ? "#ffffff" : "none"}
        style={{ transition: "fill 0.2s ease" }}
      />
    </svg>
  );
};

export default PredictionCard;
