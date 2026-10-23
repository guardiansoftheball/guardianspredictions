import React, { useState, useEffect, useCallback } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "../../assets/logo/logo.png";
import {
  HomeSVG,
  MarketsSVG,
  StatsSVG,
} from "../../assets/components/SvgIcons";
import LoginModal from "../modals/login/LoginModal";
import RegisterModal from "../modals/register/RegisterModal";
import ForgotPasswordModal from "../modals/forgotpassword/ForgotPasswordModal";
import MyBetsPanel from "../panels/MyBetsPanel";
import MobileSearchSheet from "./MobileSearchSheet";
import BottomSheet from "./BottomSheet";
import { useAuth } from "../../helpers/AuthContent";
import useUserCredit from "../utils/userFinanceTools/FetchUserCredit";
import useFrontendConfig from "../../hooks/useFrontendConfig";
import { listMarketTags } from "../../api/marketTagsApi";
import { CARD_ELEVATED, FONT, FONT_HEAD, COLOR } from "../../styles/darkTokens";
import { useWatchlist } from "../../hooks/useWatchlist";
import { WATCHLIST_PATH } from "../../hooks/useWatchToggle";
const NAV_LINKS = [
  { labelKey: "nav.trending", to: "/", Icon: HomeSVG },
  { labelKey: "nav.markets", to: "/new-markets", Icon: MarketsSVG },
  { labelKey: "nav.stats", to: "/stats", Icon: StatsSVG },
];

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
  onMyBets,
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
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: open ? "rgba(255,255,255,0.07)" : "transparent",
          border: `1px solid ${open ? "rgba(156,201,241,0.25)" : "transparent"}`,
          borderRadius: "999px",
          padding: "6px 14px 6px 6px",
          cursor: "pointer",
          transition: "all .15s",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "999px",
            flexShrink: 0,
            background: "linear-gradient(135deg, #1d3a5f, #2a5298)",
            border: "1.5px solid rgba(156,201,241,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: "12px",
            color: COLOR.accent,
          }}
        >
          {initials}
        </div>

        {/* Username + coins */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            lineHeight: 1.2,
            textAlign: "left",
          }}
        >
          <span
            style={{
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: "13px",
              color: COLOR.text,
            }}
          >
            @{username}
          </span>
          <span
            style={{
              fontFamily: FONT,
              fontWeight: 600,
              fontSize: "11px",
              color: COLOR.accent,
            }}
          >
            ${fmt(credit)}
          </span>
        </div>

        {/* Chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{
            marginLeft: "2px",
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

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            minWidth: "180px",
            zIndex: 100,
            ...CARD_ELEVATED,
            background: "rgba(10,22,38,0.97)",
            boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
            overflow: "hidden",
          }}
        >
          {/* User info header */}
          <div
            style={{
              padding: "14px 16px 12px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div
              style={{
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: "13px",
                color: COLOR.text,
              }}
            >
              @{username}
            </div>
            <div
              style={{
                fontFamily: FONT,
                fontWeight: 600,
                fontSize: "12px",
                color: COLOR.accent,
                marginTop: "3px",
              }}
            >
              ${fmt(credit)}
            </div>
          </div>

          {/* Menu items */}
          <div style={{ padding: "6px", display: "flex", flexDirection: "column", gap: "4px" }}>
            {isAdmin && (
              <DropdownItem
                icon={<AdminIcon />}
                label={t('nav.reviewMarkets')}
                active={pathname === "/admin/markets/review"}
                onClick={() => {
                  setOpen(false);
                  onAdminReview?.();
                }}
              />
            )}
            {canCreateMarket && (
              <DropdownItem
                icon={<CreateIcon />}
                label={t('nav.create')}
                active={pathname === "/create"}
                onClick={() => {
                  setOpen(false);
                  onCreate?.();
                }}
              />
            )}
            {!isAdmin && (
              <DropdownItem
                icon={<PersonIcon />}
                label={t('nav.myProfile')}
                active={pathname === "/newprofile"}
                onClick={() => {
                  setOpen(false);
                  onProfile?.();
                }}
              />
            )}
            <DropdownItem
              icon={<BetsIcon />}
              label={t('nav.myBets')}
              onClick={() => {
                setOpen(false);
                onMyBets?.();
              }}
            />
            <DropdownItem
              icon={<WatchlistIcon />}
              label={watchedCount > 0 ? `${t('nav.watchlist')} (${watchedCount})` : t('nav.watchlist')}
              onClick={() => {
                setOpen(false);
                onWatchlist?.();
              }}
            />
            <DropdownItem
              icon={<HelpIcon />}
              label={t('nav.helpFaq')}
              active={pathname === "/faq"}
              onClick={() => {
                setOpen(false);
                onHelp?.();
              }}
            />
            <DropdownItem
              icon={<LogoutIcon />}
              label={t('nav.signOut')}
              onClick={() => {
                setOpen(false);
                onLogout?.();
              }}
              danger
            />
          </div>
        </div>
      )}
    </div>
  );
};

