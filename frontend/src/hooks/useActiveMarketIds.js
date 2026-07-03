import { useState, useEffect } from 'react';
import { API_URL } from '../config';

/**
 * Fetches active market IDs from the API.
 * Falls back to [1, 2, 3] if the backend is unavailable.
 */
export const useActiveMarketIds = (limit = 25) => {
  const [marketIds, setMarketIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIds = async () => {
      try {
        const res = await fetch(`${API_URL}/v0/markets/active`);
        if (!res.ok) throw new Error('Non-OK response');
        const data = await res.json();
        const markets = Array.isArray(data) ? data : data?.markets ?? data?.result ?? [];
        const ids = markets
          .map((m) => m.id ?? m.ID ?? m.Id)
          .filter(Boolean)
          .slice(0, limit);
        setMarketIds(ids.length > 0 ? ids : [1, 2, 3]);
      } catch {
        setMarketIds([1, 2, 3]);
      } finally {
        setLoading(false);
      }
    };
    fetchIds();
  }, [limit]);

  return { marketIds, loading };
};
