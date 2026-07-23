import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import LoadingSpinner from "../../components/loaders/LoadingSpinner";
import MarkdownLite from "../../components/markdown/MarkdownLite";
import ProfileModal from "../../components/buttons/profile/ProfileModal";
import EmojiSelector from "../../components/buttons/profile/EmojiSelector";
import DescriptionSelector from "../../components/buttons/profile/DescriptionSelector";
import DisplayNameSelector from "../../components/buttons/profile/DisplayNameSelector";
import PersonalLinksSelector from "../../components/buttons/profile/PersonalLinksSelector";
import { groupLifecycleMarketRows } from "../../components/layouts/profile/MarketLifecycleTable";
import useUserData from "../../hooks/useUserData";
import { useAuth } from "../../helpers/AuthContent";
import { API_URL } from "../../config";
import { listMyLifecycleMarkets } from "../../api/lifecycleMarketsApi";
import { listMyMarketDescriptionAmendments } from "../../api/marketDescriptionAmendmentsApi";
import {
  listMarketGroupAnswerAdditionsForReview,
  reviewMarketGroupAnswerAdditionForSteward,
} from "../../api/marketsApi";
import { CARD, FONT, FONT_HEAD, COLOR } from "../../styles/darkTokens";
import {
  PAGE_SIZE,
  Chip,
  PillTabs,
  SectionCard,
  SectionLabel,
  StatCard,
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
  FinancialGroup,
  buildFinancialItemGroups,
} from "../../components/layouts/profile/ProfileUiKit";

// ─── design tokens ────────────────────────────────────────────────────────────
const TEXT = COLOR.text;
const MUTED = COLOR.muted;
const MUTED2 = COLOR.muted2;
const MUTED3 = COLOR.muted3;
const ACCENT = COLOR.accent;
const YES_TEXT = COLOR.yesText;
const NO_TEXT = COLOR.noText;

