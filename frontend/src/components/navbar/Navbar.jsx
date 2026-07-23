import React, { useState, useEffect } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import logo from "../../assets/logo/logo.png";
import {
  HomeSVG,
  MarketsSVG,
  PollsSVG,
  StatsSVG,
  MenuGrowSVG,
  MenuShrinkSVG,
} from "../../assets/components/SvgIcons";
import LoginModal from "../modals/login/LoginModal";
import RegisterModal from "../modals/register/RegisterModal";
import ForgotPasswordModal from "../modals/forgotpassword/ForgotPasswordModal";
import { useAuth } from "../../helpers/AuthContent";
import useUserCredit from "../utils/userFinanceTools/FetchUserCredit";
import { CARD_ELEVATED, FONT, FONT_HEAD, COLOR } from "../../styles/darkTokens";
const NAV_LINKS = [
  { label: "Trending", to: "/new-home", Icon: HomeSVG },
  { label: "Markets", to: "/new-markets", Icon: MarketsSVG },
  { label: "Polls", to: "/new-home", Icon: PollsSVG },
  { label: "Stats", to: "/new-home", Icon: StatsSVG },
];

const linkStyle = {
  fontFamily: "'Roboto', sans-serif",
  fontWeight: 400,
  fontSize: "20px",
  color: "#F1EFEF",
  letterSpacing: "0.4px",
  textDecoration: "none",
};

const BOTTOM_NAV = [
  { label: "Trending", to: "/new-home", activeOn: "/new-home", Icon: HomeSVG },
  {
    label: "Markets",
    to: "/new-markets",
    activeOn: "/new-markets",
    Icon: MarketsSVG,
  },
  { label: "Stats", to: "/new-home", activeOn: null, Icon: StatsSVG },
];

