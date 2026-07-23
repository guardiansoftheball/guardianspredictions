import React from "react";
import CardButton from "./CardButton";

const MatchCard = ({
  homeTeam = { name: "Atlético Madrid", logo: null, pct: 70 },
  awayTeam = { name: "Barcelona", logo: null, pct: 30 },
  draw = { pct: 0 },
  poolAmount = "$5,606.90",
  onHome,
  onDraw,
  onAway,
  transparent = false,
}) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`w-full max-w-[344px] min-w-0 mx-auto rounded-[41px] p-px box-border cursor-pointer ${transparent ? "" : "bg-[conic-gradient(from_0deg,#B4D1ED_0%,#B4D1ED_19%,#5A6B89_36%,#B4D1ED_45%,#B4D1ED_63%,#5A6B89_75%,#B4D1ED_88%,#B4D1ED_100%)]"}`}
    >
      <div
        className={`w-full h-full min-h-[210px] sm:min-h-[235px] rounded-[41px] overflow-hidden box-border p-4 ${transparent ? "" : "sm:p-5"} flex flex-col justify-between gap-4`}
        style={transparent ? {} : {
          background:
            "linear-gradient(to bottom, rgba(126,150,208,0.30) 33%, rgba(23,26,43,0.30) 100%), #12152a",
        }}
      >
        {/* Teams */}
        <div className="flex flex-col gap-3">
          <TeamRow team={homeTeam} />
          <TeamRow team={awayTeam} />
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <CardButton
            label={homeTeam.name}
            color="#bad659"
            variant="yes"
            pct={homeTeam.pct}
            onClick={onHome}
          />
          <CardButton
            label="Draw"
            color="#b4d1ed"
            variant="yes"
            pct={draw.pct}
            onClick={onDraw}
          />
          <CardButton
            label={awayTeam.name}
            color="#f89182"
            variant="no"
            pct={awayTeam.pct}
            onClick={onAway}
          />
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

const TeamRow = ({ team }) => (
  <div className="flex items-center gap-2.5">
    {team.logo ? (
      <img
        src={team.logo}
        alt={team.name}
        className="w-9 h-9 shrink-0 object-contain"
      />
    ) : (
      <div className="w-9 h-9 shrink-0" />
    )}
    <span
      title={team.name}
      className="flex-1 min-w-0 overflow-hidden whitespace-nowrap text-ellipsis text-white font-['Roboto',sans-serif] font-normal text-[clamp(14px,4vw,18px)] tracking-[0.4px]"
    >
      {team.name}
    </span>
    <span className="shrink-0 text-white font-['Roboto',sans-serif] font-medium text-[clamp(14px,4vw,18px)] tracking-[0.4px]">
      {team.pct}%
    </span>
  </div>
);

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

export default MatchCard;
