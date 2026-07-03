import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../navbar/Navbar";
import NewMarketChart from "../charts/NewMarketChart";
import ActivityTabs from "../tabs/ActivityTabs";
import NewTradePanel from "./NewTradePanel";
import ResolveModalButton from "../modals/resolution/ResolveModal";
import ResolutionAlert from "../resolutions/ResolutionAlert";
import { stewardUsernameFor } from "../markets/StewardTag";
import formatResolutionDate from "../../helpers/formatResolutionDate";
import { BG_PAGE, CARD, FONT, FONT_HEAD, COLOR } from "../../styles/darkTokens";

// ─── local aliases ────────────────────────────────────────────────────────────
const BG = BG_PAGE;
const FONT_BODY = FONT;
const YES_GREEN = COLOR.yes;
const YES_TEXT = COLOR.yesText;
const NO_RED = COLOR.no;
const NO_TEXT = COLOR.noText;
const MUTED = COLOR.muted;
const MUTED2 = COLOR.muted2;
const MUTED3 = COLOR.muted3;
const TEXT = COLOR.text;

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(Math.round(n));
};

// ─── sub-components ───────────────────────────────────────────────────────────
const StatCard = ({ label, value }) => (
  <div style={{ ...CARD, padding: "13px 15px" }}>
    <div style={{ font: `600 11px ${FONT_BODY}`, color: MUTED2 }}>{label}</div>
    <div
      style={{ font: `800 17px ${FONT_HEAD}`, marginTop: "3px", color: TEXT }}
    >
      {value}
    </div>
  </div>
);

const TabBar = ({ tabs, active, onSelect }) => (
  <div
    style={{
      display: "flex",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
    }}
  >
    {tabs.map((t) => (
      <button
        key={t}
        onClick={() => onSelect(t)}
        style={{
          flex: 1,
          padding: "14px 0",
          border: "none",
          cursor: "pointer",
          font: `700 13.5px ${FONT_BODY}`,
          background: "transparent",
          color: active === t ? TEXT : "#7d92a8",
          boxShadow: active === t ? `inset 0 -2px 0 ${YES_GREEN}` : "none",
          transition: "color .15s",
        }}
      >
        {t}
      </button>
    ))}
  </div>
);

// ─── responsive hook ─────────────────────────────────────────────────────────
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < breakpoint,
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

