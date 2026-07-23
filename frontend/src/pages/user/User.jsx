import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import LoadingSpinner from "../../components/loaders/LoadingSpinner";
import { useAuth } from "../../helpers/AuthContent";
import { API_URL } from "../../config";
import { apiRequest } from "../../api/httpClient";
import { groupLifecycleMarketRows } from "../../components/layouts/profile/MarketLifecycleTable";
import {
  PAGE_SIZE,
  Chip,
  PillTabs,
  SectionCard,
  EmptyState,
  ErrorBanner,
  GhostButton,
  pagedRows,
  Pagination,
  LifecycleMarketCard,
  buildFinancialItemGroups,
  FinancialGroup,
} from "../../components/layouts/profile/ProfileUiKit";
import { CARD, FONT, FONT_HEAD, COLOR } from "../../styles/darkTokens";

const TEXT = COLOR.text;
const MUTED = COLOR.muted;
const MUTED2 = COLOR.muted2;
const ACCENT = COLOR.accent;
const YES_TEXT = COLOR.yesText;
const NO_TEXT = COLOR.noText;

// ─── identity ─────────────────────────────────────────────────────────────────
const PublicIdentityCard = ({ userData, username, isOwnProfile }) => {
  const { isLoggedIn, token } = useAuth();
  const [userCredit, setUserCredit] = useState(null);
  const [creditLoading, setCreditLoading] = useState(true);
  const [creditError, setCreditError] = useState(null);

  useEffect(() => {
    let ignore = false;
    if (!isLoggedIn || !token) {
      setCreditLoading(false);
      return undefined;
    }
    setCreditLoading(true);
    setCreditError(null);
    apiRequest(`/v0/usercredit/${username}`, {
      authenticated: true,
      authToken: token,
      fallbackMessage: "Error fetching user credit",
    })
      .then((data) => {
        if (!ignore) setUserCredit(data);
      })
      .catch((err) => {
        if (!ignore) setCreditError(err.message);
      })
      .finally(() => {
        if (!ignore) setCreditLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [username, isLoggedIn, token]);

  const links = [userData?.personalink1, userData?.personalink2, userData?.personalink3, userData?.personalink4]
    .filter(Boolean);
  const usertype = String(userData?.usertype || "").toUpperCase();

  const creditDisplay = !isLoggedIn
    ? "Log in to view"
    : creditLoading
      ? "…"
      : creditError
        ? "N/A"
        : `${userCredit?.credit ?? "N/A"} 🪙`;

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
          {userData?.personalEmoji || "👤"}
        </div>

        {/* Identity */}
        <div style={{ flex: 1, minWidth: "220px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <h1 style={{ margin: 0, font: `800 24px ${FONT_HEAD}`, color: TEXT, letterSpacing: "-.01em" }}>
              {userData?.displayname || userData?.username}
            </h1>
            {usertype && <Chip tone="sky">{usertype}</Chip>}
          </div>
          <div style={{ marginTop: "4px", font: `600 13px ${FONT}`, color: MUTED }}>
            @{userData?.username}
          </div>
          {userData?.description ? (
            <p style={{ margin: "10px 0 0", font: `400 13.5px/1.6 ${FONT}`, color: "#b7c6d6", maxWidth: "560px" }}>
              {userData.description}
            </p>
          ) : (
            <p style={{ margin: "10px 0 0", font: `400 13px ${FONT}`, color: MUTED2, fontStyle: "italic" }}>
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

        {/* Credits + edit action */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end", flexShrink: 0 }}>
          <div style={{ ...CARD, padding: "10px 16px", textAlign: "right" }}>
            <div style={{ font: `600 11px ${FONT}`, letterSpacing: ".06em", color: MUTED2, textTransform: "uppercase" }}>
              Credits
            </div>
            <div style={{ font: `800 18px ${FONT_HEAD}`, marginTop: "2px", color: TEXT }}>{creditDisplay}</div>
          </div>
          {isOwnProfile && (
            <GhostButton as="link" to="/newprofile">
              Edit profile
            </GhostButton>
          )}
        </div>
      </div>
    </SectionCard>
  );
};

// ─── portfolio ────────────────────────────────────────────────────────────────
const PortfolioSection = ({ username }) => {
  const { isLoggedIn, token } = useAuth();
  const [positions, setPositions] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setPage(0);
  }, [username]);

  useEffect(() => {
    let ignore = false;
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
        if (!ignore) {
          setPositions(data.portfolioItems || []);
          setPage(0);
        }
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    if (username && token) {
      fetchPositions();
    } else {
      setPositions([]);
      setLoading(false);
    }
    return () => {
      ignore = true;
    };
  }, [username, token]);

  if (!isLoggedIn) return <EmptyState>Log in to see this user's portfolio positions.</EmptyState>;
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={`Error loading portfolio: ${error}`} />;
  if (!positions.length) return <EmptyState>No positions found for this user.</EmptyState>;

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
        <StatCardCompat label="Total markets" value={positions.length} />
        <StatCardCompat label="YES shares" value={totalYes} valueColor={YES_TEXT} />
        <StatCardCompat label="NO shares" value={totalNo} valueColor={NO_TEXT} />
      </div>

      <Pagination label="Portfolio" pageInfo={pageInfo} onPageChange={setPage} />

      <div style={{ borderRadius: "16px", border: "1px solid rgba(255,255,255,0.09)", overflow: "hidden" }}>
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
                <tr key={position.marketId || index} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={td}>
                    <Link
                      to={`/markets/${position.marketId}`}
                      style={{ color: TEXT, textDecoration: "none", font: `600 13.5px ${FONT}` }}
                    >
                      {position.questionTitle || "Unknown Market"}
                    </Link>
                    <div style={{ marginTop: "3px", font: `500 11px ${FONT}`, color: MUTED2 }}>
                      ID: {position.marketId}
                    </div>
                  </td>
                  <td style={{ ...td, textAlign: "center" }}>
                    {position.yesSharesOwned > 0 ? (
                      <Chip tone="green">{position.yesSharesOwned} YES</Chip>
                    ) : (
                      <span style={{ color: MUTED2 }}>—</span>
                    )}
                  </td>
                  <td style={{ ...td, textAlign: "center" }}>
                    {position.noSharesOwned > 0 ? (
                      <Chip tone="red">{position.noSharesOwned} NO</Chip>
                    ) : (
                      <span style={{ color: MUTED2 }}>—</span>
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
  const { isLoggedIn, token } = useAuth();
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    const fetchFinancialData = async () => {
      try {
        const response = await fetch(`${API_URL}/v0/users/${username}/financial`, {
          headers: token
            ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
            : {},
        });
        if (!response.ok) throw new Error(`Error fetching financial data: ${response.statusText}`);
        const data = await response.json();
        if (!ignore) setFinancialData(data.financial);
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    if (username && token) {
      fetchFinancialData();
    } else {
      setFinancialData(null);
      setLoading(false);
    }
    return () => {
      ignore = true;
    };
  }, [username, token]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={`Error loading financial data: ${error}`} />;
  if (!financialData) {
    return (
      <EmptyState>
        {isLoggedIn ? "No financial data available." : "Log in to see this user's financials."}
      </EmptyState>
    );
  }

  const { balanceSheetItems, incomeStatementItems, cashFlowItems, marketPositionItems } =
    buildFinancialItemGroups(financialData);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCardCompat
          label="Account balance"
          value={financialData.accountBalance?.toLocaleString() ?? "N/A"}
          valueColor={(financialData.accountBalance ?? 0) >= 0 ? YES_TEXT : NO_TEXT}
        />
        <StatCardCompat label="Amount in play" value={financialData.amountInPlay?.toLocaleString() ?? "N/A"} />
        <StatCardCompat
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

// ─── owned markets ──────────────────────────────────────────────────────────
const OwnedMarketsSection = ({ username }) => {
  const { isLoggedIn, token } = useAuth();
  const [markets, setMarkets] = useState([]);
  const [totalMarkets, setTotalMarkets] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setPage(0);
  }, [username]);

  useEffect(() => {
    let ignore = false;
    const fetchOwnedMarkets = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(page * PAGE_SIZE),
        });
        const data = await apiRequest(`/v0/users/${username}/owned-markets?${params.toString()}`, {
          authenticated: true,
          authToken: token,
          fallbackMessage: "Error fetching owned markets",
        });
        if (!ignore) {
          const rows = groupLifecycleMarketRows(data.markets || []);
          setMarkets(rows);
          setTotalMarkets(Number.isFinite(Number(data.total)) ? Number(data.total) : rows.length);
        }
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    if (username && token) {
      fetchOwnedMarkets();
    } else {
      setMarkets([]);
      setTotalMarkets(0);
      setLoading(false);
    }
    return () => {
      ignore = true;
    };
  }, [username, token, page]);

  if (!isLoggedIn) return <EmptyState>Log in to see this user's created and stewarded markets.</EmptyState>;
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={`Error loading owned markets: ${error}`} />;

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
      <Pagination label="Owned markets" pageInfo={pageInfo} onPageChange={setPage} />
      {markets.length === 0 ? (
        <EmptyState>No owned markets found for this user.</EmptyState>
      ) : (
        markets.map((market) => (
          <LifecycleMarketCard key={market.rowKey || market.id} market={market} profileUsername={username} />
        ))
      )}
    </div>
  );
};

// A slimmer stat tile that doesn't depend on the kit's SectionCard wrapper spacing.
const StatCardCompat = ({ label, value, valueColor = TEXT }) => (
  <div style={{ borderRadius: "16px", border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.045)", padding: "14px 16px" }}>
    <div style={{ font: `600 11px ${FONT}`, letterSpacing: ".06em", color: MUTED2, textTransform: "uppercase" }}>
      {label}
    </div>
    <div style={{ font: `800 20px ${FONT_HEAD}`, marginTop: "4px", color: valueColor }}>{value}</div>
  </div>
);

// ─── page ─────────────────────────────────────────────────────────────────────
const User = () => {
  const { username } = useParams();
  const { isLoggedIn, username: loggedInUsername, token } = useAuth();
  const [userData, setUserData] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState(null);
  const [mainTab, setMainTab] = useState("Portfolio");

  useEffect(() => {
    document.title = `${username} | Guardians Predictions`;
  }, [username]);

  useEffect(() => {
    let ignore = false;
    setUserLoading(true);
    setUserError(null);
    const headers = token
      ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      : {};

    fetch(`${API_URL}/v0/userinfo/${username}`, { headers })
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to fetch user data: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (!ignore) setUserData(data);
      })
      .catch((error) => {
        if (!ignore) setUserError(error.message);
      })
      .finally(() => {
        if (!ignore) setUserLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [username, token]);

  const isOwnProfile = isLoggedIn && loggedInUsername === username;
  const mainTabs = ["Portfolio", "Owned Markets", "Financials"];
  const activeTab = mainTabs.includes(mainTab) ? mainTab : "Portfolio";

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
            <PublicIdentityCard userData={userData} username={username} isOwnProfile={isOwnProfile} />

            <div>
              <PillTabs tabs={mainTabs} active={activeTab} onChange={setMainTab} />
            </div>

            {activeTab === "Portfolio" && <PortfolioSection username={username} />}
            {activeTab === "Owned Markets" && <OwnedMarketsSection username={username} />}
            {activeTab === "Financials" && <FinancialsSection username={username} />}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default User;