// ─── identity / user info ─────────────────────────────────────────────────────
const IdentityCard = ({ userData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");
  const [personalEmoji, setPersonalEmoji] = useState(userData?.personalEmoji || "");
  const [personalDisplayName, setPersonalDisplayName] = useState(userData?.displayname || "");
  const [personalDescription, setPersonalDescription] = useState(userData?.description || "");
  const [personalLinks, setPersonalLinks] = useState({
    personalLink1: userData?.personalink1 || "",
    personalLink2: userData?.personalink2 || "",
    personalLink3: userData?.personalink3 || "",
    personalLink4: userData?.personalink4 || "",
  });

  const openModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  const modalTitle = {
    emoji: "Select Emoji",
    displayname: "Edit Display Name",
    description: "Edit Description",
    links: "Edit Personal Links",
  }[modalType] || "";

  const links = Object.values(personalLinks).filter(Boolean);

  const usertype = String(userData?.usertype || "").toUpperCase();
  const moderatorStatus = String(userData?.moderatorStatus || "").toLowerCase();

  return (
    <SectionCard>
      <div style={{ display: "flex", gap: "18px", alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Avatar */}
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "20px",
            background: "rgba(156,201,241,0.10)",
            border: "1px solid rgba(156,201,241,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "34px",
            flexShrink: 0,
          }}
        >
          {personalEmoji || "👤"}
        </div>

        {/* Identity */}
        <div style={{ flex: 1, minWidth: "220px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <h1 style={{ margin: 0, font: `800 24px ${FONT_HEAD}`, color: TEXT, letterSpacing: "-.01em" }}>
              {personalDisplayName || userData?.username}
            </h1>
            {usertype && <Chip tone="sky">{usertype}</Chip>}
            {moderatorStatus && (
              <Chip tone={moderatorStatus === "active" ? "green" : "amber"}>
                MOD {moderatorStatus.toUpperCase()}
              </Chip>
            )}
          </div>
          <div style={{ marginTop: "4px", font: `600 13px ${FONT}`, color: MUTED }}>
            @{userData?.username}
            <span style={{ opacity: 0.4, margin: "0 8px" }}>•</span>
            <Link
              to={`/newprofile/${userData?.username}`}
              style={{ color: ACCENT, textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            >
              View public profile
            </Link>
          </div>
          {personalDescription ? (
            <p style={{ margin: "10px 0 0", font: `400 13.5px/1.6 ${FONT}`, color: "#b7c6d6", maxWidth: "560px" }}>
              {personalDescription}
            </p>
          ) : (
            <p style={{ margin: "10px 0 0", font: `400 13px ${FONT}`, color: MUTED3, fontStyle: "italic" }}>
              No description yet.
            </p>
          )}
          {links.length > 0 && (
            <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
              {links.map((link) => (
                <a
                  key={link}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "4px 12px",
                    borderRadius: "999px",
                    border: "1px solid rgba(156,201,241,0.25)",
                    background: "rgba(156,201,241,0.07)",
                    color: ACCENT,
                    font: `600 12px ${FONT}`,
                    textDecoration: "none",
                    maxWidth: "260px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {link.replace(/^https?:\/\//, "")}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Edit actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 }}>
          <GhostButton onClick={() => openModal("emoji")}>Edit emoji</GhostButton>
          <GhostButton onClick={() => openModal("displayname")}>Edit display name</GhostButton>
          <GhostButton onClick={() => openModal("description")}>Edit description</GhostButton>
          <GhostButton onClick={() => openModal("links")}>Edit links</GhostButton>
        </div>
      </div>

      {isModalOpen && (
        <ProfileModal isOpen={isModalOpen} onClose={closeModal} title={modalTitle}>
          {modalType === "emoji" && (
            <EmojiSelector
              currentEmoji={personalEmoji}
              onSave={(emoji) => {
                setPersonalEmoji(emoji);
                closeModal();
              }}
            />
          )}
          {modalType === "displayname" && (
            <DisplayNameSelector
              onSave={(displayname) => {
                setPersonalDisplayName(displayname);
                closeModal();
              }}
            />
          )}
          {modalType === "description" && (
            <DescriptionSelector
              onSave={(description) => {
                setPersonalDescription(description);
                closeModal();
              }}
            />
          )}
          {modalType === "links" && (
            <PersonalLinksSelector
              initialLinks={personalLinks}
              onSave={(newLinks) => {
                setPersonalLinks((prev) => ({ ...prev, ...newLinks }));
                closeModal();
              }}
            />
          )}
        </ProfileModal>
      )}
    </SectionCard>
  );
};

// ─── portfolio ────────────────────────────────────────────────────────────────
const PortfolioSection = ({ username }) => {
  const { token } = useAuth();
  const [positions, setPositions] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setPage(0);
  }, [username]);

  useEffect(() => {
    const fetchPositions = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/v0/portfolio/${username}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error(`Error fetching portfolio: ${response.statusText}`);
        const data = await response.json();
        setPositions(data.portfolioItems || []);
        setPage(0);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (username && token) {
      fetchPositions();
    } else {
      setPositions([]);
      setLoading(false);
    }
  }, [username, token]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={`Error loading portfolio: ${error}`} />;
  if (!positions.length) return <EmptyState>No positions found. Start trading to build your portfolio.</EmptyState>;

  const totalYes = positions.reduce((sum, pos) => sum + pos.yesSharesOwned, 0);
  const totalNo = positions.reduce((sum, pos) => sum + pos.noSharesOwned, 0);
  const pageInfo = pagedRows(positions, page);

  const th = {
    padding: "10px 14px",
    textAlign: "left",
    font: `700 10.5px ${FONT}`,
    letterSpacing: ".09em",
    color: MUTED2,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  };
  const td = { padding: "13px 14px", font: `500 13px ${FONT}`, color: TEXT, verticalAlign: "top" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Total markets" value={positions.length} />
        <StatCard label="YES shares" value={totalYes} valueColor={YES_TEXT} />
        <StatCard label="NO shares" value={totalNo} valueColor={NO_TEXT} />
      </div>

      <Pagination label="Portfolio" pageInfo={pageInfo} onPageChange={setPage} />

      <div style={{ ...CARD, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.18)" }}>
                <th style={th}>Market</th>
                <th style={{ ...th, textAlign: "center" }}>YES</th>
                <th style={{ ...th, textAlign: "center" }}>NO</th>
                <th style={{ ...th, textAlign: "center" }}>Total</th>
                <th style={{ ...th, textAlign: "center" }}>Last bet</th>
              </tr>
            </thead>
            <tbody>
              {pageInfo.rows.map((position, index) => (
                <tr
                  key={position.marketId || index}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <td style={td}>
                    <Link
                      to={`/markets/${position.marketId}`}
                      style={{ color: TEXT, textDecoration: "none", font: `600 13.5px ${FONT}` }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = ACCENT)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = TEXT)}
                    >
                      {position.questionTitle || "Unknown Market"}
                    </Link>
                    <div style={{ marginTop: "3px", font: `500 11px ${FONT}`, color: MUTED3 }}>
                      ID: {position.marketId}
                    </div>
                  </td>
                  <td style={{ ...td, textAlign: "center" }}>
                    {position.yesSharesOwned > 0 ? (
                      <Chip tone="green">{position.yesSharesOwned} YES</Chip>
                    ) : (
                      <span style={{ color: MUTED3 }}>—</span>
                    )}
                  </td>
                  <td style={{ ...td, textAlign: "center" }}>
                    {position.noSharesOwned > 0 ? (
                      <Chip tone="red">{position.noSharesOwned} NO</Chip>
                    ) : (
                      <span style={{ color: MUTED3 }}>—</span>
                    )}
                  </td>
                  <td style={{ ...td, textAlign: "center", font: `700 13px ${FONT_HEAD}` }}>
                    {position.yesSharesOwned + position.noSharesOwned}
                  </td>
                  <td style={{ ...td, textAlign: "center", color: MUTED }}>
                    {new Date(position.lastBetPlaced).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── financials ───────────────────────────────────────────────────────────────
const FinancialsSection = ({ username }) => {
  const { token } = useAuth();
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const response = await fetch(`${API_URL}/v0/users/${username}/financial`, {
          headers: token
            ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
            : {},
        });
        if (!response.ok) throw new Error(`Error fetching financial data: ${response.statusText}`);
        const data = await response.json();
        setFinancialData(data.financial);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (username && token) {
      fetchFinancialData();
    } else {
      setFinancialData(null);
      setLoading(false);
    }
  }, [username, token]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={`Error loading financial data: ${error}`} />;
  if (!financialData) return <EmptyState>No financial data available.</EmptyState>;

  const { balanceSheetItems, incomeStatementItems, cashFlowItems, marketPositionItems } =
    buildFinancialItemGroups(financialData);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          label="Account balance"
          value={financialData.accountBalance?.toLocaleString() ?? "N/A"}
          valueColor={(financialData.accountBalance ?? 0) >= 0 ? YES_TEXT : NO_TEXT}
        />
        <StatCard label="Amount in play" value={financialData.amountInPlay?.toLocaleString() ?? "N/A"} />
        <StatCard
          label="Total profits"
          value={financialData.totalProfits?.toLocaleString() ?? "N/A"}
          valueColor={(financialData.totalProfits ?? 0) >= 0 ? YES_TEXT : NO_TEXT}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
        <FinancialGroup title="Balance Sheet — Financial Position" accent="#9cc9f1" items={balanceSheetItems} />
        <FinancialGroup title="Income Statement — Profitability" accent="#C6E06C" items={incomeStatementItems} />
        <FinancialGroup title="Cash Flow — Investment Activity" accent="#ffc107" items={cashFlowItems} />
        <FinancialGroup title="Market Position — Trading Performance" accent="#c4b5fd" items={marketPositionItems} />
      </div>
    </div>
  );
};

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
        <Link to={`/newprofile/${addition.proposedBy}`} style={{ color: YES_TEXT, textDecoration: "none" }}>
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
  const { username } = useAuth();
  const location = useLocation();
  const { userData, userLoading, userError } = useUserData(username, true);
  const [mainTab, setMainTab] = useState("Portfolio");

  useEffect(() => {
    document.title = "Profile | Guardians Predictions";
  }, []);

  const isActiveModerator =
    String(userData?.usertype || "").toUpperCase() === "MODERATOR" &&
    String(userData?.moderatorStatus || "").toLowerCase() === "active";

  const mainTabs = ["Portfolio", "Financials", ...(isActiveModerator ? ["My Markets", "Market Changes"] : [])];
  const activeTab = mainTabs.includes(mainTab) ? mainTab : "Portfolio";

  const proposedMarket = location.state?.proposedMarket;
  const marketCreationCost = location.state?.marketCreationCost;

  return (
    <div className="bg-primary-background min-h-screen pb-16">
      {/* Blue glow blob */}
      <div
        style={{
          position: "fixed",
          width: "75vw",
          height: "100vh",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          background: "linear-gradient(135deg, rgb(81 173 246 / 35%) 0%, rgb(30 144 255 / 30%) 0%)",
          filter: "blur(250px)",
          pointerEvents: "none",
          zIndex: 0,
          borderRadius: "50%",
        }}
      />
      <Navbar />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "1080px",
          margin: "0 auto",
          padding: "32px 20px 48px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {userLoading ? (
          <LoadingSpinner />
        ) : userError ? (
          <ErrorBanner message={`Error loading user data: ${userError}`} />
        ) : (
          <>
            <IdentityCard userData={userData} />

            {isActiveModerator && proposedMarket && (
              <div
                style={{
                  borderRadius: "14px",
                  border: "1px solid rgba(255,193,7,0.35)",
                  background: "rgba(255,193,7,0.07)",
                  padding: "16px 18px",
                }}
              >
                <SectionLabel color="#ffc107">Proposed market created</SectionLabel>
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

            <div>
              <PillTabs tabs={mainTabs} active={activeTab} onChange={setMainTab} />
            </div>

            {activeTab === "Portfolio" && <PortfolioSection username={username} />}
            {activeTab === "Financials" && <FinancialsSection username={username} />}
            {activeTab === "My Markets" && isActiveModerator && <MyMarketsSection />}
            {activeTab === "Market Changes" && isActiveModerator && <MarketChangesSection />}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default NewProfile;
