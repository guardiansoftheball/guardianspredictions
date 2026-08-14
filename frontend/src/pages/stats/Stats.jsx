import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../../config';
import { authStorage } from '../../api/authStorage';
import SiteButton from '../../components/buttons/SiteButtons';
import LoadingSpinner from '../../components/loaders/LoadingSpinner';
import SiteTabs from '../../components/tabs/SiteTabs';
import { unwrapApiResponse } from '../../utils/apiResponse';

const LOGIN_REQUIRED_REASON = 'INVALID_TOKEN';
const LEADERBOARD_PAGE_SIZE = 20;
const paginationButtonClass = [
  'rounded',
  'border',
  'border-transparent',
  'bg-neutral-btn',
  'px-3',
  'py-1.5',
  'text-xs',
  'font-semibold',
  'text-white',
  'transition-colors',
  'duration-200',
  'hover:bg-neutral-btn-hover',
  'disabled:cursor-not-allowed',
  'disabled:bg-custom-gray-light',
  'disabled:text-gray-400',
  'disabled:opacity-60',
].join(' ');

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
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (response.status === 401 && payload?.reason === LOGIN_REQUIRED_REASON) {
    throw loginRequiredError(loginMessage);
  }

  throw new Error(payload?.message || payload?.reason || `${fallbackMessage}: ${response.status}`);
};

const freshnessTimeLabel = (freshness) => {
  if (!freshness?.generatedAt) return '';
  const generatedAt = new Date(freshness.generatedAt);
  if (Number.isNaN(generatedAt.getTime())) return '';
  return generatedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
};

const ReportingNotice = ({ message, loginRequired, errorLabel, t }) => (
  <div
    className={`rounded-lg border p-4 mb-6 ${
      loginRequired
        ? 'bg-info-blue/15 border-info-blue/50'
        : 'bg-red-900/50 border-red-600'
    }`}
  >
    <p className={loginRequired ? 'text-blue-100' : 'text-red-300'}>
      {loginRequired ? message : `${errorLabel}: ${message}`}
    </p>
  </div>
);

