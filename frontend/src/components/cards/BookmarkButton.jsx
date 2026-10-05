import React from "react";
import { useTranslation } from "react-i18next";
import { useWatchToggle } from "../../hooks/useWatchToggle";

// Cards are rendered inside a <Link>, so the click must not bubble into a navigation.
const BookmarkButton = ({ marketId, strokeWidth = 1 }) => {
  const { t } = useTranslation();
  const { isWatched, toggle } = useWatchToggle();
  const [hovered, setHovered] = React.useState(false);
  const [pop, setPop] = React.useState(false);
  const watched = isWatched(marketId);

  if (marketId == null) return null;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(marketId);
    setPop(true);
    setTimeout(() => setPop(false), 180);
  };

  const label = watched ? t("watchlist.remove") : t("watchlist.add");

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-pressed={watched}
      aria-label={label}
      title={label}
      className="shrink-0 -m-2 p-2 bg-transparent border-none cursor-pointer"
    >
      <svg
        width="14.5"
        height="20"
        viewBox="-0.5 -0.5 15.55 20.29"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block"
        style={{
          opacity: watched || hovered ? 1 : 0.8,
          transform: pop ? "scale(1.3)" : "scale(1)",
          transition: "transform 0.18s cubic-bezier(.25,1,.5,1), opacity 0.2s ease",
        }}
        aria-hidden="true"
      >
        <path
          d="M0.91 0.5 H13.64 C13.86 0.5 14.05 0.68 14.05 0.91 V18.79 L7.27 12.02 L0.5 18.79 V0.91 C0.5 0.68 0.68 0.5 0.91 0.5 Z"
          stroke={watched ? "#C6E06C" : "#F1EFEF"}
          strokeWidth={strokeWidth}
          fill={watched ? "#C6E06C" : hovered ? "rgba(255,255,255,0.35)" : "none"}
          style={{ transition: "fill 0.2s ease, stroke 0.2s ease" }}
        />
      </svg>
    </button>
  );
};

export default BookmarkButton;
