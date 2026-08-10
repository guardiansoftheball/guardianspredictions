import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FONT, COLOR, CARD_ELEVATED } from "../../styles/darkTokens";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
];

const GlobeIcon = () => (
  <svg
    width="14"
    height="14"
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

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const current = i18n.language?.slice(0, 2) || "en";
  const currentLabel = LANGUAGES.find((l) => l.code === current)?.label || "EN";

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
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: "12px",
          color: COLOR.muted,
          background: open ? "rgba(255,255,255,0.07)" : "transparent",
          border: `1px solid ${open ? "rgba(156,201,241,0.25)" : "transparent"}`,
          borderRadius: "8px",
          padding: "6px 10px",
          cursor: "pointer",
          transition: "all .15s",
        }}
      >
        <GlobeIcon />
        {currentLabel}
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
            minWidth: "130px",
            zIndex: 100,
            ...CARD_ELEVATED,
            background: "rgba(10,22,38,0.97)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
            borderRadius: "10px",
            overflow: "hidden",
            padding: "4px",
          }}
        >
          {LANGUAGES.map(({ code, label }) => {
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
                  gap: "8px",
                  padding: "8px 12px",
                  borderRadius: "7px",
                  border: "none",
                  background: active ? "rgba(156,201,241,0.12)" : "transparent",
                  cursor: "pointer",
                  fontFamily: FONT,
                  fontWeight: active ? 700 : 500,
                  fontSize: "13px",
                  color: active ? COLOR.accent : COLOR.text,
                  transition: "background .12s",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                {label}
                {active && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLOR.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto" }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
