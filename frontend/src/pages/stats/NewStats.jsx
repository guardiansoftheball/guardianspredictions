import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { API_URL } from '../../config';
import { authStorage } from '../../api/authStorage';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import LoadingSpinner from '../../components/loaders/LoadingSpinner';
import SiteTabs from '../../components/tabs/SiteTabs';
import { Button } from '../../components/ui/Button';
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

const setupConfigExplanations = {
  initialMarketProbability: 'Default probability percentage for new markets when first created',
  initialMarketSubsidization: 'Initial funding provided to new markets to bootstrap liquidity',
  initialMarketYes: 'Starting number of YES shares available in new markets',
  initialMarketNo: 'Starting number of NO shares available in new markets',
  createMarketCost: 'Cost in points for users to create a new prediction market',
  traderBonus: 'Bonus points awarded to users for participating in trading',
  initialAccountBalance: 'Starting balance given to new user accounts',
  maximumDebtAllowed: 'Maximum negative balance users can reach before restrictions',
  minimumBet: 'Smallest bet amount allowed on any market',
  maxDustPerSale: 'Maximum dust (small remainder) allowed when selling positions',
  initialBetFee: 'Fee charged when placing the first bet on a market',
  buySharesFee: 'Fee charged when purchasing shares in a market',
  sellSharesFee: 'Fee charged when selling shares back to the market',
};

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

// ─── shared UI components ─────────────────────────────────────────────────────

const GlassCard = ({ children, className = '' }) => (
  <div className={`rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 ${className}`}>{children}</div>
);

const ErrorBanner = ({ msg }) => msg ? (
  <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{msg}</div>
) : null;

const InfoBanner = ({ children }) => (
  <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-200">{children}</div>
);

const PaginationBar = ({ page, visibleCount, total, hasPrev, hasNext, onPrev, onNext, loading }) => {
  const start = total > 0 ? page * LEADERBOARD_PAGE_SIZE + 1 : 0;
  const end = total > 0 ? page * LEADERBOARD_PAGE_SIZE + visibleCount : 0;
  return (
    <GlassCard className="flex items-center justify-between !py-3">
      <span className="text-xs text-gray-400">{total > 0 ? `Showing ${start}–${end}` : '(0 results)'}</span>
      <div className="flex gap-2">
        <Button variant="dark" disabled={loading || !hasPrev} onClick={onPrev}>Previous</Button>
        <Button variant="dark" disabled={loading || !hasNext} onClick={onNext}>Next</Button>
      </div>
    </GlassCard>
  );
};

// ─── Recharts dark tooltip ────────────────────────────────────────────────────

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

// ─── Profit bar (inline, like the screenshot) ─────────────────────────────────

const ProfitBar = ({ profit, maxAbsProfit }) => {
  if (maxAbsProfit === 0) return <div className="h-2 w-full rounded-full bg-white/10" />;
  const pct = Math.min(Math.abs(profit) / maxAbsProfit, 1) * 100;
  const isPositive = profit >= 0;
  const barColor = isPositive ? COLORS.emerald : COLORS.rose;
  return (
    <div className="relative h-2 w-full rounded-full bg-white/10">
      <div
        className="absolute top-0 h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: barColor, left: 0 }}
      />
    </div>
  );
};

// ─── Tab: Setup Configuration ─────────────────────────────────────────────────

