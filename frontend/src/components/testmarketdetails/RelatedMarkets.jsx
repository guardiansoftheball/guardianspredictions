import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_URL } from "../../config";
import { transformMarkets } from "../../hooks/useMarkets";
import { getFlag } from "../../helpers/countryFlags";

const Logo = ({ src }) => (
  <span className="flex h-5 w-7 shrink-0 items-center justify-center">
    {src && <img src={src} alt="" className="max-h-5 max-w-7 object-contain" />}
  </span>
);

const OutcomeRow = ({ logo, label, pct }) => (
  <div className="flex items-center gap-2.5">
    <Logo src={logo} />
    <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-white">{label}</span>
    <span className="text-[14px] font-semibold tabular-nums text-white/80">{pct}¢</span>
  </div>
);

function rowsFor(card) {
  if (card.type === "match") {
    return [
      { logo: card.home.logo, label: card.home.name, pct: card.home.pct },
      { logo: card.away.logo, label: card.away.name, pct: card.away.pct },
    ];
  }
  if (card.type === "prediction") {
    return [...card.options]
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 2)
      .map((o) => ({ logo: getFlag(o.label), label: o.label, pct: o.pct }));
  }
  return null;
}

const RelatedRow = ({ card, locale, t }) => {
  const rows = rowsFor(card);
  const close = card.page?.resolutionDateTime ? new Date(card.page.resolutionDateTime) : null;
  const date = close && !Number.isNaN(close.getTime())
    ? close.toLocaleDateString(locale, { month: "short", day: "numeric" })
    : null;

  return (
    <Link
      to={`/markets/${card.id}`}
      className="block border-t border-white/[0.06] py-5 no-underline transition-opacity hover:opacity-80"
    >
      <div className="mb-2.5 text-[12px] text-white/40">
        {[date, `${t("marketDetails.volShort")} $${Math.round(card.volume ?? 0).toLocaleString("en-US")}`].filter(Boolean).join(" · ")}
      </div>
      {card.type !== "match" && (
        <div className={`line-clamp-2 text-[14px] font-semibold leading-snug text-white ${rows ? "mb-2.5" : ""}`}>
          {rows ? card.question : (
            <div className="flex items-start gap-2.5">
              <Logo src={card.logo} />
              <span className="min-w-0 flex-1">{card.question}</span>
              <span className="tabular-nums text-white/80">{card.pct}¢</span>
            </div>
          )}
        </div>
      )}
      {rows && (
        <div className="flex flex-col gap-2">
          {rows.map((r) => <OutcomeRow key={r.label} {...r} />)}
        </div>
      )}
    </Link>
  );
};

const RelatedMarkets = ({ marketId }) => {
  const { t, i18n } = useTranslation();
  const [cards, setCards] = useState([]);

  useEffect(() => {
    if (!marketId) return undefined;
    let cancelled = false;
    fetch(`${API_URL}/v0/markets/${marketId}/related?limit=4`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        const raw = data?.markets ?? [];
        setCards(Array.isArray(raw) ? transformMarkets(raw) : []);
      })
      .catch(() => { if (!cancelled) setCards([]); });
    return () => { cancelled = true; };
  }, [marketId]);

  if (!cards.length) return null;

  return (
    <section aria-labelledby="related-markets-title">
      <h2 id="related-markets-title" className="m-0 pb-3 text-[15px] font-bold text-white">
        {t("marketDetails.relatedMarkets")}
      </h2>
      {cards.map((card, i) => (
        <RelatedRow key={card.id ?? i} card={card} locale={i18n.language} t={t} />
      ))}
    </section>
  );
};

export default RelatedMarkets;
