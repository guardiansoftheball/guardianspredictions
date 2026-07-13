import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { resolveMarket } from './ResolveUtils';
import { useMarketLabels } from '../../../hooks/useMarketLabels';
import { FONT, FONT_HEAD, COLOR } from '../../../styles/darkTokens';

const TEXT   = COLOR.text;
const MUTED  = COLOR.muted;
const MUTED2 = COLOR.muted2;
const YES_COLOR = COLOR.yes;
const YES_TEXT  = COLOR.yesText;
const NO_COLOR  = COLOR.no;
const NO_TEXT   = COLOR.noText;

const ResolveModalDark = ({ marketId, token, market, onResolved }) => {
    const [open, setOpen]         = useState(false);
    const [selected, setSelected] = useState(null); // 'YES' | 'NO'
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]       = useState('');

    const { yesLabel, noLabel } = useMarketLabels(market);

    const handleOpen = () => {
        setSelected(null);
        setError('');
        setOpen(true);
    };

    const handleClose = () => {
        if (submitting) return;
        setOpen(false);
        setSelected(null);
        setError('');
    };

    const handleConfirm = () => {
        if (!selected) { setError('Select an outcome first.'); return; }
        setSubmitting(true);
        setError('');
        resolveMarket(marketId, token, selected)
            .then(() => {
                setOpen(false);
                onResolved?.();
            })
            .catch(err => setError(err.message || 'Failed to resolve market.'))
            .finally(() => setSubmitting(false));
    };

    const isYes = selected === 'YES';
    const isNo  = selected === 'NO';

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

                        {/* Outcome selector */}
                        <div>
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
                            disabled={submitting || !selected}
                            style={{
                                width: '100%', padding: '15px',
                                borderRadius: '13px', border: 'none',
                                font: `800 15px ${FONT_HEAD}`,
                                cursor: submitting || !selected ? 'not-allowed' : 'pointer',
                                background: submitting || !selected ? 'rgba(255,255,255,0.07)' : btnGradient,
                                color: submitting || !selected ? MUTED2 : btnTextColor,
                                boxShadow: submitting || !selected ? 'none' : btnShadow,
                                transition: 'all .15s',
                                opacity: submitting ? 0.7 : 1,
                            }}
                        >
                            {submitting
                                ? 'Resolving...'
                                : selected
                                    ? `Confirm — Resolve ${selected === 'YES' ? yesLabel : noLabel}`
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