// ── User chip with dropdown ────────────────────────────────────────────────────
const UserChip = ({
  username,
  credit,
  onLogout,
  onProfile,
  isAdmin,
  onAdminReview,
  navVisible,
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = React.useRef(null);
  const { pathname } = useLocation();

  const initials = (username || "?").slice(0, 2).toUpperCase();
  const fmt = (n) => {
    if (n == null) return "—";
    if (n >= 1000) return (n / 1000).toFixed(1) + "k";
    return String(Math.round(n));
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
          borderRadius: "12px",
          padding: "6px 10px 6px 6px",
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
            🪙 {fmt(credit)}
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
              🪙 {fmt(credit)} credits
            </div>
          </div>

          {/* Menu items */}
          <div style={{ padding: "6px" }}>
            {isAdmin && (
              <DropdownItem
                icon={<AdminIcon />}
                label="Review Markets"
                active={pathname === "/test/admin/markets/review"}
                onClick={() => {
                  setOpen(false);
                  onAdminReview?.();
                }}
              />
            )}
            {!isAdmin && (
              <DropdownItem
                icon={<PersonIcon />}
                label="My profile"
                active={pathname === "/newprofile"}
                onClick={() => {
                  setOpen(false);
                  onProfile?.();
                }}
              />
            )}
            <DropdownItem
              icon={<LogoutIcon />}
              label="Sign out"
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
      padding: "9px 12px",
      borderRadius: "9px",
      border: active ? "1px solid rgba(156,201,241,0.25)" : "none",
      background: active ? "rgba(156,201,241,0.10)" : "transparent",
      cursor: "pointer",
      fontFamily: FONT,
      fontWeight: 600,
      fontSize: "13px",
      color: danger ? COLOR.noText : active ? "rgb(156,201,241)" : COLOR.text,
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

const Navbar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authModal, setAuthModal] = useState(null); // null | 'login' | 'register' | 'forgot'
  const { pathname } = useLocation();
  const { login, logout, username, token, usertype } = useAuth();
  const isLoggedIn = !!username;
  const isAdmin = usertype === "ADMIN";
  const { userCredit } = useUserCredit(isLoggedIn ? username : null);
  const history = useHistory();

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

  const handleLogout = () => {
    logout();
    history.push("/new-home");
  };
  const handleProfile = () => history.push("/newprofile");

  const openLoginModal = () => setAuthModal("login");
  const openRegisterModal = () => setAuthModal("register");
  const openForgotPasswordModal = () => setAuthModal("forgot");
  const closeAuthModal = () => setAuthModal(null);

  // Close sidebar on outside click
  useEffect(() => {
    if (!sidebarOpen) return;
    const handler = (e) => {
      if (!document.getElementById("mobile-sidebar")?.contains(e.target)) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sidebarOpen]);

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
        padding: "40px 80px 40px 80px",
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
        height: "64px",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "40px 80px 0 80px",
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
          to="/new-home"
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
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              style={{
                ...linkStyle,
                width: "138px",
                height: "25px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {link.label}
            </Link>
          ))}
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
              isAdmin={usertype === "ADMIN"}
              onAdminReview={() => history.push("/test/admin/markets/review")}
              navVisible={navVisible}
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
                Sign in
              </button>
              <button
                type="button"
                onClick={openRegisterModal}
                style={{
                  ...linkStyle,
                  color: "#FFFFFF",
                  background: "#34425F",
                  borderRadius: "20px",
                  width: "194px",
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
                Create account
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── MOBILE TOP BAR ── */}
      <div className="flex lg:hidden items-center justify-center h-14 bg-transparent w-full">
        <Link to="/new-home">
          <img
            src={logo}
            alt="Guardians Predict"
            className="h-9 object-contain"
          />
        </Link>
      </div>

      {/* ── MOBILE SIDEBAR BACKDROP ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── MOBILE SIDEBAR ── */}
      <aside
        id="mobile-sidebar"
        className={`fixed top-0 left-0 z-50 w-64 h-full bg-gray-900 text-white flex flex-col
          transition-transform duration-300 ease-in-out lg:hidden
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
          <img
            src={logo}
            alt="Guardians Predict"
            className="h-8 object-contain"
          />
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-300 hover:text-white"
            aria-label="Close menu"
          >
            <MenuShrinkSVG className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-grow overflow-y-auto px-4 py-4">
          <ul className="space-y-2">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                  style={{
                    fontFamily: "'Roboto', sans-serif",
                    fontSize: "16px",
                  }}
                >
                  {link.Icon && <link.Icon className="w-5 h-5" />}
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-3">
            {isLoggedIn ? (
              <div style={{ padding: "8px 4px" }}>
                {/* User info */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "6px 3px",
                    marginBottom: "12px",
                  }}
                >
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
                    {(username || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ lineHeight: 1.2 }}>
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
                        fontSize: "11px",
                        color: COLOR.accent,
                      }}
                    >
                      🪙{" "}
                      {userCredit != null
                        ? userCredit >= 1000
                          ? (userCredit / 1000).toFixed(1) + "k"
                          : String(Math.round(userCredit))
                        : "—"}
                    </div>
                  </div>
                </div>
                {/* Actions */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  {usertype === "ADMIN" && (
                    <button
                      onClick={() => {
                        setSidebarOpen(false);
                        history.push("/test/admin/markets/review");
                      }}
                      className="block py-2 px-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      style={{
                        fontFamily: "'Roboto', sans-serif",
                        fontSize: "16px",
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <AdminIcon /> Review Markets
                    </button>
                  )}
                  {usertype !== "ADMIN" && (
                    <button
                      onClick={() => {
                        setSidebarOpen(false);
                        handleProfile();
                      }}
                      className="block py-2 px-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      style={{
                        fontFamily: "'Roboto', sans-serif",
                        fontSize: "16px",
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <PersonIcon /> My profile
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSidebarOpen(false);
                      handleLogout();
                    }}
                    className="block py-2 px-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    style={{
                      fontFamily: "'Roboto', sans-serif",
                      fontSize: "16px",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <LogoutIcon /> Sign out
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setSidebarOpen(false);
                    openLoginModal();
                  }}
                  className="block py-2 px-3 text-center rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                  style={{
                    fontFamily: "'Roboto', sans-serif",
                    fontSize: "16px",
                  }}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSidebarOpen(false);
                    openRegisterModal();
                  }}
                  className="block py-2 px-3 text-center rounded-lg text-white transition-colors"
                  style={{
                    background: "#34425F",
                    fontFamily: "'Roboto', sans-serif",
                    fontSize: "16px",
                    borderRadius: "20px",
                  }}
                >
                  Create account
                </button>
              </>
            )}
          </div>
        </nav>
      </aside>

      {/* ── MOBILE BOTTOM NAV ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 h-16 bg-gray-900 border-t border-gray-700 flex justify-around items-center lg:hidden">
        {BOTTOM_NAV.map(({ label, to, activeOn, Icon }) => {
          const active = activeOn != null && pathname === activeOn;
          return (
            <Link
              key={label}
              to={to}
              className={`flex flex-col items-center gap-0.5 transition-colors rounded-lg px-3 py-1 ${active ? "bg-white/10 text-white" : "text-gray-300 hover:text-white"}`}
              aria-label={label}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{label}</span>
            </Link>
          );
        })}

        <button
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center gap-0.5 text-gray-300 hover:text-white transition-colors"
          aria-label="Open menu"
        >
          <MenuGrowSVG className="w-5 h-5" />
          <span className="text-[10px]">More</span>
        </button>
      </div>

      {authModal === "login" && (
        <LoginModal
          isOpen
          onClose={closeAuthModal}
          onLogin={login}
          redirectAfterLogin={history.location.pathname}
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
