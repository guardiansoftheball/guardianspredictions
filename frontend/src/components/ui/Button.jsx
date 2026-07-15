import React from "react";

const iconNext = "/icons/icon-next.svg";

const variants = {
  // ── original light variants (login modal, etc.) ────────────────────────────
  primary: "bg-[#e9e9e9] text-[#3f3f3f] hover:bg-white rounded-[20px] px-9 py-3 text-[20px]",
  glass:   "bg-white/30 text-white hover:bg-white/40 rounded-[20px] border border-white/50 text-[20px]",

  // ── dark / glassmorphism variants (test admin pages, new UI) ───────────────
  // neutral dark glass — default action
  dark:    "bg-white/8 text-white hover:bg-white/14 rounded-[20px] border border-white/12 px-5 py-2 text-sm font-semibold",
  // celeste accent — primary action in dark context
  celeste: "bg-[#9CC9F1]/15 text-[#9CC9F1] hover:bg-[#9CC9F1]/25 rounded-[20px] border border-[#9CC9F1]/30 px-5 py-2 text-sm font-semibold",
  // success — approve
  success: "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 rounded-[20px] border border-emerald-500/30 px-5 py-2 text-sm font-semibold",
  // danger — reject
  danger:  "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 rounded-[20px] border border-rose-500/30 px-5 py-2 text-sm font-semibold",
};

export function Button({
  variant = "glass",
  type = "button",
  onClick,
  loading = false,
  disabled = false,
  withArrow = false,
  children,
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`flex items-center justify-center gap-1 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      <span>{loading ? "Cargando..." : children}</span>
      {withArrow && !loading && (
        <img src={iconNext} alt="" className="h-6 w-6 ml-1" />
      )}
    </button>
  );
}
