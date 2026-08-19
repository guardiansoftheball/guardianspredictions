import React, { createContext, useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const ToastContext = createContext(null);
export { ToastContext };

let nextId = 0;
const AUTO_DISMISS_MS = 4000;

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const addToast = useCallback(
    (message, type = "info") => {
      const id = ++nextId;
      setToasts((prev) => [...prev, { id, message, type, exiting: false }]);
      setTimeout(() => removeToast(id), AUTO_DISMISS_MS);
      return id;
    },
    [removeToast]
  );

  const api = useRef({ addToast, removeToast });
  api.current = { addToast, removeToast };

  const value = {
    success: (msg) => api.current.addToast(msg, "success"),
    error: (msg) => api.current.addToast(msg, "error"),
    info: (msg) => api.current.addToast(msg, "info"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
          style={{ maxWidth: "400px" }}
        >
          {toasts.map((t) => (
            <Toast
              key={t.id}
              toast={t}
              onClose={() => removeToast(t.id)}
            />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

const STYLES = {
  success: {
    border: "border-emerald-400/60",
    bg: "bg-emerald-950/80",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 shrink-0">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ),
  },
  error: {
    border: "border-red-400/60",
    bg: "bg-red-950/80",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400 shrink-0">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
  info: {
    border: "border-blue-400/60",
    bg: "bg-blue-950/80",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 shrink-0">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
};

function Toast({ toast, onClose }) {
  const style = STYLES[toast.type] || STYLES.info;

  return (
    <div
      className={`
        pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3
        text-sm text-white shadow-lg backdrop-blur-xl
        transition-all duration-300 ease-out
        ${style.border} ${style.bg}
        ${toast.exiting
          ? "translate-x-full opacity-0"
          : "translate-x-0 opacity-100 animate-slide-in-right"
        }
      `}
    >
      {style.icon}
      <p className="flex-1 leading-snug">{toast.message}</p>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded p-0.5 text-white/50 hover:text-white transition-colors"
        aria-label="Close"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
