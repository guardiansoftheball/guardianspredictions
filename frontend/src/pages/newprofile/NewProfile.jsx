import React, { useEffect, useMemo, useState } from "react";
import { Link, useHistory, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import { TopGlow } from "../../components/ui/BlueGlow";
import LoadingSpinner from "../../components/loaders/LoadingSpinner";
import MarkdownLite from "../../components/markdown/MarkdownLite";
import { groupLifecycleMarketRows } from "../../components/layouts/profile/MarketLifecycleTable";
import useUserData from "../../hooks/useUserData";
import { useAuth } from "../../helpers/AuthContent";
import ProfileSidebar from "../../components/profile/account/ProfileSidebar";
import ProfileOverview from "../../components/profile/account/ProfileOverview";
import ProfileFavorites from "../../components/profile/account/ProfileFavorites";
import ProfileActivity from "../../components/profile/account/ProfileActivity";
import ProfilePositions from "../../components/profile/account/ProfilePositions";
import ProfileSettings from "../../components/profile/account/ProfileSettings";
import ProfileFinancials from "../../components/profile/account/ProfileFinancials";
import PublicProfile from "../../components/profile/public/PublicProfile";
import { API_URL } from "../../config";
import { listMyLifecycleMarkets } from "../../api/lifecycleMarketsApi";
import { listMyMarketDescriptionAmendments } from "../../api/marketDescriptionAmendmentsApi";
import {
  listMarketGroupAnswerAdditionsForReview,
  reviewMarketGroupAnswerAdditionForSteward,
} from "../../api/marketsApi";
import { CARD, FONT, FONT_HEAD, COLOR, DETAIL_MAX_WIDTH } from "../../styles/darkTokens";
import {
  PAGE_SIZE,
  Chip,
  PillTabs,
  SectionCard,
  SectionLabel,
  EmptyState,
  ErrorBanner,
  SuccessBanner,
  GhostButton,
  pagedRows,
  Pagination,
  inputStyle,
  statusTone,
  formatDate,
  LifecycleMarketCard,
} from "../../components/layouts/profile/ProfileUiKit";

// ─── design tokens ────────────────────────────────────────────────────────────
const TEXT = COLOR.text;
const MUTED = COLOR.muted;
const MUTED2 = COLOR.muted2;
const MUTED3 = COLOR.muted3;
const ACCENT = COLOR.accent;
const YES_TEXT = COLOR.yesText;

// ─── my markets (lifecycle) ───────────────────────────────────────────────────
const LIFECYCLE_STATUSES = { proposed: "Proposed", published: "Published", rejected: "Rejected" };

const MyMarketsSection = () => {
  const { token } = useAuth();
  const [statusTab, setStatusTab] = useState("Proposed");
  const [markets, setMarkets] = useState([]);
  const [totalMarkets, setTotalMarkets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);

  const status = Object.keys(LIFECYCLE_STATUSES).find((key) => LIFECYCLE_STATUSES[key] === statusTab) || "proposed";

  useEffect(() => {
    setPage(0);
  }, [status, searchQuery]);

  useEffect(() => {
    let ignore = false;

    const loadMarkets = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await listMyLifecycleMarkets({
          token,
          status,
          query: searchQuery,
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
        });
        if (!ignore) {
          const rows = groupLifecycleMarketRows(data.markets || []);
          setMarkets(rows);
          setTotalMarkets(Number.isFinite(Number(data.total)) ? Number(data.total) : rows.length);
        }
      } catch (err) {
        if (!ignore) setError(err.message || "Unable to load market queue.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    const timeoutId = window.setTimeout(loadMarkets, 300);
    return () => {
      ignore = true;
      window.clearTimeout(timeoutId);
    };
  }, [status, token, searchQuery, page]);

  const pageInfo = {
    currentPage: page,
    start: page * PAGE_SIZE,
    total: totalMarkets,
    rows: markets,
    hasPrevious: page > 0,
    hasNext: page * PAGE_SIZE + markets.length < totalMarkets,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <PillTabs tabs={Object.values(LIFECYCLE_STATUSES)} active={statusTab} onChange={setStatusTab} />
      </div>

      {error && <ErrorBanner message={error} />}

      <div style={{ position: "relative" }}>
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={`Search ${status} markets by title or description`}
          style={inputStyle}
        />
        {loading && (
          <div
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              border: "2px solid transparent",
              borderBottomColor: ACCENT,
              animation: "spin 1s linear infinite",
            }}
          />
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <Pagination label={`${statusTab} markets`} pageInfo={pageInfo} onPageChange={setPage} />
          {pageInfo.rows.length === 0 ? (
            <EmptyState>No {status} markets found.</EmptyState>
          ) : (
            pageInfo.rows.map((market) => (
              <LifecycleMarketCard key={market.rowKey || market.id} market={market} />
            ))
          )}
        </>
      )}
    </div>
  );
};

