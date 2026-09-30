import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getMarketLabels } from '../../../../utils/labelMapping';
import { COLOR, FONT_HEAD } from '../../../../styles/darkTokens';

// Shared building blocks for the dark activity tabs (bets, positions, leaderboard, comments).

export const HAIRLINE = 'rgba(255,255,255,0.06)';
export const NUM_FONT = { fontFamily: FONT_HEAD, fontVariantNumeric: 'tabular-nums' };

// Stable, muted hue per username so avatars are recognizable without being loud.
function hueFor(name = '') {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
    return h;
}

export function Avatar({ name = '?', size = 32 }) {
    const hue = hueFor(name);
    return (
        <span
            aria-hidden="true"
            style={{
                width: size,
                height: size,
                flexShrink: 0,
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `hsl(${hue} 28% 22%)`,
                color: `hsl(${hue} 55% 78%)`,
                font: `700 ${Math.round(size * 0.4)}px ${FONT_HEAD}`,
                textTransform: 'uppercase',
            }}
        >
            {name.replace(/[^a-z0-9]/gi, '').slice(0, 1) || '?'}
        </span>
    );
}

export function UserLink({ username, isYou, youLabel }) {
    return (
        <span className="flex min-w-0 items-center gap-1.5">
            <Link
                to={`/newprofile/${username}`}
                className="truncate text-[14px] font-semibold text-[#eaf0f7] transition-colors hover:text-white focus-visible:underline focus-visible:outline-none"
            >
                {username}
            </Link>
            {isYou && (
                <span className="shrink-0 rounded-full bg-white/10 px-1.5 py-px text-[10px] font-bold text-white/80">
                    {youLabel}
                </span>
            )}
        </span>
    );
}

export function OutcomePill({ outcome, labels }) {
    const isYes = String(outcome).toUpperCase() === 'YES';
    const isNo = String(outcome).toUpperCase() === 'NO';
    const color = isYes ? COLOR.yesText : isNo ? COLOR.noText : COLOR.muted;
    const bg = isYes ? 'rgba(186,214,89,0.12)' : isNo ? 'rgba(251,91,107,0.12)' : 'rgba(255,255,255,0.06)';
    const text = isYes ? labels.yes : isNo ? labels.no : outcome;
    return (
        <span
            className="inline-flex max-w-[9rem] shrink-0 items-center truncate rounded-full px-2 py-0.5 text-[11px] font-bold"
            style={{ color, background: bg }}
        >
            {text}
        </span>
    );
}

export function Pager({ page, hasNext, onPrev, onNext, t }) {
    if (page === 0 && !hasNext) return null;
    const btn =
        'inline-flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white disabled:pointer-events-none disabled:opacity-25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40';
    return (
        <nav aria-label={t('activity.pagination')} className="mt-3 flex items-center justify-center gap-2">
            <button type="button" className={btn} onClick={onPrev} disabled={page === 0} aria-label={t('activity.previous')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <span className="min-w-[4.5rem] text-center text-[12px] font-semibold text-[#8ca0b6]">
                {t('activity.page', { page: page + 1 })}
            </span>
            <button type="button" className={btn} onClick={onNext} disabled={!hasNext} aria-label={t('activity.next')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
        </nav>
    );
}

export function EmptyState({ title, hint, action }) {
    return (
        <div className="flex flex-col items-center px-4 py-10 text-center">
            <p className="text-[14px] font-semibold text-[#b7c6d6]">{title}</p>
            {hint && <p className="mt-1 max-w-[36ch] text-[13px] leading-relaxed text-[#8ca0b6]">{hint}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

export function SkeletonRows({ count = 5 }) {
    return (
        <ul aria-hidden="true" className="animate-pulse">
            {Array.from({ length: count }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 py-3" style={{ borderTop: i ? `1px solid ${HAIRLINE}` : 'none' }}>
                    <span className="h-8 w-8 rounded-full bg-white/[0.06]" />
                    <span className="flex-1 space-y-2">
                        <span className="block h-3 w-28 rounded bg-white/[0.07]" />
                        <span className="block h-2.5 w-16 rounded bg-white/[0.04]" />
                    </span>
                    <span className="h-3 w-12 rounded bg-white/[0.07]" />
                </li>
            ))}
        </ul>
    );
}

// Row wrapper: hairline dividers between rows, no boxed cards.
export function Row({ index, children, highlight = false }) {
    return (
        <li
            className="flex items-center gap-3 py-3"
            style={{
                borderTop: index ? `1px solid ${HAIRLINE}` : 'none',
                ...(highlight ? { background: 'rgba(255,255,255,0.035)', margin: '0 -10px', padding: '12px 10px', borderRadius: 12 } : null),
            }}
        >
            {children}
        </li>
    );
}

// Market outcome labels, translating the backend's default "YES"/"NO" but keeping custom labels as-is.
export function useOutcomeLabels(market) {
    const { t } = useTranslation();
    const { yes, no } = getMarketLabels(market);
    return {
        yes: yes.toUpperCase() === 'YES' ? t('activity.yes') : yes,
        no: no.toUpperCase() === 'NO' ? t('activity.no') : no,
    };
}

export function formatRelative(date, locale) {
    const d = date instanceof Date ? date : new Date(date);
    const diff = (d.getTime() - Date.now()) / 1000;
    if (!Number.isFinite(diff)) return '';
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' });
    const abs = Math.abs(diff);
    if (abs < 60) return rtf.format(Math.round(diff), 'second');
    if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
    if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
    if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day');
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

export function formatNumber(n, locale) {
    return Number(n || 0).toLocaleString(locale, { maximumFractionDigits: 0 });
}
