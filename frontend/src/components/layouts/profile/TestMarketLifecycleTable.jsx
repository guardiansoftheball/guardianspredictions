import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import MarketTagChips from '../../markets/MarketTagChips';
import { groupLifecycleMarketRows } from './MarketLifecycleTable';

const CELESTE = '#9CC9F1';

const formatDate = (value) => {
  if (!value) return 'n/a';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'n/a';
  return date.toLocaleString();
};

const statusLabel = (market) => market.lifecycleStatus || market.status || 'unknown';

const marketLabel = (value, fallback) => String(value || '').trim() || fallback;

const statusBadgeClass = (status) => {
  if (status === 'published') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  if (status === 'proposed') return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
  if (status === 'rejected') return 'border-rose-500/30 bg-rose-500/10 text-rose-300';
  return 'border-white/10 bg-white/5 text-gray-300';
};

const MarketLabels = ({ market }) => (
  <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
      <div className="font-mono uppercase tracking-widest text-emerald-400">YES label</div>
      <div className="mt-1 break-words font-semibold text-emerald-100">{marketLabel(market.yesLabel, 'YES')}</div>
    </div>
    <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2">
      <div className="font-mono uppercase tracking-widest text-rose-400">NO label</div>
      <div className="mt-1 break-words font-semibold text-rose-100">{marketLabel(market.noLabel, 'NO')}</div>
    </div>
  </div>
);

const MarketGroupChildren = ({ market }) => {
  const children = Array.isArray(market.childMarkets) ? market.childMarkets : [];
  if (!market.isMarketGroup) return null;
  return (
    <div className="mt-3 rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
      <div className="font-mono uppercase tracking-widest text-sky-300">
        Grouped market · {children.length || market.marketGroup?.answerCount || 0} answers
      </div>
      {children.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {children.map((child) => (
            <span key={child.id} className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1">
              {child.marketGroup?.answerLabel || child.questionTitle || `Market #${child.id}`} · #{child.id}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const StewardshipAuditTrail = ({ audits = [] }) => {
  if (!audits.length) return null;
  return (
    <div className="mt-2 space-y-2">
      {audits.map((audit, index) => (
        <div key={audit.id || `${audit.createdAt || 'audit'}-${index}`} className="rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-xs">
          <div>
            Steward reassigned from {audit.fromStewardUsername || 'n/a'} to {audit.toStewardUsername || 'n/a'}
            {audit.actorUsername ? ` by ${audit.actorUsername}` : ''}
            {audit.createdAt ? ` at ${formatDate(audit.createdAt)}` : ''}
          </div>
          {audit.reason && <div className="mt-1" style={{ color: CELESTE }}>Reason: {audit.reason}</div>}
        </div>
      ))}
    </div>
  );
};

const TestMarketLifecycleTable = ({ markets = [], emptyMessage, showCreator = false, showSteward = false, actions }) => {
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const displayMarkets = useMemo(() => groupLifecycleMarketRows(markets), [markets]);

  const toggleDescription = (marketId) => {
    setExpandedDescriptions((current) => ({ ...current, [marketId]: !current[marketId] }));
  };

  if (!displayMarkets.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-gray-400">
        {emptyMessage || 'No markets found.'}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
      <table className="min-w-full divide-y divide-white/8 text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Market</th>
            {showCreator && <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Creator</th>}
            {showSteward && <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Steward</th>}
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Created</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Review Trail</th>
            {actions && <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {displayMarkets.map((market) => {
            const rk = market.rowKey || market.id;
            const firstChildId = market.childMarkets?.[0]?.id;
            const viewMarketId = market.isMarketGroup ? firstChildId : market.id;
            const status = statusLabel(market);

            return (
              <tr key={rk} className="align-top hover:bg-white/3 transition-colors">
                {/* Market */}
                <td className="px-4 py-4">
                  <div className="font-semibold text-white">{market.questionTitle}</div>
                  <div className="mt-1 font-mono text-xs text-gray-500">
                    {market.isMarketGroup ? `Group ID: ${market.marketGroup?.id || market.id}` : `ID: ${market.id}`}
                  </div>
                  {market.description && (
                    <div className="mt-2 max-w-xl text-xs text-gray-300">
                      <div className={expandedDescriptions[rk] ? 'whitespace-pre-wrap break-words' : 'line-clamp-2 break-words'}>
                        {market.description}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleDescription(rk)}
                        className="mt-1 text-xs font-medium transition hover:underline"
                        style={{ color: CELESTE }}
                      >
                        {expandedDescriptions[rk] ? 'Show less' : 'Show full description'}
                      </button>
                    </div>
                  )}
                  <MarketTagChips tags={market.tags || []} className="mt-3" />
                  <MarketGroupChildren market={market} />
                  {!market.isMarketGroup && <MarketLabels market={market} />}
                  {status === 'published' && viewMarketId && (
                    <Link
                      to={`/markets/${viewMarketId}`}
                      className="mt-2 inline-block text-xs font-medium transition hover:underline"
                      style={{ color: CELESTE }}
                    >
                      {market.isMarketGroup ? 'View grouped market' : 'View market'}
                    </Link>
                  )}
                </td>

                {/* Creator */}
                {showCreator && (
                  <td className="px-4 py-4">
                    <span className="font-mono text-sm text-gray-300">{market.creatorUsername || 'n/a'}</span>
                  </td>
                )}

                {/* Steward */}
                {showSteward && (
                  <td className="px-4 py-4">
                    <span className="font-mono text-sm text-gray-300">{market.stewardUsername || market.creatorUsername || 'n/a'}</span>
                  </td>
                )}

                {/* Status */}
                <td className="px-4 py-4">
                  <span className={`rounded-full border px-2.5 py-1 font-mono text-xs font-semibold ${statusBadgeClass(status)}`}>
                    {status}
                  </span>
                </td>

                {/* Created */}
                <td className="px-4 py-4 text-xs text-gray-400">{formatDate(market.createdAt)}</td>

                {/* Review Trail */}
                <td className="px-4 py-4 text-xs text-gray-400">
                  {market.proposalCost > 0 && <div>Proposal cost: {market.proposalCost} credits</div>}
                  {market.approvedBy && (
                    <div style={{ color: CELESTE }}>
                      Approved by {market.approvedBy} at {formatDate(market.approvedAt)}
                    </div>
                  )}
                  {market.rejectedBy && (
                    <div className="text-rose-300">
                      Rejected by {market.rejectedBy} at {formatDate(market.rejectedAt)}
                    </div>
                  )}
                  {market.rejectionReason && (
                    <div className="mt-1 text-rose-300">Reason: {market.rejectionReason}</div>
                  )}
                  <StewardshipAuditTrail audits={market.stewardshipAudits || []} />
                  {!market.approvedBy && !market.rejectedBy && !(market.stewardshipAudits || []).length && (
                    <span className="text-gray-500">Awaiting admin review</span>
                  )}
                </td>

                {/* Actions */}
                {actions && <td className="px-4 py-4">{actions(market)}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TestMarketLifecycleTable;
