import React, { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import BottomSheet from "./BottomSheet";

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

const ICONS = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  newest: <><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /></>,
  trending: <><path d="m3 17 6-6 4 4 8-8" /><path d="M14 7h7v7" /></>,
  popular: <><path d="M12 3c1 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1.5.6-2.6 1.5-3.5C10 9 11 6 12 3Z" /></>,
  matches: <><circle cx="12" cy="12" r="9" /><path d="m12 7 3.5 2.5-1.3 4h-4.4l-1.3-4Z" /></>,
  resolved: <><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
  following: <><path d="M6 4h12v17l-6-4-6 4Z" /></>,
};

const MobileSearchSheet = ({ open, onClose, leagues = [], t }) => {
  const history = useHistory();
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const focus = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(focus);
  }, [open]);

  const go = (to) => {
    onClose();
    history.push(to);
  };

  const submit = (e) => {
    e.preventDefault();
    const q = query.trim();
    go(q ? `/new-markets?q=${encodeURIComponent(q)}` : "/new-markets");
  };

  const quickLinks = [
    { key: "trending", label: t("nav.trending"), to: "/", icon: ICONS.trending },
    { key: "popular", label: t("filters.mostPopular"), to: "/new-markets?sort=popular", icon: ICONS.popular },
    { key: "newest", label: t("filters.newest"), to: "/new-markets?sort=newest", icon: ICONS.newest },
    { key: "matches", label: t("filters.matches"), to: "/new-markets?event=matches", icon: ICONS.matches },
    { key: "resolved", label: t("filters.resolved"), to: "/new-markets?status=resolved", icon: ICONS.resolved },
    { key: "following", label: t("nav.watchlist"), to: "/new-markets?watchlist=1", icon: ICONS.following },
  ];

  return (
    <BottomSheet open={open} onClose={onClose} label={t("nav.search")}>
      {/* Search field */}
      <form onSubmit={submit} className="relative mb-6">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
          <Icon d={ICONS.search} size={18} />
        </span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("nav.searchPlaceholder")}
          enterKeyHint="search"
          className="h-12 w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] pl-11 pr-4 text-[15px] text-white placeholder:text-white/35 outline-none focus:border-white/20"
        />
      </form>

      {/* Quick links */}
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/40">{t("nav.browse")}</p>
      <div className="mb-6 flex flex-wrap gap-2">
        {quickLinks.map(({ key, label, to, icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => go(to)}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-white/[0.08] px-3.5 text-[13px] font-medium text-white/85 active:bg-white/[0.06]"
          >
            <span className="text-white/55"><Icon d={icon} size={15} /></span>
            {label}
          </button>
        ))}
      </div>

      {/* Leagues */}
      {leagues.length > 0 && (
        <>
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/40">{t("nav.leagues")}</p>
          <div className="grid grid-cols-2 gap-2">
            {leagues.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => go(`/new-markets?league=${encodeURIComponent(name)}`)}
                className="flex h-12 items-center rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 text-left text-[14px] font-medium text-white/90 active:bg-white/[0.06]"
              >
                <span className="truncate">{name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </BottomSheet>
  );
};

export default MobileSearchSheet;
