import React, { useState, useEffect, useCallback } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "../../hooks/useToast";
import logo from "../../assets/logo/logo.png";
import {
  HomeSVG,
  MarketsSVG,
  StatsSVG,
} from "../../assets/components/SvgIcons";
import LoginModal from "../modals/login/LoginModal";
import RegisterModal from "../modals/register/RegisterModal";
import ForgotPasswordModal from "../modals/forgotpassword/ForgotPasswordModal";
import MobileSearchSheet from "./MobileSearchSheet";
import NavSearch from "./NavSearch";
import BottomSheet from "./BottomSheet";
import { useAuth } from "../../helpers/AuthContent";
import useUserCredit from "../utils/userFinanceTools/FetchUserCredit";
import useFrontendConfig from "../../hooks/useFrontendConfig";
import { listMarketTags } from "../../api/marketTagsApi";
import { CARD_ELEVATED, FONT, FONT_HEAD, COLOR, PAGE_MAX_WIDTH } from "../../styles/darkTokens";
import { useWatchlist } from "../../hooks/useWatchlist";
import { WATCHLIST_PATH } from "../../hooks/useWatchToggle";
const NAV_LINKS = [
  { labelKey: "nav.trending", to: "/", Icon: HomeSVG },
  { labelKey: "nav.markets", to: "/new-markets", Icon: MarketsSVG },
  { labelKey: "nav.stats", to: "/stats", Icon: StatsSVG },
];

// Line icons for the second nav row, same stroke as the user menu icons.
const ROW_ICONS = {
  "nav.trending": <><path d="m3 17 6-6 4 4 8-8" /><path d="M14 7h7v7" /></>,
  "nav.markets": <><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" /></>,
  "nav.stats": <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
};

const RowIcon = ({ name }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ opacity: 0.85 }}>
    {ROW_ICONS[name]}
  </svg>
);

// Links in the second nav row: quiet by default, white with an underline when active.
const rowLinkStyle = (active) => ({
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  gap: "7px",
  height: "40px",
  padding: 0,
  fontSize: "14px",
  fontWeight: active ? 500 : 400,
  color: active ? "#FFFFFF" : "rgba(241,239,239,0.6)",
  textDecoration: "none",
  whiteSpace: "nowrap",
  boxShadow: active ? "inset 0 -2px 0 #FFFFFF" : "none",
  transition: "color .15s",
});

const linkStyle = {
  fontFamily: "'Roboto', sans-serif",
  fontWeight: 400,
  // Scales from 15px (1024px screens) up to 18px (1500px+) so the bar fits on small laptops
  fontSize: "clamp(15px, 1.2vw, 18px)",
  color: "#F1EFEF",
  letterSpacing: "0.4px",
  textDecoration: "none",
};

const BOTTOM_ICONS = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  markets: <><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" /></>,
  more: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
};

const BottomNavIcon = ({ d }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

const BOTTOM_NAV = [
  { key: "home", labelKey: "nav.home", to: "/", icon: BOTTOM_ICONS.home },
  { key: "search", labelKey: "nav.search", onClick: "search", icon: BOTTOM_ICONS.search },
  { key: "markets", labelKey: "nav.markets", to: "/new-markets", icon: BOTTOM_ICONS.markets },
  { key: "more", labelKey: "nav.more", onClick: "more", icon: BOTTOM_ICONS.more },
];

// ── User chip with dropdown ────────────────────────────────────────────────────
const BetsIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const WatchlistIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 7v14l-6 -4l-6 4v-14a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4z" />
  </svg>
);

