import React, { useState } from "react";

const ChevronIcon = ({ open }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`shrink-0 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
  >
    <path d="M6 9l6 6l6 -6" />
  </svg>
);

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="shrink-0 text-white/50"
  >
    <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
    <path d="M21 21l-6 -6" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
    <path d="M12 7v5l3 3" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <path d="M5 12l5 5l10 -10" />
  </svg>
);

const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" />
  </svg>
);

const EventsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
    <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
    <path d="M9 12h6" />
    <path d="M9 16h6" />
  </svg>
);

const MarketsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
    <path d="M3.6 9h16.8" />
    <path d="M3.6 15h16.8" />
    <path d="M11.5 3a17 17 0 0 0 0 18" />
    <path d="M12.5 3a17 17 0 0 1 0 18" />
  </svg>
);

const FILTER_SECTIONS = [
  {
    key: "frecuency",
    label: "Frecuency",
    Icon: ClockIcon,
    options: ["Daily", "Weekly", "Monthly", "All"],
  },
  {
    key: "status",
    label: "Status",
    Icon: CheckIcon,
    options: ["Active", "Resolved"],
  },
  {
    key: "popularity",
    label: "Popularity",
    Icon: StarIcon,
    options: ["Daily", "Weekly", "Monthly", "All"],
  },
  {
    key: "events",
    label: "Events",
    Icon: EventsIcon,
    options: ["Matches", "Press", "Standings", "Knockouts"],
  },
];

const MARKET_CHIPS = [
  "AFA",
  "LPF",
  "JDT",
  "Argentino Juniors",
  "Aldosivi",
  "Barrancas Central",
  "Belgrano Cordoba",
  "Boca Juniors",
  "Central Cordoba",
  "Huracan",
  "Independiente",
  "Newell's",
];

const FilterSection = ({ label, Icon, options, open, onToggle }) => (
  <div className="py-4 border-t border-white/10">
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between text-white"
    >
      <span className="flex items-center gap-2">
        <Icon />
        <span className="text-[15px] font-semibold">{label}</span>
      </span>
      <ChevronIcon open={open} />
    </button>
    {open && (
      <ul className="mt-3 flex flex-col gap-2 pl-[26px]">
        {options.map((option) => (
          <li key={option}>
            <button
              type="button"
              className="text-[14px] text-white/60 hover:text-white transition-colors"
            >
              {option}
            </button>
          </li>
        ))}
      </ul>
    )}
  </div>
);

const Filtros = () => {
  const [openSections, setOpenSections] = useState(() => {
    const initial = { markets: true };
    FILTER_SECTIONS.forEach((section) => {
      initial[section.key] = true;
    });
    return initial;
  });

  const toggleSection = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="rounded-2xl border border-white/10 bg-primary-background px-5 py-6 text-white">
      {/* Header */}
      <h2 className="text-2xl font-bold">Markets</h2>
      <p className="mt-1 text-sm text-white/50">12,000 predictions</p>

      {/* Search */}
      <div className="mt-4 flex items-center gap-2 rounded-full border border-white/20 px-4 py-2">
        <SearchIcon />
        <input
          type="text"
          placeholder="Search"
          className="w-full bg-transparent text-[14px] text-white placeholder-white/50 outline-none"
        />
      </div>

      {/* Dropdown filters */}
      {FILTER_SECTIONS.map((section) => (
        <FilterSection
          key={section.key}
          label={section.label}
          Icon={section.Icon}
          options={section.options}
          open={!!openSections[section.key]}
          onToggle={() => toggleSection(section.key)}
        />
      ))}

      {/* Markets (chips) */}
      <div className="py-4 border-t border-white/10">
        <button
          type="button"
          onClick={() => toggleSection("markets")}
          className="flex w-full items-center justify-between text-white"
        >
          <span className="flex items-center gap-2">
            <MarketsIcon />
            <span className="text-[15px] font-semibold">Markets</span>
          </span>
          <ChevronIcon open={!!openSections.markets} />
        </button>
        {openSections.markets && (
          <div className="mt-3 flex flex-wrap gap-2 pl-[26px]">
            {MARKET_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                className="rounded-full border border-white/30 px-3 py-1 text-[13px] text-white/70 hover:text-white hover:border-white/60 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Filtros;
