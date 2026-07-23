import React from "react";
import { Link } from "react-router-dom";
import { CARD, FONT, FONT_HEAD, COLOR } from "../../../styles/darkTokens";

// Shared building blocks for the dark / glassmorphism profile UI, used by both
// the private profile (newprofile) and the public profile (user) pages so the
// two stay visually consistent.

const TEXT = COLOR.text;
const MUTED = COLOR.muted;
const MUTED2 = COLOR.muted2;
const MUTED3 = COLOR.muted3;
const YES_TEXT = COLOR.yesText;
const NO_TEXT = COLOR.noText;

export const PAGE_SIZE = 20;

export const CHIP_TONES = {
  neutral: { border: "rgba(255,255,255,0.14)", bg: "rgba(255,255,255,0.06)", color: "#cbd5e1" },
  sky:     { border: "rgba(156,201,241,0.35)", bg: "rgba(156,201,241,0.10)", color: "#9cc9f1" },
  green:   { border: "rgba(186,214,89,0.35)",   bg: "rgba(186,214,89,0.10)",   color: "#C6E06C" },
  red:     { border: "rgba(251,91,107,0.35)",  bg: "rgba(251,91,107,0.10)",  color: "#fb8b96" },
  amber:   { border: "rgba(255,193,7,0.35)",   bg: "rgba(255,193,7,0.08)",   color: "#ffc107" },
  purple:  { border: "rgba(167,139,250,0.35)", bg: "rgba(167,139,250,0.10)", color: "#c4b5fd" },
};

export const statusTone = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "published" || s === "approved") return "green";
  if (s === "rejected") return "red";
  if (s === "proposed" || s === "pending") return "amber";
  return "neutral";
};

export const inputStyle = {
  width: "100%",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.30)",
  padding: "10px 12px",
  font: `500 13px ${FONT}`,
  color: TEXT,
  outline: "none",
};

export const formatDate = (value) => {
  if (!value) return "n/a";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "n/a" : date.toLocaleString();
};

export const Chip = ({ children, tone = "neutral" }) => {
  const t = CHIP_TONES[tone] || CHIP_TONES.neutral;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: "999px",
        border: `1px solid ${t.border}`,
        background: t.bg,
        color: t.color,
        font: `700 11px ${FONT}`,
        letterSpacing: ".05em",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
};

export const PillTabs = ({ tabs, active, onChange }) => (
  <div
    style={{
      display: "inline-flex",
      gap: "2px",
      background: "rgba(0,0,0,0.25)",
      borderRadius: "11px",
      padding: "3px",
      flexWrap: "wrap",
    }}
  >
    {tabs.map((tab) => (
      <button
        key={tab}
        onClick={() => onChange(tab)}
        style={{
          padding: "7px 15px",
          borderRadius: "9px",
          border: "none",
          font: `700 12.5px ${FONT}`,
          cursor: "pointer",
          background: active === tab ? "rgba(255,255,255,0.10)" : "transparent",
          color: active === tab ? TEXT : MUTED2,
          transition: "all .15s",
        }}
      >
        {tab}
      </button>
    ))}
  </div>
);

export const SectionCard = ({ children, style }) => (
  <div style={{ ...CARD, padding: "18px 20px", ...style }}>{children}</div>
);

export const SectionLabel = ({ children, color = MUTED2 }) => (
  <div style={{ font: `700 11px ${FONT}`, letterSpacing: ".09em", color, textTransform: "uppercase" }}>
    {children}
  </div>
);

export const StatCard = ({ label, value, valueColor = TEXT }) => (
  <div style={{ ...CARD, padding: "14px 16px" }}>
    <div style={{ font: `600 11px ${FONT}`, letterSpacing: ".06em", color: MUTED2, textTransform: "uppercase" }}>
      {label}
    </div>
    <div style={{ font: `800 20px ${FONT_HEAD}`, marginTop: "4px", color: valueColor }}>{value}</div>
  </div>
);