const UserChip = ({
  username,
  credit,
  onLogout,
  onProfile,
  onWatchlist,
  watchedCount = 0,
  onHelp,
  onCreate,
  isAdmin,
  canCreateMarket,
  onAdminReview,
  navVisible,
  t,
  i18n,
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = React.useRef(null);
  const { pathname } = useLocation();
  const history = useHistory();
  const go = (fn) => () => {
    setOpen(false);
    fn?.();
  };

  const initials = (username || "?").slice(0, 2).toUpperCase();
  const fmt = (n) => {
    if (n == null) return "—";
    if (n >= 100000) return (n / 1000).toFixed(1) + "k";
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Close when navbar hides on scroll
  useEffect(() => {
    if (!navVisible) setOpen(false);
  }, [navVisible]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      {/* Trigger: chevron + name + avatar, as in the Figma navbar */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "transparent",
          border: "none",
          padding: "2px",
          cursor: "pointer",
          color: COLOR.text,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transition: "transform .2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
          <path d="M2 4l4 4 4-4" stroke={COLOR.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontSize: "15px", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {username}
        </span>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "999px",
            flexShrink: 0,
            background: "linear-gradient(135deg, #1d3a5f, #2a5298)",
            boxShadow: open ? "0 0 0 2px rgba(156,201,241,0.45)" : "0 0 0 1px rgba(156,201,241,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: "12px",
            color: COLOR.accent,
            transition: "box-shadow .15s",
          }}
        >
          {initials}
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: "264px",
            zIndex: 100,
            borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "#11161f",
            boxShadow: "0 18px 48px rgba(0,0,0,0.55)",
            padding: "6px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 10px 12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "999px",
                flexShrink: 0,
                background: "linear-gradient(135deg, #1d3a5f, #2a5298)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "13px",
                color: COLOR.accent,
              }}
            >
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: "14px", color: COLOR.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                @{username}
              </div>
              <div style={{ fontSize: "12px", color: COLOR.muted, marginTop: "2px" }}>
                {t("nav.balance")} <span style={{ color: COLOR.text }}>${fmt(credit)}</span>
              </div>
            </div>
          </div>

          <MenuDivider />
          {(isAdmin || canCreateMarket) && (
            <>
              {isAdmin && <DropdownItem icon={<AdminIcon />} label={t('nav.reviewMarkets')} active={pathname === "/admin/markets/review"} onClick={go(onAdminReview)} />}
              {canCreateMarket && <DropdownItem icon={<CreateIcon />} label={t('nav.create')} active={pathname === "/create"} onClick={go(onCreate)} />}
              <MenuDivider />
            </>
          )}
          {!isAdmin && (
            <>
              <DropdownItem icon={<MenuIcon name="portfolio" />} label={t('nav.myProfile')} active={pathname === "/portfolio" || pathname === "/portfolio/overview"} onClick={go(() => history.push("/portfolio"))} />
              <DropdownItem icon={<MenuIcon name="positions" />} label={t('account.positions')} active={pathname === "/portfolio/positions"} onClick={go(() => history.push("/portfolio/positions"))} />
              <DropdownItem icon={<MenuIcon name="activity" />} label={t('account.activity')} active={pathname === "/portfolio/activity"} onClick={go(() => history.push("/portfolio/activity"))} />
            </>
          )}
          <DropdownItem
            icon={<MenuIcon name="favorites" />}
            label={t('nav.watchlist')}
            badge={watchedCount > 0 ? watchedCount : null}
            onClick={go(onWatchlist)}
          />
          {!isAdmin && (
            <DropdownItem icon={<MenuIcon name="settings" />} label={t('account.settings')} active={pathname === "/portfolio/settings"} onClick={go(() => history.push("/portfolio/settings"))} />
          )}
          <LanguageRow i18n={i18n} label={t('nav.language')} />
          <DropdownItem icon={<MenuIcon name="help" />} label={t('nav.helpFaq')} active={pathname === "/faq"} onClick={go(onHelp)} />
          <MenuDivider />
          <DropdownItem icon={<MenuIcon name="logout" />} label={t('nav.signOut')} onClick={go(onLogout)} />
        </div>
      )}
    </div>
  );
};

const MENU_ICONS = {
  portfolio: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  positions: <path d="M3 12h4l3-8 4 16 3-8h4" />,
  activity: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  favorites: <path d="M6 3h12v18l-6-5-6 5z" />,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01" /></>,
  logout: <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3" />,
  language: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
};

const MenuIcon = ({ name }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {MENU_ICONS[name]}
  </svg>
);