const SetupConfigTab = ({ statsData }) => (
  <div className="flex flex-col gap-4">
    <InfoBanner>These are the platform's economic configuration parameters. They control market creation costs, initial balances, fees, and other financial settings.</InfoBanner>
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full divide-y divide-white/10 text-left text-sm">
        <thead className="bg-white/5 text-xs uppercase tracking-widest text-gray-400">
          <tr>
            <th className="px-4 py-3">Variable</th>
            <th className="px-4 py-3">Value</th>
            <th className="hidden px-4 py-3 sm:table-cell">Explanation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {statsData?.setupConfiguration && Object.entries(statsData.setupConfiguration).map(([key, value]) => (
            <tr key={key} className="hover:bg-white/5 transition">
              <td className="px-4 py-3 align-top">
                <div className="font-mono text-sm text-[#9CC9F1]">{key}</div>
                <div className="mt-1 text-xs text-gray-500 sm:hidden">{setupConfigExplanations[key] || 'Configuration parameter'}</div>
              </td>
              <td className="px-4 py-3 align-top font-semibold text-white">{typeof value === 'number' ? value.toLocaleString() : value.toString()}</td>
              <td className="hidden px-4 py-3 align-top text-gray-400 sm:table-cell">{setupConfigExplanations[key] || 'Configuration parameter for platform behavior'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

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

// ─── MetricRow (compact metric with explanation + optional formula) ───────────

const MetricRow = ({ label, value, explanation, formula, showFormula, onToggleFormula, color, icon }) => (
  <div className="flex items-start gap-3 py-3">
    {icon && <span className="text-xl mt-0.5 shrink-0">{icon}</span>}
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-gray-300">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${color || 'text-white'}`}>{fmt(value)}</span>
          <FormulaToggle formula={formula} show={showFormula} onToggle={onToggleFormula} />
        </div>
      </div>
      {explanation && <p className="text-xs text-gray-500 mt-1">{explanation}</p>}
    </div>
  </div>
);

// ─── Tab: System Financial Metrics (with charts) ─────────────────────────────

const SystemMetricsTab = () => {
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loginRequired, setLoginRequired] = useState(false);
  const [freshness, setFreshness] = useState(null);
  const [showFormulas, setShowFormulas] = useState({});

  const fetchMetrics = async () => {
    setLoading(true); setError(null); setLoginRequired(false);
    try {
      const response = await fetch(`${API_URL}/v0/system/metrics`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...getOptionalAuthHeaders() },
      });
      if (!response.ok) await readReportingError(response, 'Log in to see system stats', 'Failed to fetch system metrics');
      const data = await response.json();
      const result = unwrapApiResponse(data);
      setFreshness(result?.freshness || null);
      setSystemMetrics(result ? { ...result, freshness: undefined } : result);
    } catch (err) { setError(err.message); setLoginRequired(Boolean(err.loginRequired)); }
    finally { setLoading(false); }
  };

  const toggleFormula = (key) => setShowFormulas((prev) => ({ ...prev, [key]: !prev[key] }));
  const freshnessLabel = freshnessTimeLabel(freshness);

  // Build chart data from metrics
  const utilizationData = useMemo(() => {
    if (!systemMetrics) return [];
    const u = systemMetrics.moneyUtilized;
    return [
      { name: 'Unused Debt', value: Math.abs(u.unusedDebt.value), color: COLORS.amber, explanation: u.unusedDebt.explanation, formula: u.unusedDebt.formula, key: 'unusedDebt' },
      { name: 'Active Bets', value: Math.abs(u.activeBetVolume.value), color: COLORS.purple, explanation: u.activeBetVolume.explanation, formula: u.activeBetVolume.formula, key: 'activeBetVolume' },
      { name: 'Market Fees', value: Math.abs(u.marketCreationFees.value), color: COLORS.orange, explanation: u.marketCreationFees.explanation, formula: u.marketCreationFees.formula, key: 'marketCreationFees' },
      { name: 'Participation Fees', value: Math.abs(u.participationFees.value), color: COLORS.cyan, explanation: u.participationFees.explanation, formula: u.participationFees.formula, key: 'participationFees' },
      { name: 'Bonuses', value: Math.abs(u.bonusesPaid.value), color: COLORS.pink, explanation: u.bonusesPaid.explanation, key: 'bonusesPaid' },
    ].filter((d) => d.value > 0);
  }, [systemMetrics]);

  const isBalanced = systemMetrics?.verification?.balanced?.value === true;
  const surplus = systemMetrics?.verification?.surplus;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-200 self-start">Beta</span>
        <Button variant="celeste" disabled={loading} onClick={fetchMetrics}>
          {loading ? 'Calculating...' : 'Calculate Metrics'}
        </Button>
      </div>

      <InfoBanner>
        These financial metrics are currently in beta. Balance calculations may not perfectly align
        as we continue to refine the accounting logic.
      </InfoBanner>

      {loading && (
        <div className="flex items-center justify-center gap-3 py-8">
          <LoadingSpinner />
          <span className="text-sm text-gray-300">Computing system metrics...</span>
        </div>
      )}

      {error && !loginRequired && <ErrorBanner msg={error} />}
      {error && loginRequired && <InfoBanner>{error}</InfoBanner>}

      {!systemMetrics && !loading && !error && (
        <GlassCard className="text-center text-gray-400">
          Click "Calculate Metrics" to view detailed financial analysis.
        </GlassCard>
      )}

      {systemMetrics && (
        <div className="flex flex-col gap-5">
          {freshnessLabel && (
            <GlassCard className="!py-3 text-sm text-gray-300">
              System metrics generated at {freshnessLabel}. Trade confirmations remain authoritative.
            </GlassCard>
          )}

          {/* ── Money Created: capacity bar + details ── */}
          <GlassCard>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-3xl">💰</span>
              <div>
                <h3 className="text-xl font-bold text-white">Money Created</h3>
                <span className="text-sm text-gray-400">Total System Capacity</span>
              </div>
            </div>
            {/* Capacity usage bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">Utilized vs Total Capacity</span>
                <span className="text-xs text-gray-400">
                  {fmt(systemMetrics.moneyUtilized.totalUtilized.value)} / {fmt(systemMetrics.moneyCreated.userDebtCapacity.value)}
                </span>
              </div>
              <div className="h-4 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min((Math.abs(systemMetrics.moneyUtilized.totalUtilized.value) / Math.max(Math.abs(systemMetrics.moneyCreated.userDebtCapacity.value), 1)) * 100, 100)}%`,
                    backgroundColor: COLORS.celeste,
                  }}
                />
              </div>
            </div>
            {/* Detail rows */}
            <div className="divide-y divide-white/5">
              <MetricRow
                icon="👥"
                label="Number of Users"
                value={systemMetrics.moneyCreated.numUsers.value}
                explanation={systemMetrics.moneyCreated.numUsers.explanation}
              />
              <MetricRow
                icon="💳"
                label="User Debt Capacity"
                value={systemMetrics.moneyCreated.userDebtCapacity.value}
                explanation={systemMetrics.moneyCreated.userDebtCapacity.explanation}
                formula={systemMetrics.moneyCreated.userDebtCapacity.formula}
                showFormula={showFormulas.userDebtCapacity}
                onToggleFormula={() => toggleFormula('userDebtCapacity')}
                color="text-[#9CC9F1]"
              />
              <MetricRow
                icon="📊"
                label="Total Utilized"
                value={systemMetrics.moneyUtilized.totalUtilized.value}
                explanation={systemMetrics.moneyUtilized.totalUtilized.explanation}
                formula={systemMetrics.moneyUtilized.totalUtilized.formula}
                showFormula={showFormulas.totalUtilized}
                onToggleFormula={() => toggleFormula('totalUtilized')}
                color="text-white"
              />
            </div>
          </GlassCard>

          {/* ── Money Utilized: bar chart + detail list ── */}
          <GlassCard>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-3xl">📊</span>
              <div>
                <h3 className="text-xl font-bold text-white">Money Utilized</h3>
                <span className="text-sm text-gray-400">Where the money went</span>
              </div>
            </div>
            {utilizationData.length > 0 ? (
              <div className="flex flex-col gap-4">
                {/* Chart */}
                <div className="min-h-[200px]">
                  <ResponsiveContainer width="100%" height={200}>
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
                {/* Detail rows with explanations */}
                <div className="divide-y divide-white/5">
                  {utilizationData.map((d) => (
                    <div key={d.key} className="flex items-start gap-3 py-3">
                      <div className="h-3 w-3 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: d.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-gray-300">{d.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{fmt(d.value)}</span>
                            <FormulaToggle formula={d.formula} show={showFormulas[d.key]} onToggle={() => toggleFormula(d.key)} />
                          </div>
                        </div>
                        {d.explanation && <p className="text-xs text-gray-500 mt-1">{d.explanation}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No utilization data available.</p>
            )}
          </GlassCard>

          {/* ── Accounting Verification ── */}
          <GlassCard>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-3xl">{isBalanced ? '✅' : '❌'}</span>
              <div>
                <h3 className="text-xl font-bold text-white">Accounting Verification</h3>
                <span className="text-sm text-gray-400">Balance Check</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Balanced status */}
              <div className="flex items-center gap-4 rounded-lg border border-white/5 bg-white/[0.03] p-4">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 ${isBalanced ? 'border-emerald-400/50 bg-emerald-400/10' : 'border-rose-400/50 bg-rose-400/10'}`}>
                  <span className={`text-xl font-bold ${isBalanced ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isBalanced ? 'YES' : 'NO'}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">System {isBalanced ? 'Balanced' : 'Imbalanced'}</div>
                  <p className="text-xs text-gray-500 mt-1">{systemMetrics.verification.balanced.explanation}</p>
                </div>
              </div>
              {/* Surplus/Deficit */}
              <div className="flex items-center gap-4 rounded-lg border border-white/5 bg-white/[0.03] p-4">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 ${
                  surplus?.value === 0 ? 'border-emerald-400/50 bg-emerald-400/10' :
                  surplus?.value > 0 ? 'border-amber-400/50 bg-amber-400/10' : 'border-rose-400/50 bg-rose-400/10'
                }`}>
                  <span className={`text-lg font-bold ${
                    surplus?.value === 0 ? 'text-emerald-400' :
                    surplus?.value > 0 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {surplus?.value > 0 ? '+' : ''}{fmt(surplus?.value)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">Surplus / Deficit</span>
                    <FormulaToggle formula={surplus?.formula} show={showFormulas.surplus} onToggle={() => toggleFormula('surplus')} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{surplus?.explanation}</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

// ─── Tab: Global Leaderboard (with inline profit bars) ────────────────────────

const GlobalLeaderboardTab = () => {
  const [leaderboard, setLeaderboard] = useState(null);
  const [freshness, setFreshness] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loginRequired, setLoginRequired] = useState(false);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  const fetchLeaderboard = async (pageNum = 0) => {
    setLoading(true); setError(null); setLoginRequired(false);
    try {
      const offset = pageNum * LEADERBOARD_PAGE_SIZE;
      const response = await fetch(`${API_URL}/v0/global/leaderboard?limit=${LEADERBOARD_PAGE_SIZE + 1}&offset=${offset}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...getOptionalAuthHeaders() },
      });
      if (!response.ok) await readReportingError(response, 'Log in to see leaderboard', 'Failed to fetch global leaderboard');
      const data = await response.json();
      const result = unwrapApiResponse(data);
      const rows = Array.isArray(result) ? result : (Array.isArray(result?.entries) ? result.entries : []);
      setFreshness(Array.isArray(result) ? null : (result?.freshness || null));
      setLeaderboard(rows.slice(0, LEADERBOARD_PAGE_SIZE));
      setPage(pageNum);
      setHasNextPage(rows.length > LEADERBOARD_PAGE_SIZE);
    } catch (err) { setError(err.message); setLoginRequired(Boolean(err.loginRequired)); setHasNextPage(false); }
    finally { setLoading(false); }
  };

  const start = page * LEADERBOARD_PAGE_SIZE;
  const freshnessLabel = freshnessTimeLabel(freshness);
  const maxAbsProfit = useMemo(() => {
    if (!leaderboard?.length) return 0;
    return Math.max(...leaderboard.map((u) => Math.abs(u.totalProfit)), 1);
  }, [leaderboard]);

  const getRankDisplay = (rank) => {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return `#${rank}`;
  };

  const getUserInitials = (username) => {
    return username.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-200 self-start">Beta</span>
        <Button variant="celeste" disabled={loading} onClick={() => fetchLeaderboard(0)}>
          {loading ? 'Calculating...' : 'Calculate Leaderboard'}
        </Button>
      </div>

      <InfoBanner>
        This global leaderboard aggregates profit calculations across all markets. Rankings are based on
        total profit (current position value minus total amount spent) across both resolved and active markets.
      </InfoBanner>

      {loading && (
        <div className="flex items-center justify-center gap-3 py-8">
          <LoadingSpinner />
          <span className="text-sm text-gray-300">Computing global leaderboard...</span>
        </div>
      )}

      {error && !loginRequired && <ErrorBanner msg={error} />}
      {error && loginRequired && <InfoBanner>{error}</InfoBanner>}

      {!leaderboard && !loading && !error && (
        <GlassCard className="text-center text-gray-400">
          Click "Calculate Leaderboard" to view global profit rankings.
        </GlassCard>
      )}

      {leaderboard && leaderboard.length > 0 && (
        <div className="flex flex-col gap-3">
          {freshnessLabel && (
            <GlassCard className="!py-3 text-sm text-gray-300">
              Global leaderboard generated at {freshnessLabel}. Trade confirmations remain authoritative.
            </GlassCard>
          )}

          <PaginationBar
            page={page}
            visibleCount={leaderboard.length}
            total={start + leaderboard.length + (hasNextPage ? 1 : 0)}
            hasPrev={page > 0}
            hasNext={hasNextPage}
            onPrev={() => fetchLeaderboard(Math.max(0, page - 1))}
            onNext={() => fetchLeaderboard(page + 1)}
            loading={loading}
          />

          {/* Header row */}
          <div className="hidden sm:grid sm:grid-cols-[60px,1fr,2fr,80px,80px,120px] gap-3 px-4 py-2 text-xs uppercase tracking-widest text-gray-400">
            <span>Rank</span>
            <span>User</span>
            <span>Profit</span>
            <span className="text-right">Value</span>
            <span className="text-right">Spent</span>
            <span className="text-right">Markets</span>
          </div>

          {/* Rows */}
          <div className="flex flex-col gap-2">
            {leaderboard.map((user) => {
              const profitPositive = user.totalProfit >= 0;
              return (
                <GlassCard key={user.username} className="!py-3">
                  <div className="grid grid-cols-1 sm:grid-cols-[60px,1fr,2fr,80px,80px,120px] gap-3 items-center">
                    {/* Rank */}
                    <span className="text-lg font-bold text-white">{getRankDisplay(user.rank)}</span>

                    {/* User avatar + name */}
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#9CC9F1]/40 bg-[#9CC9F1]/15 text-xs font-bold text-[#9CC9F1]">
                        {getUserInitials(user.username)}
                      </div>
                      <Link to={`/newprofile/${user.username}`} className="font-medium text-white hover:text-[#9CC9F1] transition-colors truncate">
                        {user.username}
                      </Link>
                    </div>

                    {/* Profit bar + value */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <ProfitBar profit={user.totalProfit} maxAbsProfit={maxAbsProfit} />
                      </div>
                      <span className={`text-sm font-semibold min-w-[60px] text-right ${profitPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {profitPositive ? '+' : ''}{fmt(user.totalProfit)}
                      </span>
                    </div>

                    {/* Value */}
                    <span className="text-sm text-gray-300 text-right">{fmt(user.totalCurrentValue)}</span>

                    {/* Spent */}
                    <span className="text-sm text-gray-300 text-right">{fmt(user.totalSpent)}</span>

                    {/* Markets */}
                    <span className="text-sm text-gray-400 text-right">
                      {user.activeMarkets} active · {user.resolvedMarkets} resolved
                    </span>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      {leaderboard && leaderboard.length === 0 && (
        <GlassCard className="text-center text-gray-400">No users with betting activity found.</GlassCard>
      )}
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const NewStats = () => {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Global Leaderboard');

  useEffect(() => { document.title = 'Platform Statistics'; }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_URL}/v0/stats`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error(`Failed to fetch stats: ${response.status}`);
        const data = await response.json();
        setStatsData(unwrapApiResponse(data));
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  const shortcuts = [
    { tab: 'Global Leaderboard', eyebrow: 'Rankings', title: 'Global Leaderboard', description: 'View profit rankings across all users and markets.' },
    { tab: 'System Metrics', eyebrow: 'Financials', title: 'System Metrics', description: 'Analyze money created, utilized, and accounting verification.' },
    { tab: 'Setup Configuration', eyebrow: 'Config', title: 'Setup Configuration', description: 'Review platform economic parameters and fee structure.' },
  ];

  const tabs = [
    { label: 'Global Leaderboard', content: <GlobalLeaderboardTab /> },
    { label: 'System Metrics', content: <SystemMetricsTab /> },
    { label: 'Setup Configuration', content: loading ? <LoadingSpinner /> : error ? <ErrorBanner msg={error} /> : <SetupConfigTab statsData={statsData} /> },
  ];

  return (
    <div className="min-h-screen bg-primary-background relative overflow-x-hidden">
      <div style={{ position: 'fixed', width: '70vw', height: '70vh', left: '50%', top: '30%', transform: 'translate(-50%, -50%)', background: 'radial-gradient(ellipse, rgba(233,30,140,0.07) 0%, rgba(81,173,246,0.05) 60%, transparent 100%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-[#9CC9F1] mb-1">Platform</p>
          <h1 className="text-4xl font-bold text-white">Statistics</h1>
          <p className="mt-2 text-sm text-gray-400 max-w-2xl">System configuration, financial metrics, and global leaderboard for the platform.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {shortcuts.map((s) => (
            <button
              key={s.tab}
              type="button"
              onClick={() => setActiveTab(s.tab)}
              className={`flex flex-col gap-2 rounded-xl border p-4 text-left transition ${activeTab === s.tab ? 'border-[#9CC9F1]/60 bg-[#9CC9F1]/10 shadow-lg shadow-[#9CC9F1]/10' : 'border-white/10 bg-white/5 hover:border-sky-500/40 hover:bg-white/8'}`}
            >
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{s.eyebrow}</span>
              <div className="text-base font-semibold text-white">{s.title}</div>
              <p className="text-xs leading-5 text-gray-400">{s.description}</p>
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
          <SiteTabs variant="dark" tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default NewStats;
