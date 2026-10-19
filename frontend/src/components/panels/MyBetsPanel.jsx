import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../helpers/AuthContent";
import { API_URL } from "../../config";
import LoadingSpinner from "../loaders/LoadingSpinner";
import { useSwipeToClose } from "../../hooks/useSwipeToClose";

const MyBetsPanel = ({ isOpen, onClose, username }) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const panelRef = useSwipeToClose(isOpen, onClose);

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

  // Bottom sheet on phones, right drawer from lg.
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-[300] bg-black/60 transition-opacity duration-300 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("nav.myBets")}
        className={`fixed z-[301] flex flex-col overflow-hidden border-white/[0.08] bg-[#0b0f1a] transition-transform duration-300 ease-out
          inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl border-t
          lg:inset-x-auto lg:inset-y-0 lg:right-0 lg:w-[420px] lg:max-h-none lg:rounded-none lg:border-t-0 lg:border-l
          ${isOpen ? "translate-y-0 lg:translate-x-0" : "translate-y-full lg:translate-y-0 lg:translate-x-full"}`}
      >
        {/* Handle (phones) */}
        <button type="button" data-sheet-handle onClick={onClose} aria-label="Close" className="mx-auto mt-3 block h-1 w-10 shrink-0 rounded-full bg-white/20 lg:hidden" />

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-4 lg:pt-6">
          <div>
            <h2 className="m-0 text-lg font-bold text-white">{t("nav.myBets")}</h2>
            {!loading && !error && positions.length > 0 && (
              <p className="m-0 mt-0.5 text-[13px] text-white/45">
                {t("profile.totalMarkets")}: {positions.length}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="hidden h-9 w-9 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white lg:flex"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div data-sheet-scroll className="flex-1 overflow-y-auto px-5" style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}>
          {loading ? (
            <div className="py-10 text-center">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <p className="py-10 text-center text-sm text-[#fb8b96]">Error: {error}</p>
          ) : positions.length === 0 ? (
            <p className="py-12 text-center text-sm text-white/45">{t("profile.noBets")}</p>
          ) : (
            <ul className="m-0 list-none p-0">
              {positions.map((pos, i) => (
                <PositionRow key={pos.marketId || i} position={pos} t={t} onClose={onClose} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

const PositionRow = ({ position, t, onClose }) => {
  const totalShares = position.yesSharesOwned + position.noSharesOwned;

  return (
    <li className="border-t border-white/[0.06] first:border-t-0">
      <Link
        to={`/markets/${position.marketId}`}
        onClick={onClose}
        className="-mx-2 flex flex-col gap-2 rounded-xl px-2 py-3.5 no-underline transition-colors hover:bg-white/[0.03]"
      >
        <span className="text-[14px] font-semibold leading-snug text-white">
          {position.questionTitle || `Market #${position.marketId}`}
        </span>
        <span className="flex flex-wrap items-center gap-2">
          {position.yesSharesOwned > 0 && (
            <span className="inline-flex items-center rounded-full bg-[rgba(186,214,89,0.10)] px-2.5 py-0.5 text-[11px] font-bold tracking-[0.04em] text-[#C6E06C]">
              {position.yesSharesOwned} YES
            </span>
          )}
          {position.noSharesOwned > 0 && (
            <span className="inline-flex items-center rounded-full bg-[rgba(251,91,107,0.10)] px-2.5 py-0.5 text-[11px] font-bold tracking-[0.04em] text-[#fb8b96]">
              {position.noSharesOwned} NO
            </span>
          )}
          <span className="text-[12px] font-medium text-white/45">
            {t("profile.total")}: {totalShares}
          </span>
          <span className="ml-auto text-[12px] text-white/35">
            {new Date(position.lastBetPlaced).toLocaleDateString()}
          </span>
        </span>
      </Link>
    </li>
  );
};

export default MyBetsPanel;
