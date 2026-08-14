import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../helpers/AuthContent';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import SiteTabs from '../../components/tabs/SiteTabs';
import LoadingSpinner from '../../components/loaders/LoadingSpinner';
import MarketLifecycleTable from '../../components/layouts/profile/TestMarketLifecycleTable';
import MarkdownLite from '../../components/markdown/MarkdownLite';
import { Button } from '../../components/ui/Button';
import MarketTagChips, { MARKET_TAG_COLOR_OPTIONS } from '../../components/markets/MarketTagChips';
import { listAdminLifecycleMarkets } from '../../api/lifecycleMarketsApi';
import {
  approveProposedMarket,
  approveProposedMarketGroup,
  rejectProposedMarket,
  rejectProposedMarketGroup,
  reassignMarketSteward,
  reassignMarketGroupSteward,
  reviewMarketGroupAnswerAddition,
  listAdminMarketGroupAnswerAdditions,
  updateMarketGroupTags,
  updateMarketTags,
} from '../../api/moderationApi';
import { listAdminUsers } from '../../api/adminUsersApi';
import {
  createAdminMarketTag,
  listAdminMarketTags,
  updateAdminMarketTag,
} from '../../api/marketTagsApi';
import {
  getMarketGovernanceSettings,
  listAdminMarketDescriptionAmendments,
  reviewGroupedMarketDescriptionAmendments,
  reviewMarketDescriptionAmendment,
  updateMarketGovernanceSettings,
} from '../../api/marketDescriptionAmendmentsApi';
import {
  emptyPendingAdminReviewCounts,
  getPendingAdminReviewCounts,
} from '../../api/adminReviewCountsApi';

// ─── constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;
const RETRY_DELAY_MS = 1200;

const TAB_KEYS = {
  pendingReview: 'pendingReview',
  published: 'published',
  rejected: 'rejected',
  stewardship: 'stewardship',
  descriptionAmendments: 'descriptionAmendments',
  answerAdditions: 'answerAdditions',
  tags: 'tags',
  pendingAmendments: 'pendingAmendments',
  approvedAmendments: 'approvedAmendments',
  rejectedAmendments: 'rejectedAmendments',
  pendingAnswers: 'pendingAnswers',
  approvedAnswers: 'approvedAnswers',
  rejectedAnswers: 'rejectedAnswers',
};

const reviewTabDefs = [
  { key: TAB_KEYS.pendingReview, status: 'proposed' },
  { key: TAB_KEYS.published, status: 'published' },
  { key: TAB_KEYS.rejected, status: 'rejected' },
];

const amendmentTabDefs = [
  { key: TAB_KEYS.pendingAmendments, status: 'pending' },
  { key: TAB_KEYS.approvedAmendments, status: 'approved' },
  { key: TAB_KEYS.rejectedAmendments, status: 'rejected' },
];

const answerAdditionTabDefs = [
  { key: TAB_KEYS.pendingAnswers, status: 'pending' },
  { key: TAB_KEYS.approvedAnswers, status: 'approved' },
  { key: TAB_KEYS.rejectedAnswers, status: 'rejected' },
];

const policyOptionKeys = [
  { value: 'auto', titleKey: 'governance.policyAutoTitle', descKey: 'governance.policyAutoDesc' },
  { value: 'moderator', titleKey: 'governance.policyModeratorTitle', descKey: 'governance.policyModeratorDesc' },
  { value: 'admin', titleKey: 'governance.policyAdminTitle', descKey: 'governance.policyAdminDesc' },
];

const maxMarketTagsPerMarket = 5;

// ─── helpers ──────────────────────────────────────────────────────────────────

const wait = (ms) => new Promise((resolve) => { window.setTimeout(resolve, ms); });
const isRateLimitError = (err) => err?.status === 429 || err?.reason === 'RATE_LIMITED';

const withRetry = async (request, retries = 1) => {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await request();
    } catch (err) {
      if (!isRateLimitError(err) || attempt === retries) throw err;
      await wait(RETRY_DELAY_MS);
    }
  }
  return null;
};

const formatBadge = (count) => {
  const n = Number(count || 0);
  if (n <= 0) return '';
  return n > 99 ? '99+' : String(n);
};

const rowKey = (market) => (
  market?.rowKey || (market?.isMarketGroup ? `group:${market.marketGroup.id}` : `market:${market.id}`)
);

const tagSlugs = (market) => (market.tags || []).map((t) => t.slug).filter(Boolean).sort();
const sameSlugs = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

const tagTargetIds = (market) => {
  if (market?.isMarketGroup) return Array.from(new Set((market.childMarkets || []).map((c) => c.id).filter(Boolean)));
  return market?.id ? [market.id] : [];
};

const normalizePolicy = (value, legacyAuto = false) => {
  const v = String(value || '').trim().toLowerCase();
  if (v === 'auto' || v === 'admin' || v === 'moderator') return v;
  return legacyAuto ? 'auto' : 'moderator';
};

const amendKey = (a) => (
  a?.rowKey || (a?.isMarketGroupAmendment
    ? `group:${a.marketGroup.id}:${a.body}:${a.createdBy}:${a.submitReason || ''}:${a.status}`
    : `amendment:${a.id}`)
);

const isActiveMod = (u) => u?.usertype === 'MODERATOR' && (u.moderatorStatus || 'active') === 'active';

// ─── shared UI components ─────────────────────────────────────────────────────

const GlassCard = ({ children, className = '' }) => (
  <div className={`rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 ${className}`}>
    {children}
  </div>
);

const ErrorBanner = ({ msg }) => msg ? (
  <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{msg}</div>
) : null;

const SuccessBanner = ({ msg }) => msg ? (
  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{msg}</div>
) : null;

const InfoBanner = ({ children }) => (
  <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-200">{children}</div>
);

const SearchInput = ({ id, label, value, onChange, placeholder, loading }) => (
  <GlassCard>
    <label htmlFor={id} className="block text-xs font-mono uppercase tracking-widest text-gray-400 mb-2">{label}</label>
    <div className="relative">
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 pr-10 text-sm text-white placeholder-gray-500 focus:border-[#9CC9F1]/50 focus:outline-none focus:ring-1 focus:ring-[#9CC9F1]/30"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-b-2 border-[#9CC9F1]" />
      )}
    </div>
  </GlassCard>
);

