import { useEffect, useState } from 'react';
import { API_URL } from '../../../../config';
import { unwrapApiResponse } from '../../../../utils/apiResponse';

// Fetches market positions computed live from the bet ledger. Omitting
// limit/offset makes the backend skip its cached read-model snapshot, which
// can lag behind the bets tab. Rows come ordered by each user's earliest bet.
export function useLiveMarketPositions(marketId, token, refreshTrigger) {
    const [positions, setPositions] = useState([]);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        if (!token) { setStatus('anon'); return undefined; }
        if (!marketId) return undefined;
        let cancelled = false;
        setStatus('loading');
        fetch(`${API_URL}/v0/markets/positions/${marketId}`, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        })
            .then(async (res) => {
                if (!res.ok) throw new Error(res.statusText);
                const raw = unwrapApiResponse(await res.json());
                const rows = Array.isArray(raw?.positions) ? raw.positions : Array.isArray(raw) ? raw : [];
                if (cancelled) return;
                setPositions(rows);
                setStatus('ready');
            })
            .catch(() => { if (!cancelled) setStatus('error'); });
        return () => { cancelled = true; };
    }, [marketId, token, refreshTrigger]);

    return { positions, status };
}

const resolvePosition = (yes, no) => {
    if (yes > 0 && no === 0) return 'YES';
    if (no > 0 && yes === 0) return 'NO';
    return 'NEUTRAL';
};

// Mirrors the backend leaderboard calculator: only open positions, ranked by
// profit (value - spent), ties broken by earliest bet (the input order).
export function buildLeaderboard(positions) {
    return positions
        .filter((p) => Number(p.yesSharesOwned) > 0 || Number(p.noSharesOwned) > 0)
        .map((p, order) => {
            const currentValue = Number(p.value || 0);
            const totalSpent = Number(p.totalSpent || 0);
            return {
                username: p.username,
                currentValue,
                totalSpent,
                profit: currentValue - totalSpent,
                position: resolvePosition(Number(p.yesSharesOwned), Number(p.noSharesOwned)),
                order,
            };
        })
        .sort((a, b) => (b.profit - a.profit) || (a.order - b.order))
        .map((row, i) => ({ ...row, rank: i + 1 }));
}
