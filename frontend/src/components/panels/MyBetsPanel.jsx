import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../helpers/AuthContent";
import { API_URL } from "../../config";
import LoadingSpinner from "../loaders/LoadingSpinner";
import { FONT, FONT_HEAD, COLOR, CARD } from "../../styles/darkTokens";

const PANEL_WIDTH = 400;

const MyBetsPanel = ({ isOpen, onClose, username }) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !username || !token) return;

    const fetchPositions = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/v0/portfolio/${username}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        setPositions(data.portfolioItems || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPositions();
  }, [isOpen, username, token]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 300,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            transition: "opacity 0.2s",
          }}
        />
      )}

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: `min(${PANEL_WIDTH}px, 92vw)`,
          zIndex: 301,
          background: "linear-gradient(180deg, #0f1e30 0%, #0a1420 100%)",
          borderLeft: "1px solid rgba(255,255,255,0.09)",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.5)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 20px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: FONT_HEAD,
              fontWeight: 700,
              fontSize: "18px",
              color: COLOR.text,
            }}
          >
            {t("nav.myBets")}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px",
              width: "34px",
              height: "34px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: COLOR.muted,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M1 1l12 12M13 1L1 13"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 16px 32px",
          }}
        >
          {loading ? (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div
              style={{
                ...CARD,
                padding: "16px",
                textAlign: "center",
                fontFamily: FONT,
                fontSize: "13px",
                color: COLOR.noText,
              }}
            >
              Error: {error}
            </div>
          ) : positions.length === 0 ? (
            <div
              style={{
                ...CARD,
                padding: "32px 16px",
                textAlign: "center",
                fontFamily: FONT,
                fontSize: "13px",
                color: COLOR.muted,
              }}
            >
              {t("profile.noBets")}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {/* Summary */}
              <div
                style={{
                  ...CARD,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                }}
              >
                <span
                  style={{
                    fontFamily: FONT,
                    fontWeight: 600,
                    fontSize: "12px",
                    color: COLOR.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {t("profile.totalMarkets")}
                </span>
                <span
                  style={{
                    fontFamily: FONT_HEAD,
                    fontWeight: 700,
                    fontSize: "18px",
                    color: COLOR.text,
                  }}
                >
                  {positions.length}
                </span>
              </div>

              {/* Position cards */}
              {positions.map((pos, i) => (
                <PositionCard key={pos.marketId || i} position={pos} t={t} onClose={onClose} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const PositionCard = ({ position, t, onClose }) => {
  const totalShares = position.yesSharesOwned + position.noSharesOwned;

  return (
    <div
      style={{
        ...CARD,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.07)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = CARD.background;
      }}
    >
      {/* Market title */}
      <Link
        to={`/markets/${position.marketId}`}
        onClick={onClose}
        style={{
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: "13.5px",
          color: COLOR.text,
          textDecoration: "none",
          lineHeight: 1.35,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = COLOR.accent)}
        onMouseLeave={(e) => (e.currentTarget.style.color = COLOR.text)}
      >
        {position.questionTitle || `Market #${position.marketId}`}
      </Link>

      {/* Details row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        {/* YES shares */}
        {position.yesSharesOwned > 0 && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "3px 10px",
              borderRadius: "999px",
              background: "rgba(186,214,89,0.10)",
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: "11px",
              color: COLOR.yesText,
              letterSpacing: "0.04em",
            }}
          >
            {position.yesSharesOwned} YES
          </span>
        )}

        {/* NO shares */}
        {position.noSharesOwned > 0 && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "3px 10px",
              borderRadius: "999px",
              background: "rgba(251,91,107,0.10)",
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: "11px",
              color: COLOR.noText,
              letterSpacing: "0.04em",
            }}
          >
            {position.noSharesOwned} NO
          </span>
        )}

        {/* Total */}
        <span
          style={{
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: "12px",
            color: COLOR.muted,
          }}
        >
          {t("profile.total")}: {totalShares}
        </span>

        {/* Date — pushed to right */}
        <span
          style={{
            marginLeft: "auto",
            fontFamily: FONT,
            fontWeight: 500,
            fontSize: "11.5px",
            color: COLOR.muted2,
          }}
        >
          {new Date(position.lastBetPlaced).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

export default MyBetsPanel;
