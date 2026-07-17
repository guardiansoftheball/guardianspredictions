import React, { useState, useEffect, useCallback, useRef } from 'react';
import { submitBet, fetchUserShares, fetchSaleQuote, submitSale } from '../layouts/trade/TradeUtils';
import { API_URL } from '../../config';
import { USER_CREDIT_REFRESH_EVENT } from '../utils/userFinanceTools/FetchUserCredit';

// ─── design tokens ────────────────────────────────────────────────────────────
const FONT      = 'Manrope,system-ui,sans-serif';
const FONT_HEAD = 'Sora,system-ui,sans-serif';
const YES_COLOR = '#00d4bf';
const YES_TEXT  = '#33ddc9';
const NO_COLOR  = '#fb5b6b';
const NO_TEXT   = '#fb8b96';
const MUTED     = '#8ca0b6';
const MUTED2    = '#5d7189';
const TEXT      = '#eaf0f7';

const PRESETS = [10, 50, 100];

// ─── helpers ──────────────────────────────────────────────────────────────────
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// ─── sub-components ───────────────────────────────────────────────────────────
const SidePill = ({ label, pct, variant, active, onClick }) => {
  const isYes = variant === 'yes';
  const accentColor = isYes ? YES_COLOR : NO_COLOR;
  const accentText  = isYes ? YES_TEXT  : NO_TEXT;
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '11px 8px',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        cursor: 'pointer',
        transition: 'all .15s',
        border: active
          ? `1px solid ${accentColor}`
          : `1px solid ${isYes ? 'rgba(0,212,191,0.22)' : 'rgba(244,63,94,0.18)'}`,
        background: active
          ? (isYes
              ? 'linear-gradient(180deg,#00d4bf,#00a899)'
              : 'linear-gradient(180deg,#fb5b6b,#e11d48)')
          : (isYes ? 'rgba(0,212,191,0.08)' : 'rgba(244,63,94,0.08)'),
        boxShadow: active
          ? (isYes
              ? '0 6px 18px rgba(0,212,191,0.28)'
              : '0 6px 18px rgba(244,63,94,0.24)')
          : 'none',
      }}
    >
      <span style={{
        font: `700 14px ${FONT}`,
        color: active ? (isYes ? '#04140a' : '#fff') : accentText,
      }}>
        {label}
      </span>
      <span style={{
        font: `800 17px ${FONT_HEAD}`,
        color: active ? (isYes ? '#04140a' : '#fff') : accentText,
      }}>
        {pct}%
      </span>
    </button>
  );
};

const AmountInput = ({ value, onChange, onPlus, onMinus }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(0,0,0,0.28)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: '11px',
    padding: '4px 6px',
  }}>
    <button
      onClick={onMinus}
      style={{
        width: '34px', height: '34px', borderRadius: '8px',
        border: 'none', background: 'rgba(255,255,255,0.06)',
        color: TEXT, font: `700 20px ${FONT}`, cursor: 'pointer',
      }}
    >−</button>
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
      <span style={{ font: `700 17px ${FONT}`, color: MUTED }}>$</span>
      <input
        type="number"
        min="1"
        value={value}
        onChange={onChange}
        style={{
          width: '72px',
          background: 'transparent',
          border: 'none',
          color: TEXT,
          font: `800 22px ${FONT_HEAD}`,
          textAlign: 'center',
          outline: 'none',
          MozAppearance: 'textfield',
        }}
      />
    </div>
    <button
      onClick={onPlus}
      style={{
        width: '34px', height: '34px', borderRadius: '8px',
        border: 'none', background: 'rgba(255,255,255,0.06)',
        color: TEXT, font: `700 20px ${FONT}`, cursor: 'pointer',
      }}
    >+</button>
  </div>
);

const PresetBtn = ({ label, onClick }) => (
  <button
    onClick={onClick}
    style={{
      flex: 1, padding: '7px 0',
      borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.09)',
      background: 'rgba(255,255,255,0.04)',
      color: '#b7c6d6',
      font: `700 12px ${FONT}`,
      cursor: 'pointer',
    }}
  >
    {label}
  </button>
);

const Row = ({ label, value, valueColor }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', font: `600 13px ${FONT}` }}>
    <span style={{ color: MUTED }}>{label}</span>
    <span style={{ color: valueColor || TEXT }}>{value}</span>
  </div>
);

