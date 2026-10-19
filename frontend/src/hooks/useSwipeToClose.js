import { useEffect, useRef } from "react";

const CLOSE_DISTANCE = 100; // px
const FLICK_DISTANCE = 30; // px
const FLICK_VELOCITY = 0.5; // px/ms

// Swipe down to close a mobile bottom sheet. Only drags when the content is
// scrolled to the top or the touch starts on [data-sheet-handle].
export function useSwipeToClose(open, onClose) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (open) {
      el.style.transform = "";
      el.style.transition = "";
    }
    if (!open) return undefined;

    let startY = 0;
    let dy = 0;
    let startTime = 0;
    let dragging = false;

    const onStart = (e) => {
      if (window.innerWidth >= 1024) return;
      const scroller = el.querySelector("[data-sheet-scroll]") || el;
      const onHandle = e.target.closest?.("[data-sheet-handle]");
      if (scroller.scrollTop > 0 && !onHandle) return;
      startY = e.touches[0].clientY;
      dy = 0;
      startTime = Date.now();
      dragging = true;
      el.style.transition = "none";
    };

    const onMove = (e) => {
      if (!dragging) return;
      dy = Math.max(0, e.touches[0].clientY - startY);
      if (dy > 0) {
        el.style.transform = `translateY(${dy}px)`;
        if (e.cancelable) e.preventDefault();
      }
    };

    const onEnd = () => {
      if (!dragging) return;
      dragging = false;
      el.style.transition = "";
      const velocity = dy / Math.max(1, Date.now() - startTime);
      if (dy > CLOSE_DISTANCE || (dy > FLICK_DISTANCE && velocity > FLICK_VELOCITY)) {
        el.style.transform = "translateY(100%)";
        onClose();
      } else {
        el.style.transform = "";
      }
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [open, onClose]);

  return ref;
}
