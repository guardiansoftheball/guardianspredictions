import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useSwipeToClose } from "../../hooks/useSwipeToClose";

const BottomSheet = ({ open, onClose, label, children }) => {
  const sheetRef = useSwipeToClose(open, onClose);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return createPortal(
    <div className={`lg:hidden fixed inset-0 z-[60] ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-white/[0.08] bg-[#0b0f1a] px-4 pt-3 transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
      >
        <button type="button" data-sheet-handle onClick={onClose} aria-label="Close" className="mx-auto mb-4 block h-1 w-10 rounded-full bg-white/20" />
        {children}
      </div>
    </div>,
    document.body,
  );
};

export default BottomSheet;
