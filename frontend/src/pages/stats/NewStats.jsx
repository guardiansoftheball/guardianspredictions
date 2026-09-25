import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { API_URL } from '../../config';
import { authStorage } from '../../api/authStorage';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import BlueGlow from '../../components/ui/BlueGlow';
import LoadingSpinner from '../../components/loaders/LoadingSpinner';
import { unwrapApiResponse } from '../../utils/apiResponse';

// ─── constants ────────────────────────────────────────────────────────────────

const LOGIN_REQUIRED_REASON = 'INVALID_TOKEN';
const LEADERBOARD_PAGE_SIZE = 20;

const COLORS = {
  celeste: '#9CC9F1',
  amber: '#fbbf24',
  purple: '#a78bfa',
  orange: '#fb923c',
  cyan: '#22d3ee',
  pink: '#f472b6',
  emerald: '#34d399',
  rose: '#fb7185',
};

const CARD = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderRadius: '16px',
};

const AVATAR_COLORS = [
  { bg: '#1F2A37', text: '#9CC8FF' },
  { bg: '#2A2236', text: '#CDB6FF' },
  { bg: '#1E2E2A', text: '#8FE3C8' },
  { bg: '#2A2519', text: '#FFD19A' },
  { bg: '#2A1926', text: '#FFB0D0' },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

const loginRequiredError = (message) => {
  const error = new Error(message);
  error.loginRequired = true;
  return error;
};

const getOptionalAuthHeaders = () => {
  const token = authStorage.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const readReportingError = async (response, loginMessage, fallbackMessage) => {
  let payload = {};
  try { payload = await response.json(); } catch { payload = {}; }
  if (response.status === 401 && payload?.reason === LOGIN_REQUIRED_REASON) throw loginRequiredError(loginMessage);
  throw new Error(payload?.message || payload?.reason || `${fallbackMessage}: ${response.status}`);
};

const freshnessTimeLabel = (freshness) => {
  if (!freshness?.generatedAt) return '';
  const generatedAt = new Date(freshness.generatedAt);
  if (Number.isNaN(generatedAt.getTime())) return '';
  return generatedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
};

const fmt = (val) => typeof val === 'number' ? val.toLocaleString() : val;

// ─── shared UI ────────────────────────────────────────────────────────────────

const ErrorBanner = ({ msg }) => msg ? (
  <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{msg}</div>
) : null;

const StatCard = ({ label, value, color }) => (
  <div style={{ ...CARD, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '112px', boxSizing: 'border-box' }}>
    <span style={{ fontSize: '13px', color: '#8B929C' }}>{label}</span>
    <span style={{ fontFamily: "'Geist Mono', 'Roboto Mono', monospace", fontSize: '32px', fontWeight: 500, letterSpacing: '-0.02em', color: color || '#F3F4F6' }}>{value}</span>
  </div>
);

const CenteredProfitBar = ({ profit, maxAbsProfit }) => {
  if (maxAbsProfit === 0) {
    return (
      <div style={{ position: 'relative', width: '100px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.10)' }}>
        <div style={{ position: 'absolute', left: '49px', top: '-3px', width: '2px', height: '10px', background: '#3A3F47' }} />
      </div>
    );
  }
  const pct = Math.min(Math.abs(profit) / maxAbsProfit, 1) * 50;
  const isPositive = profit >= 0;
  return (
    <div style={{ position: 'relative', width: '100px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.10)' }}>
      {profit !== 0 && (
        <div style={{
          position: 'absolute', top: 0, height: '4px',
          borderRadius: isPositive ? '0 2px 2px 0' : '2px 0 0 2px',
          background: isPositive ? COLORS.emerald : '#F2767A',
          ...(isPositive ? { left: '50px', width: `${pct}%` } : { right: '50px', width: `${pct}%` }),
        }} />
      )}
      <div style={{ position: 'absolute', left: '49px', top: '-3px', width: '2px', height: '10px', background: '#3A3F47' }} />
    </div>
  );
};

const SectionHeader = ({ icon, title, subtitle, badge }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.07)', color: '#C9CDD3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#F3F4F6' }}>{title}</h2>
        {badge && <span style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '999px', background: 'rgba(255,255,255,0.07)', color: '#C9CDD3', border: '1px solid rgba(255,255,255,0.10)' }}>{badge}</span>}
      </div>
      {subtitle && <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#8B929C' }}>{subtitle}</p>}
    </div>
  </div>
);

