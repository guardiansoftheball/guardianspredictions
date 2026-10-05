import React from "react";
import BookmarkButton from "./BookmarkButton";
import LivePct from "./LivePct";
import CardButton from "./CardButton";

const QuestionCard = ({
  teamLogo,
  question = "Lorem ipsum dolor sit mon amet sin?",
  pct = 70,
  poolAmount = "$5,606.90",
  onYes,
  onNo,
  transparent = false,
  marketId,
}) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`w-full max-w-[344px] min-w-0 mx-auto rounded-[41px] p-px box-border cursor-pointer ${transparent ? "" : "bg-[conic-gradient(from_0deg,#B4D1ED_0%,#B4D1ED_19%,#5A6B89_36%,#B4D1ED_45%,#B4D1ED_63%,#5A6B89_75%,#B4D1ED_88%,#B4D1ED_100%)]"}`}
    >
      <div
        className={`w-full h-full min-h-[250px] rounded-[41px] overflow-hidden box-border p-6 ${transparent ? "" : "sm:p-5"} flex flex-col justify-between gap-4`}
        style={
          transparent
            ? {}
            : {
                background:
                  "linear-gradient(to bottom, rgba(126,150,208,0.30) 33%, rgba(23,26,43,0.30) 100%), #12152a",
              }
        }
      >
        {/* Header: logo + question + arc */}
        <div className="flex items-start gap-3">
          {teamLogo && (
            <img
              src={teamLogo}
              alt="team logo"
              className="w-[46px] h-[34px] sm:w-[52px] sm:h-[38px] shrink-0 object-contain"
            />
          )}
          <p
            title={question}
            className="m-0 flex-1 min-w-0 text-white font-['Roboto',sans-serif] font-medium text-[clamp(14px,4vw,18px)] leading-[1.3] tracking-[0.4px] overflow-hidden"
            style={{
              textDecoration: hovered ? "underline" : "none",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {question}
          </p>
          {/* Arc indicator */}
          <div className="flex flex-col items-center shrink-0">
            <ArcIndicator pct={pct} />
            <span className="mt-0.5 text-white font-['Roboto',sans-serif] font-medium text-xs tracking-[0.28px]">
              <LivePct value={pct} />
            </span>
            <span className="text-white font-['Roboto',sans-serif] font-light text-[10px] tracking-[0.24px]">
              chance
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <CardButton
            label="Yes"
            color="#bad659"
            variant="yes"
            pct={pct}
            onClick={onYes}
          />
          <CardButton
            label="No"
            color="#f89182"
            variant="no"
            pct={100 - pct}
            onClick={onNo}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-white font-['Roboto',sans-serif] font-light text-[clamp(15px,4vw,18px)] tracking-[0.4px]">
            {poolAmount}
          </span>
          <BookmarkButton marketId={marketId} />
        </div>
      </div>
    </div>
  );
};

const ArcIndicator = ({ pct }) => {
  const r = 18;
  const circumference = Math.PI * r;
  const filled = (pct / 100) * circumference;
  return (
    <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
      <path
        d={`M 2 20 A ${r} ${r} 0 0 1 38 20`}
        stroke="#F1EFEF"
        strokeOpacity="0.6"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M 2 20 A ${r} ${r} 0 0 1 38 20`}
        stroke="#C6E06C"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`}
        fill="none"
      />
    </svg>
  );
};


export default QuestionCard;
