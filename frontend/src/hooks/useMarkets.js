import { useState, useEffect } from "react";
import { API_URL } from "../config";
import { getFlag, getFlagFromText } from "../helpers/countryFlags";

/**
 * Fetches active markets from the API and transforms them into card-ready data.
 *
 * Binary markets → type "question" (QuestionCard)
 * Market groups with 3 answers (incl. "Draw") → type "match" (MatchCard)
 * Market groups with 2+ answers → type "prediction" (PredictionCard)
 */
const REFRESH_MS = 20000;

// Last good list, so coming back to a markets page renders the cards at once
// (and the back transition has a card to land on) while a refresh runs.
let cardsCache = null;

export function useMarkets({ refreshMs = REFRESH_MS } = {}) {
  const [cards, setCards] = useState(() => cardsCache ?? []);
  const [loading, setLoading] = useState(() => cardsCache == null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let hasData = cardsCache != null;
    let timer = null;

    async function fetchMarkets() {
      try {
        const res = await fetch(`${API_URL}/v0/markets?status=active`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const rawMarkets = data?.markets ?? data?.result ?? [];
        if (cancelled) return;
        cardsCache = Array.isArray(rawMarkets) ? transformMarkets(rawMarkets) : [];
        setCards(cardsCache);
        setError(null);
        hasData = true;
      } catch (err) {
        if (cancelled) return;
        setError(err);
        // A failed background refresh keeps the last good prices on screen.
        if (!hasData) setCards([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    // Live prices: poll while the tab is visible, refresh right away on return.
    const schedule = () => {
      clearTimeout(timer);
      if (!refreshMs || document.hidden) return;
      timer = setTimeout(async () => {
        await fetchMarkets();
        if (!cancelled) schedule();
      }, refreshMs);
    };

    const onVisibility = () => {
      if (document.hidden) {
        clearTimeout(timer);
      } else {
        fetchMarkets().then(() => { if (!cancelled) schedule(); });
      }
    };

    fetchMarkets().then(() => { if (!cancelled) schedule(); });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refreshMs]);

  return { cards, loading, error };
}

function transformMarkets(rawMarkets) {
  // Separate standalone markets from group children
  const standalone = [];
  const groupChildren = new Map(); // groupId → [market overviews]

  for (const item of rawMarkets) {
    const market = item?.market ?? item;
    if (!market) continue;

    const group = market.marketGroup;
    if (group && group.id > 0) {
      const groupId = group.id;
      if (!groupChildren.has(groupId)) {
        groupChildren.set(groupId, { group, children: [] });
      }
      groupChildren.get(groupId).children.push({
        answerLabel: group.answerLabel || market.questionTitle,
        displayOrder: group.displayOrder ?? 0,
        lastProbability: item.lastProbability ?? 0,
        marketId: market.id,
        totalVolume: item.totalVolume ?? 0,
        numUsers: item.numUsers ?? 0,
        page: pageFields(market),
      });
    } else {
      standalone.push(toQuestionCard(item));
    }
  }

  // Transform grouped markets
  const groupCards = [];
  for (const [, entry] of groupChildren) {
    const { group, children } = entry;
    // Sort by displayOrder
    children.sort((a, b) => a.displayOrder - b.displayOrder);

    const totalVolume = children.reduce((sum, c) => sum + c.totalVolume, 0);
    const maxUsers = Math.max(...children.map((c) => c.numUsers));
    const pool = formatPool(totalVolume);
    const hasDrawOption = children.some(
      (c) => c.answerLabel.toLowerCase() === "draw"
    );

    if (children.length === 3 && hasDrawOption) {
      // Match card: home / away / draw
      const home = children.find((c) => c.answerLabel.toLowerCase() !== "draw" && c.displayOrder === children.filter((x) => x.answerLabel.toLowerCase() !== "draw")[0]?.displayOrder);
      const away = children.find((c) => c.answerLabel.toLowerCase() !== "draw" && c !== home);
      const draw = children.find((c) => c.answerLabel.toLowerCase() === "draw");

      groupCards.push({
        type: "match",
        home: {
          name: home?.answerLabel ?? "",
          logo: getFlag(home?.answerLabel),
          pct: Math.round((home?.lastProbability ?? 0) * 100),
        },
        away: {
          name: away?.answerLabel ?? "",
          logo: getFlag(away?.answerLabel),
          pct: Math.round((away?.lastProbability ?? 0) * 100),
        },
        draw: {
          pct: Math.round((draw?.lastProbability ?? 0) * 100),
        },
        // Same order as the market page lists the answers.
        options: children.map((c) => ({
          label: c.answerLabel,
          marketId: c.marketId,
          pct: Math.round((c.lastProbability ?? 0) * 100),
        })),
        pool,
        volume: totalVolume,
        status: "active",
        event: "matches",
        league: group.questionTitle,
        teams: [home?.answerLabel, away?.answerLabel].filter(Boolean),
        popularity: maxUsers,
        createdAt: group.createdAt,
        id: home?.marketId,
        page: home?.page,
        groupId: null,
        question: group.questionTitle,
      });
    } else {
      // Prediction card
      const options = children.map((c) => ({
        label: c.answerLabel,
        marketId: c.marketId,
        pct: Math.round((c.lastProbability ?? 0) * 100),
      }));

      const firstLabel = children[0]?.answerLabel;
      const logo = getFlag(firstLabel);

      groupCards.push({
        type: "prediction",
        question: group.questionTitle,
        options,
        pool,
        volume: totalVolume,
        logo,
        status: "active",
        event: "knockouts",
        league: group.questionTitle,
        teams: children.map((c) => c.answerLabel),
        popularity: maxUsers,
        createdAt: group.createdAt,
        id: children[0]?.marketId,
        page: children[0]?.page,
        groupId: null,
      });
    }
  }

  // Interleave: groups first, then standalone
  return [...groupCards, ...standalone];
}

// The market fields the market page header shows, carried on the card so the
// page can render them before its own request returns.
function pageFields(market) {
  return {
    creatorUsername: market.creatorUsername,
    stewardUsername: market.stewardUsername,
    resolutionDateTime: market.resolutionDateTime,
    description: market.description,
    tags: market.tags,
    yesLabel: market.yesLabel,
    noLabel: market.noLabel,
    isResolved: market.isResolved,
    resolutionResult: market.resolutionResult,
  };
}

function toQuestionCard(item) {
  const market = item?.market ?? item;
  const pct = Math.round((item.lastProbability ?? 0) * 100);
  const title = market.questionTitle ?? "";

  return {
    type: "question",
    question: title,
    pct,
    pool: formatPool(item.totalVolume ?? 0),
    volume: item.totalVolume ?? 0,
    logo: getFlagFromText(title),
    status: "active",
    event: "standings",
    league: (market.tags ?? [])[0]?.displayName ?? "",
    teams: [],
    popularity: item.numUsers ?? 0,
    page: pageFields(market),
    createdAt: market.createdAt,
    id: market.id,
  };
}

function formatPool(volume) {
  if (!volume || volume === 0) return "$0.00";
  return `$${volume.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
