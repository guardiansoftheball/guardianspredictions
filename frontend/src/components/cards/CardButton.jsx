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
 * CardButton — botón fluido con borde SVG gradient.
 * Se estira al ancho disponible de su contenedor (flex-1); el SVG
 * escala vía viewBox en lugar de depender de un ancho fijo en px.
 * Props:
 *   label     string   — texto del botón
 *   color     string   — color del texto (#BAD659 o #f89182)
 *   variant   "yes"|"no"  — determina el gradient del borde
 *   onClick   fn
 */
const CardButton = ({ label, color, variant = "yes", pct, onClick }) => {
  const [hovered, setHovered] = React.useState(false);
  const id = React.useRef(`cb-grad-${_counter++}`).current;
  const stops = variant === "yes" ? YES_STOPS : NO_STOPS;
  const vbW = 152;
  const vbH = 38;
  const r = 11.75;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex-1 min-w-0 h-[34px] sm:h-[38px] bg-transparent border-none p-0 cursor-pointer isolate flex items-center justify-center font-['Roboto',sans-serif] font-medium text-[clamp(12px,3.2vw,18px)] tracking-[0.4px] transition-[color,transform] duration-150 ease-out"
      style={{
        color: hovered ? "#000000" : color,
        transform: hovered ? "scale(1.04)" : "scale(1)",
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
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            {stops}
          </linearGradient>
        </defs>
        <rect
          x="0.25"
          y="0.25"
          width={vbW - 0.5}
          height={vbH - 0.5}
          rx={r}
          fill={hovered ? color : "white"}
          fillOpacity={hovered ? "0.9" : "0.16"}
          stroke={`url(#${id})`}
          strokeWidth="0.5"
        />
      </svg>
      <span className="relative z-[1] px-1 truncate max-w-full">
        {hovered && pct != null ? `${pct}%` : label}
      </span>
    </button>
  );
};

export default CardButton;
