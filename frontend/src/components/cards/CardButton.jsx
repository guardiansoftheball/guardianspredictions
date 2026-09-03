import React from "react";

let _counter = 0;

function darkenHex(hex, amount = 0.2) {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.round(((n >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((n >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((n & 0xff) * (1 - amount)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function buildStops(color) {
  const dark = darkenHex(color, 0.15);
  return (
    <>
      <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="1" />
      <stop offset="20%"  stopColor={color} stopOpacity="1" />
      <stop offset="37%"  stopColor={dark} stopOpacity="1" />
      <stop offset="68%"  stopColor="#FFFFFF" stopOpacity="1" />
      <stop offset="96%"  stopColor={color} stopOpacity="1" />
      <stop offset="100%" stopColor="#999999" stopOpacity="0.55" />
    </>
  );
}

const CardButton = ({ label, color, variant = "yes", pct, onClick }) => {
  const [hovered, setHovered] = React.useState(false);
  const btnRef = React.useRef(null);
  const [dims, setDims] = React.useState({ w: 152, h: 38 });
  const id = React.useRef(`cb-grad-${_counter++}`).current;
  const stops = buildStops(color);

  React.useEffect(() => {
    if (!btnRef.current) return;
    const obs = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setDims({ w: Math.round(width), h: Math.round(height) });
    });
    obs.observe(btnRef.current);
    return () => obs.disconnect();
  }, []);

  const r = dims.h / 2;

  return (
    <button
      ref={btnRef}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex-1 min-w-0 h-[34px] sm:h-[38px] bg-transparent border-none p-0 cursor-pointer isolate flex items-center justify-center font-['Roboto',sans-serif] font-medium text-[clamp(12px,3.2vw,18px)] tracking-[0.4px] transition-colors duration-150 ease-out"
      style={{
        color: hovered ? "#000000" : color,
      }}
    >
      <svg
        viewBox={`0 0 ${dims.w} ${dims.h}`}
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
          x="0.5"
          y="0.5"
          width={dims.w - 1}
          height={dims.h - 1}
          rx={r}
          fill={hovered ? color : "white"}
          fillOpacity={hovered ? "0.9" : "0.16"}
          stroke={`url(#${id})`}
          strokeWidth="1.25"
        />
      </svg>
      <span className="relative z-[1] px-3 truncate max-w-full">
        {hovered && pct != null ? `${pct}%` : label}
      </span>
    </button>
  );
};

export default CardButton;