const DropdownItem = ({ icon, label, onClick, danger, active }) => (
  <button
    onClick={onClick}
    style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "9px 18px",
      borderRadius: "999px",
      border: active ? "1px solid rgba(156,201,241,0.25)" : "none",
      background: active ? "rgba(255,255,255,0.08)" : "transparent",
      cursor: "pointer",
      fontFamily: FONT,
      fontWeight: 600,
      fontSize: "13px",
      color: danger ? COLOR.noText : active ? "rgba(255,255,255,0.85)" : COLOR.text,
      transition: "background .12s",
    }}
    onMouseEnter={(e) => {
      if (!active)
        e.currentTarget.style.background = danger
          ? "rgba(251,91,107,0.10)"
          : "rgba(255,255,255,0.06)";
    }}
    onMouseLeave={(e) => {
      if (!active) e.currentTarget.style.background = "transparent";
    }}
  >
    <span style={{ opacity: active ? 1 : 0.7, display: "flex" }}>{icon}</span>
    {label}
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

const NAV_HEIGHT = 80; // px — matches padding-top + height
const SCROLL_THRESHOLD = 80; // px before switching to fixed mode

// Cached across pages so the Markets chevron doesn't flicker.
let marketTagsCache = null;

/**
 * @param {string} [contentWidth] - When set (e.g. "1400px"), the nav keeps its full-width
 *   background but aligns its content to a centered column of that width (40px gutters).
 */
