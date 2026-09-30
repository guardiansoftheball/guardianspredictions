import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../helpers/AuthContent';
import { COLOR } from '../../../../styles/darkTokens';
import { Avatar, UserLink, EmptyState, HAIRLINE, formatRelative } from './activityKit';

// TODO: there is no comments backend yet, so comments only live in local state and
// are lost on reload. Load/post them through the API once the endpoint exists.
const MAX_LEN = 500;

function HeartIcon({ filled }) {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
        </svg>
    );
}

function Composer({ me, onSubmit, t }) {
    const [text, setText] = useState('');
    const ref = useRef(null);
    const trimmed = text.trim();

    const grow = (el) => {
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    };

    const submit = () => {
        if (!trimmed) return;
        onSubmit(trimmed);
        setText('');
        if (ref.current) ref.current.style.height = 'auto';
    };

    if (!me) {
        return (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-4 text-center text-[13px] text-[#8ca0b6]">
                {t('activity.commentLoginPrompt')}
            </div>
        );
    }

    return (
        <form
            onSubmit={(e) => { e.preventDefault(); submit(); }}
            className="flex gap-3 rounded-2xl border border-white/[0.09] bg-white/[0.03] p-3 transition-colors focus-within:border-white/25 focus-within:bg-white/[0.05]"
        >
            <Avatar name={me} />
            <div className="min-w-0 flex-1">
                <label htmlFor="comment-input" className="sr-only">{t('activity.commentLabel')}</label>
                <textarea
                    id="comment-input"
                    ref={ref}
                    rows={1}
                    value={text}
                    maxLength={MAX_LEN}
                    onChange={(e) => { setText(e.target.value); grow(e.target); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
                    placeholder={t('activity.commentPlaceholder')}
                    className="block w-full resize-none bg-transparent pt-1.5 text-[14px] leading-relaxed text-[#eaf0f7] placeholder:text-[#8ca0b6] focus:outline-none"
                />
                <div className="mt-2 flex items-center justify-end gap-3" style={{ minHeight: 36 }}>
                    {text.length > MAX_LEN * 0.8 && (
                        <span className="text-[11px] text-[#8ca0b6]" aria-live="polite">{text.length}/{MAX_LEN}</span>
                    )}
                    <button
                        type="submit"
                        disabled={!trimmed}
                        className="h-9 rounded-full bg-white px-4 text-[13px] font-bold text-[#0e121d] transition-all hover:bg-white/90 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
                    >
                        {t('activity.publish')}
                    </button>
                </div>
            </div>
        </form>
    );
}

const DarkCommentsActivity = () => {
    const { t, i18n } = useTranslation();
    const locale = i18n.language || 'en';
    const { username: me } = useAuth();
    const [sort, setSort] = useState('recent');
    const [liked, setLiked] = useState(() => new Set());
    const [comments, setComments] = useState([]);

    const sorted = useMemo(() => {
        const likesOf = (c) => c.likes + (liked.has(c.id) ? 1 : 0);
        const list = [...comments];
        if (sort === 'top') list.sort((a, b) => likesOf(b) - likesOf(a));
        else list.sort((a, b) => b.createdAt - a.createdAt);
        return list;
    }, [comments, sort, liked]);

    const addComment = (text) => {
        setComments((prev) => [
            { id: `local-${Date.now()}`, username: me, likes: 0, text, createdAt: Date.now() },
            ...prev,
        ]);
        setSort('recent');
    };

    const toggleLike = (id) => {
        setLiked((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const sortBtn = (key) =>
        `rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors ${sort === key ? 'bg-white/10 text-white' : 'text-[#8ca0b6] hover:text-white'}`;

    return (
        <div>
            <Composer me={me} onSubmit={addComment} t={t} />

            {sorted.length === 0 ? (
                <EmptyState title={t('activity.noComments')} hint={t('activity.noCommentsHint')} />
            ) : (
                <>
                    <div className="mt-5 flex items-center justify-between">
                        <span className="text-[12px] font-semibold text-[#8ca0b6]">
                            {t('activity.commentCount', { count: comments.length })}
                        </span>
                        <div role="group" aria-label={t('activity.sortComments')} className="flex gap-1">
                            <button type="button" aria-pressed={sort === 'recent'} onClick={() => setSort('recent')} className={sortBtn('recent')}>
                                {t('activity.sortRecent')}
                            </button>
                            <button type="button" aria-pressed={sort === 'top'} onClick={() => setSort('top')} className={sortBtn('top')}>
                                {t('activity.sortTop')}
                            </button>
                        </div>
                    </div>
                    <ul className="mt-1">
                        {sorted.map((c, i) => {
                            const isLiked = liked.has(c.id);
                            const created = new Date(c.createdAt);
                            return (
                                <li key={c.id} className="flex gap-3 py-4" style={{ borderTop: i ? `1px solid ${HAIRLINE}` : 'none' }}>
                                    <Avatar name={c.username} />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                            <UserLink username={c.username} isYou={c.username === me} youLabel={t('activity.you')} />
                                            <time className="text-[12px] text-[#6b7f95]" dateTime={created.toISOString()} title={created.toLocaleString(locale)}>
                                                {formatRelative(created, locale)}
                                            </time>
                                        </div>
                                        <p className="mt-1.5 whitespace-pre-wrap break-words text-[14px] leading-relaxed text-[#c9d6e3]">
                                            {c.text}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => toggleLike(c.id)}
                                            aria-pressed={isLiked}
                                            aria-label={t('activity.like')}
                                            className="-ml-2 mt-1 inline-flex h-8 items-center gap-1.5 rounded-full px-2 text-[12px] font-semibold transition-colors hover:bg-white/[0.06]"
                                            style={{ color: isLiked ? COLOR.noText : '#8ca0b6' }}
                                        >
                                            <HeartIcon filled={isLiked} />
                                            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{c.likes + (isLiked ? 1 : 0)}</span>
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </>
            )}
        </div>
    );
};

export default DarkCommentsActivity;
