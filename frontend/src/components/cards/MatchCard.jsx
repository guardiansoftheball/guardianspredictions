import React from "react";
import CardButton from "./CardButton";

const MatchCard = ({
  homeTeam = { name: "Atlético Madrid", logo: null, pct: 70 },
  awayTeam = { name: "Barcelona", logo: null, pct: 30 },
  draw = { pct: 0 },
  poolAmount = "$5.606,90",
  onHome,
  onDraw,
  onAway,
}) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "344px",
        borderRadius: "41px",
        backgroundImage:
          "conic-gradient(from 0deg, #B4D1ED 0%, #B4D1ED 19%, #5A6B89 36%, #B4D1ED 45%, #B4D1ED 63%, #5A6B89 75%, #B4D1ED 88%, #B4D1ED 100%)",
        padding: "1px",
        boxSizing: "border-box",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: "100%",
          borderRadius: "41px",
          background:
            "linear-gradient(to bottom, rgba(126,150,208,0.30) 33%, rgba(23,26,43,0.30) 100%), #12152a",
          overflow: "hidden",
          padding: "24px 20px 20px 20px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "235px",
        }}
      >
        {/* Teams */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <TeamRow team={homeTeam} />
          <TeamRow team={awayTeam} />
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "8px" }}>
          <CardButton
            label={homeTeam.name}
            color="#bad659"
            variant="yes"
            width={93}
            pct={homeTeam.pct}
            onClick={onHome}
          />
          <CardButton
            label="Draw"
            color="#b4d1ed"
            variant="yes"
            width={93}
            pct={draw.pct}
            onClick={onDraw}
          />
          <CardButton
            label={awayTeam.name}
            color="#f89182"
            variant="no"
            width={93}
            pct={awayTeam.pct}
            onClick={onAway}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: "'Roboto', sans-serif",
              fontWeight: 300,
              fontSize: "18px",
              letterSpacing: "0.4px",
              color: "#ffffff",
            }}
          >
            {poolAmount}
          </span>
          <BookmarkIcon />
        </div>
      </div>
    </div>
  );
};

const TeamRow = ({ team }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
    {team.logo ? (
      <img
        src={team.logo}
        alt={team.name}
        style={{
          width: "36px",
          height: "36px",
          objectFit: "contain",
          flexShrink: 0,
        }}
      />
    ) : (
      <div style={{ width: "36px", height: "36px", flexShrink: 0 }} />
    )}
    <span
      title={team.name}
      style={{
        fontFamily: "'Roboto', sans-serif",
        fontWeight: 400,
        fontSize: "18px",
        letterSpacing: "0.4px",
        color: "#ffffff",
        flex: 1,
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
      }}
    >
      {team.name}
    </span>
    <span
      style={{
        fontFamily: "'Roboto', sans-serif",
        fontWeight: 500,
        fontSize: "18px",
        letterSpacing: "0.4px",
        color: "#ffffff",
      }}
    >
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
      style={{
        opacity: hovered ? 1 : 0.8,
        display: "block",
        flexShrink: 0,
        cursor: "pointer",
        transition: "opacity 0.2s ease",
      }}
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