const PaginationBar = ({ page, visibleCount, total, hasPrev, hasNext, onPrev, onNext, loading }) => {
  const { t } = useTranslation();
  const start = total > 0 ? page * PAGE_SIZE + 1 : 0;
  const end = total > 0 ? page * PAGE_SIZE + visibleCount : 0;
  return (
    <GlassCard className="flex items-center justify-between !py-3">
      <span className="text-xs text-gray-400">
        {total > 0 ? t('adminReview.common.showing', { start, end, total }) : t('adminReview.common.zeroResults')}
      </span>
      <div className="flex gap-2">
        <Button variant="dark" disabled={loading || !hasPrev} onClick={onPrev}>{t('adminReview.common.previous')}</Button>
        <Button variant="dark" disabled={loading || !hasNext} onClick={onNext}>{t('adminReview.common.next')}</Button>
      </div>
    </GlassCard>
  );
};

// ─── GovernanceAutoApprovalSetting ────────────────────────────────────────────

const GovernanceAutoApprovalSetting = ({ settingKey, title, description, savedMessage }) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [settings, setSettings] = useState({ autoApproveDescriptionAmendments: false, autoApproveMarketProposals: false, autoApproveMarketGroupAnswers: false, marketGroupAnswerAdditionApprovalPolicy: 'moderator', version: 0 });
  const [draft, setDraft] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getMarketGovernanceSettings({ token });
        if (!ignore) { setSettings({ ...data, marketGroupAnswerAdditionApprovalPolicy: normalizePolicy(data.marketGroupAnswerAdditionApprovalPolicy, data.autoApproveMarketGroupAnswers) }); setDraft(Boolean(data[settingKey])); }
      } catch (err) { if (!ignore) setError(err.message || 'Unable to load settings.'); }
      finally { if (!ignore) setLoading(false); }
    })();
    return () => { ignore = true; };
  }, [token, settingKey]);

  const save = async () => {
    setSaving(true); setError(''); setMessage('');
    try {
      const saved = await updateMarketGovernanceSettings({ token, autoApproveDescriptionAmendments: Boolean(settings.autoApproveDescriptionAmendments), autoApproveMarketProposals: Boolean(settings.autoApproveMarketProposals), autoApproveMarketGroupAnswers: Boolean(settings.autoApproveMarketGroupAnswers), marketGroupAnswerAdditionApprovalPolicy: normalizePolicy(settings.marketGroupAnswerAdditionApprovalPolicy, settings.autoApproveMarketGroupAnswers), version: settings.version, [settingKey]: draft });
      setSettings({ ...saved, marketGroupAnswerAdditionApprovalPolicy: normalizePolicy(saved.marketGroupAnswerAdditionApprovalPolicy, saved.autoApproveMarketGroupAnswers) });
      setDraft(Boolean(saved[settingKey]));
      setMessage(savedMessage);
    } catch (err) { setError(err.message || 'Unable to save settings.'); }
    finally { setSaving(false); }
  };

  const changed = draft !== Boolean(settings[settingKey]);

  return (
    <GlassCard className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <label className="flex cursor-pointer items-start gap-3 text-sm text-gray-200">
          <input type="checkbox" checked={draft} disabled={loading || saving} onChange={(e) => setDraft(e.target.checked)} className="mt-1 h-5 w-5 rounded border-white/20 bg-white/5 text-[#9CC9F1] focus:ring-[#9CC9F1]" />
          <span>
            <span className="block font-semibold text-white">{title}</span>
            <span className="mt-1 block text-gray-400">{description}</span>
          </span>
        </label>
        <Button variant="celeste" disabled={loading || saving || !changed} onClick={save}>
          {saving ? t('adminReview.common.saving') : t('adminReview.common.saveSetting')}
        </Button>
      </div>
      <span className="text-xs text-gray-500">{t('adminReview.common.version', { version: settings.version || 1 })}</span>
      <ErrorBanner msg={error} />
      <SuccessBanner msg={message} />
    </GlassCard>
  );
};

// ─── AnswerAdditionApprovalPolicySetting ──────────────────────────────────────

