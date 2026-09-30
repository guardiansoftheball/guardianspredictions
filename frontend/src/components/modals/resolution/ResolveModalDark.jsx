import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { resolveMarket, resolveMarketGroup } from './ResolveUtils';
import { useMarketLabels } from '../../../hooks/useMarketLabels';
import { FONT, FONT_HEAD, COLOR } from '../../../styles/darkTokens';

const TEXT   = COLOR.text;
const MUTED  = COLOR.muted;
const MUTED2 = COLOR.muted2;
const YES_COLOR = COLOR.yes;
const YES_TEXT  = COLOR.yesText;
const NO_COLOR  = COLOR.no;
const NO_TEXT   = COLOR.noText;

// `answers` + `groupId` (optional) turn this into a grouped-market resolver.
// Shape: [{ marketId, label, market, isResolved, resolutionResult }]
//
// Winner mode (no option resolved yet): the steward picks the winning option
// and the group endpoint resolves it YES and every other option NO in one go.
// Per-option mode is only a fallback for groups where an option was already
// resolved on its own — the backend then rejects whole-group resolution.
const ResolveModalDark = ({ marketId, token, market, onResolved, answers, groupId, defaultMarketId }) => {
    const [open, setOpen]         = useState(false);
    const [selected, setSelected] = useState(null); // 'YES' | 'NO'
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]       = useState('');
    const [targetId, setTargetId] = useState(null);

    const isGroup = Array.isArray(answers) && answers.length > 1;
    const winnerMode = isGroup && Boolean(groupId) && answers.every(a => !a.isResolved);
    const target = isGroup ? answers.find(a => String(a.marketId) === String(targetId)) : null;
    const targetMarketId = isGroup ? target?.marketId : marketId;

    const { yesLabel, noLabel } = useMarketLabels(isGroup ? target?.market : market);

    const handleOpen = () => {
        setSelected(null);
        setError('');
        if (winnerMode) {
            // Never preselect a winner: it must be a deliberate choice.
            setTargetId(null);
        } else if (isGroup) {
            const unresolved = answers.filter(a => !a.isResolved);
            const preferred = unresolved.find(a => String(a.marketId) === String(defaultMarketId));
            setTargetId((preferred || unresolved[0])?.marketId ?? null);
        }
        setOpen(true);
    };

    const handleClose = () => {
        if (submitting) return;
        setOpen(false);
        setSelected(null);
        setError('');
    };

    const handleConfirm = () => {
        if (winnerMode) {
            if (!target) { setError('Select the winning option first.'); return; }
            setSubmitting(true);
            setError('');
            resolveMarketGroup(groupId, token, { mode: 'exclusive_yes', winningMarketId: Number(target.marketId) })
                .then(() => {
                    setOpen(false);
                    onResolved?.();
                })
                .catch(err => setError(err.message || 'Failed to resolve grouped market.'))
                .finally(() => setSubmitting(false));
            return;
        }
        if (!selected) { setError('Select an outcome first.'); return; }
        if (!targetMarketId) { setError('Select an option first.'); return; }
        setSubmitting(true);
        setError('');
        resolveMarket(targetMarketId, token, selected)
            .then(() => {
                setOpen(false);
                onResolved?.();
            })
            .catch(err => setError(err.message || 'Failed to resolve market.'))
            .finally(() => setSubmitting(false));
    };

    // In winner mode a chosen winner reads as a YES resolution for styling.
    const ready = winnerMode ? Boolean(target) : Boolean(selected);
    const isYes = winnerMode ? Boolean(target) : selected === 'YES';
    const isNo  = !winnerMode && selected === 'NO';

    const btnGradient = isYes
        ? 'linear-gradient(180deg,#26d365,#16a34a)'
        : isNo
            ? 'linear-gradient(180deg,#fb5b6b,#e11d48)'
            : 'rgba(255,255,255,0.08)';
    const btnShadow = isYes
        ? '0 8px 22px rgba(34,197,94,0.30)'
        : isNo
            ? '0 8px 22px rgba(244,63,94,0.26)'
            : 'none';
    const btnTextColor = isYes ? '#04140a' : isNo ? '#fff' : MUTED2;

    return (
        <>
            {/* Trigger */}
            <button
                onClick={handleOpen}
                style={{
                    padding: '9px 18px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,193,7,0.35)',
                    background: 'rgba(255,193,7,0.08)',
                    color: '#ffc107',
                    font: `700 13px ${FONT_HEAD}`,
                    cursor: 'pointer',
                    transition: 'all .15s',
                    letterSpacing: '.04em',
                    whiteSpace: 'nowrap',
                }}
            >
                Resolve
            </button>

            {/* Portal — renders in document.body, above everything including charts */}
            {open && createPortal(
                <div
                    onClick={handleClose}
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(0,0,0,0.72)',
                        backdropFilter: 'blur(6px)',
                        zIndex: 9999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '16px',
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: '100%', maxWidth: '380px',
                            background: 'linear-gradient(160deg,rgba(22,38,58,0.98),rgba(10,20,34,0.98))',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '20px',
                            padding: '28px 24px 24px',
                            boxShadow: '0 24px 64px rgba(0,0,0,0.60)',
                            display: 'flex', flexDirection: 'column', gap: '20px',
                            position: 'relative',
                        }}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ font: `800 18px ${FONT_HEAD}`, color: TEXT }}>Resolve Market</div>
                                <div style={{ font: `500 12px ${FONT}`, color: MUTED, marginTop: '3px' }}>
                                    This action is irreversible
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                style={{
                                    width: '32px', height: '32px', borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.10)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: MUTED, font: `600 16px ${FONT}`,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Option selector (grouped markets only) */}
                        {isGroup && (
                            <div>
                                <div style={{ font: `700 11px ${FONT}`, letterSpacing: '.07em', color: MUTED2, marginBottom: '10px' }}>
                                    {winnerMode ? 'WHICH OPTION WON?' : 'SELECT OPTION'}
                                </div>
                                {!winnerMode && (
                                    <div style={{
                                        font: `500 12px ${FONT}`, color: MUTED, marginBottom: '10px',
                                        padding: '8px 10px', borderRadius: '8px',
                                        background: 'rgba(255,193,7,0.06)', border: '1px solid rgba(255,193,7,0.22)',
                                    }}>
                                        An option was already resolved on its own, so the group can&apos;t be resolved in one step. Resolve the remaining options one by one.
                                    </div>
                                )}
                                <div role="radiogroup" aria-label={winnerMode ? 'Winning option' : 'Option to resolve'} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {answers.map(a => {
                                        const active = String(a.marketId) === String(targetId);
                                        return (
                                            <button
                                                key={a.marketId}
                                                type="button"
                                                role="radio"
                                                aria-checked={active}
                                                disabled={a.isResolved}
                                                onClick={() => { setTargetId(a.marketId); setSelected(null); }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                                                    padding: '10px 12px', borderRadius: '10px', textAlign: 'left',
                                                    border: `1px solid ${active ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.08)'}`,
                                                    background: active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                                                    color: a.isResolved ? MUTED2 : TEXT,
                                                    font: `700 13px ${FONT}`,
                                                    cursor: a.isResolved ? 'not-allowed' : 'pointer',
                                                    transition: 'all .15s',
                                                }}
                                            >
                                                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {a.label}
                                                </span>
                                                <span style={{ font: `600 11px ${FONT}`, color: MUTED2, flexShrink: 0 }}>
                                                    {a.isResolved
                                                        ? `Resolved ${a.resolutionResult || ''}`.trim()
                                                        : active ? (winnerMode ? 'Winner' : 'Selected') : ''}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {winnerMode && (
                                    <div style={{ font: `500 12px ${FONT}`, color: MUTED, marginTop: '10px' }}>
                                        {target
                                            ? `${target.label} resolves YES. Every other option resolves NO automatically.`
                                            : 'The winner resolves YES and every other option resolves NO automatically.'}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Outcome selector (single markets and per-option fallback) */}
                        {!winnerMode && (
                        <div style={isGroup && !target ? { opacity: 0.4, pointerEvents: 'none' } : undefined}>
                            <div style={{ font: `700 11px ${FONT}`, letterSpacing: '.07em', color: MUTED2, marginBottom: '10px' }}>
                                SELECT OUTCOME
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => setSelected('YES')}
                                    style={{
                                        flex: 1, padding: '14px 8px', borderRadius: '14px',
                                        border: isYes ? `1px solid ${YES_COLOR}` : '1px solid rgba(34,197,94,0.22)',
                                        background: isYes ? 'linear-gradient(180deg,#26d365,#16a34a)' : 'rgba(34,197,94,0.07)',
                                        boxShadow: isYes ? '0 6px 18px rgba(34,197,94,0.28)' : 'none',
                                        cursor: 'pointer', transition: 'all .15s',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                                    }}
                                >
                                    <span style={{ font: `800 18px ${FONT_HEAD}`, color: isYes ? '#04140a' : YES_TEXT }}>
                                        {yesLabel}
                                    </span>
                                    <span style={{ font: `600 11px ${FONT}`, color: isYes ? '#04140a' : YES_TEXT, opacity: 0.8 }}>
                                        Resolves YES
                                    </span>
                                </button>

                                <button
                                    onClick={() => setSelected('NO')}
                                    style={{
                                        flex: 1, padding: '14px 8px', borderRadius: '14px',
                                        border: isNo ? `1px solid ${NO_COLOR}` : '1px solid rgba(244,63,94,0.18)',
                                        background: isNo ? 'linear-gradient(180deg,#fb5b6b,#e11d48)' : 'rgba(244,63,94,0.07)',
                                        boxShadow: isNo ? '0 6px 18px rgba(244,63,94,0.26)' : 'none',
                                        cursor: 'pointer', transition: 'all .15s',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                                    }}
                                >
                                    <span style={{ font: `800 18px ${FONT_HEAD}`, color: isNo ? '#fff' : NO_TEXT }}>
                                        {noLabel}
                                    </span>
                                    <span style={{ font: `600 11px ${FONT}`, color: isNo ? '#fff' : NO_TEXT, opacity: 0.8 }}>
                                        Resolves NO
                                    </span>
                                </button>
                            </div>
                        </div>
                        )}

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />

                        {error && (
                            <div style={{
                                background: 'rgba(251,91,107,0.12)',
                                border: '1px solid rgba(251,91,107,0.3)',
                                borderRadius: '10px', padding: '10px 14px',
                                font: `500 12px ${FONT}`, color: NO_TEXT,
                            }}>
                                {error}
                            </div>
                        )}

                        {/* Confirm */}
                        <button
                            onClick={handleConfirm}
                            disabled={submitting || !ready}
                            style={{
                                width: '100%', padding: '15px',
                                borderRadius: '13px', border: 'none',
                                font: `800 15px ${FONT_HEAD}`,
                                cursor: submitting || !ready ? 'not-allowed' : 'pointer',
                                background: submitting || !ready ? 'rgba(255,255,255,0.07)' : btnGradient,
                                color: submitting || !ready ? MUTED2 : btnTextColor,
                                boxShadow: submitting || !ready ? 'none' : btnShadow,
                                transition: 'all .15s',
                                opacity: submitting ? 0.7 : 1,
                            }}
                        >
                            {submitting
                                ? 'Resolving...'
                                : winnerMode
                                    ? (target ? `Confirm — ${target.label} wins` : 'Select the winning option')
                                    : selected
                                        ? `Confirm — Resolve ${target ? `${target.label}: ` : ''}${selected === 'YES' ? yesLabel : noLabel}`
                                        : 'Select an outcome'}
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default ResolveModalDark;
