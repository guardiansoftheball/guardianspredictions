import React, { useState, useEffect } from "react";
import { Link, useHistory } from "react-router-dom";
import logo from "../../assets/logo/logo.png";
import {
  HomeSVG,
  MarketsSVG,
  StatsSVG,
  MenuGrowSVG,
  MenuShrinkSVG,
} from "../../assets/components/SvgIcons";
import LoginModal from "../modals/login/LoginModal";
import RegisterModal from "../modals/register/RegisterModal";
import ForgotPasswordModal from "../modals/forgotpassword/ForgotPasswordModal";
import { useAuth } from "../../helpers/AuthContent";

const NAV_LINKS = [
  { label: "Trending", to: "/" },
  { label: "Markets", to: "/new-markets" },
  { label: "Polls", to: "/polls" },
  { label: "Stats", to: "/stats" },
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
  { label: "Trending", to: "/", Icon: HomeSVG },
  { label: "Markets", to: "/markets", Icon: MarketsSVG },
  { label: "Stats", to: "/stats", Icon: StatsSVG },
];

const Navbar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authModal, setAuthModal] = useState(null); // null | 'login' | 'register' | 'forgot'
  const { login } = useAuth();
  const history = useHistory();

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

  return (
    <>
      {/* ── DESKTOP NAV ── */}
      <nav
        className="hidden lg:flex"
        style={{
          height: "64px",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "40px 80px 0 80px",
          boxSizing: "border-box",
        }}
      >
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

        {/* Auth */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            flexShrink: 0,
          }}
        >
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
            Log in
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
            Sign up
          </button>
        </div>
      </nav>

      {/* ── MOBILE TOP BAR ── */}
      <div className="flex lg:hidden items-center justify-center h-14 bg-transparent w-full">
        <Link to="/">
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
                  className="block py-2 px-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                  style={{
                    fontFamily: "'Roboto', sans-serif",
                    fontSize: "16px",
                  }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                setSidebarOpen(false);
                openLoginModal();
              }}
              className="block py-2 px-3 text-center rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              style={{ fontFamily: "'Roboto', sans-serif", fontSize: "16px" }}
            >
              Log in
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
              Sign up
            </button>
          </div>
        </nav>
      </aside>

      {/* ── MOBILE BOTTOM NAV ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 h-16 bg-gray-900/90 backdrop-blur border-t border-gray-700 flex justify-around items-center lg:hidden">
        {BOTTOM_NAV.map(({ label, to, Icon }) => (
          <Link
            key={label}
            to={to}
            className="flex flex-col items-center gap-0.5 text-gray-300 hover:text-white transition-colors"
            aria-label={label}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px]">{label}</span>
          </Link>
        ))}

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
