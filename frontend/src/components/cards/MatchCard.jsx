import React from "react";
import BookmarkButton from "./BookmarkButton";
import LivePct from "./LivePct";
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
        {/* Teams */}
        <div className="flex flex-col gap-3">
          <TeamRow team={homeTeam} />
          <TeamRow team={awayTeam} />
        </div>

        {/* Buttons */}
        <div className="flex gap-[6px]">
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
          <BookmarkButton marketId={marketId} />
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
      <LivePct value={team.pct} />
    </span>
  </div>
);


export default MatchCard;
