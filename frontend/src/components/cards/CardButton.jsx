import React from "react";

let _counter = 0;

const YES_STOPS = (
  <>
    <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="1" />
    <stop offset="28%"  stopColor="#BAD659" stopOpacity="1" />
    <stop offset="37%"  stopColor="#AABA49" stopOpacity="1" />
    <stop offset="68%"  stopColor="#FFFFFF" stopOpacity="1" />
    <stop offset="96%"  stopColor="#BAD659" stopOpacity="1" />
    <stop offset="100%" stopColor="#999999" stopOpacity="0.55" />
  </>
);

const NO_STOPS = (
  <>
    <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="1" />
    <stop offset="15%"  stopColor="#F89182" stopOpacity="1" />
    <stop offset="37%"  stopColor="#AABA49" stopOpacity="1" />
    <stop offset="68%"  stopColor="#FFFFFF" stopOpacity="1" />
    <stop offset="96%"  stopColor="#F89182" stopOpacity="1" />
    <stop offset="100%" stopColor="#999999" stopOpacity="0.55" />
  </>
);

/**
 * CardButton — botón ancho con borde SVG gradient.
 * Props:
 *   label     string   — texto del botón
 *   color     string   — color del texto (#bad659 o #f89182)
 *   variant   "yes"|"no"  — determina el gradient del borde
 *   width     number   — ancho en px (default 152)
 *   onClick   fn
 */
const CardButton = ({ label, color, variant = "yes", width = 152, pct, onClick }) => {
  const [hovered, setHovered] = React.useState(false);
  const id = React.useRef(`cb-grad-${_counter++}`).current;
  const stops = variant === "yes" ? YES_STOPS : NO_STOPS;
  const h = 38;
  const r = 11.75;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        width: `${width}px`,
        height: `${h}px`,
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
        transition: "color 0.2s ease, transform 0.15s ease",
        transform: hovered ? "scale(1.04)" : "scale(1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width={width}
        height={h}
        viewBox={`0 0 ${width} ${h}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", top: 0, left: 0, zIndex: 0 }}
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            {stops}
          </linearGradient>
        </defs>
        <rect
          x="0.25"
          y="0.25"
          width={width - 0.5}
          height={h - 0.5}
          rx={r}
          fill={hovered ? color : "white"}
          fillOpacity={hovered ? "0.9" : "0.16"}
          stroke={`url(#${id})`}
          strokeWidth="0.5"
        />
      </svg>
      <span
        title={label}
        style={{
          position: "relative",
          zIndex: 1,
          display: "block",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: `${width - 16}px`,
        }}
      >
        {hovered && pct != null ? `${pct}%` : label}
      </span>
    </button>
  );
};

export default CardButton;