const LanguageRow = ({ i18n, label }) => {
  const current = (i18n?.language || "en").startsWith("es") ? "es" : "en";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "7px 10px", fontSize: "14px", color: "rgba(234,240,247,0.72)" }}>
      <span style={{ display: "flex", opacity: 0.85 }}><MenuIcon name="language" /></span>
      <span style={{ flex: 1 }}>{label}</span>
      <div style={{ display: "flex", padding: "2px", borderRadius: "8px", background: "rgba(255,255,255,0.06)" }}>
        {["es", "en"].map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => i18n.changeLanguage(code)}
            aria-pressed={current === code}
            style={{
              border: "none",
              borderRadius: "6px",
              padding: "3px 9px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              background: current === code ? "rgba(255,255,255,0.14)" : "transparent",
              color: current === code ? COLOR.text : COLOR.muted,
            }}
          >
            {code.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
};

const MenuDivider = () => <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", margin: "6px 4px" }} />;

const DropdownItem = ({ icon, label, onClick, active, badge }) => (
  <button
    type="button"
    role="menuitem"
    onClick={onClick}
    style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "9px 10px",
      borderRadius: "8px",
      border: "none",
      background: active ? "rgba(255,255,255,0.07)" : "transparent",
      cursor: "pointer",
      fontWeight: 400,
      fontSize: "14px",
      textAlign: "left",
      color: active ? COLOR.text : "rgba(234,240,247,0.72)",
      transition: "background .12s, color .12s",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = "rgba(255,255,255,0.06)";
      e.currentTarget.style.color = COLOR.text;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = active ? "rgba(255,255,255,0.07)" : "transparent";
      e.currentTarget.style.color = active ? COLOR.text : "rgba(234,240,247,0.72)";
    }}
  >
    <span style={{ display: "flex", opacity: 0.85 }}>{icon}</span>
    <span style={{ flex: 1 }}>{label}</span>
    {badge != null && (
      <span style={{ fontSize: "12px", color: COLOR.muted, background: "rgba(255,255,255,0.06)", borderRadius: "999px", padding: "1px 8px" }}>
        {badge}
      </span>
    )}
  </button>
);

