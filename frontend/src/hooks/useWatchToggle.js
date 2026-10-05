import { useCallback } from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "./useToast";
import { useWatchlist } from "./useWatchlist";

export const WATCHLIST_PATH = "/new-markets?watchlist=1";

// Toggles a market in the watchlist and confirms with a toast that links to
// the "Following" view, so users learn where saved markets end up.
export function useWatchToggle() {
  const { t } = useTranslation();
  const toast = useToast();
  const history = useHistory();
  const { isWatched, toggle } = useWatchlist();

  const toggleWithFeedback = useCallback(
    (marketId) => {
      const adding = !isWatched(marketId);
      toggle(marketId);
      if (adding) {
        toast.success(t("watchlist.added"), {
          action: { label: t("watchlist.view"), onClick: () => history.push(WATCHLIST_PATH) },
        });
      } else {
        toast.info(t("watchlist.removed"));
      }
    },
    [isWatched, toggle, toast, t, history],
  );

  return { isWatched, toggle: toggleWithFeedback };
}