const AnswerAdditionApprovalPolicySetting = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [settings, setSettings] = useState({ autoApproveDescriptionAmendments: false, autoApproveMarketProposals: false, autoApproveMarketGroupAnswers: false, marketGroupAnswerAdditionApprovalPolicy: 'moderator', version: 0 });
  const [draft, setDraft] = useState('moderator');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return undefined;
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getMarketGovernanceSettings({ token });
        if (!ignore) { const p = normalizePolicy(data.marketGroupAnswerAdditionApprovalPolicy, data.autoApproveMarketGroupAnswers); setSettings({ ...data, marketGroupAnswerAdditionApprovalPolicy: p }); setDraft(p); }
      } catch (err) { if (!ignore) setError(err.message || 'Unable to load settings.'); }
      finally { if (!ignore) setLoading(false); }
    })();
    return () => { ignore = true; };
  }, [token]);

  const save = async () => {
    setSaving(true); setError(''); setMessage('');
    try {
      const saved = await updateMarketGovernanceSettings({ token, autoApproveDescriptionAmendments: Boolean(settings.autoApproveDescriptionAmendments), autoApproveMarketProposals: Boolean(settings.autoApproveMarketProposals), autoApproveMarketGroupAnswers: draft === 'auto', marketGroupAnswerAdditionApprovalPolicy: draft, version: settings.version });
      const p = normalizePolicy(saved.marketGroupAnswerAdditionApprovalPolicy, saved.autoApproveMarketGroupAnswers);
      setSettings({ ...saved, marketGroupAnswerAdditionApprovalPolicy: p });
      setDraft(p);
      setMessage(t('adminReview.governance.answerOptionPolicySaved'));
    } catch (err) { setError(err.message || 'Unable to save policy.'); }
    finally { setSaving(false); }
  };

  const changed = draft !== normalizePolicy(settings.marketGroupAnswerAdditionApprovalPolicy, settings.autoApproveMarketGroupAnswers);

  return (
    <GlassCard className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-white">{t('adminReview.governance.answerOptionApprovalPolicy')}</h3>
        <p className="mt-1 text-sm text-gray-400">{t('adminReview.governance.answerOptionApprovalPolicyDesc')}</p>
      </div>
      <div className="grid gap-2">
        {policyOptionKeys.map((opt) => (
          <label key={opt.value} className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition ${draft === opt.value ? 'border-sky-500/60 bg-sky-500/10 text-white' : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20'}`}>
            <input type="radio" name="answerPolicy" value={opt.value} checked={draft === opt.value} disabled={loading || saving} onChange={(e) => setDraft(e.target.value)} className="mt-1 h-4 w-4" />
            <span><span className="block font-semibold">{t(`adminReview.${opt.titleKey}`)}</span><span className="mt-1 block text-xs text-gray-400">{t(`adminReview.${opt.descKey}`)}</span></span>
          </label>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{t('adminReview.common.version', { version: settings.version || 1 })}</span>
        <Button variant="celeste" disabled={loading || saving || !changed} onClick={save}>
          {saving ? t('adminReview.common.saving') : t('adminReview.common.savePolicy')}
        </Button>
      </div>
      <ErrorBanner msg={error} />
      <SuccessBanner msg={message} />
    </GlassCard>
  );
};

// ─── AdminMarketQueue ─────────────────────────────────────────────────────────

const AdminMarketQueue = ({ status }) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [markets, setMarkets] = useState([]);
  const [activeTags, setActiveTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [tagForms, setTagForms] = useState({});
  const [busyKey, setBusyKey] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const tagEditingEnabled = status === 'proposed' || status === 'published';

  const load = async ({ query = searchQuery, pageNumber = page } = {}) => {
    setLoading(true); setError('');
    try {
      const data = await withRetry(() => listAdminLifecycleMarkets({ token, status, query, limit: PAGE_SIZE, offset: pageNumber * PAGE_SIZE }));
      setMarkets(data.markets || []);
      setTotal(Number(data.total || 0));
    } catch (err) { setError(err.message || 'Unable to load markets.'); setMarkets([]); setTotal(0); }
    finally { setLoading(false); }
  };

  useEffect(() => { setPage(0); }, [status, searchQuery]);
  useEffect(() => {
    const t = window.setTimeout(() => load({ query: searchQuery, pageNumber: page }), 300);
    return () => window.clearTimeout(t);
  }, [status, token, searchQuery, page]);

  useEffect(() => {
    if (!token || !tagEditingEnabled) return;
    let ignore = false;
    withRetry(() => listAdminMarketTags({ token, includeInactive: false }))
      .then((r) => { if (!ignore) setActiveTags(r.tags || []); })
      .catch(() => {});
    return () => { ignore = true; };
  }, [token, tagEditingEnabled]);

  const approveMarket = async (market) => {
    const k = rowKey(market); setBusyKey(k); setError(''); setSuccess('');
    try {
      if (market?.isMarketGroup) await approveProposedMarketGroup({ groupId: market.marketGroup.id, token });
      else await approveProposedMarket({ marketId: market.id, token });
      await load({ query: searchQuery, pageNumber: page });
    } catch (err) { setError(err.message || 'Unable to approve market.'); }
    finally { setBusyKey(null); }
  };

  const rejectMarket = async (market) => {
    const k = rowKey(market); const reason = rejectionReasons[k];
    setBusyKey(k); setError(''); setSuccess('');
    try {
      if (market?.isMarketGroup) await rejectProposedMarketGroup({ groupId: market.marketGroup.id, token, reason });
      else await rejectProposedMarket({ marketId: market.id, token, reason });
      setRejectionReasons((c) => ({ ...c, [k]: '' }));
      await load({ query: searchQuery, pageNumber: page });
    } catch (err) { setError(err.message || 'Unable to reject market.'); }
    finally { setBusyKey(null); }
  };

  const saveMarketTags = async (market) => {
    const k = rowKey(market); const slugs = tagForms[k] || tagSlugs(market);
    setBusyKey(k); setError(''); setSuccess('');
    try {
      if (market.isMarketGroup) {
        const groupId = market.marketGroup?.id || market.id;
        const updated = await updateMarketGroupTags({ groupId, token, tagSlugs: slugs });
        setMarkets((c) => c.map((r) => rowKey(r) === k ? { ...r, ...updated } : r));
      } else {
        const updated = await updateMarketTags({ marketId: market.id, token, tagSlugs: slugs });
        setMarkets((c) => c.map((m) => m.id === updated.id ? { ...m, ...updated } : m));
      }
      setTagForms((c) => { const n = { ...c }; delete n[k]; return n; });
      setSuccess(market.isMarketGroup ? t('adminReview.marketQueue.updatedTagsGroup', { id: market.marketGroup?.id || market.id }) : t('adminReview.marketQueue.updatedTagsMarket', { id: market.id }));
    } catch (err) { setError(err.message || 'Unable to update tags.'); }
    finally { setBusyKey(null); }
  };

  const toggleTag = (market, slug) => {
    const k = rowKey(market);
    setTagForms((c) => {
      const selected = c[k] || tagSlugs(market);
      const next = selected.includes(slug) ? selected.filter((s) => s !== slug) : [...selected, slug].sort();
      return { ...c, [k]: next };
    });
  };

  const renderTagEditor = (market) => {
    if (!tagEditingEnabled) return null;
    const activeBySlug = new Map(activeTags.map((t) => [t.slug, t]));
    const choices = [...activeTags, ...(market.tags || []).filter((t) => t.slug && !activeBySlug.has(t.slug))];
    const k = rowKey(market);
    const selected = tagForms[k] || tagSlugs(market);
    const original = tagSlugs(market);
    const changed = !sameSlugs(selected, original);
    const atLimit = selected.length >= maxMarketTagsPerMarket;
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
        <div className="text-xs font-mono uppercase tracking-widest text-gray-400">{t('adminReview.marketQueue.tagAdjustment')}</div>
        <p className="text-xs text-gray-500">{market.isMarketGroup ? t('adminReview.marketQueue.tagGroupedDesc') : t('adminReview.marketQueue.tagSingleDesc')}</p>
        {choices.length ? (
          <div className="flex flex-wrap gap-2">
            {choices.map((tag) => {
              const sel = selected.includes(tag.slug);
              const disabled = !sel && (atLimit || !tag.isActive);
              return (
                <button key={tag.slug} type="button" disabled={disabled || busyKey === k} onClick={() => toggleTag(market, tag.slug)} className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50 ${sel ? 'border-[#9CC9F1] bg-[#9CC9F1]/20 text-white' : 'border-white/20 bg-white/5 text-gray-300 hover:border-white/40'}`}>
                  {sel ? '✓ ' : ''}{tag.displayName || tag.slug}{!tag.isActive ? ` ${t('adminReview.marketQueue.inactive')}` : ''}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-amber-300">{t('adminReview.marketQueue.createTagsFirst')}</p>
        )}
        <Button variant="celeste" disabled={busyKey === k || !changed} onClick={() => saveMarketTags(market)}>{t('adminReview.marketQueue.saveTags')}</Button>
      </div>
    );
  };

  const renderActions = (market) => {
    if (!tagEditingEnabled) return null;
    const k = rowKey(market);
    return (
      <div className="flex flex-col gap-3 min-w-[220px]">
        {renderTagEditor(market)}
        {status === 'proposed' && (
          <>
            <Button variant="success" disabled={busyKey === k} onClick={() => approveMarket(market)}>
              {market.isMarketGroup ? t('adminReview.common.approveGroup') : t('adminReview.common.approve')}
            </Button>
            <textarea value={rejectionReasons[k] || ''} onChange={(e) => setRejectionReasons((c) => ({ ...c, [k]: e.target.value }))} rows={3} placeholder={t('adminReview.common.reasonForRejection')} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#9CC9F1]/50 focus:outline-none resize-none" />
            <Button variant="danger" disabled={busyKey === k || !(rejectionReasons[k] || '').trim()} onClick={() => rejectMarket(market)}>
              {market.isMarketGroup ? t('adminReview.common.rejectGroupAndRefund') : t('adminReview.common.rejectAndRefund')}
            </Button>
          </>
        )}
      </div>
    );
  };

  if (loading && !markets.length) return <LoadingSpinner />;

  return (
    <div className="flex flex-col gap-4">
      {status === 'proposed' && (
        <GovernanceAutoApprovalSetting settingKey="autoApproveMarketProposals" title={t('adminReview.governance.autoApproveProposals')} description={t('adminReview.governance.autoApproveProposalsDesc')} savedMessage={t('adminReview.governance.proposalAutoApprovalSaved')} />
      )}
      <ErrorBanner msg={error} />
      <SuccessBanner msg={success} />
      <SearchInput id={`mq-search-${status}`} label={t('adminReview.common.searchMarkets')} value={searchQuery} onChange={setSearchQuery} placeholder={t('adminReview.marketQueue.searchPlaceholder', { status })} loading={loading} />
      <PaginationBar page={page} visibleCount={markets.length} total={total} hasPrev={page > 0} hasNext={(page + 1) * PAGE_SIZE < total} onPrev={() => setPage((p) => Math.max(0, p - 1))} onNext={() => setPage((p) => p + 1)} loading={loading} />
      <MarketLifecycleTable markets={markets} emptyMessage={t('adminReview.marketQueue.noMarketsFound', { status })} showCreator showSteward actions={tagEditingEnabled ? renderActions : null} />
    </div>
  );
};

// ─── DescriptionAmendmentStatusQueue ─────────────────────────────────────────

const DescriptionAmendmentStatusQueue = ({ status }) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [amendments, setAmendments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyKey, setBusyKey] = useState(null);
  const [reasonById, setReasonById] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const canReview = status === 'pending';

  const load = async ({ query = searchQuery, pageNumber = page } = {}) => {
    setLoading(true); setError('');
    try {
      const data = await withRetry(() => listAdminMarketDescriptionAmendments({ token, status, query, limit: PAGE_SIZE, offset: pageNumber * PAGE_SIZE }));
      setAmendments(data.amendments || []); setTotal(Number(data.total || 0));
    } catch (err) { setError(err.message || 'Unable to load amendments.'); setAmendments([]); setTotal(0); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (!token) return; const t = window.setTimeout(() => load({ query: searchQuery, pageNumber: page }), 300); return () => window.clearTimeout(t); }, [token, status, searchQuery, page]);
  useEffect(() => { setPage(0); }, [status, searchQuery]);

  const review = async (amendment, nextStatus) => {
    const k = amendKey(amendment); const reason = String(reasonById[k] || '').trim();
    const children = amendment.isMarketGroupAmendment ? amendment.childAmendments || [] : [amendment];
    setBusyKey(k); setError(''); setSuccess('');
    try {
      if (amendment.isMarketGroupAmendment) await reviewGroupedMarketDescriptionAmendments({ token, amendmentIds: children.map((c) => c.id), status: nextStatus, reason });
      else await reviewMarketDescriptionAmendment({ token, amendmentId: amendment.id, status: nextStatus, reason });
      setReasonById((c) => ({ ...c, [k]: '' }));
      setSuccess(t('adminReview.amendments.statusResult', { type: amendment.isMarketGroupAmendment ? t('adminReview.amendments.groupedAmendment') : `Amendment v${amendment.version}`, status: nextStatus }));
      await load({ query: searchQuery, pageNumber: page });
    } catch (err) { setError(err.message || 'Unable to review amendment.'); }
    finally { setBusyKey(null); }
  };

  if (loading && !amendments.length) return <LoadingSpinner />;

  return (
    <div className="flex flex-col gap-4">
      <ErrorBanner msg={error} />
      <SuccessBanner msg={success} />
      <SearchInput id={`amend-search-${status}`} label={t('adminReview.amendments.searchLabel')} value={searchQuery} onChange={setSearchQuery} placeholder={t('adminReview.amendments.searchPlaceholder')} loading={loading} />
      <PaginationBar page={page} visibleCount={amendments.length} total={total} hasPrev={page > 0} hasNext={(page + 1) * PAGE_SIZE < total} onPrev={() => setPage((p) => Math.max(0, p - 1))} onNext={() => setPage((p) => p + 1)} loading={loading} />
      {total === 0 && <GlassCard className="text-center text-gray-400">{t('adminReview.amendments.noAmendmentsFound', { status })}</GlassCard>}
      {amendments.map((amendment) => {
        const k = amendKey(amendment);
        const children = amendment.isMarketGroupAmendment ? amendment.childAmendments || [] : [amendment];
        const reason = reasonById[k] || '';
        const title = amendment.marketTitle || `Market #${amendment.marketId}`;
        const previousAmendments = Array.isArray(amendment.previousApprovedAmendments) ? amendment.previousApprovedAmendments : [];
        const primaryId = children[0]?.marketId || amendment.marketId;
        return (
          <GlassCard key={k} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-300">
              <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-xs font-semibold text-sky-200">{amendment.isMarketGroupAmendment ? t('adminReview.amendments.groupLabel', { id: amendment.marketGroup.id }) : t('adminReview.amendments.marketLabel', { id: amendment.marketId })}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-gray-200">{amendment.isMarketGroupAmendment ? t('adminReview.amendments.groupedAmendment') : t('adminReview.amendments.amendmentVersion', { version: amendment.version })}</span>
              <span>{t('adminReview.amendments.submittedBy', { user: amendment.createdBy })}</span>
              {amendment.createdAt && <span>{new Date(amendment.createdAt).toLocaleString()}</span>}
            </div>
            <a href={`/markets/${primaryId}`} className="text-lg font-semibold text-white underline decoration-sky-500/40 underline-offset-4 hover:text-sky-200 transition">{title}</a>
            {amendment.isMarketGroupAmendment && (
              <div className="flex flex-wrap gap-2">
                {children.map((c) => <span key={c.id} className="rounded-full border border-sky-800/50 bg-sky-900/30 px-2.5 py-1 text-xs text-sky-100">{c.marketGroup?.answerLabel || `Market #${c.marketId}`} · Amendment {c.version}</span>)}
              </div>
            )}
            {amendment.submitReason && <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-gray-300"><span className="font-semibold text-white">{t('adminReview.common.submitReason')}</span> {amendment.submitReason}</div>}
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{t('adminReview.amendments.description')}</p>
              <p className="whitespace-pre-wrap text-sm leading-6 text-gray-200">{amendment.marketDescription || t('adminReview.amendments.noDescription')}</p>
              {previousAmendments.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  {previousAmendments.map((prev) => (
                    <div key={prev.id || prev.version} className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-2"><span>{t('adminReview.amendments.amendmentVersion', { version: prev.version })}</span><span>{t('adminReview.amendments.approvedBy', { user: prev.approvedBy || 'admin' })}</span>{prev.approvedAt && <span>{new Date(prev.approvedAt).toLocaleString()}</span>}</div>
                      <MarkdownLite>{prev.body}</MarkdownLite>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-lg border border-sky-500/20 bg-sky-500/10 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-sky-300">{t('adminReview.amendments.proposedAmendment', { version: amendment.version })}</p>
              <MarkdownLite>{amendment.body}</MarkdownLite>
            </div>
            {status === 'rejected' && amendment.rejectionReason && <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">{t('adminReview.common.rejectionReason', { reason: amendment.rejectionReason })}</div>}
            {canReview && (
              <div className="grid gap-3 md:grid-cols-[1fr,auto,auto] md:items-start">
                <textarea value={reason} onChange={(e) => setReasonById((c) => ({ ...c, [k]: e.target.value }))} rows={3} placeholder={t('adminReview.common.decisionReasonRequired')} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#9CC9F1]/50 focus:outline-none resize-none" />
                <Button variant="success" disabled={busyKey === k || !reason.trim()} onClick={() => review(amendment, 'approved')}>{amendment.isMarketGroupAmendment ? t('adminReview.common.approveGroup') : t('adminReview.common.approve')}</Button>
                <Button variant="danger" disabled={busyKey === k || !reason.trim()} onClick={() => review(amendment, 'rejected')}>{amendment.isMarketGroupAmendment ? t('adminReview.common.rejectGroup') : t('adminReview.common.reject')}</Button>
              </div>
            )}
          </GlassCard>
        );
      })}
    </div>
  );
};

const DescriptionAmendmentQueue = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4">
      <InfoBanner>{t('adminReview.amendments.infoBanner')}</InfoBanner>
      <GovernanceAutoApprovalSetting settingKey="autoApproveDescriptionAmendments" title={t('adminReview.governance.autoApproveAmendments')} description={t('adminReview.governance.autoApproveAmendmentsDesc')} savedMessage={t('adminReview.governance.amendmentAutoApprovalSaved')} />
      <SiteTabs variant="dark" tabs={amendmentTabDefs.map((td) => ({ label: t(`adminReview.tabs.${td.key}`), content: <DescriptionAmendmentStatusQueue status={td.status} /> }))} defaultTab={t('adminReview.tabs.pendingAmendments')} />
    </div>
  );
};

// ─── MarketGroupAnswerAdditionStatusQueue ─────────────────────────────────────

const MarketGroupAnswerAdditionStatusQueue = ({ status }) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [additions, setAdditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [reasonById, setReasonById] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const canReview = status === 'pending';

  const load = async ({ query = searchQuery, pageNumber = page } = {}) => {
    setLoading(true); setError('');
    try {
      const data = await withRetry(() => listAdminMarketGroupAnswerAdditions({ token, status, query, limit: PAGE_SIZE, offset: pageNumber * PAGE_SIZE }));
      setAdditions(data.additions || []); setTotal(Number(data.total || 0));
    } catch (err) { setError(err.message || 'Unable to load answer additions.'); setAdditions([]); setTotal(0); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (!token) return; const t = window.setTimeout(() => load({ query: searchQuery, pageNumber: page }), 300); return () => window.clearTimeout(t); }, [token, status, searchQuery, page]);
  useEffect(() => { setPage(0); }, [status, searchQuery]);

  const review = async (addition, nextStatus) => {
    const reason = String(reasonById[addition.id] || '').trim();
    if (nextStatus === 'rejected' && !reason) { setError(t('adminReview.common.rejectionReasonRequired')); return; }
    setBusyId(addition.id); setError(''); setSuccess('');
    try {
      await reviewMarketGroupAnswerAddition({ token, additionId: addition.id, status: nextStatus, reason, confirm: nextStatus === 'approved' });
      setReasonById((c) => ({ ...c, [addition.id]: '' }));
      setSuccess(t('adminReview.answerAdditions.answerOptionStatus', { label: addition.answerLabel, status: nextStatus }));
      await load({ query: searchQuery, pageNumber: page });
    } catch (err) { setError(err.message || 'Unable to review addition.'); }
    finally { setBusyId(null); }
  };

  if (loading && !additions.length) return <LoadingSpinner />;

  return (
    <div className="flex flex-col gap-4">
      <ErrorBanner msg={error} />
      <SuccessBanner msg={success} />
      <SearchInput id={`aa-search-${status}`} label={t('adminReview.answerAdditions.searchLabel')} value={searchQuery} onChange={setSearchQuery} placeholder={t('adminReview.answerAdditions.searchPlaceholder')} loading={loading} />
      <PaginationBar page={page} visibleCount={additions.length} total={total} hasPrev={page > 0} hasNext={(page + 1) * PAGE_SIZE < total} onPrev={() => setPage((p) => Math.max(0, p - 1))} onNext={() => setPage((p) => p + 1)} loading={loading} />
      {total === 0 && <GlassCard className="text-center text-gray-400">{t('adminReview.answerAdditions.noAdditionsFound', { status })}</GlassCard>}
      {additions.map((addition) => {
        const group = addition.marketGroup || {};
        const href = addition.marketId ? `/markets/${addition.marketId}` : (group.id ? `/markets/group/${group.id}` : '#');
        const reason = reasonById[addition.id] || '';
        return (
          <GlassCard key={addition.id} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-300">
              <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-xs font-semibold text-sky-200">{t('adminReview.answerAdditions.groupLabel', { id: addition.groupId })}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-gray-200">{addition.status}</span>
              <span>{t('adminReview.answerAdditions.proposedBy')} <a href={`/newprofile/${addition.proposedBy}`} className="text-sky-300 hover:text-sky-200">@{addition.proposedBy}</a></span>
              {addition.createdAt && <span>{new Date(addition.createdAt).toLocaleString()}</span>}
            </div>
            <div className="flex flex-col gap-2">
              <a href={href} className="text-lg font-semibold text-white underline decoration-sky-500/40 underline-offset-4 hover:text-sky-200 transition">{group.questionTitle || addition.groupTitle || `Grouped market #${addition.groupId}`}</a>
              <div className="rounded-lg border border-sky-500/20 bg-sky-500/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-sky-300">{t('adminReview.answerAdditions.answerOption')}</p>
                <p className="mt-1 text-xl font-semibold text-white">{addition.answerLabel}</p>
                <p className="mt-2 text-sm text-sky-100/70">{t('adminReview.answerAdditions.addAnswerCost', { cost: addition.additionCost })}</p>
              </div>
            </div>
            {addition.status === 'rejected' && addition.rejectionReason && <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">{t('adminReview.common.rejectionReason', { reason: addition.rejectionReason })}</div>}
            {addition.status === 'approved' && <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">{t('adminReview.answerAdditions.approvedBy', { user: addition.reviewedBy || 'admin', date: addition.reviewedAt ? ` at ${new Date(addition.reviewedAt).toLocaleString()}` : '' })}</div>}
            {canReview && (
              <div className="grid gap-3 md:grid-cols-[1fr,auto,auto] md:items-start">
                <textarea value={reason} onChange={(e) => setReasonById((c) => ({ ...c, [addition.id]: e.target.value }))} rows={3} placeholder={t('adminReview.common.decisionReasonRequiredForRejection')} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#9CC9F1]/50 focus:outline-none resize-none" />
                <Button variant="success" disabled={busyId === addition.id} onClick={() => review(addition, 'approved')}>{t('adminReview.answerAdditions.approveAnswer')}</Button>
                <Button variant="danger" disabled={busyId === addition.id || !reason.trim()} onClick={() => review(addition, 'rejected')}>{t('adminReview.common.reject')}</Button>
              </div>
            )}
          </GlassCard>
        );
      })}
    </div>
  );
};

const MarketGroupAnswerAdditionQueue = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4">
      <InfoBanner>{t('adminReview.answerAdditions.infoBanner')}</InfoBanner>
      <AnswerAdditionApprovalPolicySetting />
      <SiteTabs variant="dark" tabs={answerAdditionTabDefs.map((td) => ({ label: t(`adminReview.tabs.${td.key}`), content: <MarketGroupAnswerAdditionStatusQueue status={td.status} /> }))} defaultTab={t('adminReview.tabs.pendingAnswers')} />
    </div>
  );
};

// ─── MarketStewardshipQueue ───────────────────────────────────────────────────

const MarketStewardshipQueue = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [markets, setMarkets] = useState([]);
  const [moderators, setModerators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modsLoading, setModsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyKey, setBusyKey] = useState(null);
  const [stewardForms, setStewardForms] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => { setPage(0); }, [searchQuery]);

  useEffect(() => {
    if (!token) return;
    let ignore = false;
    (async () => {
      setModsLoading(true);
      try { const r = await listAdminUsers({ token, limit: 250 }); if (!ignore) setModerators((r.users || []).filter(isActiveMod)); }
      catch (err) { if (!ignore) setError(err.message || 'Unable to load moderators.'); }
      finally { if (!ignore) setModsLoading(false); }
    })();
    return () => { ignore = true; };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let ignore = false;
    const t = window.setTimeout(async () => {
      setLoading(true); setError('');
      try {
        const r = await listAdminLifecycleMarkets({ token, status: 'all', query: searchQuery, limit: PAGE_SIZE, offset: page * PAGE_SIZE });
        if (!ignore) { setMarkets(r.markets || []); setTotal(Number(r.total || 0)); }
      } catch (err) { if (!ignore) { setError(err.message || 'Unable to load markets.'); setMarkets([]); setTotal(0); } }
      finally { if (!ignore) setLoading(false); }
    }, 300);
    return () => { ignore = true; window.clearTimeout(t); };
  }, [token, searchQuery, page]);

  const formFor = (market) => {
    const k = rowKey(market);
    return { stewardUsername: market.stewardUsername || market.creatorUsername || '', reason: '', ...(stewardForms[k] || {}) };
  };

  const updateForm = (k, updates) => setStewardForms((c) => ({ ...c, [k]: { ...(c[k] || {}), ...updates } }));

  const reassign = async (market) => {
    const k = rowKey(market); const form = formFor(market);
    setBusyKey(k); setError(''); setSuccess('');
    try {
      const updated = market.isMarketGroup
        ? await reassignMarketGroupSteward({ groupId: market.marketGroup.id, token, stewardUsername: form.stewardUsername, reason: form.reason })
        : await reassignMarketSteward({ marketId: market.id, token, stewardUsername: form.stewardUsername, reason: form.reason });
      setMarkets((c) => {
        if (market.isMarketGroup) {
          const gid = market.marketGroup?.id || updated.id;
          return c.map((m) => m.marketGroup?.id === gid ? { ...m, stewardUsername: updated.stewardUsername, marketGroup: { ...(m.marketGroup || {}), stewardUsername: updated.stewardUsername } } : m);
        }
        return c.map((m) => m.id === updated.id ? { ...m, ...updated } : m);
      });
      setStewardForms((c) => ({ ...c, [k]: { stewardUsername: updated.stewardUsername || form.stewardUsername, reason: '' } }));
      setSuccess(t('adminReview.stewardship.reassignedSuccess', { type: market.isMarketGroup ? 'Group' : 'Market', id: updated.id, username: updated.stewardUsername }));
    } catch (err) { setError(err.message || 'Unable to reassign steward.'); }
    finally { setBusyKey(null); }
  };

  const renderActions = (market) => {
    const k = rowKey(market); const form = formFor(market);
    const currentSteward = market.stewardUsername || market.creatorUsername || '';
    const selected = String(form.stewardUsername || '').trim();
    const reason = String(form.reason || '').trim();
    const canSubmit = selected && reason && selected !== currentSteward;
    const listId = `steward-opts-${k}`;
    return (
      <div className="flex flex-col gap-3 min-w-[260px]">
        <label className="flex flex-col gap-1 text-xs text-gray-300">
          <span className="font-mono uppercase tracking-widest text-gray-400">{t('adminReview.stewardship.newSteward')}</span>
          <input list={listId} value={form.stewardUsername} onChange={(e) => updateForm(k, { stewardUsername: e.target.value })} placeholder={t('adminReview.stewardship.searchModerators')} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#9CC9F1]/50 focus:outline-none" />
          <datalist id={listId}>{moderators.map((m) => <option key={m.username} value={m.username} label={m.displayName || m.username} />)}</datalist>
        </label>
        <textarea value={form.reason} onChange={(e) => updateForm(k, { reason: e.target.value })} rows={3} placeholder={t('adminReview.stewardship.reasonPlaceholder')} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#9CC9F1]/50 focus:outline-none resize-none" />
        <Button variant="celeste" disabled={busyKey === k || !canSubmit} onClick={() => reassign(market)}>{t('adminReview.stewardship.reassign')}</Button>
        {selected === currentSteward && <p className="text-xs text-gray-500">{t('adminReview.stewardship.chooseDifferent')}</p>}
      </div>
    );
  };

  if (loading && !markets.length) return <LoadingSpinner />;

  return (
    <div className="flex flex-col gap-4">
      <InfoBanner>{t('adminReview.stewardship.infoBanner')}</InfoBanner>
      <div className="flex flex-col gap-2">
        <SearchInput id="stewardship-search" label={t('adminReview.stewardship.searchLabel')} value={searchQuery} onChange={setSearchQuery} placeholder={t('adminReview.stewardship.searchPlaceholder')} loading={loading} />
        <p className="text-xs text-gray-500 px-1">{t('adminReview.stewardship.excludedNote')}</p>
      </div>
      <ErrorBanner msg={error} />
      <SuccessBanner msg={success} />
      {!modsLoading && moderators.length === 0 && <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">{t('adminReview.stewardship.noModerators')}</div>}
      <PaginationBar page={page} visibleCount={markets.length} total={total} hasPrev={page > 0} hasNext={(page + 1) * PAGE_SIZE < total} onPrev={() => setPage((p) => Math.max(0, p - 1))} onNext={() => setPage((p) => p + 1)} loading={loading} />
      <MarketLifecycleTable markets={markets} emptyMessage={t('adminReview.stewardship.noMarkets')} showCreator showSteward actions={renderActions} />
      <PaginationBar page={page} visibleCount={markets.length} total={total} hasPrev={page > 0} hasNext={(page + 1) * PAGE_SIZE < total} onPrev={() => setPage((p) => Math.max(0, p - 1))} onNext={() => setPage((p) => p + 1)} loading={loading} />
    </div>
  );
};

// ─── ColorKeyPicker ───────────────────────────────────────────────────────────

const ColorKeyPicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const selectedOption = MARKET_TAG_COLOR_OPTIONS.find((o) => o.key === value) || MARKET_TAG_COLOR_OPTIONS[0];
  const previewTag = (o) => ({ slug: o.key, displayName: o.label, colorKey: o.key, description: o.label });
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#9CC9F1]/50 focus:outline-none">
        <MarketTagChips tags={[previewTag(selectedOption)]} />
        <span className="text-xs text-gray-400">▾</span>
      </button>
      {open && (
        <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-white/10 bg-gray-950/95 p-2 shadow-xl backdrop-blur-sm">
          {MARKET_TAG_COLOR_OPTIONS.map((opt) => (
            <button key={opt.key} type="button" onClick={() => { onChange(opt.key); setOpen(false); }} className={`grid w-full gap-1 rounded-lg px-3 py-2 text-left transition hover:bg-white/5 ${opt.key === selectedOption.key ? 'bg-white/8 ring-1 ring-[#9CC9F1]/50' : ''}`}>
              <MarketTagChips tags={[previewTag(opt)]} />
              <span className="font-mono text-xs text-gray-500">{opt.key}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── MarketTaxonomyAdmin ──────────────────────────────────────────────────────

const emptyTagForm = { slug: '', displayName: '', description: '', colorKey: 'slate', sortOrder: 0 };

const MarketTaxonomyAdmin = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [tags, setTags] = useState([]);
  const [form, setForm] = useState(emptyTagForm);
  const [loading, setLoading] = useState(true);
  const [busySlug, setBusySlug] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadTags = async () => {
    if (!token) return;
    setLoading(true); setError('');
    try { const r = await listAdminMarketTags({ token, includeInactive: true }); setTags(r.tags || []); }
    catch (err) { setError(err.message || 'Unable to load tags.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadTags(); }, [token]);

  const updateForm = (updates) => setForm((c) => ({ ...c, ...updates }));

  const createTag = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    try {
      const created = await createAdminMarketTag({ token, tag: form });
      setTags((c) => [...c, created].sort((a, b) => (a.sortOrder - b.sortOrder) || String(a.displayName).localeCompare(String(b.displayName))));
      setForm(emptyTagForm);
      setSuccess(t('adminReview.tags.createdTag', { name: created.displayName }));
    } catch (err) { setError(err.message || 'Unable to create tag.'); }
  };

  const setTagActive = async (tag, isActive) => {
    if (!isActive && !window.confirm(t('adminReview.tags.deactivateConfirm', { name: tag.displayName }))) return;
    setBusySlug(tag.slug); setError(''); setSuccess('');
    try {
      const updated = await updateAdminMarketTag({ token, slug: tag.slug, tag: { displayName: tag.displayName, description: tag.description || '', colorKey: tag.colorKey || 'slate', sortOrder: tag.sortOrder || 0, isActive, confirmDeactivate: !isActive } });
      setTags((c) => c.map((t) => t.slug === updated.slug ? updated : t));
      setSuccess(t('adminReview.tags.tagStatus', { name: updated.displayName, status: updated.isActive ? t('adminReview.tags.active') : 'inactive' }));
    } catch (err) { setError(err.message || 'Unable to update tag.'); }
    finally { setBusySlug(''); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <GlassCard>
        <h2 className="text-lg font-semibold text-white">{t('adminReview.tags.title')}</h2>
        <p className="mt-2 text-sm text-gray-300">{t('adminReview.tags.tagsDescription')}</p>
        <p className="mt-2 text-xs text-amber-300">{t('adminReview.tags.deactivateNote')}</p>
      </GlassCard>
      <ErrorBanner msg={error} />
      <SuccessBanner msg={success} />
      <form onSubmit={createTag} className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-gray-300">{t('adminReview.tags.displayName')}<input value={form.displayName} onChange={(e) => updateForm({ displayName: e.target.value })} required maxLength={120} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#9CC9F1]/50 focus:outline-none" /></label>
          <label className="flex flex-col gap-1 text-sm text-gray-300">{t('adminReview.tags.slug')}<input value={form.slug} onChange={(e) => updateForm({ slug: e.target.value })} placeholder={t('adminReview.tags.autoGenerated')} maxLength={64} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-500 focus:border-[#9CC9F1]/50 focus:outline-none" /></label>
        </div>
        <label className="flex flex-col gap-1 text-sm text-gray-300">{t('adminReview.tags.tagDescription')}<textarea value={form.description} onChange={(e) => updateForm({ description: e.target.value })} rows={3} maxLength={500} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#9CC9F1]/50 focus:outline-none resize-none" /></label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-gray-300">{t('adminReview.tags.colorKey')}<ColorKeyPicker value={form.colorKey} onChange={(k) => updateForm({ colorKey: k })} /></label>
          <label className="flex flex-col gap-1 text-sm text-gray-300">{t('adminReview.tags.sortOrder')}<input type="number" value={form.sortOrder} onChange={(e) => updateForm({ sortOrder: Number(e.target.value || 0) })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#9CC9F1]/50 focus:outline-none" /></label>
        </div>
        <Button variant="celeste" type="submit" className="self-start">{t('adminReview.tags.createTag')}</Button>
      </form>
      <div className="flex flex-col gap-3">
        {tags.map((tag) => (
          <GlassCard key={tag.slug} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <MarketTagChips tags={[tag]} />
              <div className="mt-2 font-mono text-xs text-gray-500">{tag.slug}</div>
              {tag.description && <p className="mt-2 text-sm text-gray-300">{tag.description}</p>}
              {!tag.isActive && <p className="mt-2 text-xs text-amber-300">{t('adminReview.tags.inactiveNote')}</p>}
            </div>
            <Button variant={tag.isActive ? 'danger' : 'success'} disabled={busySlug === tag.slug} onClick={() => setTagActive(tag, !tag.isActive)}>
              {tag.isActive ? t('adminReview.tags.deactivate') : t('adminReview.tags.reactivate')}
            </Button>
          </GlassCard>
        ))}
        {!tags.length && <GlassCard className="text-center text-gray-400">{t('adminReview.tags.noTags')}</GlassCard>}
      </div>
    </div>
  );
};

// ─── ReviewQueueShortcuts ─────────────────────────────────────────────────────

const useReviewWorkCounts = () => {
  const { token } = useAuth();
  const [counts, setCounts] = useState(emptyPendingAdminReviewCounts);
  useEffect(() => {
    if (!token) { setCounts(emptyPendingAdminReviewCounts); return undefined; }
    let ignore = false;
    const loadCounts = async () => {
      try {
        const next = await getPendingAdminReviewCounts({ token });
        if (ignore) return;
        setCounts(next);
        window.dispatchEvent(new CustomEvent('socialpredict:admin-review-counts', { detail: next }));
      } catch { if (!ignore) { setCounts(emptyPendingAdminReviewCounts); window.dispatchEvent(new CustomEvent('socialpredict:admin-review-counts', { detail: emptyPendingAdminReviewCounts })); } }
    };
    const timeoutId = window.setTimeout(loadCounts, 1500);
    const intervalId = window.setInterval(loadCounts, 60000);
    return () => { ignore = true; window.clearTimeout(timeoutId); window.clearInterval(intervalId); };
  }, [token]);
  return counts;
};

const ShortcutCard = ({ eyebrow, title, description, count, active, onClick }) => (
  <button type="button" onClick={onClick} className={`flex flex-col gap-2 rounded-xl border p-4 text-left transition ${active ? 'border-[#9CC9F1]/60 bg-[#9CC9F1]/10 shadow-lg shadow-[#9CC9F1]/10' : 'border-white/10 bg-white/5 hover:border-sky-500/40 hover:bg-white/8'}`}>
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{eyebrow}</span>
      {count != null && (
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${count > 0 ? 'bg-[#9CC9F1] text-white' : 'bg-white/10 text-gray-400'}`}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </div>
    <div className="text-base font-semibold text-white">{title}</div>
    <p className="text-xs leading-5 text-gray-400">{description}</p>
  </button>
);

// ─── Main page ────────────────────────────────────────────────────────────────

const TestAdminMarketsReview = () => {
  const { t } = useTranslation();
  const counts = useReviewWorkCounts();
  const [activeTab, setActiveTab] = useState(TAB_KEYS.pendingReview);

  useEffect(() => { document.title = t('adminReview.pageTitle'); }, [t]);

  const tabLabel = (key) => t(`adminReview.tabs.${key}`);

  const shortcuts = [
    { tabKey: TAB_KEYS.pendingReview, eyebrow: t('adminReview.shortcuts.marketQueue'), title: t('adminReview.shortcuts.pendingMarkets'), description: t('adminReview.shortcuts.pendingMarketsDesc'), count: counts.pendingMarkets },
    { tabKey: TAB_KEYS.descriptionAmendments, eyebrow: t('adminReview.shortcuts.contractChanges'), title: t('adminReview.shortcuts.pendingAmendments'), description: t('adminReview.shortcuts.pendingAmendmentsDesc'), count: counts.pendingAmendments },
    { tabKey: TAB_KEYS.answerAdditions, eyebrow: t('adminReview.shortcuts.groupedMarkets'), title: t('adminReview.shortcuts.pendingAnswerOptions'), description: t('adminReview.shortcuts.pendingAnswerOptionsDesc'), count: counts.pendingAnswers },
    { tabKey: TAB_KEYS.stewardship, eyebrow: t('adminReview.shortcuts.operations'), title: t('adminReview.shortcuts.stewardship'), description: t('adminReview.shortcuts.stewardshipDesc'), count: null },
  ];

  const badgeFor = (key) => {
    if (key === TAB_KEYS.pendingReview) return formatBadge(counts.pendingMarkets);
    if (key === TAB_KEYS.descriptionAmendments) return formatBadge(counts.pendingAmendments);
    if (key === TAB_KEYS.answerAdditions) return formatBadge(counts.pendingAnswers);
    return '';
  };

  const tabs = [
    ...reviewTabDefs.map((td) => ({ label: tabLabel(td.key), badge: badgeFor(td.key), content: <AdminMarketQueue status={td.status} /> })),
    { label: tabLabel(TAB_KEYS.stewardship), content: <MarketStewardshipQueue /> },
    { label: tabLabel(TAB_KEYS.descriptionAmendments), badge: badgeFor(TAB_KEYS.descriptionAmendments), content: <DescriptionAmendmentQueue /> },
    { label: tabLabel(TAB_KEYS.answerAdditions), badge: badgeFor(TAB_KEYS.answerAdditions), content: <MarketGroupAnswerAdditionQueue /> },
    { label: tabLabel(TAB_KEYS.tags), content: <MarketTaxonomyAdmin /> },
  ];

  return (
    <div className="min-h-screen bg-primary-background relative overflow-x-hidden">
      {/* Background glow */}
      <div style={{ position: 'fixed', width: '70vw', height: '70vh', left: '50%', top: '30%', transform: 'translate(-50%, -50%)', background: 'radial-gradient(ellipse, rgba(233,30,140,0.07) 0%, rgba(81,173,246,0.05) 60%, transparent 100%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-[#9CC9F1] mb-1">{t('adminReview.eyebrow')}</p>
          <h1 className="text-4xl font-bold text-white">{t('adminReview.heading')}</h1>
          <p className="mt-2 text-sm text-gray-400 max-w-2xl">{t('adminReview.description')}</p>
        </div>

        {/* Shortcut cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-8">
          {shortcuts.map((s) => (
            <ShortcutCard key={s.tabKey} {...s} active={activeTab === s.tabKey} onClick={() => setActiveTab(s.tabKey)} />
          ))}
        </div>

        {/* Tabs */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
          <SiteTabs variant="dark" tabs={tabs} activeTab={tabLabel(activeTab)} onTabChange={(label) => { const key = Object.values(TAB_KEYS).find((k) => tabLabel(k) === label); setActiveTab(key || activeTab); }} />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TestAdminMarketsReview;
