import React from "react";

const iconNext = "/icons/icon-next.svg";

const variants = {
  primary: "bg-[#e9e9e9] text-[#3f3f3f] hover:bg-white rounded-[20px] px-9 py-3 text-[20px]",
  glass:   "bg-white/30 text-white hover:bg-white/40 rounded-[20px] border border-white/50 text-[20px]",
};

export function Button({
  variant = "glass",
  onClick,
  loading = false,
  disabled = false,
  withArrow = false,
  children,
  className = "",
}) {
  return (
    <button
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