const ActionBtn = ({ onClick, disabled, loading, label, color, shadow }) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    style={{
      width: '100%', padding: '14px',
      borderRadius: '12px', border: 'none',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      font: `800 16px ${FONT_HEAD}`,
      background: disabled || loading ? 'rgba(255,255,255,0.08)' : color,
      color: disabled || loading ? MUTED2 : (color.includes('26d365') ? '#04140a' : '#fff'),
      boxShadow: disabled || loading ? 'none' : shadow,
      transition: 'all .15s',
      opacity: disabled ? 0.6 : 1,
    }}
  >
    {loading ? 'Processing...' : label}
  </button>
);

const ErrorMsg = ({ msg }) => msg ? (
  <div style={{
    background: 'rgba(251,91,107,0.12)',
    border: '1px solid rgba(251,91,107,0.3)',
    borderRadius: '8px',
    padding: '10px 12px',
    font: `500 12px ${FONT}`,
    color: NO_TEXT,
  }}>
    {msg}
  </div>
) : null;

const SuccessMsg = ({ msg }) => msg ? (
  <div style={{
    background: 'rgba(0,212,191,0.12)',
    border: '1px solid rgba(0,212,191,0.3)',
    borderRadius: '8px',
    padding: '10px 12px',
    font: `600 13px ${FONT}`,
    color: YES_TEXT,
  }}>
    {msg}
  </div>
) : null;

// ─── shared helpers ───────────────────────────────────────────────────────────
const normalizeShares = (data) => {
  if (!data) return { noSharesOwned: 0, yesSharesOwned: 0, value: 0 };
  if (Array.isArray(data)) return normalizeShares(data[0]);
  return {
    noSharesOwned:  data.noSharesOwned  ?? data.NoSharesOwned  ?? 0,
    yesSharesOwned: data.yesSharesOwned ?? data.YesSharesOwned ?? 0,
    value:          data.value          ?? data.Value          ?? 0,
  };
};

const defaultSaleAmount = (normalized) => Math.max(1, Number(normalized?.value) || 1);

const buildSaleSuccessMessage = (data) => {
  const dust = Number(data?.dust) || 0;
  const netProceeds = Number(data?.netProceeds ?? data?.saleValue) || 0;
  const base = `Sale successful! Sold ${data.sharesSold} shares and credited ${netProceeds} credits.`;
  if (dust <= 0) return base;
  return `${base} Dust assessed: ${dust} credit${dust === 1 ? '' : 's'} retained by the market due to whole-share rounding.`;
};