// ─── market changes (amendments + answer options) ─────────────────────────────
const REVIEW_STATUSES = { pending: "Pending", approved: "Approved", rejected: "Rejected" };
const MARKET_TYPES = { grouped: "Grouped Markets", binary: "Binary Markets" };

const amendmentNumber = (version) => Math.max(1, Number(version || 2) - 1);
const isGroupedAmendment = (amendment) => Boolean(amendment?.marketGroup?.id);

const amendmentRowKey = (amendment) => {
  if (!isGroupedAmendment(amendment)) {
    return `amendment:${amendment?.id}`;
  }
  return [
    "group-amendment",
    amendment.marketGroup.id,
    amendment.status,
    amendment.body,
    amendment.createdBy,
    amendment.submitReason || "",
  ].join("|");
};

const compactDescriptionAmendments = (amendments = []) => {
  const rows = [];
  const groups = new Map();

  amendments.forEach((amendment) => {
    if (!isGroupedAmendment(amendment)) {
      rows.push({ ...amendment, childAmendments: [amendment] });
      return;
    }

    const key = amendmentRowKey(amendment);
    const existing = groups.get(key);
    if (!existing) {
      const row = {
        ...amendment,
        marketTitle: amendment.marketGroup.questionTitle || amendment.marketTitle,
        marketDescription: amendment.marketGroup.description || amendment.marketDescription,
        childAmendments: [amendment],
      };
      groups.set(key, row);
      rows.push(row);
      return;
    }

    existing.childAmendments.push(amendment);
    existing.childAmendments.sort((left, right) => Number(left.marketId || 0) - Number(right.marketId || 0));
  });

  return rows;
};

const marketChangeKey = ({ marketType, amendment, answerOption }) => {
  if (marketType === "grouped") {
    return `group:${amendment?.marketGroup?.id || answerOption?.groupId || 0}`;
  }
  return `market:${amendment?.marketId || 0}`;
};

const marketChangeTitle = ({ marketType, amendment, answerOption }) => {
  if (marketType === "grouped") {
    return amendment?.marketGroup?.questionTitle ||
      amendment?.marketTitle ||
      answerOption?.marketGroup?.questionTitle ||
      answerOption?.groupTitle ||
      `Grouped market #${answerOption?.groupId || amendment?.marketGroup?.id || ""}`;
  }
  return amendment?.marketTitle || `Market #${amendment?.marketId || ""}`;
};

const marketChangeHref = ({ marketType, amendment, answerOption }) => {
  if (marketType === "grouped") {
    const childMarketId = amendment?.marketId || answerOption?.marketId;
    if (childMarketId) {
      return `/markets/${childMarketId}`;
    }
    const groupId = amendment?.marketGroup?.id || answerOption?.groupId;
    return groupId ? `/markets/group/${groupId}` : "#";
  }
  return amendment?.marketId ? `/markets/${amendment.marketId}` : "#";
};

