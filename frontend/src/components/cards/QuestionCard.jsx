import React from "react";
import CardButton from "./CardButton";

const QuestionCard = ({
  teamLogo,
  question = "Lorem ipsum dolor sit mon amet sin?",
  pct = 70,
  poolAmount = "$5.606,90",
  onYes,
  onNo,
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
        {/* Header: logo + question + arc */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          {teamLogo && (
            <img
              src={teamLogo}
              alt="team logo"
              style={{
                width: "42px",
                height: "54px",
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          )}
          <p
            title={question}
            style={{
              margin: 0,
              fontFamily: "'Roboto', sans-serif",
              fontWeight: 500,
              fontSize: "18px",
              lineHeight: "1.3",
              letterSpacing: "0.4px",
              color: "#ffffff",
              flex: 1,
              textDecoration: hovered ? "underline" : "none",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {question}
          </p>
          {/* Arc indicator */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <ArcIndicator pct={pct} />
            <span
              style={{
                fontFamily: "'Roboto', sans-serif",
                fontWeight: 500,
                fontSize: "14px",
                letterSpacing: "0.28px",
                color: "#ffffff",
                marginTop: "2px",
              }}
            >
              {pct}%
            </span>
            <span
              style={{
                fontFamily: "'Roboto', sans-serif",
                fontWeight: 300,
                fontSize: "12px",
                letterSpacing: "0.24px",
                color: "#ffffff",
              }}
            >
              chance
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "8px" }}>
          <CardButton
            label="Yes"
            color="#bad659"
            variant="yes"
            width={148}
            pct={pct}
            onClick={onYes}
          />
          <CardButton
            label="No"
            color="#f89182"
            variant="no"
            width={148}
            pct={100 - pct}
            onClick={onNo}
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

export default QuestionCard;