const NavCard = ({ icon, title, description, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      ...CARD, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      flexGrow: 1, cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'border-color 0.2s, background 0.2s',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(156,201,241,0.4)'; e.currentTarget.style.background = 'rgba(156,201,241,0.08)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.07)', color: '#C9CDD3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7D848F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7v10M17 7v10" /><path d="M7 12h10" /></svg>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{ fontSize: '16px', fontWeight: 600, color: '#F3F4F6' }}>{title}</span>
      <span style={{ fontSize: '13px', lineHeight: 1.45, color: '#8B929C' }}>{description}</span>
    </div>
  </button>
);

// ─── Icons ────────────────────────────────────────────────────────────────────

const ChartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></svg>
);
const SlidersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></svg>
);
const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" /></svg>
);
const LeaderboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="14" width="4" height="7" rx="1" /><rect x="10" y="8" width="4" height="13" rx="1" /><rect x="16" y="3" width="4" height="18" rx="1" /></svg>
);

// ─── Recharts tooltip ─────────────────────────────────────────────────────────

const DarkTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="rounded-lg border border-white/10 bg-gray-900/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <span className="text-gray-400">{name}</span>
      <span className="ml-2 font-semibold text-white">{fmt(value)}</span>
    </div>
  );
};

// ─── FormulaToggle ────────────────────────────────────────────────────────────

