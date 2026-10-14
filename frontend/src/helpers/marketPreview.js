// A market card already knows most of what the market page header shows:
// title, volume, options, creator, close date, description, tags. Passing it
// in the link's location state lets the page render all of that immediately,
// with skeletons only for the chart and activity.

export function cardPreview(card) {
  const binary = card.type === "question";
  const options = binary
    ? [{ label: "Yes", pct: card.pct }, { label: "No", pct: 100 - card.pct }]
    : card.options ?? [];
  return {
    id: card.id,
    type: card.type,
    title: card.question ?? "",
    volume: card.volume,
    options,
    market: card.page ?? {},
    // A binary card is a single market, so its trader count is the page's.
    users: binary ? card.popularity : undefined,
  };
}

export function marketLocation(card) {
  return { pathname: `/markets/${card.id}`, state: { preview: cardPreview(card) } };
}
