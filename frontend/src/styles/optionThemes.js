// Per-option colors: first=green, last=red, middles=neutral/purple/orange/teal.
export const OPTION_THEMES = [
  {
    color: "#BAD659",
    text: "#C6E06C",
    bg: "rgba(186,214,89,0.10)",
    border: "rgba(186,214,89,0.28)",
    activeBorder: "rgba(186,214,89,0.55)",
    gradient: "linear-gradient(180deg,#BAD659,#AABA49)",
    shadow: "0 8px 22px rgba(186,214,89,0.30)",
  },
  {
    color: "#fb5b6b",
    text: "#fb8b96",
    bg: "rgba(251,91,107,0.10)",
    border: "rgba(251,91,107,0.25)",
    activeBorder: "rgba(251,91,107,0.55)",
    gradient: "linear-gradient(180deg,#fb5b6b,#e11d48)",
    shadow: "0 8px 22px rgba(244,63,94,0.28)",
  },
  {
    color: "#6b7f96",
    text: "#8ca0b6",
    bg: "rgba(107,127,150,0.09)",
    border: "rgba(107,127,150,0.22)",
    activeBorder: "rgba(107,127,150,0.50)",
    gradient: "linear-gradient(180deg,#6b7f96,#4a5e72)",
    shadow: "0 8px 22px rgba(107,127,150,0.22)",
  },
  {
    color: "#a78bfa",
    text: "#c4b5fd",
    bg: "rgba(167,139,250,0.10)",
    border: "rgba(167,139,250,0.26)",
    activeBorder: "rgba(167,139,250,0.52)",
    gradient: "linear-gradient(180deg,#a78bfa,#7c3aed)",
    shadow: "0 8px 22px rgba(167,139,250,0.28)",
  },
  {
    color: "#f6ad55",
    text: "#fbd38d",
    bg: "rgba(246,173,85,0.10)",
    border: "rgba(246,173,85,0.24)",
    activeBorder: "rgba(246,173,85,0.50)",
    gradient: "linear-gradient(180deg,#f6ad55,#d97706)",
    shadow: "0 8px 22px rgba(246,173,85,0.26)",
  },
  {
    color: "#4fd1c5",
    text: "#81e6d9",
    bg: "rgba(79,209,197,0.10)",
    border: "rgba(79,209,197,0.24)",
    activeBorder: "rgba(79,209,197,0.50)",
    gradient: "linear-gradient(180deg,#4fd1c5,#0d9488)",
    shadow: "0 8px 22px rgba(79,209,197,0.24)",
  },
];

export function getOptionTheme(index, total) {
  if (total === 1) return OPTION_THEMES[0];
  if (index === 0) return OPTION_THEMES[0];
  if (index === total - 1) return OPTION_THEMES[1];
  const midSlot = ((index - 1) % (OPTION_THEMES.length - 2)) + 2;
  return OPTION_THEMES[midSlot];
}
