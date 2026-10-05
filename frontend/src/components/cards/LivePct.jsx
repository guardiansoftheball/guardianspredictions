import React, { useEffect, useRef, useState } from "react";

const FLASH_MS = 1400;

// Renders a percentage and briefly tints it green/red when the value moves,
// so live price refreshes are visible on the cards.
const LivePct = ({ value, className = "", suffix = "%" }) => {
  const prev = useRef(value);
  const [dir, setDir] = useState(null);

  useEffect(() => {
    if (prev.current === value) return undefined;
    const next = value > prev.current ? "up" : "down";
    prev.current = value;
    setDir(next);
    const id = setTimeout(() => setDir(null), FLASH_MS);
    return () => clearTimeout(id);
  }, [value]);

  const color = dir === "up" ? "#C6E06C" : dir === "down" ? "#fb8b96" : undefined;

  return (
    <span
      className={`relative inline-block ${className}`}
      style={{ color, transition: "color 0.6s ease" }}
    >
      {dir && (
        <span aria-hidden="true" className="absolute right-full top-1/2 -translate-y-1/2 mr-0.5 text-[0.6em] leading-none pointer-events-none">
          {dir === "up" ? "▲" : "▼"}
        </span>
      )}
      {value}
      {suffix}
    </span>
  );
};

export default LivePct;