export const EmptyState = ({ children }) => (
  <div
    style={{
      ...CARD,
      padding: "26px 20px",
      textAlign: "center",
      font: `500 13px ${FONT}`,
      color: MUTED2,
    }}
  >
    {children}
  </div>
);

export const ErrorBanner = ({ message }) => (
  <div
    style={{
      background: "rgba(251,91,107,0.12)",
      border: "1px solid rgba(251,91,107,0.3)",
      borderRadius: "10px",
      padding: "10px 14px",
      font: `500 13px ${FONT}`,
      color: NO_TEXT,
    }}
    role="alert"
  >
    {message}
  </div>
);

export const SuccessBanner = ({ message }) => (
  <div
    style={{
      background: "rgba(34,197,94,0.12)",
      border: "1px solid rgba(34,197,94,0.3)",
      borderRadius: "10px",
      padding: "10px 14px",
      font: `600 13px ${FONT}`,
      color: YES_TEXT,
    }}
  >
    {message}
  </div>
);

export const GhostButton = ({ children, onClick, disabled, tone = "sky", style, as, to }) => {
  const t = CHIP_TONES[tone] || CHIP_TONES.sky;
  const sharedStyle = {
    padding: "7px 14px",
    borderRadius: "9px",
    border: `1px solid ${t.border}`,
    background: t.bg,
    color: disabled ? MUTED2 : t.color,
    font: `700 12px ${FONT}`,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
    transition: "all .15s",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    ...style,
  };

  if (as === "link" && to) {
    return (
      <Link to={to} style={sharedStyle}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} style={sharedStyle}>
      {children}
    </button>
  );
};

export const pagedRows = (rows = [], page = 0, pageSize = PAGE_SIZE) => {
  const total = rows.length;
  const maxPage = Math.max(0, Math.ceil(total / pageSize) - 1);
  const currentPage = Math.min(Math.max(0, page), maxPage);
  const start = currentPage * pageSize;
  return {
    currentPage,
    start,
    total,
    rows: rows.slice(start, start + pageSize),
    hasPrevious: currentPage > 0,
    hasNext: start + pageSize < total,
  };
};

export const Pagination = ({ label, pageInfo, onPageChange }) => {
  if (!pageInfo.total) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        flexWrap: "wrap",
      }}
    >
      <div style={{ font: `600 11px ${FONT}`, letterSpacing: ".08em", color: MUTED2, textTransform: "uppercase" }}>
        {label} · page {pageInfo.currentPage + 1} ({pageInfo.start + 1}-{pageInfo.start + pageInfo.rows.length} of {pageInfo.total})
      </div>
      <div style={{ display: "flex", gap: "6px" }}>
        <GhostButton
          tone="neutral"
          disabled={!pageInfo.hasPrevious}
          onClick={() => onPageChange((current) => Math.max(0, current - 1))}
        >
          Previous
        </GhostButton>
        <GhostButton
          tone="neutral"
          disabled={!pageInfo.hasNext}
          onClick={() => onPageChange((current) => current + 1)}
        >
          Next
        </GhostButton>
      </div>
    </div>
  );
};

