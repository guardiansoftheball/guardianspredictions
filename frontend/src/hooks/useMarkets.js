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
export function useMarkets() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchMarkets() {
      try {
        const res = await fetch(`${API_URL}/v0/markets?status=active`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const rawMarkets = data?.markets ?? data?.result ?? [];
        if (!Array.isArray(rawMarkets)) {
          setCards([]);
          return;
        }

        const transformed = transformMarkets(rawMarkets);
        if (!cancelled) {
          setCards(transformed);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setCards([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchMarkets();
    return () => { cancelled = true; };
  }, []);

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
        pool,
        status: "active",
        event: "matches",
        league: group.questionTitle,
        teams: [home?.answerLabel, away?.answerLabel].filter(Boolean),
        popularity: maxUsers,
        createdAt: group.createdAt,
        id: home?.marketId,
        groupId: null,
        question: group.questionTitle,
      });
    } else {
      // Prediction card
      const options = children.map((c) => ({
        label: c.answerLabel,
        pct: Math.round((c.lastProbability ?? 0) * 100),
      }));

      const firstLabel = children[0]?.answerLabel;
      const logo = getFlag(firstLabel);

      groupCards.push({
        type: "prediction",
        question: group.questionTitle,
        options,
        pool,
        logo,
        status: "active",
        event: "knockouts",
        league: group.questionTitle,
        teams: children.map((c) => c.answerLabel),
        popularity: maxUsers,
        createdAt: group.createdAt,
        id: children[0]?.marketId,
        groupId: null,
      });
    }
  }

  // Interleave: groups first, then standalone
  return [...groupCards, ...standalone];
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
    logo: getFlagFromText(title),
    status: "active",
    event: "standings",
    league: (market.tags ?? [])[0]?.displayName ?? "",
    teams: [],
    popularity: item.numUsers ?? 0,
    createdAt: market.createdAt,
    id: market.id,
  };
}

function formatPool(volume) {
  if (!volume || volume === 0) return "$0.00";
  return `$${volume.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
