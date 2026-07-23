import { useState, useEffect, useRef, useCallback } from "react";

const PAGE_SIZE = 6;
const LOAD_DELAY = 500; // ms

/** Skeleton count that fits ~one screen: fewer on narrow/mobile viewports. */
function getSkeletonCap() {
  if (typeof window === "undefined") return 6;
  const w = window.innerWidth;
  if (w < 640) return 3;   // mobile – single column
  if (w < 1024) return 6;  // tablet – two columns
  return 12;               // desktop – three+ columns
}

/**
 * Paginated infinite-scroll hook.
 * Keeps loading pages (with a 300ms skeleton delay each) until the sentinel
 * element scrolls out of the viewport, then loads more when the user scrolls
 * back down to it.
 */
export function usePaginatedCards(allCards) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef(null);
  const timerRef = useRef(null);
  // Track whether the sentinel is currently visible so we can keep
  // filling the screen automatically after each page loads.
  const sentinelVisible = useRef(false);

  const total = allCards.length;
  const hasMore = visibleCount < total;

  const loadNextPage = useCallback(() => {
    if (loading) return;
    setLoading(true);
    timerRef.current = setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, total));
      setLoading(false);
    }, LOAD_DELAY);
  }, [loading, total]);

  // After each page finishes loading, if the sentinel is still visible
  // (screen not full yet) and there are more cards, load another page.
  useEffect(() => {
    if (!loading && hasMore && sentinelVisible.current) {
      loadNextPage();
    }
  }, [loading, hasMore, loadNextPage]);

  // Intersection observer — fires on mount and on every scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        sentinelVisible.current = entry.isIntersecting;
        if (entry.isIntersecting && !loading && hasMore) {
          loadNextPage();
        }
      },
      { rootMargin: "800px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading, hasMore, loadNextPage]);

  // Kick-start the first load on mount
  useEffect(() => {
    sentinelVisible.current = true;
    loadNextPage();
    return () => clearTimeout(timerRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleCards = allCards.slice(0, visibleCount);
  // Show enough skeletons to fill ~one screen, capped to remaining
  const skeletonCount = Math.min(getSkeletonCap(), total - visibleCount);

  return { visibleCards, skeletonCount, loading, hasMore, sentinelRef };
}