// ─── lifecycle market card (used by "My Markets" / "Owned Markets") ───────────
export const LifecycleMarketCard = ({ market, profileUsername }) => {
  const [expanded, setExpanded] = React.useState(false);
  const status = market.lifecycleStatus || market.status || "unknown";
  const children = Array.isArray(market.childMarkets) ? market.childMarkets : [];
  const viewMarketId = market.isMarketGroup ? children[0]?.id : market.id;

  const isCreator = profileUsername && market.creatorUsername === profileUsername;
  const isSteward = profileUsername && market.stewardUsername === profileUsername
    && market.stewardUsername !== market.creatorUsername;

  return (
    <SectionCard>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
            <Chip tone={statusTone(status)}>{status.toUpperCase()}</Chip>
            <Chip tone="sky">
              {market.isMarketGroup ? `GROUP #${market.marketGroup?.id || market.id}` : `MARKET #${market.id}`}
            </Chip>
            {market.isMarketGroup && <Chip tone="purple">GROUPED</Chip>}
            {isCreator && <Chip tone="green">CREATOR</Chip>}
            {isSteward && <Chip tone="sky">STEWARD</Chip>}
          </div>
          <div style={{ font: `700 16px ${FONT_HEAD}`, color: TEXT, wordBreak: "break-word" }}>
            {market.questionTitle}
          </div>
          <div style={{ marginTop: "4px", font: `500 12px ${FONT}`, color: MUTED2 }}>
            Created {formatDate(market.createdAt)}
          </div>
        </div>
        {status === "published" && viewMarketId && (
          <Link
            to={`/markets/${viewMarketId}`}
            style={{
              padding: "7px 14px",
              borderRadius: "9px",
              border: "1px solid rgba(156,201,241,0.35)",
              background: "rgba(156,201,241,0.10)",
              color: COLOR.accent,
              font: `700 12px ${FONT}`,
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            View market
          </Link>
        )}
      </div>

      {market.description && (
        <div style={{ marginTop: "10px" }}>
          <div
            style={{
              font: `400 13px/1.6 ${FONT}`,
              color: "#b7c6d6",
              whiteSpace: expanded ? "pre-wrap" : "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              wordBreak: expanded ? "break-word" : "normal",
            }}
          >
            {market.description}
          </div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            style={{
              marginTop: "4px",
              border: "none",
              background: "transparent",
              color: COLOR.accent,
              font: `600 12px ${FONT}`,
              cursor: "pointer",
              padding: 0,
            }}
          >
            {expanded ? "Show less" : "Show full description"}
          </button>
        </div>
      )}

      {market.isMarketGroup && children.length > 0 && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "10px" }}>
          {children.map((child) => (
            <Chip key={child.id} tone="sky">
              {child.marketGroup?.answerLabel || child.questionTitle || `Market #${child.id}`} · #{child.id}
            </Chip>
          ))}
        </div>
      )}

      {!market.isMarketGroup && (market.yesLabel || market.noLabel) && (
        <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
          <Chip tone="green">YES · {String(market.yesLabel || "YES").trim() || "YES"}</Chip>
          <Chip tone="red">NO · {String(market.noLabel || "NO").trim() || "NO"}</Chip>
        </div>
      )}

      <div style={{ marginTop: "12px", font: `500 12px/1.7 ${FONT}`, color: MUTED }}>
        {market.proposalCost > 0 && <div>Proposal cost: {market.proposalCost} credits</div>}
        {market.approvedBy && <div>Approved by @{market.approvedBy} at {formatDate(market.approvedAt)}</div>}
        {market.rejectedBy && <div>Rejected by @{market.rejectedBy} at {formatDate(market.rejectedAt)}</div>}
        {market.rejectionReason && <div style={{ color: NO_TEXT }}>Reason: {market.rejectionReason}</div>}
        {!market.approvedBy && !market.rejectedBy && <div style={{ color: MUTED3 }}>Awaiting admin review</div>}
      </div>
    </SectionCard>
  );
};

// ─── financials ───────────────────────────────────────────────────────────────
export const FinancialValue = ({ value }) => {
  if (value === null || value === undefined) {
    return <span style={{ color: MUTED3 }}>N/A</span>;
  }
  return (
    <span style={{ color: value >= 0 ? YES_TEXT : NO_TEXT, font: `800 15px ${FONT_HEAD}` }}>
      {value.toLocaleString()}
    </span>
  );
};

