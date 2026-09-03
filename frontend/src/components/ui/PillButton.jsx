import React from "react";
import { FONT, FONT_HEAD, COLOR } from "../../styles/darkTokens";

/**
 * PillButton — unified pill-shaped button for the dark UI.
 *
 * Variants:
 *   "default"   — subtle white bg, white text
 *   "yes"       — green tones, gradient bg when active
 *   "no"        — red tones, gradient bg when active
 *   "primary"   — blue gradient action button
 *   "ghost"     — transparent bg, colored border
 *   "danger"    — red text, red hover bg
 *
 * Props:
 *   variant     string
 *   active      boolean — toggles active/selected state (yes/no/tab)
 *   size        "sm" | "md" | "lg"
 *   fullWidth   boolean
 *   disabled    boolean
 *   tone        string — for ghost variant ("sky"|"green"|"red"|"amber")
 *   as          "button"|"a"|Link — render as different element
 *   to          string — for Link usage
 *   style       object — merge extra styles
 *   children, onClick, ...rest
 */

const TONES = {
  sky:    { bg: "rgba(156,201,241,0.10)", border: "rgba(156,201,241,0.35)", color: COLOR.accent },
  green:  { bg: "rgba(186,214,89,0.10)",  border: "rgba(186,214,89,0.30)",  color: COLOR.yesText },
  red:    { bg: "rgba(251,91,107,0.10)",   border: "rgba(251,91,107,0.30)",  color: COLOR.noText },
  amber:  { bg: "rgba(255,193,7,0.10)",    border: "rgba(255,193,7,0.30)",   color: "#ffc107" },
};

const SIZES = {
  sm: { padding: "7px 18px", font: `700 12px ${FONT}` },
  md: { padding: "11px 20px", font: `700 14px ${FONT}` },
  lg: { padding: "15px 24px", font: `800 15px ${FONT_HEAD}` },
};

function getVariantStyle(variant, active, tone, disabled) {
  const t = TONES[tone] || TONES.sky;

  switch (variant) {
    case "yes":
      return {
        background: active
          ? "linear-gradient(180deg,#BAD659,#AABA49)"
          : "rgba(186,214,89,0.08)",
        border: "none",
        color: active ? "#000" : COLOR.yesText,
      };
    case "no":
      return {
        background: active
          ? "linear-gradient(180deg,#fb5b6b,#e11d48)"
          : "rgba(244,63,94,0.08)",
        border: "none",
        color: active ? "#000" : COLOR.noText,
      };
    case "primary":
      return {
        background: disabled
          ? "rgba(255,255,255,0.06)"
          : "linear-gradient(135deg, #9cc9f1 0%, #6aabde 100%)",
        border: "none",
        color: disabled ? COLOR.muted2 : "#0a1628",
      };
    case "ghost":
      return {
        background: t.bg,
        border: `1px solid ${t.border}`,
        color: disabled ? COLOR.muted2 : t.color,
      };
    case "danger":
      return {
        background: "transparent",
        border: "none",
        color: COLOR.noText,
      };
    case "tab":
      return {
        background: active ? "rgba(255,255,255,0.10)" : "transparent",
        border: "none",
        color: active ? COLOR.text : COLOR.muted2,
      };
    case "preset":
      return {
        background: "rgba(255,255,255,0.06)",
        border: "none",
        color: "#b7c6d6",
      };
    case "sell":
      return {
        background: disabled
          ? "rgba(255,255,255,0.08)"
          : "linear-gradient(180deg,#BAD659,#AABA49)",
        border: "none",
        color: disabled ? COLOR.muted2 : "#1a1a00",
      };
    default:
      return {
        background: "rgba(255,255,255,0.06)",
        border: "none",
        color: COLOR.text,
      };
  }
}

const PillButton = React.forwardRef(function PillButton(
  {
    variant = "default",
    active = false,
    size = "md",
    fullWidth = false,
    disabled = false,
    tone = "sky",
    as: Component = "button",
    to,
    style: extraStyle,
    children,
    onClick,
    ...rest
  },
  ref,
) {
  const sizeStyle = SIZES[size] || SIZES.md;
  const variantStyle = getVariantStyle(variant, active, tone, disabled);

  const style = {
    borderRadius: "999px",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all .15s",
    opacity: disabled ? 0.55 : 1,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: fullWidth ? "100%" : undefined,
    ...sizeStyle,
    ...variantStyle,
    ...extraStyle,
  };

  const props = {
    ref,
    style,
    onClick: disabled ? undefined : onClick,
    disabled: Component === "button" ? disabled : undefined,
    ...(to ? { to } : {}),
    ...rest,
  };

  return <Component {...props}>{children}</Component>;
});

export default PillButton;