const Navbar = ({ contentWidth } = {}) => {
  const sidePad = contentWidth
    ? `max(40px, calc((100% - ${contentWidth}) / 2 + 40px))`
    : "80px";
  const { t, i18n } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const [authModal, setAuthModal] = useState(null); // null | 'login' | 'register' | 'forgot'
  const { pathname } = useLocation();
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
  const lastScrollY = React.useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      const prev = lastScrollY.current;

      if (current > SCROLL_THRESHOLD) {
        setNavFixed(true);
        if (Math.abs(current - prev) < 4) return;
        // scrolling down → hide, scrolling up → show
        setNavVisible(current < prev);
      } else {
        setNavFixed(false);
        setNavVisible(true);
      }

      lastScrollY.current = current;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // ────────────────────────────────────────────────────────────────────────────

  const [betsOpen, setBetsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    const path = history.location.pathname;
    const isPrivate =
      path === "/newprofile" ||
      ["/create", "/admin", "/changepassword", "/notifications", "/profile"].some(
        (p) => path === p || path.startsWith(`${p}/`),
      );
    if (isPrivate) history.push("/");
  };
  const handleProfile = () => history.push("/newprofile");
  const handleMyBets = () => setBetsOpen(true);
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

  const desktopNavStyle = navFixed
    ? {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        height: "104px",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `40px ${sidePad}`,
        boxSizing: "border-box",
        background: "rgba(10,20,34,0.88)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        transform: navVisible ? "translateY(0)" : "translateY(-110%)",
        // animate only when reappearing; instant hide
        transition: navVisible
          ? "transform 0.28s cubic-bezier(0.4,0,0.2,1)"
          : "none",
      }
    : {
        position: "relative",
        zIndex: 20,
        height: "64px",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `40px ${sidePad} 0`,
        marginBottom: "16px",
        boxSizing: "border-box",
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
        {/* Logo */}
        <Link
          to="/"
          style={{ display: "flex", alignItems: "center", flexShrink: 0 }}
        >
          <img
            src={logo}
            alt="Guardians Predict"
            style={{ height: "40px", objectFit: "contain" }}
          />
        </Link>

        {/* Nav links */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {NAV_LINKS.map((link) => {
            const label = t(link.labelKey);
            const isActive = link.to !== "/" && link.to === pathname;
            const isMarkets = link.labelKey === "nav.markets";

            if (isMarkets && marketTags.length > 0) {
              return (
                <div
                  key={link.labelKey}
                  style={{ position: "relative" }}
                  className="group"
                >
                  <Link
                    to={link.to}
                    style={{
                      ...linkStyle,
                      padding: "0 clamp(10px, 1.6vw, 28px)",
                      height: "25px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      ...(isActive
                        ? { color: "#FFFFFF", textDecoration: "underline", textUnderlineOffset: "6px" }
                        : {}),
                    }}
                  >
                    {label}
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 12 12"
                      fill="none"
                      className="transition-transform duration-200 group-hover:rotate-180"
                    >
                      <path
                        d="M2 4l4 4 4-4"
                        stroke={COLOR.muted}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                  {/* Hover dropdown */}
                  <div
                    className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200"
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: "50%",
                      transform: "translateX(-50%)",
                      paddingTop: "10px",
                      zIndex: 100,
                    }}
                  >
                    <div
                      style={{
                        minWidth: "200px",
                        ...CARD_ELEVATED,
                        background: "rgba(10,22,38,0.97)",
                        boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
                        overflow: "hidden",
                        padding: "6px",
                      }}
                    >
                      {/* All Markets link */}
                      <Link
                        to="/new-markets"
                        style={{
                          display: "block",
                          padding: "9px 16px",
                          borderRadius: "9px",
                          fontFamily: FONT,
                          fontWeight: 700,
                          fontSize: "13px",
                          color: COLOR.text,
                          textDecoration: "none",
                          borderBottom: "1px solid rgba(255,255,255,0.07)",
                          marginBottom: "4px",
                          transition: "background .12s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        {t('filters.all') || 'All Markets'}
                      </Link>
                      {marketTags.map((tag) => (
                        <Link
                          key={tag}
                          to={`/new-markets?league=${encodeURIComponent(tag)}`}
                          style={{
                            display: "block",
                            padding: "9px 16px",
                            borderRadius: "9px",
                            fontFamily: FONT,
                            fontWeight: 600,
                            fontSize: "13px",
                            color: COLOR.muted,
                            textDecoration: "none",
                            whiteSpace: "nowrap",
                            transition: "background .12s, color .12s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                            e.currentTarget.style.color = COLOR.text;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = COLOR.muted;
                          }}
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={link.labelKey}
                to={link.to}
                style={{
                  ...linkStyle,
                  padding: "0 clamp(10px, 1.6vw, 28px)",
                  height: "25px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  ...(isActive
                    ? { color: "#FFFFFF", textDecoration: "underline", textUnderlineOffset: "6px" }
                    : {}),
                }}
              >
                {label}
              </Link>
            );
          })}
          <LanguageDropdown i18n={i18n} />
        </div>

        {/* Auth / User */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexShrink: 0,
          }}
        >
          {isLoggedIn ? (
            <UserChip
              username={username}
              credit={userCredit}
              onLogout={handleLogout}
              onProfile={handleProfile}
              onMyBets={handleMyBets}
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
              onClick={handleMyBets}
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

      {isLoggedIn && (
        <MyBetsPanel
          isOpen={betsOpen}
          onClose={() => setBetsOpen(false)}
          username={username}
        />
      )}
    </>
  );
};

export default Navbar;