export const FinancialGroup = ({ title, accent, items }) => (
  <SectionCard>
    <SectionLabel color={accent}>{title}</SectionLabel>
    <div style={{ marginTop: "10px" }}>
      {items.map((item, index) => (
        <div
          key={item.name}
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
            padding: "11px 0",
            borderTop: index > 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ font: `700 13px ${FONT}`, color: TEXT }}>{item.name}</div>
            <div style={{ marginTop: "2px", font: `400 12px/1.5 ${FONT}`, color: MUTED2 }}>
              {item.description}
            </div>
            <div style={{ marginTop: "2px", font: `500 11px ${FONT}`, color: MUTED3, fontFamily: "monospace" }}>
              {item.formula}
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            <FinancialValue value={item.value} />
          </div>
        </div>
      ))}
    </div>
  </SectionCard>
);

// Builds the four financial item groups shared by the private and public profile pages.
export const buildFinancialItemGroups = (financialData) => ({
  balanceSheetItems: [
    { name: "Account Balance", value: financialData.accountBalance, description: "Current available funds (cash equivalent)", formula: "Initial Balance + All Gains/Losses" },
    { name: "Amount In Play", value: financialData.amountInPlay, description: "Total current value of all positions", formula: "Sum of all position values" },
    { name: "Amount Borrowed", value: financialData.amountBorrowed, description: "Amount owed when account balance is negative", formula: "max(0, -accountBalance)" },
    { name: "Retained Earnings", value: financialData.retainedEarnings, description: "Funds not currently invested in positions", formula: "accountBalance - amountInPlay" },
    { name: "Total Equity", value: financialData.equity, description: "Total financial position after liabilities", formula: "retainedEarnings + amountInPlay - amountBorrowed" },
    { name: "Maximum Debt Allowed", value: financialData.maximumDebtAllowed, description: "Credit limit for borrowing", formula: "System configuration limit" },
  ],
  incomeStatementItems: [
    { name: "Trading Profits", value: financialData.tradingProfits, description: "Net gains/losses from market positions", formula: "Sum of (position.value - position.totalSpent)" },
    { name: "Work Profits", value: financialData.workProfits, description: "Net work profit from resolved stewarded markets", formula: "Resolved participant fees - proposal costs" },
    { name: "Unrealized Work Income", value: financialData.unrealizedWorkIncome, description: "Projected participant-fee income from unresolved stewarded markets", formula: "Unresolved participant fees" },
    { name: "Unrealized Work Profits", value: financialData.unrealizedWorkProfits, description: "Projected work profit from unresolved stewarded markets", formula: "Unresolved participant fees - proposal costs" },
    { name: "Total Profits", value: financialData.totalProfits, description: "Combined profits from all sources", formula: "tradingProfits + workProfits" },
    { name: "Realized Profits", value: financialData.realizedProfits, description: "Confirmed gains/losses from resolved positions", formula: "Profits from resolved markets only" },
    { name: "Potential Profits", value: financialData.potentialProfits, description: "Unrealized gains/losses from active positions", formula: "Profits from unresolved markets only" },
  ],
  cashFlowItems: [
    { name: "Total Spent", value: financialData.totalSpent, description: "All money invested across all markets", formula: "Sum of all bet amounts ever placed" },
    { name: "Total Spent In Play", value: financialData.totalSpentInPlay, description: "Money invested in current positions", formula: "Sum of totalSpent for current positions" },
    { name: "Amount In Play (Active)", value: financialData.amountInPlayActive, description: "Current value of unresolved positions only", formula: "Sum of position values (unresolved markets)" },
  ],
  marketPositionItems: [
    { name: "Realized Value", value: financialData.realizedValue, description: "Final value from resolved positions", formula: "Sum of values from resolved markets" },
    { name: "Potential Value", value: financialData.potentialValue, description: "Current estimated value of active positions", formula: "Sum of values from unresolved markets" },
    {
      name: "Position Efficiency",
      value: financialData.totalSpentInPlay > 0
        ? Math.round((financialData.amountInPlayActive / financialData.totalSpentInPlay) * 100)
        : 0,
      description: "Current position value vs amount spent (%)",
      formula: "(amountInPlayActive / totalSpentInPlay) × 100",
    },
  ],
});