const FormulaToggle = ({ formula, show, onToggle }) => {
  if (!formula) return null;
  return (
    <>
      <button onClick={onToggle} className="text-xs text-[#9CC9F1] hover:text-[#9CC9F1]/70 transition-colors" title="Toggle formula">fx</button>
      {show && (
        <div className="mt-2 rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-gray-300 text-xs font-mono">{formula}</p>
        </div>
      )}
    </>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const NewStats = () => {
  const { t } = useTranslation();
  const metricsRef = useRef(null);
  const configRef = useRef(null);

  // Stats config
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState(null);
  const [lbFreshness, setLbFreshness] = useState(null);
  const [lbLoading, setLbLoading] = useState(false);
  const [lbError, setLbError] = useState(null);
  const [lbLoginRequired, setLbLoginRequired] = useState(false);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  // System metrics
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [smFreshness, setSmFreshness] = useState(null);
  const [smLoading, setSmLoading] = useState(false);
  const [smError, setSmError] = useState(null);
  const [smLoginRequired, setSmLoginRequired] = useState(false);
  const [showFormulas, setShowFormulas] = useState({});

  useEffect(() => { document.title = t('stats.pageTitle'); }, [t]);

  // Fetch stats config
  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`${API_URL}/v0/stats`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
        if (!response.ok) throw new Error(`Failed to fetch stats: ${response.status}`);
        setStatsData(unwrapApiResponse(await response.json()));
      } catch (err) { setStatsError(err.message); }
      finally { setStatsLoading(false); }
    })();
  }, []);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async (pageNum = 0) => {
    setLbLoading(true); setLbError(null); setLbLoginRequired(false);
    try {
      const offset = pageNum * LEADERBOARD_PAGE_SIZE;
      const response = await fetch(`${API_URL}/v0/global/leaderboard?limit=${LEADERBOARD_PAGE_SIZE + 1}&offset=${offset}`, {
        method: 'GET', headers: { 'Content-Type': 'application/json', ...getOptionalAuthHeaders() },
      });
      if (!response.ok) await readReportingError(response, t('stats.leaderboard.loginRequired'), t('stats.leaderboard.fetchError'));
      const result = unwrapApiResponse(await response.json());
      const rows = Array.isArray(result) ? result : (Array.isArray(result?.entries) ? result.entries : []);
      setLbFreshness(Array.isArray(result) ? null : (result?.freshness || null));
      setLeaderboard(rows.slice(0, LEADERBOARD_PAGE_SIZE));
      setPage(pageNum);
      setHasNextPage(rows.length > LEADERBOARD_PAGE_SIZE);
    } catch (err) { setLbError(err.message); setLbLoginRequired(Boolean(err.loginRequired)); setHasNextPage(false); }
    finally { setLbLoading(false); }
  }, [t]);

  // Fetch system metrics
  const fetchMetrics = useCallback(async () => {
    setSmLoading(true); setSmError(null); setSmLoginRequired(false);
    try {
      const response = await fetch(`${API_URL}/v0/system/metrics`, {
        method: 'GET', headers: { 'Content-Type': 'application/json', ...getOptionalAuthHeaders() },
      });
      if (!response.ok) await readReportingError(response, t('stats.metrics.loginRequired'), t('stats.metrics.fetchError'));
      const result = unwrapApiResponse(await response.json());
      setSmFreshness(result?.freshness || null);
      setSystemMetrics(result ? { ...result, freshness: undefined } : result);
    } catch (err) { setSmError(err.message); setSmLoginRequired(Boolean(err.loginRequired)); }
    finally { setSmLoading(false); }
  }, [t]);

  // Auto-fetch everything on mount
  useEffect(() => { fetchLeaderboard(0); }, [fetchLeaderboard]);
  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  const lbFreshnessLabel = freshnessTimeLabel(lbFreshness);
  const smFreshnessLabel = freshnessTimeLabel(smFreshness);
  const toggleFormula = (key) => setShowFormulas((prev) => ({ ...prev, [key]: !prev[key] }));

  const maxAbsProfit = useMemo(() => {
    if (!leaderboard?.length) return 0;
    return Math.max(...leaderboard.map((u) => Math.abs(u.totalProfit)), 1);
  }, [leaderboard]);

  const summary = useMemo(() => {
    if (!leaderboard?.length) return { users: 0, value: 0, spent: 0, profit: 0 };
    return {
      users: leaderboard.length,
      value: leaderboard.reduce((s, u) => s + (u.totalCurrentValue || 0), 0),
      spent: leaderboard.reduce((s, u) => s + (u.totalSpent || 0), 0),
      profit: leaderboard.reduce((s, u) => s + (u.totalProfit || 0), 0),
    };
  }, [leaderboard]);

  const utilizationData = useMemo(() => {
    if (!systemMetrics) return [];
    const u = systemMetrics.moneyUtilized;
    return [
      { name: t('stats.metrics.unusedDebtShort'), value: Math.abs(u.unusedDebt.value), color: COLORS.amber, explanation: u.unusedDebt.explanation, formula: u.unusedDebt.formula, key: 'unusedDebt' },
      { name: t('stats.metrics.activeBetsShort'), value: Math.abs(u.activeBetVolume.value), color: COLORS.purple, explanation: u.activeBetVolume.explanation, formula: u.activeBetVolume.formula, key: 'activeBetVolume' },
      { name: t('stats.metrics.marketFeesShort'), value: Math.abs(u.marketCreationFees.value), color: COLORS.orange, explanation: u.marketCreationFees.explanation, formula: u.marketCreationFees.formula, key: 'marketCreationFees' },
      { name: t('stats.metrics.participationFees'), value: Math.abs(u.participationFees.value), color: COLORS.cyan, explanation: u.participationFees.explanation, formula: u.participationFees.formula, key: 'participationFees' },
      { name: t('stats.metrics.bonusesShort'), value: Math.abs(u.bonusesPaid.value), color: COLORS.pink, explanation: u.bonusesPaid.explanation, key: 'bonusesPaid' },
    ].filter((d) => d.value > 0);
  }, [systemMetrics, t]);

  const isBalanced = systemMetrics?.verification?.balanced?.value === true;
  const surplus = systemMetrics?.verification?.surplus;
  const start = page * LEADERBOARD_PAGE_SIZE;

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Setup config explanations
  const explanations = {
    initialMarketProbability: t('stats.setupConfig.explanations.initialMarketProbability'),
    initialMarketSubsidization: t('stats.setupConfig.explanations.initialMarketSubsidization'),
    initialMarketYes: t('stats.setupConfig.explanations.initialMarketYes'),
    initialMarketNo: t('stats.setupConfig.explanations.initialMarketNo'),
    createMarketCost: t('stats.setupConfig.explanations.createMarketCost'),
    traderBonus: t('stats.setupConfig.explanations.traderBonus'),
    initialAccountBalance: t('stats.setupConfig.explanations.initialAccountBalance'),
    maximumDebtAllowed: t('stats.setupConfig.explanations.maximumDebtAllowed'),
    minimumBet: t('stats.setupConfig.explanations.minimumBet'),
    maxDustPerSale: t('stats.setupConfig.explanations.maxDustPerSale'),
    initialBetFee: t('stats.setupConfig.explanations.initialBetFee'),
    buySharesFee: t('stats.setupConfig.explanations.buySharesFee'),
    sellSharesFee: t('stats.setupConfig.explanations.sellSharesFee'),
  };

  return (
    <div className="min-h-screen bg-[#0A0B0D] relative overflow-x-hidden">
      <BlueGlow />
      <Navbar />

      <div className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-8 pb-24">

        {/* ── Header ── */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8B929C' }}>{t('stats.pageEyebrow')}</span>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 600, letterSpacing: '-0.02em', color: '#F3F4F6' }}>{t('stats.pageHeading')}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {lbFreshnessLabel && (
              <span style={{ fontSize: '13px', color: '#8B929C', fontFamily: "'Geist Mono', 'Roboto Mono', monospace" }}>
                Updated {lbFreshnessLabel}
              </span>
            )}
            <button
              type="button"
              onClick={() => { fetchLeaderboard(0); fetchMetrics(); }}
              disabled={lbLoading || smLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', height: '36px', padding: '0 14px',
                borderRadius: '8px', background: '#F3F4F6', color: '#0A0B0D', border: 'none',
                fontSize: '13px', fontWeight: 500, cursor: (lbLoading || smLoading) ? 'not-allowed' : 'pointer',
                opacity: (lbLoading || smLoading) ? 0.6 : 1,
              }}
            >
              <RefreshIcon />
              Recalculate
            </button>
          </div>
        </header>

        {/* ── Summary stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label={t('stats.leaderboard.rank') + 'ed users'} value={fmt(summary.users)} />
          <StatCard label={t('stats.leaderboard.value')} value={fmt(summary.value)} />
          <StatCard label={t('stats.leaderboard.spent')} value={fmt(summary.spent)} />
          <StatCard label={t('stats.leaderboard.profit')} value={summary.profit >= 0 ? fmt(summary.profit) : `−${fmt(Math.abs(summary.profit))}`} color={summary.profit >= 0 ? '#F3F4F6' : '#F2767A'} />
        </div>

        {/* ── Bento grid: leaderboard + side nav ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">

          {/* Leaderboard - 3 cols */}
          <section className="lg:col-span-3" style={{ ...CARD, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
              <SectionHeader icon={<LeaderboardIcon />} title={t('stats.tabs.globalLeaderboard')} subtitle={t('stats.shortcuts.leaderboardDesc')} badge={t('stats.beta')} />
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button type="button" aria-label="Previous page" disabled={lbLoading || page <= 0} onClick={() => fetchLeaderboard(Math.max(0, page - 1))}
                  style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: page > 0 ? '#C9CDD3' : '#5F6670', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page > 0 ? 'pointer' : 'not-allowed' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                <button type="button" aria-label="Next page" disabled={lbLoading || !hasNextPage} onClick={() => fetchLeaderboard(page + 1)}
                  style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: hasNextPage ? '#C9CDD3' : '#5F6670', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: hasNextPage ? 'pointer' : 'not-allowed' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                </button>
              </div>
            </div>

            {lbLoading && !leaderboard && (
              <div className="flex items-center justify-center gap-3 py-12">
                <LoadingSpinner />
                <span style={{ fontSize: '13px', color: '#8B929C' }}>{t('stats.leaderboard.computing')}</span>
              </div>
            )}
            {lbError && !lbLoginRequired && <ErrorBanner msg={lbError} />}
            {lbError && lbLoginRequired && <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-200">{lbError}</div>}

            {leaderboard && leaderboard.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Table header */}
                <div className="hidden sm:grid" style={{ gridTemplateColumns: '56px minmax(0,1fr) 200px 80px 80px 130px', alignItems: 'center', height: '36px', fontSize: '12px', fontWeight: 500, color: '#7D848F', borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
                  <div>#</div><div>{t('stats.leaderboard.user')}</div><div style={{ textAlign: 'right' }}>{t('stats.leaderboard.profit')}</div><div style={{ textAlign: 'right' }}>{t('stats.leaderboard.value')}</div><div style={{ textAlign: 'right' }}>{t('stats.leaderboard.spent')}</div><div style={{ textAlign: 'right' }}>{t('stats.leaderboard.markets')}</div>
                </div>
                {leaderboard.map((user, idx) => {
                  const rank = start + idx + 1;
                  const av = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                  const initials = user.username.slice(0, 2).toUpperCase();
                  const neg = user.totalProfit < 0;
                  return (
                    <div key={user.username}>
                      {/* Desktop */}
                      <div className="hidden sm:grid" style={{ gridTemplateColumns: '56px minmax(0,1fr) 200px 80px 80px 130px', alignItems: 'center', height: '60px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}>
                        <div style={{ fontFamily: "'Geist Mono', 'Roboto Mono', monospace", fontWeight: 500, color: rank === 1 ? '#F3F4F6' : '#8B929C' }}>{String(rank).padStart(2, '0')}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '999px', background: av.bg, color: av.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, flexShrink: 0 }}>{initials}</div>
                          <Link to={`/newprofile/${user.username}`} style={{ color: '#F3F4F6', fontWeight: 500, textDecoration: 'none' }}>{user.username}</Link>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '14px' }}>
                          <CenteredProfitBar profit={user.totalProfit} maxAbsProfit={maxAbsProfit} />
                          <span style={{ fontFamily: "'Geist Mono', 'Roboto Mono', monospace", color: neg ? '#F2767A' : '#C9CDD3', width: '48px', textAlign: 'right' }}>
                            {neg ? `−${fmt(Math.abs(user.totalProfit))}` : fmt(user.totalProfit)}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right', fontFamily: "'Geist Mono', 'Roboto Mono', monospace", color: '#C9CDD3' }}>{fmt(user.totalCurrentValue)}</div>
                        <div style={{ textAlign: 'right', fontFamily: "'Geist Mono', 'Roboto Mono', monospace", color: '#C9CDD3' }}>{fmt(user.totalSpent)}</div>
                        <div style={{ textAlign: 'right', color: '#8B929C', fontSize: '13px' }}>
                          <span style={{ color: '#E7E9EC' }}>{user.activeMarkets}</span> {t('stats.leaderboard.active')} · <span style={{ color: '#E7E9EC' }}>{user.resolvedMarkets}</span> res.
                        </div>
                      </div>
                      {/* Mobile */}
                      <div className="sm:hidden" style={{ ...CARD, padding: '16px', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <span style={{ fontFamily: "'Geist Mono', 'Roboto Mono', monospace", fontWeight: 700, color: '#F3F4F6', fontSize: '18px' }}>{String(rank).padStart(2, '0')}</span>
                          <div style={{ width: '28px', height: '28px', borderRadius: '999px', background: av.bg, color: av.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600 }}>{initials}</div>
                          <Link to={`/newprofile/${user.username}`} style={{ color: '#F3F4F6', fontWeight: 500, textDecoration: 'none', flex: 1 }}>{user.username}</Link>
                          <span style={{ fontFamily: "'Geist Mono', 'Roboto Mono', monospace", fontWeight: 600, color: neg ? '#F2767A' : '#C9CDD3' }}>
                            {neg ? `−${fmt(Math.abs(user.totalProfit))}` : fmt(user.totalProfit)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#8B929C' }}>
                          <span>Value: <span style={{ color: '#C9CDD3' }}>{fmt(user.totalCurrentValue)}</span></span>
                          <span>Spent: <span style={{ color: '#C9CDD3' }}>{fmt(user.totalSpent)}</span></span>
                          <span>{user.activeMarkets} {t('stats.leaderboard.active')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {leaderboard && leaderboard.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#8B929C' }}>{t('stats.leaderboard.noResults')}</div>
            )}
            {leaderboard && leaderboard.length > 0 && (
              <div style={{ marginTop: 'auto', fontSize: '12px', color: '#7D848F' }}>
                {t('stats.leaderboard.showing', { start: start + 1, end: start + leaderboard.length })}
              </div>
            )}
          </section>

          {/* Side nav cards - 1 col */}
          <div className="flex flex-row lg:flex-col gap-4">
            <NavCard icon={<ChartIcon />} title={t('stats.shortcuts.financials')} description={t('stats.shortcuts.metricsDesc')} onClick={() => scrollTo(metricsRef)} />
            <NavCard icon={<SlidersIcon />} title={t('stats.shortcuts.config')} description={t('stats.shortcuts.configDesc')} onClick={() => scrollTo(configRef)} />
          </div>
        </div>

        {/* ── Financial Metrics section ── */}
        <section ref={metricsRef} style={{ ...CARD, padding: '24px', marginBottom: '16px' }}>
          <SectionHeader icon={<ChartIcon />} title={t('stats.tabs.systemMetrics')} subtitle={t('stats.shortcuts.metricsDesc')} badge={t('stats.beta')} />

          {smLoading && (
            <div className="flex items-center justify-center gap-3 py-8">
              <LoadingSpinner />
              <span style={{ fontSize: '13px', color: '#8B929C' }}>{t('stats.metrics.computing')}</span>
            </div>
          )}
          {smError && !smLoginRequired && <ErrorBanner msg={smError} />}
          {smError && smLoginRequired && <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-200">{smError}</div>}

          {systemMetrics && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {smFreshnessLabel && (
                <div style={{ fontSize: '12px', color: '#7D848F', fontFamily: "'Geist Mono', 'Roboto Mono', monospace" }}>
                  {t('stats.metrics.freshnessLabel', { time: smFreshnessLabel })}
                </div>
              )}

              {/* Money Created - capacity bar */}
              <div>
                <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, color: '#F3F4F6' }}>{t('stats.metrics.moneyCreated')}</h3>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: '#7D848F' }}>
                    <span>{t('stats.metrics.utilizationLabel')}</span>
                    <span>{fmt(systemMetrics.moneyUtilized.totalUtilized.value)} / {fmt(systemMetrics.moneyCreated.userDebtCapacity.value)}</span>
                  </div>
                  <div style={{ height: '6px', width: '100%', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '3px', transition: 'width 0.7s',
                      width: `${Math.min((Math.abs(systemMetrics.moneyUtilized.totalUtilized.value) / Math.max(Math.abs(systemMetrics.moneyCreated.userDebtCapacity.value), 1)) * 100, 100)}%`,
                      backgroundColor: COLORS.celeste,
                    }} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: t('stats.metrics.numUsers'), value: systemMetrics.moneyCreated.numUsers.value, icon: '👥' },
                    { label: t('stats.metrics.userDebtCapacity'), value: systemMetrics.moneyCreated.userDebtCapacity.value, icon: '💳' },
                    { label: t('stats.metrics.totalUtilized'), value: systemMetrics.moneyUtilized.totalUtilized.value, icon: '📊' },
                  ].map((m) => (
                    <div key={m.label} style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '12px', color: '#8B929C', marginBottom: '6px' }}>{m.icon} {m.label}</div>
                      <div style={{ fontSize: '20px', fontWeight: 600, color: '#F3F4F6', fontFamily: "'Geist Mono', 'Roboto Mono', monospace" }}>{fmt(m.value)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Money Utilized - chart */}
              {utilizationData.length > 0 && (
                <div>
                  <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, color: '#F3F4F6' }}>{t('stats.metrics.moneyUtilized')}</h3>
                  <div style={{ minHeight: '180px' }}>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={utilizationData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
                          {utilizationData.map((d, i) => <Cell key={i} fill={d.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3">
                    {utilizationData.map((d) => (
                      <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: '11px', color: '#8B929C' }}>{d.name}</div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#F3F4F6' }}>{fmt(d.value)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Accounting Verification */}
              <div>
                <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, color: '#F3F4F6' }}>{t('stats.metrics.accountingVerification')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `2px solid ${isBalanced ? 'rgba(52,211,153,0.5)' : 'rgba(251,113,133,0.5)'}`, background: isBalanced ? 'rgba(52,211,153,0.1)' : 'rgba(251,113,133,0.1)' }}>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: isBalanced ? COLORS.emerald : COLORS.rose }}>{isBalanced ? '✓' : '✗'}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#F3F4F6' }}>{isBalanced ? t('stats.metrics.systemBalanced') : t('stats.metrics.systemImbalanced')}</div>
                      <p style={{ fontSize: '12px', color: '#8B929C', margin: '4px 0 0' }}>{systemMetrics.verification.balanced.explanation}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      border: `2px solid ${surplus?.value === 0 ? 'rgba(52,211,153,0.5)' : surplus?.value > 0 ? 'rgba(251,191,36,0.5)' : 'rgba(251,113,133,0.5)'}`,
                      background: surplus?.value === 0 ? 'rgba(52,211,153,0.1)' : surplus?.value > 0 ? 'rgba(251,191,36,0.1)' : 'rgba(251,113,133,0.1)',
                    }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: surplus?.value === 0 ? COLORS.emerald : surplus?.value > 0 ? COLORS.amber : COLORS.rose }}>
                        {surplus?.value > 0 ? '+' : ''}{fmt(surplus?.value)}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#F3F4F6' }}>{t('stats.metrics.surplusDeficit')}</span>
                        <FormulaToggle formula={surplus?.formula} show={showFormulas.surplus} onToggle={() => toggleFormula('surplus')} />
                      </div>
                      <p style={{ fontSize: '12px', color: '#8B929C', margin: '4px 0 0' }}>{surplus?.explanation}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Setup Configuration section ── */}
        <section ref={configRef} style={{ ...CARD, padding: '24px' }}>
          <SectionHeader icon={<SlidersIcon />} title={t('stats.tabs.setupConfig')} subtitle={t('stats.shortcuts.configDesc')} />

          {statsLoading && (
            <div className="flex items-center justify-center gap-3 py-8">
              <LoadingSpinner />
            </div>
          )}
          {statsError && <ErrorBanner msg={statsError} />}

          {statsData?.setupConfiguration && (
            <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
                    <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7D848F' }}>{t('stats.setupConfig.variable')}</th>
                    <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7D848F' }}>{t('stats.setupConfig.value')}</th>
                    <th className="hidden sm:table-cell" style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7D848F' }}>{t('stats.setupConfig.explanation')}</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(statsData.setupConfiguration).map(([key, value]) => (
                    <tr key={key} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 20px', fontFamily: "'Geist Mono', 'Roboto Mono', monospace", fontSize: '13px', color: '#9CC9F1' }}>{key}</td>
                      <td style={{ padding: '12px 20px', fontWeight: 600, color: '#F3F4F6' }}>{typeof value === 'number' ? value.toLocaleString() : value.toString()}</td>
                      <td className="hidden sm:table-cell" style={{ padding: '12px 20px', color: '#8B929C', fontSize: '13px' }}>{explanations[key] || t('stats.setupConfig.configParamFull')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default NewStats;