// MetricCard Component
const MetricCard = ({
  title,
  value,
  formula,
  explanation,
  onToggleFormula,
  showFormula,
  colorClass = "text-white",
  isTotal = false,
  isStatus = false
}) => {
  const formatValue = (val) => {
    if (isStatus) return val;
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <div className={`bg-gray-600 rounded-lg p-4 ${isTotal ? 'border-2 border-gray-500' : ''}`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-gray-300 text-sm font-medium">{title}</h4>
        {formula && (
          <button
            onClick={onToggleFormula}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            title="Toggle formula"
          >
            📐
          </button>
        )}
      </div>

      <p className={`${colorClass} ${isTotal ? 'text-3xl' : 'text-2xl'} font-bold mb-2`}>
        {formatValue(value)}
      </p>

      {explanation && (
        <p className="text-gray-400 text-xs mb-2">{explanation}</p>
      )}

      {formula && showFormula && (
        <div className="mt-3 p-3 bg-gray-800 rounded border border-gray-700">
          <p className="text-gray-300 text-xs font-mono">{formula}</p>
        </div>
      )}
    </div>
  );
};

const Stats = () => {
  const { t } = useTranslation();
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // System metrics state
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState(null);
  const [metricsLoginRequired, setMetricsLoginRequired] = useState(false);
  const [metricsFreshness, setMetricsFreshness] = useState(null);
  const [showFormulas, setShowFormulas] = useState({});

  // Global leaderboard state
  const [globalLeaderboard, setGlobalLeaderboard] = useState(null);
  const [leaderboardFreshness, setLeaderboardFreshness] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState(null);
  const [leaderboardLoginRequired, setLeaderboardLoginRequired] = useState(false);
  const [leaderboardPage, setLeaderboardPage] = useState(0);
  const [leaderboardHasNextPage, setLeaderboardHasNextPage] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_URL}/v0/stats`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch stats: ${response.status}`);
        }

        const data = await response.json();
        setStatsData(unwrapApiResponse(data));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const fetchSystemMetrics = async () => {
    setMetricsLoading(true);
    setMetricsError(null);
    setMetricsLoginRequired(false);
    try {
      const response = await fetch(`${API_URL}/v0/system/metrics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getOptionalAuthHeaders(),
        },
      });

      if (!response.ok) {
        await readReportingError(
          response,
          t('stats.metrics.loginRequired'),
          t('stats.metrics.fetchError')
        );
      }

      const data = await response.json();
      const result = unwrapApiResponse(data);
      setMetricsFreshness(result?.freshness || null);
      setSystemMetrics(result ? { ...result, freshness: undefined } : result);
    } catch (err) {
      setMetricsError(err.message);
      setMetricsLoginRequired(Boolean(err.loginRequired));
    } finally {
      setMetricsLoading(false);
    }
  };

  const fetchGlobalLeaderboard = async (page = 0) => {
    setLeaderboardLoading(true);
    setLeaderboardError(null);
    setLeaderboardLoginRequired(false);
    try {
      const offset = page * LEADERBOARD_PAGE_SIZE;
      const response = await fetch(`${API_URL}/v0/global/leaderboard?limit=${LEADERBOARD_PAGE_SIZE + 1}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getOptionalAuthHeaders(),
        },
      });

      if (!response.ok) {
        await readReportingError(
          response,
          t('stats.leaderboard.loginRequired'),
          t('stats.leaderboard.fetchError')
        );
      }

      const data = await response.json();
      const result = unwrapApiResponse(data);
      const leaderboardRows = Array.isArray(result) ? result : (Array.isArray(result?.entries) ? result.entries : []);
      setLeaderboardFreshness(Array.isArray(result) ? null : (result?.freshness || null));
      setGlobalLeaderboard(leaderboardRows.slice(0, LEADERBOARD_PAGE_SIZE));
      setLeaderboardPage(page);
      setLeaderboardHasNextPage(leaderboardRows.length > LEADERBOARD_PAGE_SIZE);
    } catch (err) {
      setLeaderboardError(err.message);
      setLeaderboardLoginRequired(Boolean(err.loginRequired));
      setLeaderboardHasNextPage(false);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const leaderboardStart = leaderboardPage * LEADERBOARD_PAGE_SIZE;
  const canPageLeaderboardBack = leaderboardPage > 0;
  const canPageLeaderboardForward = leaderboardHasNextPage;
  const metricsFreshnessLabel = freshnessTimeLabel(metricsFreshness);
  const leaderboardFreshnessLabel = freshnessTimeLabel(leaderboardFreshness);

  const toggleFormula = (key) => {
    setShowFormulas(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const setupConfigExplanations = {
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
    sellSharesFee: t('stats.setupConfig.explanations.sellSharesFee')
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-white text-xl">{t('stats.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-400 text-xl">{t('stats.error')}: {error}</div>
      </div>
    );
  }

  // Setup Configuration Tab Content
  const setupConfigContent = (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-semibold text-white mb-6">{t('stats.setupConfig.title')}</h2>

      {/* Mobile-responsive grid for setup configuration */}
      <div className="space-y-2">
        <div className="sp-grid-setup-header">
          <div>{t('stats.setupConfig.setupVariable')}</div>
          <div>{t('stats.setupConfig.value')}</div>
          <div>{t('stats.setupConfig.explanation')}</div>
        </div>

        {statsData?.setupConfiguration && Object.entries(statsData.setupConfiguration).map(([key, value]) => (
          <div key={key} className="sp-grid-setup-row hover:bg-gray-700/50 transition-colors">
            {/* Variable Name */}
            <div className="sp-cell-username">
              <div className="sp-ellipsis text-xs sm:text-sm font-mono text-blue-400">
                {key}
              </div>
            </div>

            {/* Value */}
            <div className="sp-cell-num text-xs sm:text-sm text-white font-semibold">
              {typeof value === 'number' ? value.toLocaleString() : value.toString()}
            </div>

            {/* Explanation (desktop only on mobile, full width below on mobile) */}
            <div className="hidden sm:block text-gray-300 text-xs sm:text-sm">
              {setupConfigExplanations[key] || t('stats.setupConfig.configParamFull')}
            </div>

            {/* Mobile explanation - spans full width */}
            <div className="col-span-2 sm:hidden sp-subline mt-1">
              {setupConfigExplanations[key] || t('stats.setupConfig.configParamFull')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // System Financial Metrics Tab Content
  const systemMetricsContent = (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-white">
          {t('stats.tabs.systemMetrics')} <span className="text-warning-orange text-lg">({t('stats.beta')})</span>
        </h2>
        <SiteButton
          onClick={fetchSystemMetrics}
          isSelected={false}
          disabled={metricsLoading}
          className="bg-info-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {metricsLoading ? t('stats.metrics.calculating') : t('stats.metrics.calculateBtn')}
        </SiteButton>
      </div>

      {/* Beta Disclaimer */}
      <div className="bg-warning-orange/20 border border-warning-orange/50 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <span className="text-warning-orange text-xl mr-3">⚠️</span>
          <div>
            <h4 className="text-warning-orange font-medium mb-2">{t('stats.metrics.betaNotice')}</h4>
            <p className="text-gray-300 text-sm">
              {t('stats.metrics.betaDisclaimerFull')}
            </p>
          </div>
        </div>
      </div>

      {metricsLoading && (
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner />
          <span className="ml-3 text-gray-300">{t('stats.metrics.computing')}</span>
        </div>
      )}

      {metricsError && (
        <ReportingNotice
          message={metricsError}
          loginRequired={metricsLoginRequired}
          errorLabel={t('stats.metrics.errorLabel')}
          t={t}
        />
      )}

      {!systemMetrics && !metricsLoading && !metricsError && (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">{t('stats.metrics.noData')}</p>
          <p className="text-gray-500 text-sm">{t('stats.metrics.noDataDesc')}</p>
        </div>
      )}

      {systemMetrics && (
        <div className="space-y-8">
          {metricsFreshnessLabel && (
            <p className="rounded-lg border border-gray-700 bg-gray-900/70 px-4 py-3 text-sm text-gray-300">
              {t('stats.metrics.freshnessLabel', { time: metricsFreshnessLabel })}
            </p>
          )}

          {/* Money Created Section */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              💰 {t('stats.metrics.moneyCreated')}
              <span className="ml-2 text-sm text-gray-400">({t('stats.metrics.totalSystemCapacity')})</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MetricCard
                title={t('stats.metrics.userDebtCapacity')}
                value={systemMetrics.moneyCreated.userDebtCapacity.value}
                formula={systemMetrics.moneyCreated.userDebtCapacity.formula}
                explanation={systemMetrics.moneyCreated.userDebtCapacity.explanation}
                onToggleFormula={() => toggleFormula('userDebtCapacity')}
                showFormula={showFormulas.userDebtCapacity}
                colorClass="text-blue-400"
              />
              <MetricCard
                title={t('stats.metrics.numUsers')}
                value={systemMetrics.moneyCreated.numUsers.value}
                explanation={systemMetrics.moneyCreated.numUsers.explanation}
                colorClass="text-white"
              />
            </div>
          </div>

          {/* Money Utilized Section */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              📊 {t('stats.metrics.moneyUtilized')}
              <span className="ml-2 text-sm text-gray-400">({t('stats.metrics.whereMoneyWent')})</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard
                title={t('stats.metrics.unusedDebt')}
                value={systemMetrics.moneyUtilized.unusedDebt.value}
                formula={systemMetrics.moneyUtilized.unusedDebt.formula}
                explanation={systemMetrics.moneyUtilized.unusedDebt.explanation}
                onToggleFormula={() => toggleFormula('unusedDebt')}
                showFormula={showFormulas.unusedDebt}
                colorClass="text-yellow-400"
              />
              <MetricCard
                title={t('stats.metrics.activeBetVolume')}
                value={systemMetrics.moneyUtilized.activeBetVolume.value}
                formula={systemMetrics.moneyUtilized.activeBetVolume.formula}
                explanation={systemMetrics.moneyUtilized.activeBetVolume.explanation}
                onToggleFormula={() => toggleFormula('activeBetVolume')}
                showFormula={showFormulas.activeBetVolume}
                colorClass="text-purple-400"
              />
              <MetricCard
                title={t('stats.metrics.marketCreationFees')}
                value={systemMetrics.moneyUtilized.marketCreationFees.value}
                formula={systemMetrics.moneyUtilized.marketCreationFees.formula}
                explanation={systemMetrics.moneyUtilized.marketCreationFees.explanation}
                onToggleFormula={() => toggleFormula('marketCreationFees')}
                showFormula={showFormulas.marketCreationFees}
                colorClass="text-orange-400"
              />
              <MetricCard
                title={t('stats.metrics.participationFees')}
                value={systemMetrics.moneyUtilized.participationFees.value}
                formula={systemMetrics.moneyUtilized.participationFees.formula}
                explanation={systemMetrics.moneyUtilized.participationFees.explanation}
                onToggleFormula={() => toggleFormula('participationFees')}
                showFormula={showFormulas.participationFees}
                colorClass="text-cyan-400"
              />
              <MetricCard
                title={t('stats.metrics.bonusesPaid')}
                value={systemMetrics.moneyUtilized.bonusesPaid.value}
                explanation={systemMetrics.moneyUtilized.bonusesPaid.explanation}
                colorClass="text-pink-400"
              />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-600">
              <MetricCard
                title={t('stats.metrics.totalUtilized')}
                value={systemMetrics.moneyUtilized.totalUtilized.value}
                formula={systemMetrics.moneyUtilized.totalUtilized.formula}
                explanation={systemMetrics.moneyUtilized.totalUtilized.explanation}
                onToggleFormula={() => toggleFormula('totalUtilized')}
                showFormula={showFormulas.totalUtilized}
                colorClass="text-white"
                isTotal={true}
              />
            </div>
          </div>

          {/* Verification Section */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              ✅ {t('stats.metrics.accountingVerification')}
              <span className="ml-2 text-sm text-gray-400">({t('stats.metrics.balanceCheck')})</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MetricCard
                title={t('stats.metrics.systemBalanced')}
                value={systemMetrics.verification.balanced.value === true ? t('stats.metrics.yes') : t('stats.metrics.no')}
                explanation={systemMetrics.verification.balanced.explanation}
                colorClass={systemMetrics.verification.balanced.value === true ? 'text-green-400' : 'text-red-400'}
                isStatus={true}
              />
              <MetricCard
                title={t('stats.metrics.surplusDeficit')}
                value={systemMetrics.verification.surplus.value}
                formula={systemMetrics.verification.surplus.formula}
                explanation={systemMetrics.verification.surplus.explanation}
                onToggleFormula={() => toggleFormula('surplus')}
                showFormula={showFormulas.surplus}
                colorClass={systemMetrics.verification.surplus.value === 0 ? 'text-green-400' :
                           systemMetrics.verification.surplus.value > 0 ? 'text-yellow-400' : 'text-red-400'}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Global Leaderboard Tab Content
  const globalLeaderboardContent = (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
        <h2 className="text-2xl font-semibold text-white">
          {t('stats.tabs.globalLeaderboard')} <span className="text-warning-orange text-lg">({t('stats.beta')})</span>
        </h2>
        <SiteButton
          onClick={() => fetchGlobalLeaderboard(0)}
          isSelected={false}
          disabled={leaderboardLoading}
          className="bg-info-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors w-full sm:w-auto"
        >
          {leaderboardLoading ? t('stats.leaderboard.calculating') : t('stats.leaderboard.calculateBtn')}
        </SiteButton>
      </div>

      {/* Beta Disclaimer */}
      <div className="bg-warning-orange/20 border border-warning-orange/50 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <span className="text-warning-orange text-xl mr-3">🏆</span>
          <div>
            <h4 className="text-warning-orange font-medium mb-2">{t('stats.leaderboard.betaNotice')}</h4>
            <p className="text-gray-300 text-sm">
              {t('stats.leaderboard.betaDisclaimer')}
            </p>
          </div>
        </div>
      </div>

      {leaderboardLoading && (
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner />
          <span className="ml-3 text-gray-300">{t('stats.leaderboard.computing')}</span>
        </div>
      )}

      {leaderboardError && (
        <ReportingNotice
          message={leaderboardError}
          loginRequired={leaderboardLoginRequired}
          errorLabel={t('stats.leaderboard.errorLabel')}
          t={t}
        />
      )}

      {!globalLeaderboard && !leaderboardLoading && !leaderboardError && (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">{t('stats.leaderboard.noData')}</p>
          <p className="text-gray-500 text-sm">{t('stats.leaderboard.noDataDesc')}</p>
        </div>
      )}

      {globalLeaderboard && globalLeaderboard.length > 0 && (
        <div>
          {leaderboardFreshnessLabel && (
            <p className="mb-3 rounded-lg border border-gray-700 bg-gray-900/70 px-4 py-3 text-sm text-gray-300">
              {t('stats.leaderboard.freshnessLabel', { time: leaderboardFreshnessLabel })}
            </p>
          )}

          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs uppercase tracking-[0.16em] text-gray-400">
              {t('stats.leaderboard.showingPage', { page: leaderboardPage + 1 })}{globalLeaderboard.length ? ` (${leaderboardStart + 1}-${leaderboardStart + globalLeaderboard.length})` : ''}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fetchGlobalLeaderboard(Math.max(0, leaderboardPage - 1))}
                disabled={!canPageLeaderboardBack}
                className={paginationButtonClass}
              >
                {t('stats.leaderboard.previous')}
              </button>
              <button
                type="button"
                onClick={() => fetchGlobalLeaderboard(leaderboardPage + 1)}
                disabled={!canPageLeaderboardForward}
                className={paginationButtonClass}
              >
                {t('stats.leaderboard.next')}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">{t('stats.leaderboard.rank')}</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">{t('stats.leaderboard.user')}</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">{t('stats.leaderboard.totalProfit')}</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">{t('stats.leaderboard.currentValue')}</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">{t('stats.leaderboard.totalSpent')}</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">{t('stats.leaderboard.activeMarkets')}</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">{t('stats.leaderboard.resolvedMarkets')}</th>
                </tr>
              </thead>
              <tbody>
                {globalLeaderboard.map((user) => {
                  const getRankDisplay = (rank) => {
                    if (rank === 1) return '🥇';
                    if (rank === 2) return '🥈';
                    if (rank === 3) return '🥉';
                    return `#${rank}`;
                  };

                  const getProfitColor = (profit) => {
                    if (profit > 0) return 'text-green-400';
                    if (profit < 0) return 'text-red-400';
                    return 'text-gray-300';
                  };

                  return (
                    <tr key={user.username} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                      <td className="py-3 px-4 text-white font-semibold">
                        {getRankDisplay(user.rank)}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          to={`/newprofile/${user.username}`}
                          className="text-blue-400 font-medium hover:text-blue-300 transition-colors"
                        >
                          {user.username}
                        </Link>
                      </td>
                      <td className={`py-3 px-4 font-semibold ${getProfitColor(user.totalProfit)}`}>
                        {user.totalProfit >= 0 ? '+' : ''}{user.totalProfit.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {user.totalCurrentValue.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {user.totalSpent.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-gray-300 text-center">
                        {user.activeMarkets}
                      </td>
                      <td className="py-3 px-4 text-gray-300 text-center">
                        {user.resolvedMarkets}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {globalLeaderboard && globalLeaderboard.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">{t('stats.leaderboard.noResults')}</p>
        </div>
      )}
    </div>
  );

  const tabs = [
    {
      label: t('stats.tabs.globalLeaderboardBeta'),
      content: globalLeaderboardContent
    },
    {
      label: t('stats.tabs.systemMetricsBeta'),
      content: systemMetricsContent
    },
    {
      label: t('stats.tabs.setupConfig'),
      content: setupConfigContent
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">{t('stats.pageTitle')}</h1>
        <p className="text-gray-300 text-lg">
          {t('stats.pageDescription')}
        </p>
      </div>

      <SiteTabs tabs={tabs} defaultTab={t('stats.tabs.globalLeaderboardBeta')} />
    </div>
  );
};

export default Stats;
