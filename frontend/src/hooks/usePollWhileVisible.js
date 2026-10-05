import { useEffect, useRef } from "react";

// Calls `callback` every `intervalMs` while the tab is visible, and once right
// away when the user comes back to the tab. Pass a falsy interval to disable.
export function usePollWhileVisible(callback, intervalMs) {
  const saved = useRef(callback);
  saved.current = callback;

  useEffect(() => {
    if (!intervalMs) return undefined;
    let timer = null;

    const start = () => {
      clearInterval(timer);
      timer = setInterval(() => saved.current(), intervalMs);
    };
    const onVisibility = () => {
      if (document.hidden) {
        clearInterval(timer);
      } else {
        saved.current();
        start();
      }
    };

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs]);
}
