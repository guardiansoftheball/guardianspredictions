import React from "react";

const PredictionCard = ({
  teamLogo,
  question = "Lorem ipsum dolor sit mon amet sin?",
  options = [
    { label: "Opción A", pct: 30 },
    { label: "Opción B", pct: 70 },
  ],
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
        // backgroundImage: "conic-gradient(from 0deg, #B4D1ED 0%, #B4D1ED 19%, #5A6B89 36%, #B4D1ED 45%, #B4D1ED 63%, #5A6B89 75%, #B4D1ED 88%, #B4D1ED 100%)",
        border: "1px solid #B4D1ED",

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
            "linear-gradient(to bottom, rgba(126,150,208,0.25) 33%, rgba(23,26,43,0.10) 100%), rgba(18,21,42,0.05)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          overflow: "hidden",
          padding: "24px 20px 20px 20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "235px",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            gap: "16px",
          }}
        >
          {teamLogo && (
            <img
              src={teamLogo}
              alt="team logo"
              style={{
                width: "38px",
                height: "49px",
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          )}
          <p
            title={question}
            style={{
              margin: 0,
              color: "#ffffff",
              fontFamily: "'Roboto', sans-serif",
              fontWeight: 500,
              fontSize: "20px",
              letterSpacing: "0.4px",
              lineHeight: "1.3",
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
        </div>

        {/* Options rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              color: "#ffffff",
              fontFamily: "'Roboto', sans-serif",
              fontWeight: 300,
              fontSize: "18px",
              letterSpacing: "0.4px",
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

const PredictionRow = ({ label, pct, onYes, onNo }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
    }}
  >
    <span
      title={label}
      style={{
        color: "#ffffff",
        fontFamily: "'Roboto', sans-serif",
        fontWeight: 400,
        fontSize: "18px",
        letterSpacing: "0.4px",
        flex: 1,
        minWidth: 0,
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
      }}
    >
      {label}
    </span>
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "8px",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          color: "#ffffff",
          fontFamily: "'Roboto', sans-serif",
          fontWeight: 500,
          fontSize: "18px",
          letterSpacing: "0.4px",
          width: "42px",
          flexShrink: 0,
        }}
      >
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
      style={{
        position: "relative",
        width: "65px",
        height: "38px",
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        flexShrink: 0,
        color: hovered ? "#ffffff" : color,
        fontFamily: "'Roboto', sans-serif",
        fontWeight: 500,
        fontSize: "18px",
        letterSpacing: "0.4px",
        isolation: "isolate",
        transition: "color 0.25s ease, transform 0.2s ease",
        transform: hovered ? "scale(1.06)" : "scale(1)",
      }}
    >
      <svg
        width="65"
        height="38"
        viewBox="0 0 65 38"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "65px",
          height: "38px",
          zIndex: 0,
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            {gradientStops}
          </linearGradient>
        </defs>
        <rect
          x="0.25"
          y="0.25"
          width="64.5"
          height="37.5"
          rx="11.75"
          fill={hovered ? color : "white"}
          fillOpacity={hovered ? "0.9" : "0.16"}
          stroke={`url(#${gradientId})`}
          strokeWidth="0.5"
        />
      </svg>
      <span
        style={{
          position: "relative",
          zIndex: 1,
          transition: "opacity 0.2s ease",
          opacity: 1,
        }}
      >
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

export default PredictionCard;