// ─── main component ───────────────────────────────────────────────────────────
function TestMarketDetailsLayout({
  market,
  creator,
  numUsers,
  totalVolume,
  currentProbability,
  probabilityChanges,
  marketId,
  username,
  token,
  isLoggedIn,
  refetchData,
}) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const isMobile = useIsMobile();

  // Load Manrope + Sora from Google Fonts
  useEffect(() => {
    if (document.getElementById("gp-fonts")) return;
    const link = document.createElement("link");
    link.id = "gp-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@700;800&display=swap";
    document.head.appendChild(link);
  }, []);

  const safeMarket = market ?? {};
  const safeCreator = creator ?? {};
  const creatorUsername =
    safeMarket.creatorUsername ?? safeCreator.username ?? "unknown";
  const stewardUsername = stewardUsernameFor(safeMarket, creatorUsername);

  const yesPct = Math.round(currentProbability * 100);
  const noPct = 100 - yesPct;
  const yesLabel = safeMarket.yesLabel || "Yes";
  const noLabel = safeMarket.noLabel || "No";

  const isMarketOpen =
    !safeMarket.isResolved &&
    safeMarket.resolutionDateTime &&
    new Date(safeMarket.resolutionDateTime) > new Date();

  const canResolveMarket =
    !safeMarket.isResolved &&
    String(username || "").trim() === String(stewardUsername || "").trim();

  const handleTransactionSuccess = () => {
    if (refetchData) refetchData();
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleMarketResolved = () => {
    if (refetchData) refetchData();
    setRefreshTrigger((prev) => prev + 1);
  };

  const closesLabel = safeMarket.isResolved
    ? "Closed"
    : formatResolutionDate(safeMarket.resolutionDateTime);

  return (
    <div
      style={{
        minHeight: "100vh",
        color: TEXT,
        fontFamily: FONT_BODY,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          left: "50%",
          top: "0%",
          transform: "translate(-50%, -50%)",
          // background: "#51ADF6",// opacity: 0.3,
          background:
            "linear-gradient(135deg, rgb(81 173 246 / 5%) 0%, rgb(30 144 255 / 10%) 0%)",
          filter: "blur(150px)",
          pointerEvents: "none",
          zIndex: 0,
          borderRadius: "50%",
        }}
      />
      {/* ── Navbar ── */}
      <div style={{ position: "relative", zIndex: 20 }}>
        <Navbar />
      </div>

      {/* ── Body ── */}
      <div
        style={{
          zIndex: 10,
          maxWidth: "1180px",
          margin: "0 auto",
          padding: isMobile ? "16px 16px 60px" : "22px 40px 60px",
        }}
      >
        {/* Breadcrumb */}
        <div
          style={{
            font: `600 12px ${FONT_BODY}`,
            color: MUTED2,
            marginBottom: "14px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Link
            to="/new-markets"
            style={{
              color: COLOR.accent,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Markets
          </Link>
          {!isMobile && (
            <>
              <span style={{ opacity: 0.4 }}>/</span>
              <span style={{ color: "#93a7bd" }}>
                {safeMarket.questionTitle?.slice(0, 50)}
              </span>
            </>
          )}
        </div>

        {/* Resolution alert */}
        <ResolutionAlert
          isResolved={safeMarket.isResolved}
          resolutionResult={safeMarket.resolutionResult}
          market={safeMarket}
        />

        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            marginBottom: isMobile ? "16px" : "22px",
          }}
        >
          {/* Icon — hidden on mobile to save space */}
          {!isMobile && (
            <div
              style={{
                width: "52px",
                height: "56px",
                flexShrink: 0,
                borderRadius: "10px",
                background: "linear-gradient(160deg,#1d3a5f,#0f2138)",
                border: "1px solid rgba(255,255,255,0.10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Soccer ball */}
              <svg
                width="26"
                height="26"
                viewBox="0 0 512 512"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="#eaf0f7"
                  d="M255.03 33.813c-1.834-.007-3.664-.007-5.5.03-6.73.14-13.462.605-20.155 1.344.333.166.544.32.47.438L204.78 75.063l73.907 49.437-.125.188 70.625.28L371 79.282 342.844 52c-15.866-6.796-32.493-11.776-49.47-14.78-12.65-2.24-25.497-3.36-38.343-3.407zM190.907 88.25l-73.656 36.78-13.813 98.407 51.344 33.657 94.345-43.438 14.875-76.5-73.094-48.906zm196.344.344l-21.25 44.5 36.75 72.72 62.063 38.905 11.312-21.282c.225.143.45.403.656.75-.77-4.954-1.71-9.893-2.81-14.782-6.446-28.59-18.59-55.962-35.5-79.97-9.07-12.872-19.526-24.778-31.095-35.5l-20.125-5.342zm-302.656 23c-6.906 8.045-13.257 16.56-18.938 25.5-15.676 24.664-26.44 52.494-31.437 81.312C31.783 232.446 30.714 246.73 31 261l20.25 5.094 33.03-40.5L98.75 122.53l-14.156-10.936zm312.719 112.844l-55.813 44.75-3.47 101.093 39.626 21.126 77.188-49.594 4.406-78.75-.094.157-61.844-38.783zm-140.844 6.406l-94.033 43.312-1.218 76.625 89.155 57.376 68.938-36.437 3.437-101.75-66.28-39.126zm-224.22 49.75c.91 8.436 2.29 16.816 4.156 25.094 6.445 28.59 18.62 55.96 35.532 79.968 3.873 5.5 8.02 10.805 12.374 15.938l-9.374-48.156.124-.032-27.03-68.844-15.782-3.968zm117.188 84.844l-51.532 8.156 10.125 52.094c8.577 7.49 17.707 14.332 27.314 20.437 14.612 9.287 30.332 16.88 46.687 22.594l62.626-13.69-4.344-31.124-90.875-58.47zm302.437.5l-64.22 41.25-42 47.375 4.408 6.156c12.027-5.545 23.57-12.144 34.406-19.72 23.97-16.76 44.604-38.304 60.28-62.97 2.51-3.947 4.87-7.99 7.125-12.092zm-122.78 97.656l-79.94 9.625-25.968 5.655c26.993 4 54.717 3.044 81.313-2.813 9.412-2.072 18.684-4.79 27.75-8.062l-3.156-4.406z"
                />
              </svg>
            </div>
          )}

          {/* Title + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                margin: "0 0 8px",
                font: `800 ${isMobile ? "19px" : "26px"}/1.25 ${FONT_HEAD}`,
                letterSpacing: "-.01em",
                color: TEXT,
                wordBreak: "break-word",
              }}
            >
              {safeMarket.questionTitle}
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: isMobile ? "8px" : "14px",
                font: `600 ${isMobile ? "11.5px" : "12.5px"} ${FONT_BODY}`,
                color: "#8ca0b6",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#8ca0b6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0 }}
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
                @{creatorUsername}
              </span>
              <span style={{ opacity: 0.4 }}>•</span>
              <span>${fmt(totalVolume)} Vol.</span>
              <span style={{ opacity: 0.4 }}>•</span>
              <span>Closes {closesLabel}</span>
            </div>
          </div>

          {/* Resolve button (steward only) */}
          {canResolveMarket && (
            <div style={{ flexShrink: 0 }}>
              <ResolveModalButton
                marketId={marketId}
                token={token}
                market={market}
                onResolved={handleMarketResolved}
                disabled={!token}
                className="text-xs px-4 py-2"
              />
            </div>
          )}
        </div>

        {/* ── Layout: 2-col on desktop, single col on mobile ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 336px",
            gap: isMobile ? "16px" : "22px",
            alignItems: "start",
          }}
        >
          {/* ── LEFT / MAIN ── */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: isMobile ? "14px" : "18px",
            }}
          >
            {/* Trade panel — appears at top on mobile, before chart */}
            {isMobile && (
              <div
                style={{
                  ...CARD,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.11)",
                  padding: "16px",
                }}
              >
                <TradePanelContent
                  safeMarket={safeMarket}
                  yesLabel={yesLabel}
                  noLabel={noLabel}
                  yesPct={yesPct}
                  noPct={noPct}
                  isMarketOpen={isMarketOpen}
                  isLoggedIn={isLoggedIn}
                  marketId={marketId}
                  token={token}
                  currentProbability={currentProbability}
                  username={username}
                  onSuccess={handleTransactionSuccess}
                />
              </div>
            )}

            {/* Chart card */}
            <div
              style={{ ...CARD, padding: isMobile ? "14px 14px" : "20px 22px" }}
            >
              <NewMarketChart
                data={probabilityChanges}
                currentProbability={currentProbability}
                closeDateTime={safeMarket.resolutionDateTime}
                yesLabel={yesLabel}
                noLabel={noLabel}
              />
            </div>

            {/* Description / Rules card */}
            {safeMarket.description ? (
              <div
                style={{
                  ...CARD,
                  padding: isMobile ? "14px 14px" : "20px 22px",
                }}
              >
                <div
                  style={{
                    font: `700 12px ${FONT_BODY}`,
                    letterSpacing: ".08em",
                    color: MUTED2,
                    marginBottom: "10px",
                  }}
                >
                  RULES
                </div>
                <p
                  style={{
                    margin: "0 0 14px",
                    font: `400 14px/1.6 ${FONT_BODY}`,
                    color: "#b7c6d6",
                  }}
                >
                  {safeMarket.description}
                </p>
              </div>
            ) : null}

            {/* Stats row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: isMobile ? "8px" : "12px",
              }}
            >
              <StatCard label="Volume" value={`$${fmt(totalVolume)}`} />
              <StatCard label="Traders" value={fmt(numUsers)} />
              <StatCard label="Closes" value={closesLabel} />
            </div>

            {/* Activity tabs */}
            <div
              style={{
                ...CARD,
                overflow: "hidden",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <ActivityTabs
                marketId={marketId}
                market={safeMarket}
                refreshTrigger={refreshTrigger}
                variant="dark"
              />
            </div>
          </div>

          {/* ── RIGHT — trade panel (desktop only) ── */}
          {!isMobile && (
            <div
              style={{
                ...CARD,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.11)",
                padding: "18px",
                position: "sticky",
                top: "16px",
              }}
            >
              <TradePanelContent
                safeMarket={safeMarket}
                yesLabel={yesLabel}
                noLabel={noLabel}
                yesPct={yesPct}
                noPct={noPct}
                isMarketOpen={isMarketOpen}
                isLoggedIn={isLoggedIn}
                marketId={marketId}
                token={token}
                currentProbability={currentProbability}
                username={username}
                onSuccess={handleTransactionSuccess}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Trade panel content (shared between mobile + desktop) ───────────────────
function TradePanelContent({
  safeMarket,
  yesLabel,
  noLabel,
  yesPct,
  noPct,
  isMarketOpen,
  isLoggedIn,
  marketId,
  token,
  currentProbability,
  username,
  onSuccess,
}) {
  if (safeMarket.isResolved) {
    return (
      <ResolvedPanel
        result={safeMarket.resolutionResult}
        yesLabel={yesLabel}
        noLabel={noLabel}
        yesPct={yesPct}
        noPct={noPct}
      />
    );
  }
  if (!isMarketOpen) {
    return (
      <ClosedPanel
        yesLabel={yesLabel}
        noLabel={noLabel}
        yesPct={yesPct}
        noPct={noPct}
      />
    );
  }
  if (isLoggedIn) {
    return (
      <NewTradePanel
        marketId={marketId}
        market={safeMarket}
        token={token}
        currentProbability={currentProbability}
        username={username}
        onSuccess={onSuccess}
      />
    );
  }
  return (
    <NotLoggedInPanel
      yesLabel={yesLabel}
      noLabel={noLabel}
      yesPct={yesPct}
      noPct={noPct}
    />
  );
}

// ─── YES / NO price display ───────────────────────────────────────────────────
function YesNoPill({ label, pct, variant }) {
  const isYes = variant === "yes";
  const color = isYes ? YES_GREEN : NO_RED;
  const textColor = isYes ? YES_TEXT : NO_TEXT;
  return (
    <div
      style={{
        flex: 1,
        padding: "11px",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2px",
        background: isYes ? "rgba(34,197,94,0.10)" : "rgba(244,63,94,0.10)",
        border: `1px solid ${isYes ? "rgba(34,197,94,0.25)" : "rgba(244,63,94,0.22)"}`,
      }}
    >
      <span style={{ font: `700 15px ${FONT_BODY}`, color: textColor }}>
        {label}
      </span>
      <span style={{ font: `800 18px ${FONT_HEAD}`, color: textColor }}>
        {pct}¢
      </span>
    </div>
  );
}

// ─── Resolved panel ───────────────────────────────────────────────────────────
function ResolvedPanel({ result, yesLabel, noLabel, yesPct, noPct }) {
  const isYes = result?.toUpperCase() === "YES";
  const isNA =
    result?.toUpperCase() === "N/A" || result?.toUpperCase() === "NA";
  const winLabel = isNA ? "N/A" : isYes ? yesLabel : noLabel;
  const winColor = isNA ? "#8ca0b6" : isYes ? "#22c55e" : "#fb5b6b";
  const winBg = isNA
    ? "rgba(140,160,182,0.10)"
    : isYes
      ? "rgba(34,197,94,0.10)"
      : "rgba(251,91,107,0.10)";
  const winBorder = isNA
    ? "rgba(140,160,182,0.25)"
    : isYes
      ? "rgba(34,197,94,0.30)"
      : "rgba(251,91,107,0.30)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Result badge */}
      <div
        style={{
          borderRadius: "14px",
          padding: "20px 16px",
          background: winBg,
          border: `1px solid ${winBorder}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span
          style={{
            font: `700 11px ${FONT_BODY}`,
            letterSpacing: ".1em",
            color: winColor,
          }}
        >
          MARKET RESOLVED
        </span>
        <span style={{ font: `800 32px ${FONT_HEAD}`, color: winColor }}>
          {winLabel}
        </span>
        <span style={{ font: `500 12px ${FONT_BODY}`, color: MUTED3 }}>
          {isNA ? "Cancelled — bets refunded" : `${winLabel} won`}
        </span>
      </div>

      {/* Final odds */}
      <div style={{ display: "flex", gap: "9px" }}>
        <div
          style={{
            flex: 1,
            padding: "11px 8px",
            borderRadius: "12px",
            textAlign: "center",
            background: isYes
              ? "rgba(34,197,94,0.12)"
              : "rgba(255,255,255,0.04)",
            border: isYes
              ? "1px solid rgba(34,197,94,0.30)"
              : "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              font: `700 13px ${FONT_BODY}`,
              color: isYes ? YES_TEXT : MUTED,
            }}
          >
            {yesLabel}
          </div>
          <div
            style={{
              font: `800 17px ${FONT_HEAD}`,
              color: isYes ? YES_TEXT : MUTED,
            }}
          >
            {yesPct}¢
          </div>
        </div>
        <div
          style={{
            flex: 1,
            padding: "11px 8px",
            borderRadius: "12px",
            textAlign: "center",
            background:
              !isYes && !isNA
                ? "rgba(251,91,107,0.12)"
                : "rgba(255,255,255,0.04)",
            border:
              !isYes && !isNA
                ? "1px solid rgba(251,91,107,0.30)"
                : "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              font: `700 13px ${FONT_BODY}`,
              color: !isYes && !isNA ? NO_TEXT : MUTED,
            }}
          >
            {noLabel}
          </div>
          <div
            style={{
              font: `800 17px ${FONT_HEAD}`,
              color: !isYes && !isNA ? NO_TEXT : MUTED,
            }}
          >
            {noPct}¢
          </div>
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          font: `500 11px ${FONT_BODY}`,
          color: MUTED3,
        }}
      >
        Payouts have been credited automatically
      </div>
    </div>
  );
}

// ─── Closed (awaiting resolution) panel ───────────────────────────────────────
function ClosedPanel({ yesLabel, noLabel, yesPct, noPct }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div
        style={{
          borderRadius: "14px",
          padding: "20px 16px",
          background: "rgba(255,193,7,0.08)",
          border: "1px solid rgba(255,193,7,0.25)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span
          style={{
            font: `700 11px ${FONT_BODY}`,
            letterSpacing: ".1em",
            color: "#ffc107",
          }}
        >
          MARKET CLOSED
        </span>
        <span style={{ font: `800 20px ${FONT_HEAD}`, color: "#eaf0f7" }}>
          Awaiting resolution
        </span>
        <span style={{ font: `500 12px ${FONT_BODY}`, color: MUTED3 }}>
          The market steward needs to resolve this
        </span>
      </div>

      {/* Final odds read-only */}
      <div style={{ display: "flex", gap: "9px" }}>
        {[
          { label: yesLabel, pct: yesPct, color: YES_TEXT },
          { label: noLabel, pct: noPct, color: NO_TEXT },
        ].map(({ label, pct, color }) => (
          <div
            key={label}
            style={{
              flex: 1,
              padding: "11px 8px",
              borderRadius: "12px",
              textAlign: "center",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ font: `700 13px ${FONT_BODY}`, color }}>{label}</div>
            <div style={{ font: `800 17px ${FONT_HEAD}`, color }}>{pct}¢</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Not logged in panel ──────────────────────────────────────────────────────
function NotLoggedInPanel({ yesLabel, noLabel, yesPct, noPct }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", gap: "9px" }}>
        {[
          {
            label: yesLabel,
            pct: yesPct,
            color: YES_TEXT,
            bg: "rgba(34,197,94,0.08)",
            border: "rgba(34,197,94,0.22)",
          },
          {
            label: noLabel,
            pct: noPct,
            color: NO_TEXT,
            bg: "rgba(244,63,94,0.08)",
            border: "rgba(244,63,94,0.18)",
          },
        ].map(({ label, pct, color, bg, border }) => (
          <div
            key={label}
            style={{
              flex: 1,
              padding: "11px 8px",
              borderRadius: "12px",
              textAlign: "center",
              background: bg,
              border: `1px solid ${border}`,
            }}
          >
            <div style={{ font: `700 13px ${FONT_BODY}`, color }}>{label}</div>
            <div style={{ font: `800 17px ${FONT_HEAD}`, color }}>{pct}¢</div>
          </div>
        ))}
      </div>
      <div
        style={{
          borderRadius: "14px",
          padding: "20px 16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.09)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            font: `700 14px ${FONT_BODY}`,
            color: TEXT,
            marginBottom: "6px",
          }}
        >
          Sign in to trade
        </div>
        <div style={{ font: `500 12px ${FONT_BODY}`, color: MUTED3 }}>
          You need an account to participate
        </div>
      </div>
    </div>
  );
}

export default TestMarketDetailsLayout;
