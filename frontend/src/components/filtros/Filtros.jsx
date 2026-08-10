import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";

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
    key: "status",
    labelKey: "filters.status",
    Icon: CheckIcon,
    optionKeys: ["filters.active", "filters.resolved"],
    optionValues: ["active", "resolved"],
  },
  {
    key: "event",
    labelKey: "filters.events",
    Icon: EventsIcon,
    optionKeys: ["filters.matches", "filters.press", "filters.standings", "filters.knockouts"],
    optionValues: ["matches", "press", "standings", "knockouts"],
  },
];

const SORT_OPTIONS = [
  { key: "popular", labelKey: "filters.mostPopular" },
  { key: "newest", labelKey: "filters.newest" },
  { key: "oldest", labelKey: "filters.oldest" },
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

const FilterSection = ({ label, Icon, options, selected, onSelect, open, onToggle }) => (
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
        {options.map(({ label: optLabel, value }) => {
          const isActive = selected === value;
          return (
            <li key={value}>
              <button
                type="button"
                onClick={() => onSelect(isActive ? null : value)}
                className={`text-[14px] transition-colors ${isActive ? "text-white font-semibold" : "text-white/60 hover:text-white"}`}
              >
                {optLabel}
                {isActive && " ✕"}
              </button>
            </li>
          );
        })}
      </ul>
    )}
  </div>
);

const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.414 4.414v7l-6 2v-8.5l-4.48 -4.928a2 2 0 0 1 -.52 -1.345v-2.227z" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <path d="M4 7l16 0" />
    <path d="M10 11l0 6" />
    <path d="M14 11l0 6" />
    <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
    <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
  </svg>
);

const FilterPanelContent = ({ openSections, toggleSection, filters, onFilterChange, resultCount }) => {
  const { t } = useTranslation();
  const hasActiveFilters = !!(filters.search || filters.status || filters.event || filters.league);

  return (
  <>
    {/* Header */}
    <h2 className="text-2xl font-bold">{t('filters.marketsTitle')}</h2>
    <div className="mt-1 flex items-center justify-between">
      <p className="text-sm text-white/50">{resultCount} {t('filters.predictions')}</p>
      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => onFilterChange("clear")}
          className="flex items-center gap-1.5 text-[12px] text-white/40 hover:text-red-400 transition-colors"
        >
          <TrashIcon />
          {t('filters.clearFilters')}
        </button>
      )}
    </div>

    {/* Search */}
    <div className="mt-4 mb-2 flex items-center gap-2 rounded-full border border-white/20 px-4 py-2">
      <SearchIcon />
      <input
        type="text"
        placeholder={t('filters.searchPlaceholder')}
        value={filters.search}
        onChange={(e) => onFilterChange("search", e.target.value)}
        className="w-full bg-transparent text-[14px] text-white placeholder-white/50 outline-none"
      />
      {filters.search && (
        <button
          type="button"
          onClick={() => onFilterChange("search", "")}
          className="text-white/40 hover:text-white transition-colors"
        >
          <CloseIcon />
        </button>
      )}
    </div>

    {/* Sort */}
    <div className="py-4 border-t border-white/10">
      <button
        type="button"
        onClick={() => toggleSection("sort")}
        className="flex w-full items-center justify-between text-white"
      >
        <span className="flex items-center gap-2">
          <StarIcon />
          <span className="text-[15px] font-semibold">{t('filters.sortBy')}</span>
        </span>
        <ChevronIcon open={!!openSections.sort} />
      </button>
      {openSections.sort && (
        <ul className="mt-3 flex flex-col gap-2 pl-[26px]">
          {SORT_OPTIONS.map((opt) => {
            const isActive = filters.sort === opt.key;
            return (
              <li key={opt.key}>
                <button
                  type="button"
                  onClick={() => onFilterChange("sort", opt.key)}
                  className={`text-[14px] transition-colors ${isActive ? "text-white font-semibold" : "text-white/60 hover:text-white"}`}
                >
                  {t(opt.labelKey)}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>

    {/* Dropdown filters */}
    {FILTER_SECTIONS.map((section) => (
      <FilterSection
        key={section.key}
        label={t(section.labelKey)}
        Icon={section.Icon}
        options={section.optionKeys.map((key, i) => ({ label: t(key), value: section.optionValues[i] }))}
        selected={filters[section.key]}
        onSelect={(val) => onFilterChange(section.key, val)}
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
          <span className="text-[15px] font-semibold">{t('filters.marketsTitle')}</span>
        </span>
        <ChevronIcon open={!!openSections.markets} />
      </button>
      {openSections.markets && (
        <div className="mt-3 flex flex-wrap gap-2 pl-[26px]">
          {MARKET_CHIPS.map((chip) => {
            const isActive = filters.league === chip;
            return (
              <button
                key={chip}
                type="button"
                onClick={() => onFilterChange("league", isActive ? null : chip)}
                className={`rounded-full border px-3 py-1 text-[13px] transition-colors ${
                  isActive
                    ? "border-white bg-white/15 text-white font-semibold"
                    : "border-white/30 text-white/70 hover:text-white hover:border-white/60"
                }`}
              >
                {chip}
                {isActive && " ✕"}
              </button>
            );
          })}
        </div>
      )}
    </div>

  </>
  );
};

const INITIAL_FILTERS = {
  search: "",
  status: null,
  event: null,
  league: null,
  sort: "popular",
};

const Filtros = ({ filters: externalFilters, onFilterChange: externalOnChange, resultCount = 0 }) => {
  const { t } = useTranslation();
  const [openSections, setOpenSections] = useState(() => {
    const initial = { markets: true, sort: true };
    FILTER_SECTIONS.forEach((section) => {
      initial[section.key] = true;
    });
    return initial;
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filters = externalFilters || INITIAL_FILTERS;
  const onFilterChange = externalOnChange || (() => {});

  const toggleSection = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const activeCount = [filters.status, filters.event, filters.league, filters.search].filter(Boolean).length;

  return (
    <>
      {/* ── DESKTOP: full filter panel ── */}
      <div className="hidden lg:block rounded-2xl border border-white/10 bg-primary-background px-5 py-6 text-white">
        <FilterPanelContent
          openSections={openSections}
          toggleSection={toggleSection}
          filters={filters}
          onFilterChange={onFilterChange}
          resultCount={resultCount}
        />
      </div>

      {/* ── MOBILE: search bar + filter button ── */}
      <div className="lg:hidden flex items-center gap-3 text-white">
        <div className="flex-1 flex items-center gap-2 rounded-full border border-white/20 px-4 py-2">
          <SearchIcon />
          <input
            type="text"
            placeholder={t('filters.searchPlaceholder')}
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="w-full bg-transparent text-[14px] text-white placeholder-white/50 outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="shrink-0 relative flex items-center justify-center w-10 h-10 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-colors"
        >
          <FilterIcon />
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-[10px] font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* ── MOBILE: filter drawer backdrop ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── MOBILE: filter drawer (right side) ── */}
      <aside
        className={`fixed top-0 right-0 z-50 w-72 h-full bg-gray-900 text-white flex flex-col
          transition-transform duration-300 ease-in-out lg:hidden
          ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <span className="text-lg font-bold">{t('filters.filtersTitle')}</span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-white/60 hover:text-white transition-colors"
            aria-label="Close filters"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <FilterPanelContent
            openSections={openSections}
            toggleSection={toggleSection}
            filters={filters}
            onFilterChange={onFilterChange}
            resultCount={resultCount}
          />
        </div>
      </aside>
    </>
  );
};

export default Filtros;
export { INITIAL_FILTERS };
