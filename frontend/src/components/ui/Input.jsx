import React, { useState } from "react";

const eyeOpen   = "/icons/charm-eye.svg";
const eyeClosed = "/icons/charm-eye-closed.svg";

export function Input({ type = "text", placeholder, value, onChange, autoComplete, className = "" }) {
  const [showPassword, setShowPass] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={`flex h-[58px] items-center rounded-[20px] border border-white/50 bg-white/25 px-5 ${className}`}>
      <input
        type={resolvedType}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className="w-full bg-transparent text-[16px] text-white placeholder-white/70 outline-none"
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPass((v) => !v)}
          className="ml-3 shrink-0 opacity-80 hover:opacity-100 transition-opacity relative h-5 w-7"
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          <img
            src={eyeOpen}
            alt=""
            className={`absolute inset-0 h-full w-full transition-all duration-300 ${showPassword ? "opacity-0 scale-75" : "opacity-100 scale-100"}`}
          />
          <img
            src={eyeClosed}
            alt=""
            className={`absolute inset-0 h-full w-full transition-all duration-300 ${showPassword ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
          />
        </button>
      )}
    </div>
  );
}
