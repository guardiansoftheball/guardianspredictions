import React from "react";
import { FONT, FONT_HEAD, COLOR } from "../../styles/darkTokens";

const DIVIDER = "1px solid rgba(255,255,255,0.06)";

const StepButton = ({ onClick, side, children }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      width: "44px",
      border: "none",
      [side === "left" ? "borderRight" : "borderLeft"]: DIVIDER,
      background: "transparent",
      color: COLOR.muted,
      font: `700 20px ${FONT}`,
      cursor: "pointer",
      transition: "all .15s",
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.10)"; e.currentTarget.style.color = COLOR.text; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = COLOR.muted; }}
  >
    {children}
  </button>
);

const AmountInput = ({ value, onChange, onPlus, onMinus }) => (
  <div
    style={{
      display: "flex",
      alignItems: "stretch",
      background: "rgba(255,255,255,0.06)",
      borderRadius: "11px",
      overflow: "hidden",
    }}
  >
    <StepButton side="left" onClick={onMinus}>−</StepButton>
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "2px", padding: "10px 0" }}>
      <span style={{ font: `700 17px ${FONT}`, color: COLOR.muted }}>$</span>
      <input
        type="number"
        min="1"
        value={value}
        onChange={onChange}
        style={{
          width: "72px",
          background: "transparent",
          border: "none",
          color: COLOR.text,
          font: `800 22px ${FONT_HEAD}`,
          textAlign: "center",
          outline: "none",
          MozAppearance: "textfield",
        }}
      />
    </div>
    <StepButton side="right" onClick={onPlus}>+</StepButton>
  </div>
);

export default AmountInput;