// ─── BUY TAB ──────────────────────────────────────────────────────────────────
const BuyTab = ({ marketId, market, token, currentProbability, username, onSuccess }) => {
  const [side, setSide]       = useState(null);   // 'YES' | 'NO'
  const [amount, setAmount]   = useState(10);
  const [projection, setProjection] = useState(null);
  const [projLoading, setProjLoading] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [fees, setFees]           = useState(null);
  const [hasBetBefore, setHasBetBefore] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/v0/setup`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => setFees(data?.betting?.betFees ?? null))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchUserShares(marketId, token)
      .then(data => {
        const normalized = normalizeShares(data);
        setHasBetBefore(normalized.yesSharesOwned > 0 || normalized.noSharesOwned > 0);
      })
      .catch(() => {});
  }, [marketId, token]);

  const yesPct = Math.round(currentProbability * 100);
  const noPct  = 100 - yesPct;

  const yesLabel = market?.yesLabel || 'Yes';
  const noLabel  = market?.noLabel  || 'No';

  // Fetch projection whenever side or amount changes
  useEffect(() => {
    if (!side || !amount || amount < 1) {
      setProjection(null);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setProjLoading(true);
      try {
        const res = await fetch(`${API_URL}/v0/marketprojection/${marketId}/${amount}/${side}/`);
        if (res.ok) {
          const data = await res.json();
          setProjection(data);
        } else {
          setProjection(null);
        }
      } catch {
        setProjection(null);
      } finally {
        setProjLoading(false);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [side, amount, marketId]);

  const handleSubmit = () => {
    setError('');
    setSuccess('');
    if (!side) { setError('Select YES or NO first.'); return; }
    if (!amount || amount < 1) { setError('Minimum amount is 1.'); return; }
    setSubmitting(true);
    submitBet(
      { marketId, amount, outcome: side },
      token,
      (data) => {
        setSubmitting(false);
        setSuccess(`Bet placed! $${data.amount} on ${side === 'YES' ? yesLabel : noLabel}.`);
        window.dispatchEvent(new Event(USER_CREDIT_REFRESH_EVENT));
        onSuccess?.();
      },
      (err) => {
        setSubmitting(false);
        setError(err.message || 'Error placing the bet.');
      },
    );
  };

  const projPct = projection?.projectedProbability != null
    ? Math.round(projection.projectedProbability * 100)
    : null;
  const currentPct = side === 'NO' ? noPct : yesPct;
  const projDisplay = projPct != null
    ? (side === 'NO' ? 100 - projPct : projPct)
    : null;
  const projDelta = projDisplay != null ? projDisplay - currentPct : null;

  const btnColor = side === 'YES'
    ? 'linear-gradient(180deg,#00d4bf,#00a899)'
    : side === 'NO'
      ? 'linear-gradient(180deg,#fb5b6b,#e11d48)'
      : 'rgba(255,255,255,0.08)';
  const btnShadow = side === 'YES'
    ? '0 8px 22px rgba(0,212,191,0.28)'
    : '0 8px 22px rgba(244,63,94,0.26)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* YES / NO selector */}
      <div style={{ display: 'flex', gap: '9px' }}>
        <SidePill label={yesLabel} pct={yesPct} variant="yes" active={side === 'YES'} onClick={() => { setSide('YES'); setError(''); setSuccess(''); }} />
        <SidePill label={noLabel}  pct={noPct}  variant="no"  active={side === 'NO'}  onClick={() => { setSide('NO');  setError(''); setSuccess(''); }} />
      </div>

      {/* Amount */}
      <div>
        <div style={{ font: `700 11px ${FONT}`, letterSpacing: '.06em', color: MUTED2, marginBottom: '7px' }}>
          AMOUNT
        </div>
        <AmountInput
          value={amount}
          onChange={e => { const v = parseInt(e.target.value, 10); setAmount(isNaN(v) ? '' : v); }}
          onPlus={() => setAmount(v => (parseInt(v) || 0) + 10)}
          onMinus={() => setAmount(v => clamp((parseInt(v) || 0) - 10, 1, 99999))}
        />
        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
          {PRESETS.map(p => (
            <PresetBtn key={p} label={`+${p}`} onClick={() => setAmount(v => (parseInt(v) || 0) + p)} />
          ))}
          <PresetBtn label="Max" onClick={() => setAmount(999)} />
        </div>
      </div>

      {/* Summary */}
      {side && amount >= 1 && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '9px',
        }}>
          <Row
            label="New probability"
            value={
              projLoading
                ? '...'
                : projDisplay != null
                  ? `${projDisplay}% ${projDelta > 0 ? `▲ ${projDelta}%` : projDelta < 0 ? `▼ ${Math.abs(projDelta)}%` : ''}`
                  : '—'
            }
            valueColor={
              projDelta > 0 ? YES_TEXT : projDelta < 0 ? NO_TEXT : TEXT
            }
          />
          {fees?.initialBetFee > 0 && !hasBetBefore && (
            <Row label="First bet fee" value={`$${fees.initialBetFee}`} valueColor={NO_TEXT} />
          )}
          {fees?.buySharesFee > 0 && (
            <Row label="Trade fee" value={`$${fees.buySharesFee}`} valueColor={NO_TEXT} />
          )}
          <Row label="You spend" value={`$${amount}`} />
        </div>
      )}

      <ErrorMsg msg={error} />
      <SuccessMsg msg={success} />

      <ActionBtn
        onClick={handleSubmit}
        disabled={!side || !amount || amount < 1}
        loading={submitting}
        label={side === 'YES' ? `Buy ${yesLabel}` : side === 'NO' ? `Buy ${noLabel}` : 'Select a side'}
        color={btnColor}
        shadow={btnShadow}
      />

      <div style={{ textAlign: 'center', font: `500 11px ${FONT}`, color: MUTED2 }}>
        By trading you accept the market rules
      </div>
    </div>
  );
};

// ─── SELL TAB ─────────────────────────────────────────────────────────────────
const SellTab = ({ marketId, market, token, onSuccess }) => {
  const [shares, setShares]           = useState({ noSharesOwned: 0, yesSharesOwned: 0, value: 0 });
  const [sellAmount, setSellAmount]   = useState(1);
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [feeData, setFeeData]         = useState(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [sharesLoading, setSharesLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saleQuote, setSaleQuote]     = useState(null);
  const [quoteError, setQuoteError]   = useState('');
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);

  const yesLabel = market?.yesLabel || 'Yes';
  const noLabel  = market?.noLabel  || 'No';
  const showFeeSection = !isLoading && Number(feeData?.sellSharesFee) > 0;
  const maxSaleCredits = Math.max(0, Number(shares.value) || 0);

  useEffect(() => {
    const fetchFeeData = async () => {
      if (!token) { setIsLoading(false); return; }
      try {
        const response = await fetch(`${API_URL}/v0/setup`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(`Failed to load setup: ${response.status}`);
        const data = await response.json();
        setFeeData(data.betting?.betFees || null);
      } catch {
        setFeeData(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeeData();
  }, [token]);

  useEffect(() => {
    if (!token) {
      setShares({ noSharesOwned: 0, yesSharesOwned: 0, value: 0 });
      setSelectedOutcome(null);
      setSellAmount(1);
      setSaleQuote(null);
      setQuoteError('');
      return;
    }
    setSharesLoading(true);
    fetchUserShares(marketId, token)
      .then(data => {
        const normalized = normalizeShares(data);
        setShares(normalized);
        if (normalized.noSharesOwned > 0 && normalized.yesSharesOwned === 0) {
          setSelectedOutcome('NO');
          setSellAmount(defaultSaleAmount(normalized));
        } else if (normalized.yesSharesOwned > 0 && normalized.noSharesOwned === 0) {
          setSelectedOutcome('YES');
          setSellAmount(defaultSaleAmount(normalized));
        } else {
          setSelectedOutcome(null);
          setSellAmount(1);
        }
      })
      .catch(error => {
        alert(`Error fetching shares: ${error.message}`);
        setShares({ noSharesOwned: 0, yesSharesOwned: 0, value: 0 });
        setSelectedOutcome(null);
        setSellAmount(1);
      })
      .finally(() => setSharesLoading(false));
  }, [marketId, token]);

  const handleSellAmountChange = (e) => {
    const newAmount = parseInt(e.target.value, 10) || 0;
    if (newAmount < 0) return;
    setSaleQuote(null);
    setQuoteError('');
    if (maxSaleCredits > 0 && newAmount > maxSaleCredits) { setSellAmount(maxSaleCredits); return; }
    setSellAmount(newAmount);
  };

  const requestSaleQuote = (outcomeOverride, amountOverride = sellAmount) => {
    const outcomeToUse = outcomeOverride || selectedOutcome;
    if (!outcomeToUse) {
      alert('Please select which shares you would like to sell.');
      return Promise.resolve(null);
    }
    const saleData = { marketId, outcome: outcomeToUse, amount: amountOverride };
    setSelectedOutcome(outcomeToUse);
    setIsQuoteLoading(true);
    setQuoteError('');
    return fetchSaleQuote(saleData, token)
      .then(quote => { setSaleQuote(quote); return quote; })
      .catch(error => { setSaleQuote(null); setQuoteError(error.message); return null; })
      .finally(() => setIsQuoteLoading(false));
  };

  const handleSaleSubmission = (outcomeOverride) => {
    const outcomeToUse = outcomeOverride || selectedOutcome;
    if (!outcomeToUse) {
      alert('Please select which shares you would like to sell.');
      return;
    }
    const saleData = { marketId, outcome: outcomeToUse, amount: sellAmount };
    setIsSubmitting(true);
    fetchSaleQuote(saleData, token)
      .then(quote => {
        setSaleQuote(quote);
        if (!quote.allowed) {
          alert(quote.message || 'Sale preview is not allowed. Try a different Sale Order amount.');
          setIsSubmitting(false);
          return;
        }
        submitSale(
          saleData,
          token,
          (data) => {
            alert(buildSaleSuccessMessage(data));
            setSelectedOutcome(null);
            setSellAmount(1);
            setIsSubmitting(false);
            window.dispatchEvent(new Event(USER_CREDIT_REFRESH_EVENT));
            onSuccess?.();
          },
          (error) => {
            alert(`Sale failed: ${error.message}`);
            setIsSubmitting(false);
          }
        );
      })
      .catch(error => {
        alert(`Sale quote failed: ${error.message}`);
        setIsSubmitting(false);
      });
  };

  const isActionDisabled = sharesLoading || isSubmitting || isQuoteLoading;

  if (sharesLoading) {
    return <div style={{ padding: '24px 0', textAlign: 'center', font: `500 13px ${FONT}`, color: MUTED2 }}>Loading positions...</div>;
  }

  if (shares.noSharesOwned < 1 && shares.yesSharesOwned < 1) {
    return <div style={{ padding: '24px 0', textAlign: 'center', font: `500 13px ${FONT}`, color: MUTED2 }}>No Shares Owned In This Market</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Shares badges */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
        {shares.noSharesOwned > 0 && (
          <div style={{ padding: '8px 16px', borderRadius: '10px', background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', textAlign: 'center' }}>
            <div style={{ font: `700 11px ${FONT}`, color: NO_TEXT, letterSpacing: '.06em' }}>{noLabel}</div>
            <div style={{ font: `800 18px ${FONT_HEAD}`, color: TEXT }}>{shares.noSharesOwned}</div>
          </div>
        )}
        {shares.yesSharesOwned > 0 && (
          <div style={{ padding: '8px 16px', borderRadius: '10px', background: 'rgba(0,212,191,0.12)', border: '1px solid rgba(0,212,191,0.3)', textAlign: 'center' }}>
            <div style={{ font: `700 11px ${FONT}`, color: YES_TEXT, letterSpacing: '.06em' }}>{yesLabel}</div>
            <div style={{ font: `800 18px ${FONT_HEAD}`, color: TEXT }}>{shares.yesSharesOwned}</div>
          </div>
        )}
      </div>

      {/* Position value */}
      {(shares.noSharesOwned > 0 || shares.yesSharesOwned > 0) && (
        <div style={{ textAlign: 'center', font: `600 13px ${FONT}`, color: MUTED }}>
          Position Value: <span style={{ color: YES_TEXT }}>{shares.value}</span>
        </div>
      )}

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />

      {/* Sale order input */}
      <div>
        <div style={{ font: `700 11px ${FONT}`, letterSpacing: '.06em', color: MUTED2, marginBottom: '7px' }}>
          SALE ORDER
        </div>
        <AmountInput
          value={sellAmount}
          onChange={handleSellAmountChange}
          onPlus={() => { const next = (parseInt(sellAmount) || 0) + 1; setSellAmount(maxSaleCredits > 0 ? Math.min(next, maxSaleCredits) : next); }}
          onMinus={() => setSellAmount(Math.max(1, (parseInt(sellAmount) || 0) - 1))}
        />
      </div>

      {/* Quote panel */}
      {(isQuoteLoading || quoteError || saleQuote) && (
        <SellQuotePanel
          quote={saleQuote}
          quoteError={quoteError}
          isLoading={isQuoteLoading}
          selectedOutcome={selectedOutcome}
          onSelectAmount={(amount) => { setSellAmount(amount); requestSaleQuote(selectedOutcome, amount); }}
        />
      )}

      {/* Action buttons per side */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {shares.noSharesOwned > 0 && (
          <SellActionGroup
            outcome="NO"
            label={noLabel}
            disabled={isActionDisabled}
            isQuoteLoading={isQuoteLoading && selectedOutcome === 'NO'}
            onTerms={() => requestSaleQuote('NO')}
            onSubmit={() => { setSelectedOutcome('NO'); handleSaleSubmission('NO'); }}
          />
        )}
        {shares.yesSharesOwned > 0 && (
          <SellActionGroup
            outcome="YES"
            label={yesLabel}
            disabled={isActionDisabled}
            isQuoteLoading={isQuoteLoading && selectedOutcome === 'YES'}
            onTerms={() => requestSaleQuote('YES')}
            onSubmit={() => { setSelectedOutcome('YES'); handleSaleSubmission('YES'); }}
          />
        )}
      </div>

      {/* Fee section */}
      {showFeeSection && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', font: `500 12px ${FONT}`, color: MUTED }}>
          Trading Fee (Selling Share): {feeData.sellSharesFee}
        </div>
      )}
    </div>
  );
};

const SellQuotePanel = ({ quote, quoteError, isLoading, selectedOutcome, onSelectAmount }) => {
  if (!selectedOutcome && !quoteError && !isLoading) return null;
  if (isLoading) return (
    <div style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', font: `500 12px ${FONT}`, color: MUTED2 }}>
      Calculating sale preview...
    </div>
  );
  if (quoteError) return <ErrorMsg msg={quoteError} />;
  if (!quote) return null;

  const panelColor = quote.allowed
    ? { border: 'rgba(0,212,191,0.3)', bg: 'rgba(0,212,191,0.07)' }
    : { border: 'rgba(255,193,7,0.35)', bg: 'rgba(255,193,7,0.07)' };

  return (
    <div style={{ borderRadius: '10px', border: `1px solid ${panelColor.border}`, background: panelColor.bg, padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ font: `700 13px ${FONT}`, color: TEXT }}>Sale Preview</span>
        <span style={{ font: `600 11px ${FONT}`, color: quote.allowed ? YES_TEXT : '#ffc107', background: 'rgba(255,255,255,0.07)', borderRadius: '6px', padding: '2px 8px' }}>
          {quote.allowed ? 'Allowed' : 'Adjust amount'}
        </span>
      </div>
      <Row label="Sale order"       value={quote.requestedCredits} />
      <Row label="Credits received" value={quote.netProceeds ?? quote.saleValue} valueColor={YES_TEXT} />
      <Row label="Shares sold"      value={quote.sharesSold} />
      <Row label="Value per share"  value={quote.valuePerShare} />
      {quote.message && <div style={{ font: `500 11px ${FONT}`, color: MUTED }}>{quote.message}</div>}
      {!quote.allowed && quote.suggestedAmounts?.length > 0 && (
        <div>
          <div style={{ font: `600 11px ${FONT}`, color: MUTED2, marginBottom: '6px' }}>TRY A VALID AMOUNT</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {quote.suggestedAmounts.map(s => (
              <button key={s} onClick={() => onSelectAmount(s)} style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.10)', border: 'none', color: TEXT, font: `600 12px ${FONT}`, cursor: 'pointer' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const SellActionGroup = ({ outcome, label, disabled, isQuoteLoading, onTerms, onSubmit }) => {
  const isYes = outcome === 'YES';
  const color = isYes ? YES_COLOR : NO_COLOR;
  const textColor = isYes ? YES_TEXT : NO_TEXT;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', padding: '10px' }}>
      <ActionBtn
        onClick={onSubmit}
        disabled={disabled}
        loading={false}
        label={`Confirm Sale — ${label}`}
        color={`linear-gradient(180deg,${color},${isYes ? '#00a899' : '#e11d48'})`}
        shadow={`0 6px 18px ${isYes ? 'rgba(0,212,191,0.25)' : 'rgba(244,63,94,0.22)'}`}
      />
      <button
        type="button"
        onClick={onTerms}
        disabled={disabled}
        style={{
          width: '100%', padding: '10px',
          borderRadius: '10px',
          border: `1px solid ${color}40`,
          background: 'transparent',
          color: disabled ? MUTED2 : textColor,
          font: `700 13px ${FONT_HEAD}`,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'all .15s',
        }}
      >
        {isQuoteLoading ? 'Loading Terms...' : 'Terms'}
      </button>
    </div>
  );
};

// ─── MAIN PANEL ───────────────────────────────────────────────────────────────
const NewTradePanel = ({ marketId, market, token, currentProbability, username, onSuccess }) => {
  const [tab, setTab] = useState('buy');

  return (
    <div>
      {/* Tab bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        marginBottom: '16px',
      }}>
        {[['buy', 'Buy'], ['sell', 'Sell']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1, padding: '11px 0', border: 'none',
              cursor: 'pointer', background: 'transparent',
              font: `700 13px ${FONT}`,
              color: tab === key ? TEXT : MUTED2,
              boxShadow: tab === key ? `inset 0 -2px 0 #9cc9f1` : 'none',
              transition: 'color .15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'buy' ? (
        <BuyTab
          marketId={marketId}
          market={market}
          token={token}
          currentProbability={currentProbability}
          username={username}
          onSuccess={onSuccess}
        />
      ) : (
        <SellTab
          marketId={marketId}
          market={market}
          token={token}
          onSuccess={onSuccess}
        />
      )}
    </div>
  );
};

export default NewTradePanel;
