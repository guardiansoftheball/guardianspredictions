import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../helpers/AuthContent';
import { COLOR } from '../../../../styles/darkTokens';
import {
    useOutcomeLabels, Avatar, UserLink, Pager, EmptyState, SkeletonRows, Row, NUM_FONT, formatNumber,
} from './activityKit';
import { useLiveMarketPositions } from './useLiveMarketPositions';

const PAGE_SIZE = 20;

function HolderColumn({ title, color, holders, sharesKey, me, locale, t }) {
    const total = holders.reduce((sum, h) => sum + Number(h[sharesKey] || 0), 0);
    return (
        <section aria-label={title} className="min-w-0">
            <header className="flex items-baseline justify-between pb-2" style={{ borderBottom: `1px solid ${color}33` }}>
                <h3 className="truncate text-[13px] font-bold" style={{ color }}>{title}</h3>
                <span className="shrink-0 text-[12px] text-[#6b7f95]" style={NUM_FONT}>
                    {t('activity.holders', { count: holders.length })} · {formatNumber(total, locale)} {t('activity.sharesShort')}
                </span>
            </header>
            {holders.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-[#6b7f95]">{t('activity.noHolders')}</p>
            ) : (
                <ul>
                    {holders.map((pos, i) => (
                        <Row key={pos.username} index={i} highlight={pos.username === me}>
                            <Avatar name={pos.username} size={28} />
                            <div className="min-w-0 flex-1">
                                <UserLink username={pos.username} isYou={pos.username === me} youLabel={t('activity.you')} />
                            </div>
                            <div className="shrink-0 text-right">
                                <div className="text-[14px] font-bold text-[#eaf0f7]" style={NUM_FONT}>
                                    {formatNumber(pos[sharesKey], locale)}
                                </div>
                                <div className="text-[11px] text-[#6b7f95]" style={NUM_FONT}>
                                    {t('activity.valueShort', { value: formatNumber(pos.value, locale) })}
                                </div>
                            </div>
                        </Row>
                    ))}
                </ul>
            )}
        </section>
    );
}

const DarkPositionsActivity = ({ marketId, market, refreshTrigger }) => {
    const { t, i18n } = useTranslation();
    const locale = i18n.language || 'en';
    const { token, username: me } = useAuth();
    const labels = useOutcomeLabels(market);
    const { positions: allPositions, status } = useLiveMarketPositions(marketId, token, refreshTrigger);
    const [page, setPage] = useState(0);

    useEffect(() => { setPage(0); }, [marketId, refreshTrigger, token]);

    const open = allPositions.filter((p) => p.noSharesOwned > 0 || p.yesSharesOwned > 0);
    const positions = open.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const hasNext = open.length > (page + 1) * PAGE_SIZE;

    if (status === 'anon') return <EmptyState title={t('activity.positionsLocked')} hint={t('activity.positionsLockedHint')} />;
    if (status === 'loading' && positions.length === 0) return <SkeletonRows />;
    if (status === 'error') return <EmptyState title={t('activity.loadError')} hint={t('activity.loadErrorHint')} />;
    if (positions.length === 0) return <EmptyState title={t('activity.noPositions')} hint={t('activity.noPositionsHint')} />;

    const bySharesDesc = (key) => (a, b) => b[key] - a[key];
    const yesHolders = positions.filter((p) => p.yesSharesOwned > 0).sort(bySharesDesc('yesSharesOwned'));
    const noHolders = positions.filter((p) => p.noSharesOwned > 0).sort(bySharesDesc('noSharesOwned'));

    return (
        <div style={{ opacity: status === 'loading' ? 0.5 : 1, transition: 'opacity .2s' }}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
                <HolderColumn title={labels.yes} color={COLOR.yesText} holders={yesHolders} sharesKey="yesSharesOwned" me={me} locale={locale} t={t} />
                <HolderColumn title={labels.no} color={COLOR.noText} holders={noHolders} sharesKey="noSharesOwned" me={me} locale={locale} t={t} />
            </div>
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

export default DarkPositionsActivity;
