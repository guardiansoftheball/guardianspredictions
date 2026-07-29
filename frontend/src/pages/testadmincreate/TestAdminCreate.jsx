import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../helpers/AuthContent';
import { getEndofDayDateTime } from '../../components/utils/dateTimeTools/FormDateTimeTools';
import DatetimeSelector from '../../components/datetimeSelector/DatetimeSelector';
import EmojiPickerInput from '../../components/inputs/EmojiPicker';
import { Button } from '../../components/ui/Button';
import { USER_CREDIT_REFRESH_EVENT } from '../../components/utils/userFinanceTools/FetchUserCredit';
import { apiRequest, authenticatedApiRequest } from '../../api/httpClient';
import { listMarketTags } from '../../api/marketTagsApi';
import { createMarketGroup } from '../../api/marketsApi';
import MarketTagChips from '../../components/markets/MarketTagChips';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';

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

function TestAdminCreate() {
  const [questionTitle, setQuestionTitle] = useState('');
  const [description, setDescription] = useState('');
  const [resolutionDateTime, setResolutionDateTime] = useState(getEndofDayDateTime());
  const [yesLabel, setYesLabel] = useState('');
  const [noLabel, setNoLabel] = useState('');
  const [marketType, setMarketType] = useState('binary');
  const [answerLabels, setAnswerLabels] = useState(['', '']);
  const [autoApproveAnswerAdditions, setAutoApproveAnswerAdditions] = useState(false);
  const [error, setError] = useState('');
  const [createdMarket, setCreatedMarket] = useState(null);
  const [marketCreationCost, setMarketCreationCost] = useState(null);
  const [multipleChoicePolicy, setMultipleChoicePolicy] = useState({
    addAnswerCost: 2,
    softAnswerReviewThreshold: 12,
    hardAnswerSafetyCap: 50,
  });
  const [marketTags, setMarketTags] = useState([]);
  const [selectedTagSlugs, setSelectedTagSlugs] = useState([]);
  const { username } = useAuth();
  const history = useHistory();

  const createMarketReasonMessages = {
    USER_NOT_APPROVED: 'User does not have approval to create markets in moderator mode.',
    AUTHORIZATION_DENIED: 'You are not allowed to create this market.',
    INSUFFICIENT_BALANCE: 'You do not have enough credit to create this market.',
    VALIDATION_FAILED: 'Check the market fields and try again.',
    INVALID_REQUEST: 'Check the market fields and try again.',
  };

  useEffect(() => {
    document.title = 'Create Market | Admin';
    let ignore = false;
    const loadSetup = async () => {
      try {
        const setup = await apiRequest('/v0/setup');
        const cost = setup?.marketincentives?.createMarketCost;
        if (!ignore && cost !== undefined && cost !== null) setMarketCreationCost(cost);
        const groupPolicy = setup?.marketincentives?.multipleChoiceBinary;
        if (!ignore && groupPolicy) setMultipleChoicePolicy((c) => ({ ...c, ...groupPolicy }));
      } catch {}
    };
    loadSetup();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    let ignore = false;
    const loadTags = async () => {
      try {
        const data = await listMarketTags();
        if (!ignore) setMarketTags(data.tags || []);
      } catch {
        if (!ignore) setMarketTags([]);
      }
    };
    loadTags();
    return () => { ignore = true; };
  }, []);

  const toggleTagSlug = (slug) => {
    setSelectedTagSlugs((current) => {
      if (current.includes(slug)) return current.filter((v) => v !== slug);
      if (current.length >= 5) { setError('You can select up to five market tags.'); return current; }
      setError('');
      return [...current, slug];
    });
  };

  const updateAnswerLabel = (index, value) => {
    setAnswerLabels((current) => current.map((label, i) => (i === index ? value : label)));
  };

  const addAnswerLabel = () => {
    setAnswerLabels((current) => {
      const hardCap = multipleChoicePolicy.hardAnswerSafetyCap || 50;
      if (current.length >= hardCap) { setError(`Multiple-choice market groups can have up to ${hardCap} answers.`); return current; }
      setError('');
      return [...current, ''];
    });
  };

  const removeAnswerLabel = (index) => {
    setAnswerLabels((current) => current.length <= 2 ? current : current.filter((_, i) => i !== index));
  };

  const validateAnswerLabels = () => {
    const trimmedLabels = answerLabels.map((l) => l.trim()).filter(Boolean);
    if (trimmedLabels.length < 2) return { error: 'Add at least two answer options.', labels: [] };
    const hardCap = multipleChoicePolicy.hardAnswerSafetyCap || 50;
    if (trimmedLabels.length > hardCap) return { error: `Multiple-choice market groups can have up to ${hardCap} answers.`, labels: [] };
    const seen = new Set();
    for (const label of trimmedLabels) {
      if (label.length > 160) return { error: 'Answer labels must be 160 characters or fewer.', labels: [] };
      const key = label.toLowerCase();
      if (seen.has(key)) return { error: 'Answer labels must be unique.', labels: [] };
      seen.add(key);
    }
    return { error: '', labels: trimmedLabels };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setCreatedMarket(null);

    const trimmedYesLabel = yesLabel.trim();
    const trimmedNoLabel = noLabel.trim();

    if (marketType === 'binary') {
      if (trimmedYesLabel && (trimmedYesLabel.length < 1 || trimmedYesLabel.length > 20)) { setError('Yes label must be between 1 and 20 characters'); return; }
      if (trimmedNoLabel && (trimmedNoLabel.length < 1 || trimmedNoLabel.length > 20)) { setError('No label must be between 1 and 20 characters'); return; }
    }

    let isoDateTime = resolutionDateTime;
    if (resolutionDateTime) {
      const dateTime = new Date(resolutionDateTime);
      if (!isNaN(dateTime.getTime())) isoDateTime = dateTime.toISOString();
      else { setError('Invalid date-time value'); return; }
    }

    try {
      if (marketType === 'group') {
        const validation = validateAnswerLabels();
        if (validation.error) { setError(validation.error); return; }
        const responseData = await createMarketGroup({
          questionTitle, description, resolutionDateTime: isoDateTime,
          answerLabels: validation.labels, tagSlugs: selectedTagSlugs, autoApproveAnswerAdditions,
        });
        window.dispatchEvent(new Event(USER_CREDIT_REFRESH_EVENT));
        const firstChildMarketId = responseData?.answers?.[0]?.marketId;
        if (firstChildMarketId) { history.push(`/markets/${firstChildMarketId}`); return; }
        setCreatedMarket(responseData?.group || responseData);
        return;
      }

      const marketData = {
        questionTitle, description, outcomeType: 'BINARY', resolutionDateTime: isoDateTime,
        initialProbability: 0.5, creatorUsername: username, isResolved: false,
        utcOffset: new Date().getTimezoneOffset(),
        yesLabel: trimmedYesLabel || 'YES', noLabel: trimmedNoLabel || 'NO',
        tagSlugs: selectedTagSlugs,
      };

      const responseData = await authenticatedApiRequest('/v0/markets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(marketData),
        reasonMessages: createMarketReasonMessages,
        fallbackMessage: 'Market creation failed. Please try again.',
      });

      window.dispatchEvent(new Event(USER_CREDIT_REFRESH_EVENT));
      if (String(responseData.status || '').toLowerCase() === 'proposed') {
        const proposalCost = responseData.proposalCost ?? marketCreationCost;
        setCreatedMarket(responseData);
        history.push('/profile?tab=Proposed%20Markets', { proposedMarket: responseData, marketCreationCost: proposalCost });
        return;
      }
      history.push(`/markets/${responseData.id}`);
    } catch (err) {
      setError(err.message || 'Market creation failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-primary-background relative overflow-x-hidden">
      {/* Background glow */}
      <div style={{ position: 'fixed', width: '70vw', height: '70vh', left: '50%', top: '30%', transform: 'translate(-50%, -50%)', background: 'radial-gradient(ellipse, rgba(233,30,140,0.07) 0%, rgba(81,173,246,0.05) 60%, transparent 100%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-[#9CC9F1] mb-1">Moderator mode</p>
          <h1 className="text-4xl font-bold text-white">Create a Market</h1>
          <p className="mt-2 text-sm text-gray-400 max-w-2xl">Propose a new binary or multiple-choice market for admin review.</p>
        </div>

        {/* Proposal cost */}
        <GlassCard className="mb-6 border-[#9CC9F1]/20">
          <p className="text-xs font-mono uppercase tracking-widest text-[#9CC9F1]">Market proposal cost</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {marketCreationCost === null ? 'Loading...' : `${marketCreationCost} credits`}
          </p>
          <p className="mt-2 text-sm text-gray-400">
            This amount is deducted when you create the proposal. If an admin rejects the proposal, the proposal cost is refunded.
          </p>
          {marketType === 'group' && (
            <p className="mt-2 text-sm text-gray-400">
              Initial multiple-choice answers are included in the group proposal cost. Later answer additions cost {multipleChoicePolicy.addAnswerCost ?? 0} credits each if enabled.
            </p>
          )}
        </GlassCard>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Market type */}
          <GlassCard>
            <p className="text-sm font-semibold text-white">Market Type</p>
            <p className="mt-1 text-xs text-gray-400">
              Multiple-choice binary groups create one parent page and a normal YES/NO child market for each answer.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMarketType('binary')}
                className={`rounded-xl border p-4 text-left transition ${
                  marketType === 'binary'
                    ? 'border-[#9CC9F1]/60 bg-[#9CC9F1]/10 text-white shadow-lg shadow-[#9CC9F1]/10'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:border-[#9CC9F1]/40'
                }`}
              >
                <span className="block text-sm font-semibold">Binary Market</span>
                <span className="mt-1 block text-xs text-gray-400">One YES/NO market.</span>
              </button>
              <button
                type="button"
                onClick={() => setMarketType('group')}
                className={`rounded-xl border p-4 text-left transition ${
                  marketType === 'group'
                    ? 'border-[#9CC9F1]/60 bg-[#9CC9F1]/10 text-white shadow-lg shadow-[#9CC9F1]/10'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:border-[#9CC9F1]/40'
                }`}
              >
                <span className="block text-sm font-semibold">Multiple-Choice Binary Group</span>
                <span className="mt-1 block text-xs text-gray-400">
                  Each answer becomes its own YES/NO market. Initial answers do not add proposal cost.
                </span>
              </button>
            </div>
          </GlassCard>

          {/* Question title */}
          <GlassCard>
            <label htmlFor="market-question-title" className="block text-xs font-mono uppercase tracking-widest text-gray-400 mb-2">
              Question Title
            </label>
            <EmojiPickerInput
              id="market-question-title"
              type="text"
              value={questionTitle}
              onChange={(e) => setQuestionTitle(e.target.value)}
              placeholder="Enter the market question"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#9CC9F1]/50 focus:outline-none focus:ring-1 focus:ring-[#9CC9F1]/30"
            />
          </GlassCard>

          {/* Description */}
          <GlassCard>
            <label htmlFor="market-description" className="block text-xs font-mono uppercase tracking-widest text-gray-400 mb-2">
              Description
            </label>
            <EmojiPickerInput
              id="market-description"
              type="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about the market"
              className="w-full h-32 resize-y rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#9CC9F1]/50 focus:outline-none focus:ring-1 focus:ring-[#9CC9F1]/30"
            />
          </GlassCard>

          {/* Market tags */}
          {marketTags.length > 0 && (
            <GlassCard>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white">Market Tags</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Pick up to five categories so admins can review routing and users can find this market.
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                  {selectedTagSlugs.length}/5 selected
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {marketTags.map((tag) => {
                  const selected = selectedTagSlugs.includes(tag.slug);
                  return (
                    <button
                      key={tag.slug}
                      type="button"
                      onClick={() => toggleTagSlug(tag.slug)}
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                        selected
                          ? 'border-[#9CC9F1] bg-[#9CC9F1]/20 text-white'
                          : 'border-white/20 bg-white/5 text-gray-300 hover:border-white/40'
                      }`}
                    >
                      {selected ? '\u2713 ' : ''}{tag.displayName || tag.slug}
                    </button>
                  );
                })}
              </div>
              <MarketTagChips
                tags={marketTags.filter((tag) => selectedTagSlugs.includes(tag.slug))}
                className="mt-3"
              />
            </GlassCard>
          )}

          {/* Binary labels / Group answers */}
          {marketType === 'binary' ? (
            <>
              <GlassCard>
                <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-3">Outcome Labels (Optional)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="market-yes-label" className="block text-sm font-medium text-gray-300 mb-1">Yes Label</label>
                    <EmojiPickerInput
                      id="market-yes-label"
                      type="text"
                      value={yesLabel}
                      onChange={(e) => setYesLabel(e.target.value)}
                      placeholder='e.g., BULL, WIN, PASS'
                      maxLength={20}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#9CC9F1]/50 focus:outline-none focus:ring-1 focus:ring-[#9CC9F1]/30"
                    />
                    <p className="text-xs text-gray-500 mt-1">Custom label for positive outcome (defaults to "YES")</p>
                  </div>
                  <div>
                    <label htmlFor="market-no-label" className="block text-sm font-medium text-gray-300 mb-1">No Label</label>
                    <EmojiPickerInput
                      id="market-no-label"
                      type="text"
                      value={noLabel}
                      onChange={(e) => setNoLabel(e.target.value)}
                      placeholder='e.g., BEAR, LOSE, FAIL'
                      maxLength={20}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#9CC9F1]/50 focus:outline-none focus:ring-1 focus:ring-[#9CC9F1]/30"
                    />
                    <p className="text-xs text-gray-500 mt-1">Custom label for negative outcome (defaults to "NO")</p>
                  </div>
                </div>
                {(yesLabel.trim() || noLabel.trim()) && (
                  <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-2">Preview</p>
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-sm font-semibold text-emerald-300">
                        {yesLabel.trim() || 'YES'}
                      </span>
                      <span className="text-gray-500 text-sm">vs</span>
                      <span className="rounded-lg bg-rose-500/20 border border-rose-500/30 px-3 py-1 text-sm font-semibold text-rose-300">
                        {noLabel.trim() || 'NO'}
                      </span>
                    </div>
                  </div>
                )}
              </GlassCard>
            </>
          ) : (
            <GlassCard>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white">Answer Options</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Each answer becomes a separate YES/NO child market under one parent page.
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                  {answerLabels.length}/{multipleChoicePolicy.hardAnswerSafetyCap || 50} answers
                </span>
              </div>
              {answerLabels.length >= (multipleChoicePolicy.softAnswerReviewThreshold || 12) && (
                <div className="mb-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                  Large answer sets can be harder for participants to compare. Initial answers are still included in the group proposal cost.
                </div>
              )}
              <div className="flex flex-col gap-3">
                {answerLabels.map((answerLabel, index) => (
                  <div key={`answer-${index}`} className="flex gap-2">
                    <EmojiPickerInput
                      id={`market-answer-label-${index}`}
                      type="text"
                      value={answerLabel}
                      onChange={(e) => updateAnswerLabel(index, e.target.value)}
                      placeholder={`Answer ${index + 1}`}
                      maxLength={160}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#9CC9F1]/50 focus:outline-none focus:ring-1 focus:ring-[#9CC9F1]/30"
                    />
                    <button
                      type="button"
                      onClick={() => removeAnswerLabel(index)}
                      disabled={answerLabels.length <= 2}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-rose-400/50 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addAnswerLabel}
                className="mt-3 rounded-lg border border-[#9CC9F1]/40 px-4 py-2 text-sm font-semibold text-[#9CC9F1] transition hover:bg-[#9CC9F1]/10"
              >
                Add Answer
              </button>
              <div className="mt-4 flex flex-col gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-200">Auto-approve later answer options</p>
                  <p className="mt-1 text-xs text-emerald-200/70">
                    If enabled, active moderators can add later answer options immediately. If disabled, their options wait for your approval.
                  </p>
                </div>
                <button
                  type="button"
                  aria-pressed={autoApproveAnswerAdditions}
                  onClick={() => setAutoApproveAnswerAdditions((c) => !c)}
                  className={`relative inline-flex h-8 w-16 shrink-0 items-center rounded-full border transition ${
                    autoApproveAnswerAdditions
                      ? 'border-emerald-400 bg-emerald-600'
                      : 'border-white/20 bg-white/10'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                      autoApproveAnswerAdditions ? 'translate-x-8' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </GlassCard>
          )}

          {/* Resolution date */}
          <GlassCard>
            <DatetimeSelector
              id="market-resolution-date-time"
              label="Resolution Date Time"
              value={resolutionDateTime}
              onChange={(e) => setResolutionDateTime(e.target.value)}
              className="w-full"
            />
          </GlassCard>

          {/* Error / Success */}
          <ErrorBanner msg={error} />

          {createdMarket && (
            <GlassCard className="border-[#9CC9F1]/20">
              <p className="text-xs font-mono uppercase tracking-widest text-[#9CC9F1]">Proposed market created</p>
              <h2 className="mt-2 text-lg font-semibold text-white">{createdMarket.questionTitle}</h2>
              <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <p><span className="text-gray-400">Market ID:</span> <span className="font-mono text-white">{createdMarket.id}</span></p>
                <p><span className="text-gray-400">Status:</span> <span className="font-mono text-white">{createdMarket.status}</span></p>
              </div>
              <p className="mt-3 text-sm text-gray-400">
                This moderator-mode proposal is not tradable until an admin approves it. You will be redirected to your Proposed Markets tab.
              </p>
            </GlassCard>
          )}

          {/* Submit */}
          <Button variant="celeste" type="submit" className="w-full">
            {marketType === 'group' ? 'Create Market Group' : 'Create Market'}
          </Button>
        </form>
      </div>

      <Footer />
    </div>
  );
}

export default TestAdminCreate;
