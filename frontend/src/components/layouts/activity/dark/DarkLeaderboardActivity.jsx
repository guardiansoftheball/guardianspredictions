import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../../../../config';
import { unwrapApiResponse } from '../../../../utils/apiResponse';
import { useAuth } from '../../../../helpers/AuthContent';
import { COLOR } from '../../../../styles/darkTokens';
import {
    useOutcomeLabels, Avatar, UserLink, OutcomePill, Pager, EmptyState, SkeletonRows, Row, NUM_FONT, formatNumber,
} from './activityKit';
import { useLiveMarketPositions, buildLeaderboard } from './useLiveMarketPositions';

const PAGE_SIZE = 20;
const PODIUM = ['#e8c872', '#c9d3de', '#d49a6a'];

const DarkLeaderboardActivity = ({ marketId, market, refreshTrigger }) => {
    const { t, i18n } = useTranslation();
    const locale = i18n.language || 'en';
    const { token, username: me } = useAuth();
    const labels = useOutcomeLabels(market);
    const live = useLiveMarketPositions(marketId, token, refreshTrigger);
    const [publicRows, setPublicRows] = useState([]);
    const [page, setPage] = useState(0);
    const [publicHasNext, setPublicHasNext] = useState(false);
    const [publicStatus, setPublicStatus] = useState('loading');

    useEffect(() => { setPage(0); }, [marketId, refreshTrigger]);

    // Logged-in viewers get a leaderboard derived from live positions (same
    // source as the bets tab). The public endpoint serves a cached snapshot,
    // so it is only used for anonymous viewers who can't read positions.
    const liveBoard = useMemo(() => buildLeaderboard(live.positions), [live.positions]);
    const useLive = Boolean(token);
    const rows = useLive ? liveBoard.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE) : publicRows;
    const hasNext = useLive ? liveBoard.length > (page + 1) * PAGE_SIZE : publicHasNext;
    const status = useLive ? live.status : publicStatus;

    useEffect(() => {
        if (!marketId || token) return undefined;
        let cancelled = false;
        setPublicStatus('loading');
        fetch(`${API_URL}/v0/markets/${marketId}/leaderboard?limit=${PAGE_SIZE + 1}&offset=${page * PAGE_SIZE}`)
            .then(async (res) => {
                if (!res.ok) throw new Error(res.statusText);
                const data = unwrapApiResponse(await res.json());
                const list = Array.isArray(data?.leaderboard) ? data.leaderboard : [];
                if (cancelled) return;
                setPublicRows(list.slice(0, PAGE_SIZE));
                setPublicHasNext(list.length > PAGE_SIZE);
                setPublicStatus('ready');
            })
            .catch(() => { if (!cancelled) setPublicStatus('error'); });
        return () => { cancelled = true; };
    }, [marketId, page, refreshTrigger, token]);

    if (status === 'loading' && rows.length === 0) return <SkeletonRows />;
    if (status === 'error') return <EmptyState title={t('activity.loadError')} hint={t('activity.loadErrorHint')} />;
    if (rows.length === 0) return <EmptyState title={t('activity.noParticipants')} hint={t('activity.noParticipantsHint')} />;

    return (
        <div style={{ opacity: status === 'loading' ? 0.5 : 1, transition: 'opacity .2s' }}>
            <div className="flex justify-between pb-1 text-[11px] font-semibold text-[#6b7f95]">
                <span>{t('activity.trader')}</span>
                <span>{t('activity.profit')}</span>
            </div>
            <ul>
                {rows.map((entry, i) => {
                    const profit = Number(entry.profit || 0);
                    const profitColor = profit > 0 ? COLOR.yesText : profit < 0 ? COLOR.noText : COLOR.muted;
                    const podium = entry.rank <= 3 ? PODIUM[entry.rank - 1] : null;
                    return (
                        <Row key={entry.username} index={i} highlight={entry.username === me}>
                            <span
                                className="w-6 shrink-0 text-center text-[13px] font-bold"
                                style={{ ...NUM_FONT, color: podium || '#6b7f95' }}
                                aria-label={t('activity.rank', { rank: entry.rank })}
                            >
                                {entry.rank}
                            </span>
                            <Avatar name={entry.username} />
                            <div className="min-w-0 flex-1">
                                <UserLink username={entry.username} isYou={entry.username === me} youLabel={t('activity.you')} />
                                <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[#8ca0b6]" style={NUM_FONT}>
                                    {entry.position && entry.position !== 'NEUTRAL' && (
                                        <OutcomePill outcome={entry.position} labels={labels} />
                                    )}
                                    <span className="truncate">
                                        {t('activity.spentValue', {
                                            spent: formatNumber(entry.totalSpent, locale),
                                            value: formatNumber(entry.currentValue, locale),
                                        })}
                                    </span>
                                </div>
                            </div>
                            <div className="shrink-0 text-right text-[15px] font-bold" style={{ ...NUM_FONT, color: profitColor }}>
                                {profit > 0 ? '+' : profit < 0 ? '−' : ''}{formatNumber(Math.abs(profit), locale)}
                            </div>
                        </Row>
                    );
                })}
            </ul>
            <Pager
                page={page}
                hasNext={hasNext}
                onPrev={() => setPage((p) => Math.max(0, p - 1))}
                onNext={() => setPage((p) => p + 1)}
                t={t}
            />
        </div>
    );
};

export default DarkLeaderboardActivity;