const groupProfileMarketChanges = ({ marketType, amendments = [], answerOptions = [] }) => {
  const rows = new Map();

  const ensureRow = ({ amendment = null, answerOption = null }) => {
    const key = marketChangeKey({ marketType, amendment, answerOption });
    if (!rows.has(key)) {
      rows.set(key, {
        key,
        marketType,
        title: marketChangeTitle({ marketType, amendment, answerOption }),
        href: marketChangeHref({ marketType, amendment, answerOption }),
        amendments: [],
        answerOptions: [],
        groupId: amendment?.marketGroup?.id || answerOption?.groupId || 0,
        marketId: amendment?.marketId || answerOption?.marketId || 0,
      });
    }
    const row = rows.get(key);
    if (row.href === "#" || row.href === "/markets/group/0") {
      row.href = marketChangeHref({ marketType, amendment, answerOption });
    }
    if (!row.title || row.title.endsWith("#")) {
      row.title = marketChangeTitle({ marketType, amendment, answerOption });
    }
    return row;
  };

  compactDescriptionAmendments(amendments).forEach((amendment) => {
    ensureRow({ amendment }).amendments.push(amendment);
  });

  answerOptions.forEach((answerOption) => {
    ensureRow({ answerOption }).answerOptions.push(answerOption);
  });

  return Array.from(rows.values()).sort((left, right) => left.title.localeCompare(right.title));
};

const marketChangeSearchText = (change) => [
  change.title,
  change.key,
  change.marketType,
  change.groupId ? `group ${change.groupId}` : "",
  change.marketId ? `market ${change.marketId}` : "",
  ...(change.amendments || []).flatMap((amendment) => [
    amendment.marketTitle,
    amendment.marketDescription,
    amendment.body,
    amendment.submitReason,
    amendment.createdBy,
    amendment.marketId ? `market ${amendment.marketId}` : "",
    amendment.marketGroup?.questionTitle,
    amendment.marketGroup?.answerLabel,
    amendment.marketGroup?.id ? `group ${amendment.marketGroup.id}` : "",
    ...(amendment.childAmendments || []).map((child) => child.marketGroup?.answerLabel || `market ${child.marketId}`),
  ]),
  ...(change.answerOptions || []).flatMap((addition) => [
    addition.groupTitle,
    addition.answerLabel,
    addition.proposedBy,
    addition.reviewedBy,
    addition.rejectionReason,
    addition.groupId ? `group ${addition.groupId}` : "",
    addition.marketId ? `market ${addition.marketId}` : "",
    addition.marketGroup?.questionTitle,
  ]),
].filter(Boolean).join(" ").toLowerCase();

const filterMarketChanges = (changes, query) => {
  const needle = String(query || "").trim().toLowerCase();
  if (!needle) return changes;
  return changes.filter((change) => marketChangeSearchText(change).includes(needle));
};

