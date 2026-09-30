import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../../../../config';
import { unwrapApiResponse } from '../../../../utils/apiResponse';
import { useAuth } from '../../../../helpers/AuthContent';
import {
    useOutcomeLabels, Avatar, UserLink, OutcomePill, Pager, EmptyState, SkeletonRows, Row,
    NUM_FONT, formatRelative, formatNumber,
} from './activityKit';

const PAGE_SIZE = 20;

const DarkBetsActivity = ({ marketId, market, refreshTrigger }) => {
    const { t, i18n } = useTranslation();
    const { username: me } = useAuth();
    const locale = i18n.language || 'en';
    const labels = useOutcomeLabels(market);
    const [bets, setBets] = useState([]);
    const [page, setPage] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [status, setStatus] = useState('loading');

    useEffect(() => { setPage(0); }, [marketId, refreshTrigger]);

    useEffect(() => {
        let cancelled = false;
        setStatus('loading');
        fetch(`${API_URL}/v0/markets/bets/${marketId}?limit=${PAGE_SIZE + 1}&offset=${page * PAGE_SIZE}`)
            .then(async (res) => {
                if (!res.ok) throw new Error(res.statusText);
                const data = unwrapApiResponse(await res.json());
                const rows = Array.isArray(data) ? data : [];
                if (cancelled) return;
                setBets(rows.slice(0, PAGE_SIZE).sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt)));
                setHasNext(rows.length > PAGE_SIZE);
                setStatus('ready');
            })
            .catch(() => { if (!cancelled) setStatus('error'); });
        return () => { cancelled = true; };
    }, [marketId, refreshTrigger, page]);

    if (status === 'loading' && bets.length === 0) return <SkeletonRows />;
    if (status === 'error') return <EmptyState title={t('activity.loadError')} hint={t('activity.loadErrorHint')} />;
    if (bets.length === 0) return <EmptyState title={t('activity.noBets')} hint={t('activity.noBetsHint')} />;

    return (
        <div style={{ opacity: status === 'loading' ? 0.5 : 1, transition: 'opacity .2s' }}>
            <ul>
                {bets.map((bet, i) => {
                    const isSale = Number(bet.amount) < 0;
                    const placed = new Date(bet.placedAt);
                    return (
                        <Row key={`${bet.username}-${bet.placedAt}-${i}`} index={i}>
                            <Avatar name={bet.username} />
                            <div className="min-w-0 flex-1">
                                <div className="flex min-w-0 items-center gap-2">
                                    <UserLink username={bet.username} isYou={bet.username === me} youLabel={t('activity.you')} />
                                </div>
                                <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[#8ca0b6]">
                                    <span>{isSale ? t('activity.sold') : t('activity.bought')}</span>
                                    <OutcomePill outcome={bet.outcome} labels={labels} />
                                    <span aria-hidden="true">·</span>
                                    <time dateTime={placed.toISOString()} title={placed.toLocaleString(locale)}>
                                        {formatRelative(placed, locale)}
                                    </time>
                                </div>
                            </div>
                            <div className="shrink-0 text-right">
                                <div className="text-[14px] font-bold text-[#eaf0f7]" style={NUM_FONT}>
                                    {isSale ? '−' : ''}{formatNumber(Math.abs(bet.amount), locale)}
                                </div>
                                <div className="mt-0.5 text-[12px] text-[#6b7f95]" style={NUM_FONT}>
                                    {t('activity.priceAfter', { pct: Math.round(Number(bet.probability) * 100) })}
                                </div>
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

export default DarkBetsActivity;
