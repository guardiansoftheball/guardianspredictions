import React, { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import { searchMarkets } from "../../api/marketsApi";

const MAX_RESULTS = 6;

// Group children come back one per answer; show each group once, linked to its first child.
function toResults(data) {
  const rows = [...(data?.primaryResults ?? []), ...(data?.fallbackResults ?? [])];
  const seen = new Set();
  const out = [];
  rows.forEach(({ market, lastProbability, totalVolume }) => {
    if (!market) return;
    const group = market.marketGroup;
    const key = group?.id ? `g${group.id}` : `m${market.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({
      key,
      id: market.id,
      title: group?.questionTitle || market.questionTitle,
      pct: group?.id ? null : Math.round((lastProbability ?? 0) * 100),
      volume: totalVolume ?? 0,
      resolved: market.isResolved,
    });
  });
  return out.slice(0, MAX_RESULTS);
}

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

const NavSearch = ({ t }) => {
  const history = useHistory();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!wrapperRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return undefined;
    }
    let cancelled = false;
    const id = setTimeout(() => {
      searchMarkets(q, "all", 20)
        .then((data) => { if (!cancelled) { setResults(toResults(data)); setActive(-1); } })
        .catch(() => { if (!cancelled) setResults([]); });
    }, 200);
    return () => { cancelled = true; clearTimeout(id); };
  }, [query]);

  const goTo = (path) => {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    history.push(path);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && results[active]) goTo(`/markets/${results[active].id}`);
      else if (query.trim()) goTo(`/new-markets?q=${encodeURIComponent(query.trim())}`);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const showPanel = open && query.trim().length >= 2;

  return (
    <div ref={wrapperRef} className="relative w-full">
      <label className="flex h-12 items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.05] px-3 text-white/45 transition-colors focus-within:border-white/20 focus-within:bg-white/[0.07]">
        <SearchIcon />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={t("nav.searchPlaceholder")}
          aria-label={t("nav.search")}
          className="min-w-0 flex-1 bg-transparent text-[15px] text-white placeholder:text-white/40 outline-none"
        />
      </label>

      {showPanel && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[120] overflow-hidden rounded-[14px] border border-white/[0.08] bg-[#11161f] p-1.5 shadow-[0_18px_48px_rgba(0,0,0,0.55)]">
          {results.length === 0 ? (
            <div className="px-3 py-4 text-center text-[13px] text-white/45">{t("nav.searchEmpty")}</div>
          ) : (
            results.map((r, i) => (
              <button
                key={r.key}
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => goTo(`/markets/${r.id}`)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  active === i ? "bg-white/[0.07]" : ""
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] text-white">{r.title}</span>
                  <span className="text-[12px] text-white/40">
                    {r.resolved ? t("filters.resolved") : `Vol. $${Math.round(r.volume).toLocaleString("en-US")}`}
                  </span>
                </span>
                {r.pct != null && <span className="shrink-0 text-[14px] font-semibold tabular-nums text-white/85">{r.pct}%</span>}
              </button>
            ))
          )}
          <button
            type="button"
            onClick={() => goTo(`/new-markets?q=${encodeURIComponent(query.trim())}`)}
            className="mt-1 w-full rounded-lg border-t border-white/[0.06] px-3 py-2.5 text-left text-[13px] text-white/60 hover:text-white"
          >
            {t("nav.searchSeeAll", { query: query.trim() })}
          </button>
        </div>
      )}
    </div>
  );
};

export default NavSearch;