const AmendmentCard = ({ amendment, status }) => {
  const previousAmendments = Array.isArray(amendment.previousApprovedAmendments)
    ? amendment.previousApprovedAmendments
    : [];
  const childAmendments = Array.isArray(amendment.childAmendments) ? amendment.childAmendments : [amendment];

  return (
    <div
      style={{
        borderRadius: "12px",
        border: "1px solid rgba(156,201,241,0.20)",
        background: "rgba(156,201,241,0.05)",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", font: `500 12px ${FONT}`, color: MUTED }}>
        <Chip tone="sky">AMENDMENT {amendmentNumber(amendment.version)}</Chip>
        <span>Submitted by @{amendment.createdBy}</span>
        <span>{amendment.createdAt ? new Date(amendment.createdAt).toLocaleString() : ""}</span>
      </div>

      {isGroupedAmendment(amendment) && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {childAmendments.map((child) => (
            <Chip key={child.id} tone="sky">
              {child.marketGroup?.answerLabel || `Market #${child.marketId}`} · A{amendmentNumber(child.version)}
            </Chip>
          ))}
        </div>
      )}

      <div style={{ borderRadius: "10px", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.25)", padding: "12px" }}>
        <SectionLabel>Current description</SectionLabel>
        <p style={{ margin: "6px 0 0", font: `400 13px/1.6 ${FONT}`, color: "#b7c6d6", whiteSpace: "pre-wrap" }}>
          {amendment.marketDescription || "No market description was returned."}
        </p>
        {previousAmendments.length > 0 && (
          <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {previousAmendments.map((previous) => (
              <div
                key={previous.id || previous.version}
                style={{ borderRadius: "8px", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", padding: "10px" }}
              >
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", font: `500 11px ${FONT}`, color: MUTED2, marginBottom: "6px" }}>
                  <span>Amendment {amendmentNumber(previous.version)}</span>
                  <span>Approved by @{previous.approvedBy || "admin"}</span>
                  {previous.approvedAt && <span>{new Date(previous.approvedAt).toLocaleString()}</span>}
                </div>
                <MarkdownLite>{previous.body}</MarkdownLite>
              </div>
            ))}
          </div>
        )}
      </div>

      {amendment.submitReason && (
        <div style={{ borderRadius: "10px", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.20)", padding: "10px 12px", font: `500 12.5px ${FONT}`, color: MUTED }}>
          <span style={{ color: TEXT, fontWeight: 700 }}>Submit reason:</span> {amendment.submitReason}
        </div>
      )}

      <div style={{ borderRadius: "10px", border: "1px solid rgba(156,201,241,0.25)", background: "rgba(156,201,241,0.07)", padding: "12px" }}>
        <SectionLabel color="#9cc9f1">Proposed amendment {amendmentNumber(amendment.version)}</SectionLabel>
        <div style={{ marginTop: "6px" }}>
          <MarkdownLite>{amendment.body}</MarkdownLite>
        </div>
      </div>

      {status === "rejected" && amendment.rejectionReason && (
        <ErrorBanner message={`Rejection reason: ${amendment.rejectionReason}`} />
      )}
    </div>
  );
};

const AnswerOptionCard = ({ addition, status, reason, busy, canReview, onReasonChange, onReview }) => (
  <div
    style={{
      borderRadius: "12px",
      border: "1px solid rgba(34,197,94,0.22)",
      background: "rgba(34,197,94,0.05)",
      padding: "14px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    }}
  >
    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", font: `500 12px ${FONT}`, color: MUTED }}>
      <Chip tone={statusTone(addition.status)}>{String(addition.status || "").toUpperCase()}</Chip>
      <span>
        Proposed by{" "}
        <Link to={`/users/${addition.proposedBy}`} style={{ color: YES_TEXT, textDecoration: "none" }}>
          @{addition.proposedBy}
        </Link>
      </span>
      <span>{addition.createdAt ? new Date(addition.createdAt).toLocaleString() : ""}</span>
    </div>

    <div>
      <SectionLabel color={YES_TEXT}>Answer option</SectionLabel>
      <div style={{ marginTop: "4px", font: `800 18px ${FONT_HEAD}`, color: TEXT }}>{addition.answerLabel}</div>
      <div style={{ marginTop: "4px", font: `500 12.5px ${FONT}`, color: MUTED }}>
        Add-answer cost: {addition.additionCost} credits
      </div>
    </div>

    {addition.status === "rejected" && addition.rejectionReason && (
      <ErrorBanner message={`Rejection reason: ${addition.rejectionReason}`} />
    )}
    {addition.status === "approved" && (
      <SuccessBanner
        message={`Approved by @${addition.reviewedBy || "reviewer"}${addition.reviewedAt ? ` at ${new Date(addition.reviewedAt).toLocaleString()}` : ""}.`}
      />
    )}

    {canReview && (
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <textarea
          value={reason}
          onChange={(event) => onReasonChange(addition.id, event.target.value)}
          rows={3}
          placeholder="Decision reason required for rejection"
          style={{ ...inputStyle, resize: "vertical" }}
        />
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <GhostButton tone="green" disabled={busy} onClick={() => onReview(addition, "approved")}>
            Approve answer
          </GhostButton>
          <GhostButton tone="red" disabled={busy || !reason.trim()} onClick={() => onReview(addition, "rejected")}>
            Reject
          </GhostButton>
        </div>
      </div>
    )}
  </div>
);

const MarketChangeCard = ({ change, status, reasonById, busyAdditionId, onReasonChange, onReviewAddition }) => {
  const isGrouped = change.marketType === "grouped";
  const canReviewAnswerOptions = isGrouped && status === "pending";

  return (
    <SectionCard style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
          <Chip tone="sky">{isGrouped ? `GROUP #${change.groupId}` : `MARKET #${change.marketId}`}</Chip>
          <Chip tone={isGrouped ? "purple" : "neutral"}>{isGrouped ? "GROUPED MARKET" : "BINARY MARKET"}</Chip>
        </div>
        <Link
          to={change.href}
          style={{ font: `700 16px ${FONT_HEAD}`, color: TEXT, textDecoration: "none", wordBreak: "break-word" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = ACCENT)}
          onMouseLeave={(e) => (e.currentTarget.style.color = TEXT)}
        >
          {change.title}
        </Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <SectionLabel color="#9cc9f1">Description amendments</SectionLabel>
          <span style={{ font: `600 12px ${FONT}`, color: MUTED2 }}>{change.amendments.length}</span>
        </div>
        {change.amendments.length === 0 ? (
          <div style={{ font: `500 12.5px ${FONT}`, color: MUTED3, padding: "8px 0" }}>
            No {status} description amendments for this market.
          </div>
        ) : (
          change.amendments.map((amendment) => (
            <AmendmentCard key={amendmentRowKey(amendment)} amendment={amendment} status={status} />
          ))
        )}
      </div>

      {isGrouped && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <SectionLabel color={YES_TEXT}>Answer options</SectionLabel>
            <span style={{ font: `600 12px ${FONT}`, color: MUTED2 }}>{change.answerOptions.length}</span>
          </div>
          {change.answerOptions.length === 0 ? (
            <div style={{ font: `500 12.5px ${FONT}`, color: MUTED3, padding: "8px 0" }}>
              No {status} answer options for this grouped market.
            </div>
          ) : (
            change.answerOptions.map((addition) => (
              <AnswerOptionCard
                key={addition.id}
                addition={addition}
                status={status}
                reason={reasonById[addition.id] || ""}
                busy={busyAdditionId === addition.id}
                canReview={canReviewAnswerOptions}
                onReasonChange={onReasonChange}
                onReview={onReviewAddition}
              />
            ))
          )}
        </div>
      )}
    </SectionCard>
  );
};

const MarketChangesSection = () => {
  const { token } = useAuth();
  const [typeTab, setTypeTab] = useState("Grouped Markets");
  const [statusTab, setStatusTab] = useState("Pending");
  const [amendments, setAmendments] = useState([]);
  const [answerOptions, setAnswerOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [busyAdditionId, setBusyAdditionId] = useState(null);
  const [reasonById, setReasonById] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);

  const marketType = typeTab === "Binary Markets" ? "binary" : "grouped";
  const status = Object.keys(REVIEW_STATUSES).find((key) => REVIEW_STATUSES[key] === statusTab) || "pending";

  useEffect(() => {
    setPage(0);
  }, [marketType, status, searchQuery]);

  useEffect(() => {
    let ignore = false;

    const loadChanges = async () => {
      setLoading(true);
      setError("");
      setSuccessMessage("");
      try {
        const amendmentData = await listMyMarketDescriptionAmendments({ token, status, limit: 200 });
        const rawAmendments = amendmentData.amendments || [];
        const filteredAmendments = rawAmendments.filter((amendment) => (
          marketType === "grouped" ? isGroupedAmendment(amendment) : !isGroupedAmendment(amendment)
        ));

        let groupedAnswerOptions = [];
        if (marketType === "grouped") {
          const answerOptionData = await listMarketGroupAnswerAdditionsForReview({ token, status, limit: 200 });
          groupedAnswerOptions = answerOptionData.additions || [];
        }

        if (!ignore) {
          setAmendments(filteredAmendments);
          setAnswerOptions(groupedAnswerOptions);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Unable to load market changes.");
          setAmendments([]);
          setAnswerOptions([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadChanges();
    return () => {
      ignore = true;
    };
  }, [marketType, status, token]);

  const updateReason = (additionId, reason) => {
    setReasonById((current) => ({ ...current, [additionId]: reason }));
  };

  const reviewAddition = async (addition, nextStatus) => {
    const reason = String(reasonById[addition.id] || "").trim();
    if (nextStatus === "rejected" && !reason) {
      setError("A rejection reason is required.");
      return;
    }

    setBusyAdditionId(addition.id);
    setError("");
    setSuccessMessage("");
    try {
      await reviewMarketGroupAnswerAdditionForSteward({
        token,
        additionId: addition.id,
        status: nextStatus,
        reason,
        confirm: nextStatus === "approved",
      });
      updateReason(addition.id, "");
      setAnswerOptions((current) => current.filter((item) => item.id !== addition.id));
      setSuccessMessage(`Answer option "${addition.answerLabel}" ${nextStatus}.`);
    } catch (err) {
      setError(err.message || "Unable to review grouped answer option.");
    } finally {
      setBusyAdditionId(null);
    }
  };

  const groupedChanges = useMemo(
    () => groupProfileMarketChanges({ marketType, amendments, answerOptions }),
    [marketType, amendments, answerOptions],
  );
  const visibleChanges = useMemo(
    () => filterMarketChanges(groupedChanges, searchQuery),
    [groupedChanges, searchQuery],
  );
  const pageInfo = pagedRows(visibleChanges, page);

  const emptyLabel = marketType === "grouped" ? "grouped market" : "binary market";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <PillTabs tabs={Object.values(MARKET_TYPES)} active={typeTab} onChange={setTypeTab} />
        <PillTabs tabs={Object.values(REVIEW_STATUSES)} active={statusTab} onChange={setStatusTab} />
      </div>

      {error && <ErrorBanner message={error} />}
      {successMessage && <SuccessBanner message={successMessage} />}

      {marketType === "binary" && (
        <div style={{ ...CARD, padding: "12px 16px", font: `500 12.5px ${FONT}`, color: MUTED }}>
          Binary markets only support description amendments. Answer options are fixed when the market is created.
        </div>
      )}

      <input
        type="search"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder="Search title, ID, amendment text, answer option, or user"
        style={inputStyle}
      />

      {loading ? (
        <LoadingSpinner />
      ) : groupedChanges.length === 0 ? (
        <EmptyState>No {status} {emptyLabel} changes found.</EmptyState>
      ) : visibleChanges.length === 0 ? (
        <EmptyState>No {status} {emptyLabel} changes match "{searchQuery}".</EmptyState>
      ) : (
        <>
          <Pagination
            label={`${statusTab} ${emptyLabel} changes`}
            pageInfo={pageInfo}
            onPageChange={setPage}
          />
          {pageInfo.rows.map((change) => (
            <MarketChangeCard
              key={change.key}
              change={change}
              status={status}
              reasonById={reasonById}
              busyAdditionId={busyAdditionId}
              onReasonChange={updateReason}
              onReviewAddition={reviewAddition}
            />
          ))}
        </>
      )}
    </div>
  );
};

// ─── page ─────────────────────────────────────────────────────────────────────
const NewProfile = () => {
  const { t } = useTranslation();
  const { username: authUsername, logout } = useAuth();
  const history = useHistory();
  const { username: paramUsername, section: sectionParam } = useParams();
  const location = useLocation();
  const username = paramUsername || authUsername;
  const isOwnProfile = !paramUsername;
  const { userData, userLoading, userError } = useUserData(username, isOwnProfile);

  useEffect(() => {
    const name = isOwnProfile ? "Portfolio" : userData?.displayname || paramUsername;
    document.title = `${name} | Guardians Predictions`;
  }, [isOwnProfile, userData, paramUsername]);

  const isActiveModerator =
    String(userData?.usertype || "").toUpperCase() === "MODERATOR" &&
    String(userData?.moderatorStatus || "").toLowerCase() === "active";


  const accountSections = [
    { key: "overview", label: t("account.overview") },
    { key: "positions", label: t("account.positions") },
    { key: "favorites", label: t("account.favorites") },
    { key: "activity", label: t("account.activity") },
    { key: "financials", label: t("profile.financials") },
    ...(isActiveModerator
      ? [{ key: "myMarkets", label: t("profile.myMarkets") }, { key: "marketChanges", label: t("profile.marketChanges") }]
      : []),
    { key: "settings", label: t("account.settings") },
  ];
  const requestedSection = sectionParam || new URLSearchParams(location.search).get("section");
  const section = accountSections.some((s) => s.key === requestedSection) ? requestedSection : "overview";
  const setSection = (key) => history.push(`/portfolio/${key}`);
  const handleLogout = () => {
    logout();
    history.push("/");
  };

  const proposedMarket = location.state?.proposedMarket;
  const marketCreationCost = location.state?.marketCreationCost;

  return (
    <div className="bg-[#050811] min-h-screen pb-16">
      {/* Light coming down from the top edge */}
      <div style={{ position: "relative" }}>
        <TopGlow />
        <Navbar />

        <div
          className="px-4 lg:px-10"
          style={{
            position: "relative",
            zIndex: 10,
            maxWidth: DETAIL_MAX_WIDTH,
            margin: "0 auto",
            paddingTop: "32px",
            paddingBottom: "120px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {userLoading ? (
            <LoadingSpinner />
          ) : userError ? (
            <ErrorBanner message={`Error loading user data: ${userError}`} />
          ) : isOwnProfile ? (
            <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
              <ProfileSidebar
                sections={accountSections}
                active={section}
                onChange={setSection}
                onLogout={handleLogout}
                logoutLabel={t("nav.signOut")}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-4">
                <div className="hidden items-center justify-between gap-3 lg:flex">
                  <h1 className="m-0 text-[24px] font-bold text-white">
                    {accountSections.find((s) => s.key === section)?.label}
                  </h1>
                  <Link
                    to={`/users/${username}`}
                    className="flex items-center gap-2 rounded-full bg-white/[0.06] py-1.5 pl-1.5 pr-3.5 text-[13px] text-white/80 no-underline hover:bg-white/[0.1] hover:text-white"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] text-[15px]">
                      {userData?.personalEmoji || "🙂"}
                    </span>
                    @{username}
                  </Link>
                </div>
                {isActiveModerator && proposedMarket && (
                  <div
                    style={{
                      borderRadius: "14px",
                      border: "1px solid rgba(255,193,7,0.35)",
                      background: "rgba(255,193,7,0.07)",
                      padding: "16px 18px",
                    }}
                  >
                    <SectionLabel color="#ffc107">{t('profile.proposedMarketCreated')}</SectionLabel>
                    <div style={{ marginTop: "6px", font: `700 16px ${FONT_HEAD}`, color: TEXT }}>
                      {proposedMarket.questionTitle}
                    </div>
                    <p style={{ margin: "6px 0 0", font: `500 13px ${FONT}`, color: MUTED }}>
                      Market ID <span style={{ fontFamily: "monospace", color: TEXT }}>{proposedMarket.id}</span> is awaiting admin review.
                      {marketCreationCost !== undefined && marketCreationCost !== null && (
                        <> The proposal cost was <span style={{ color: TEXT, fontWeight: 700 }}>{marketCreationCost}</span> credits.</>
                      )}
                    </p>
                  </div>
                )}
                {section === "overview" && <ProfileOverview username={username} />}
                {section === "positions" && <ProfilePositions username={username} />}
                {section === "favorites" && <ProfileFavorites />}
                {section === "activity" && <ProfileActivity username={username} />}
                {section === "financials" && <ProfileFinancials username={username} />}
                {section === "myMarkets" && <MyMarketsSection />}
                {section === "marketChanges" && <MarketChangesSection />}
                {section === "settings" && <ProfileSettings userData={userData} />}
              </div>
            </div>
          ) : (
            <PublicProfile userData={userData} />
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default NewProfile;