const LanguageDropdown = ({ i18n }) => {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);
  const current = i18n.language?.slice(0, 2) || "en";

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: open ? "rgba(255,255,255,0.07)" : "transparent",
          border: `1px solid ${open ? "rgba(156,201,241,0.25)" : "transparent"}`,
          borderRadius: "999px",
          padding: "8px 10px",
          cursor: "pointer",
          transition: "all .15s",
          color: COLOR.text,
        }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.background = open ? "rgba(255,255,255,0.07)" : "transparent";
        }}
      >
        <GlobeIcon />
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          style={{
            transition: "transform .2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <path
            d="M2 4l4 4 4-4"
            stroke={COLOR.muted}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            minWidth: "140px",
            zIndex: 100,
            ...CARD_ELEVATED,
            background: "rgba(10,22,38,0.97)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
            overflow: "hidden",
            padding: "4px",
          }}
        >
          {[
            { code: "en", label: "English" },
            { code: "es", label: "Español" },
          ].map(({ code, label }) => {
            const active = current === code;
            return (
              <button
                key={code}
                onClick={() => {
                  i18n.changeLanguage(code);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "9px 12px",
                  borderRadius: "9px",
                  border: active ? "1px solid rgba(156,201,241,0.25)" : "none",
                  background: active ? "rgba(255,255,255,0.08)" : "transparent",
                  cursor: "pointer",
                  fontFamily: FONT,
                  fontWeight: 600,
                  fontSize: "13px",
                  color: active ? "rgba(255,255,255,0.85)" : COLOR.text,
                  transition: "background .12s",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = active ? "rgba(255,255,255,0.08)" : "transparent";
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// One row of the mobile "More" sheet.
const MoreRow = ({ icon, label, onClick, trailing }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex h-12 w-full items-center gap-3 rounded-xl px-2 text-left text-[15px] font-medium text-white/90 active:bg-white/[0.05]"
  >
    <span className="flex w-5 justify-center text-white/55">{icon}</span>
    <span className="flex-1 min-w-0 truncate">{label}</span>
    {trailing}
  </button>
);

const AdminIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const PersonIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const CreateIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const GlobeIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" />
  </svg>
);

const HelpIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v.01" />
    <path d="M12 13a2 2 0 0 0 .914-3.782 1.98 1.98 0 0 0-2.414.483" />
  </svg>
);

const LogoutIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

// In-flow nav: 24px top padding + 48px main row + 8px gap + 40px links row + 16px margin.
const NAV_HEIGHT = 136; // px — placeholder height while the nav is fixed
const SCROLL_THRESHOLD = 136; // px before switching to fixed mode (in-flow nav fully scrolled away)

// Cached across pages so the Markets chevron doesn't flicker.
let marketTagsCache = null;

/**
 * @param {string} [contentWidth] - The nav keeps its full-width background but aligns its
 *   content to a centered column of this width (40px gutters). Defaults to PAGE_MAX_WIDTH.
 */
const Navbar = ({ contentWidth = PAGE_MAX_WIDTH } = {}) => {
  const sidePad = `max(40px, calc((100% - ${contentWidth}) / 2 + 40px))`;
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const [authModal, setAuthModal] = useState(null); // null | 'login' | 'register' | 'forgot'
  const location = useLocation();
  const { pathname } = location;
  const { login, logout, username, token, usertype, moderatorStatus, changePasswordNeeded } = useAuth();
  const isLoggedIn = !!username;
  const isAdmin = usertype === "ADMIN";
  const { frontendConfig } = useFrontendConfig();
  const isModeratorMode = frontendConfig?.game?.mode === 'moderator';
  const isActiveModerator = usertype === 'MODERATOR' && moderatorStatus === 'active';
  const isSuspendedModerator = usertype === 'MODERATOR' && moderatorStatus === 'suspended';
  const canCreateMarket = isLoggedIn && !isAdmin && !changePasswordNeeded && !isSuspendedModerator && (!isModeratorMode || isActiveModerator);
  const { userCredit } = useUserCredit(isLoggedIn ? username : null);
  const history = useHistory();

  // ── market tags for dropdown ─────────────────────────────────────────────────
  const [marketTags, setMarketTags] = useState(() => marketTagsCache ?? []);
  useEffect(() => {
    listMarketTags()
      .then((res) => {
        const tags = res?.tags || res;
        if (Array.isArray(tags)) {
          marketTagsCache = tags.map((t) => t.displayName || t.DisplayName || t.slug || t.Slug);
          setMarketTags(marketTagsCache);
        }
      })
      .catch(() => {});
  }, []);

  // ── scroll-aware desktop nav ────────────────────────────────────────────────
  const [navFixed, setNavFixed] = useState(false); // switched to fixed position
  const [navVisible, setNavVisible] = useState(true); // show or hide via transform
  // Off for the frame the nav switches to fixed, so it does not visibly slide away from y=0.
  const [navAnimate, setNavAnimate] = useState(true);
  const lastScrollY = React.useRef(0);
  const fixedRef = React.useRef(false);

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      const prev = lastScrollY.current;

      if (current > SCROLL_THRESHOLD) {
        // Enter fixed mode already hidden: showing the fixed bar for a frame
        // and then hiding it is what made the header flicker.
        if (!fixedRef.current) {
          fixedRef.current = true;
          setNavAnimate(false);
          requestAnimationFrame(() => requestAnimationFrame(() => setNavAnimate(true)));
          setNavFixed(true);
          setNavVisible(false);
          lastScrollY.current = current;
          return;
        }
        if (Math.abs(current - prev) < 4) return;
        // scrolling down → hide, scrolling up → show
        setNavVisible(current < prev);
      } else if (fixedRef.current && current > 0) {
        // Near the top while fixed: stay fixed and visible until scrollY hits 0.
        // Unfixing here would park the in-flow nav above the viewport, so it
        // vanished and slid back in.
        setNavVisible(true);
      } else {
        fixedRef.current = false;
        setNavFixed(false);
        setNavVisible(true);
      }

      lastScrollY.current = current;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // ────────────────────────────────────────────────────────────────────────────


  const handleLogout = () => {
    logout();
    const path = history.location.pathname;
    const isPrivate =
      path.startsWith("/portfolio") ||
      ["/create", "/admin", "/changepassword", "/notifications", "/profile"].some(
        (p) => path === p || path.startsWith(`${p}/`),
      );
    if (isPrivate) history.push("/");
  };
  const handleProfile = () => history.push("/portfolio");
  // Bets live in the portfolio now (positions), not in a side panel.
  const handleMyBets = () => history.push("/portfolio/positions");
  const handleWatchlist = () => history.push(WATCHLIST_PATH);
  const { ids: watchedIds } = useWatchlist();

  const openLoginModal = () => setAuthModal("login");
  const openRegisterModal = () => setAuthModal("register");
  const openForgotPasswordModal = () => setAuthModal("forgot");
  const closeAuthModal = () => setAuthModal(null);

  const closeMore = useCallback(() => setSidebarOpen(false), []);
  const goMore = (to) => {
    setSidebarOpen(false);
    history.push(to);
  };


  const activeLeague = pathname === "/new-markets" ? new URLSearchParams(location.search).get("league") : null;

  const desktopNavStyle = navFixed
    ? {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        flexDirection: "column",
        padding: `12px ${sidePad}`,
        boxSizing: "border-box",
        background: "rgba(10,20,34,0.88)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        transform: navVisible ? "translateY(0)" : "translateY(-110%)",
        opacity: navVisible ? 1 : 0,
        transition: navAnimate
          ? navVisible
            ? "transform 0.32s cubic-bezier(0.22,1,0.36,1), opacity 0.2s ease, background-color 0.2s, border-color 0.2s"
            : "transform 0.24s cubic-bezier(0.4,0,1,1), opacity 0.24s ease"
          : "none",
      }
    : {
        position: "relative",
        zIndex: 20,
        flexDirection: "column",
        gap: "8px",
        padding: `24px ${sidePad} 0`,
        marginBottom: "16px",
        boxSizing: "border-box",
        background: "transparent",
        borderBottom: "1px solid transparent",
        transition: "background-color 0.2s, border-color 0.2s",
      };

  return (
    <>
      {/* ── DESKTOP NAV ── */}
      {/* Placeholder keeps layout stable when nav becomes fixed */}
      {navFixed && (
        <div
          className="hidden lg:block"
          style={{ height: NAV_HEIGHT }}
          aria-hidden="true"
        />
      )}
      <nav className="hidden lg:flex" style={desktopNavStyle}>
        {/* Row 1: logo, search, account */}
        {/* 3-column grid: search centred when there is room; side columns never shrink below their content, so the search gives way first */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(max-content, 1fr) minmax(0, 780px) minmax(max-content, 1fr)", alignItems: "center", gap: "28px", height: "48px" }}>
        <Link
          to="/"
          style={{ display: "flex", alignItems: "center", justifySelf: "start" }}
        >
          <img
            src={logo}
            alt="Guardians Predict"
            style={{ height: "40px", objectFit: "contain" }}
          />
        </Link>

        <div style={{ minWidth: 0 }}>
          <NavSearch t={t} />
        </div>

        {/* Auth / User */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            justifySelf: "end",
          }}
        >
          {!isLoggedIn && <LanguageDropdown i18n={i18n} />}
          {isLoggedIn ? (
            <>
            <button
              type="button"
              onClick={handleProfile}
              aria-label={t('nav.balance')}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "15px", fontWeight: 500, color: COLOR.yesText, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}
            >
              $ {userCredit == null ? "—" : Math.round(userCredit).toLocaleString("en-US")}
            </button>
            <button
              type="button"
              onClick={() => toast.info(t('nav.depositSoon'))}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                height: "32px",
                padding: "0 16px",
                borderRadius: "999px",
                border: "none",
                cursor: "pointer",
                background: "#34425F",
                color: "#fff",
                fontWeight: 500,
                fontSize: "14px",
                whiteSpace: "nowrap",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
              </svg>
              {t('nav.deposit')}
            </button>
            <span aria-hidden="true" style={{ width: "1px", height: "28px", background: "rgba(255,255,255,0.25)" }} />
            <UserChip
              username={username}
              credit={userCredit}
              onLogout={handleLogout}
              onProfile={handleProfile}
              onWatchlist={handleWatchlist}
              watchedCount={watchedIds.length}
              onHelp={() => history.push("/faq")}
              onCreate={() => history.push("/create")}
              isAdmin={usertype === "ADMIN"}
              canCreateMarket={canCreateMarket}
              onAdminReview={() => history.push("/admin/markets/review")}
              navVisible={navVisible}
              t={t}
              i18n={i18n}
            />
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={openLoginModal}
                style={{
                  ...linkStyle,
                  whiteSpace: "nowrap",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {t('nav.signIn')}
              </button>
              <button
                type="button"
                onClick={openRegisterModal}
                style={{
                  ...linkStyle,
                  color: "#FFFFFF",
                  background: "#34425F",
                  borderRadius: "20px",
                  padding: "0 22px",
                  height: "37px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {t('nav.createAccount')}
              </button>
            </>
          )}
        </div>
        </div>

        {/* Row 2: sections + market categories; hidden while the nav floats fixed */}
        {!navFixed && (
          <div style={{ height: "40px", overflowX: "auto", scrollbarWidth: "none" }}>
          {/* Centred under the search; the inner w-max + auto margins keep the start reachable when it overflows */}
          <div style={{ display: "flex", alignItems: "center", gap: "26px", height: "100%", width: "max-content", margin: "0 auto" }}>
            {NAV_LINKS.map((link) => {
              const active = link.to === "/" ? pathname === "/" : pathname === link.to && !activeLeague;
              return (
                <Link key={link.labelKey} to={link.to} style={rowLinkStyle(active)}>
                  <RowIcon name={link.labelKey} />
                  {t(link.labelKey)}
                </Link>
              );
            })}
            {marketTags.length > 0 && (
              <span aria-hidden="true" style={{ width: "1px", height: "18px", background: "rgba(255,255,255,0.15)", flexShrink: 0 }} />
            )}
            {marketTags.map((tag) => (
              <Link
                key={tag}
                to={`/new-markets?league=${encodeURIComponent(tag)}`}
                style={rowLinkStyle(activeLeague === tag)}
              >
                {tag}
              </Link>
            ))}
          </div>
          </div>
        )}
      </nav>

      {/* ── MOBILE TOP BAR ── */}
      <div className="relative z-20 flex lg:hidden items-center justify-between h-16 px-4 bg-transparent w-full">
        <Link to="/">
          <img
            src={logo}
            alt="Guardians Predict"
            className="h-10 object-contain"
          />
        </Link>
        {isLoggedIn ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleProfile}
              aria-label={`${t('nav.myBets')}: $${userCredit != null ? Math.round(userCredit) : "—"}`}
              className="rounded-full px-2.5 py-1.5 text-[16px] font-semibold tabular-nums text-white"
            >
              {userCredit != null
                ? "$" + (userCredit >= 1000 ? (userCredit / 1000).toFixed(1) + "k" : String(Math.round(userCredit)))
                : "—"}
            </button>
            <button
              type="button"
              onClick={handleProfile}
              aria-label={t('nav.myProfile')}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-[12px] font-bold text-white"
            >
              {(username || "?").slice(0, 2).toUpperCase()}
            </button>
          </div>
        ) : (
          <button type="button" onClick={openLoginModal} className="text-[14px] font-medium text-white/85">
            {t('nav.signIn')}
          </button>
        )}
      </div>

      {/* ── MOBILE "MORE" MENU ── */}
      <BottomSheet open={sidebarOpen} onClose={closeMore} label={t('nav.more')}>
        {isLoggedIn ? (
          <div className="mb-4 flex items-center gap-3 px-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-[13px] font-bold text-white">
              {(username || "?").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[15px] font-semibold text-white">@{username}</div>
              <div className="text-[13px] text-white/50">
                {userCredit != null
                  ? "$" + (userCredit >= 1000 ? (userCredit / 1000).toFixed(1) + "k" : String(Math.round(userCredit)))
                  : "—"}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => { closeMore(); openRegisterModal(); }} className="h-11 rounded-full bg-white text-[15px] font-medium text-[#0b0f1a]">
              {t('nav.createAccount')}
            </button>
            <button type="button" onClick={() => { closeMore(); openLoginModal(); }} className="h-11 rounded-full border border-white/15 text-[15px] font-medium text-white">
              {t('nav.signIn')}
            </button>
          </div>
        )}

        <div className="flex flex-col">
          {isLoggedIn && usertype === "ADMIN" && (
            <MoreRow icon={<AdminIcon />} label={t('nav.reviewMarkets')} onClick={() => goMore("/admin/markets/review")} />
          )}
          {isLoggedIn && canCreateMarket && (
            <MoreRow icon={<CreateIcon />} label={t('nav.create')} onClick={() => goMore("/create")} />
          )}
          {isLoggedIn && usertype !== "ADMIN" && (
            <MoreRow icon={<PersonIcon />} label={t('nav.myProfile')} onClick={() => { closeMore(); handleProfile(); }} />
          )}
          {isLoggedIn && (
            <MoreRow icon={<BetsIcon />} label={t('nav.myBets')} onClick={() => { closeMore(); handleMyBets(); }} />
          )}
          {isLoggedIn && (
            <MoreRow
              icon={<WatchlistIcon />}
              label={t('nav.watchlist')}
              onClick={() => { closeMore(); handleWatchlist(); }}
              trailing={watchedIds.length > 0 ? <span className="rounded-full bg-white/10 px-2 text-[12px] leading-[20px] tabular-nums text-white/70">{watchedIds.length}</span> : null}
            />
          )}
          {isLoggedIn && <div className="my-2 h-px bg-white/[0.06]" />}
          <MoreRow icon={<StatsSVG className="h-[15px] w-[15px]" />} label={t('nav.stats')} onClick={() => goMore("/stats")} />
          <MoreRow icon={<HelpIcon />} label={t('nav.helpFaq')} onClick={() => goMore("/faq")} />
          <MoreRow
            icon={<GlobeIcon />}
            label={t('nav.language')}
            onClick={() => i18n.changeLanguage((i18n.language || "en").startsWith("es") ? "en" : "es")}
            trailing={<span className="text-[13px] text-white/45">{(i18n.language || "en").startsWith("es") ? "Español" : "English"}</span>}
          />
          {isLoggedIn && (
            <>
              <div className="my-2 h-px bg-white/[0.06]" />
              <MoreRow icon={<LogoutIcon />} label={t('nav.signOut')} onClick={() => { closeMore(); handleLogout(); }} />
            </>
          )}
        </div>
      </BottomSheet>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 border-t border-white/[0.06] bg-[#050811]/90 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {BOTTOM_NAV.map(({ key, labelKey, to, icon, onClick }) => {
          const label = t(labelKey);
          const active = key === "search" ? searchOpen : to != null && pathname === to && !searchOpen;
          const className = `flex h-16 flex-col items-center justify-center gap-1 transition-colors ${active ? "text-white" : "text-white/45"}`;
          const content = (
            <>
              <BottomNavIcon d={icon} />
              <span className="text-[11px] font-medium">{label}</span>
            </>
          );
          return to ? (
            <Link key={key} to={to} aria-current={active ? "page" : undefined} className={className}>
              {content}
            </Link>
          ) : (
            <button key={key} type="button" onClick={onClick === "search" ? openSearch : () => setSidebarOpen(true)} className={className}>
              {content}
            </button>
          );
        })}
      </nav>

      <MobileSearchSheet
        open={searchOpen}
        onClose={closeSearch}
        leagues={marketTags}
        t={t}
      />

      {authModal === "login" && (
        <LoginModal
          isOpen
          onClose={closeAuthModal}
          onLogin={login}
          onSwitchToRegister={openRegisterModal}
          onForgotPassword={openForgotPasswordModal}
        />
      )}

      {authModal === "register" && (
        <RegisterModal
          isOpen
          onClose={closeAuthModal}
          onSwitchToLogin={openLoginModal}
        />
      )}

      {authModal === "forgot" && (
        <ForgotPasswordModal
          isOpen
          onClose={closeAuthModal}
          onSwitchToLogin={openLoginModal}
        />
      )}

    </>
  );
};

export default Navbar;
