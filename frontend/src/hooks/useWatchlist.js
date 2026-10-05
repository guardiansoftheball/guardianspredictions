import { useCallback, useSyncExternalStore } from "react";

// Watchlist of followed market ids, kept per browser in localStorage.
// All components subscribe to the same store, so toggling a bookmark in one
// card updates every other view (and other tabs, via the storage event).
const STORAGE_KEY = "gp.watchlist.v1";
const EMPTY = [];

let cache = null;
const listeners = new Set();

function read() {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    cache = Array.isArray(parsed) ? parsed.map(String) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(ids) {
  cache = ids;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable (private mode, quota): keep the in-memory copy.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  const onStorage = (e) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useWatchlist() {
  const ids = useSyncExternalStore(subscribe, read, () => EMPTY);

  const isWatched = useCallback(
    (marketId) => marketId != null && ids.includes(String(marketId)),
    [ids],
  );

  const toggle = useCallback((marketId) => {
    if (marketId == null) return;
    const id = String(marketId);
    const current = read();
    write(current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  }, []);

  return { ids, isWatched, toggle };
}
