import React from "react";

/**
 * Empty card shell — same shape/background as real cards but no content.
 * Used as a decorative background layer.
 */
const GhostCard = () => (
  <div className="w-full max-w-[344px] min-w-0 mx-auto rounded-[41px] p-px box-border bg-[conic-gradient(from_0deg,#B4D1ED_0%,#B4D1ED_19%,#5A6B89_36%,#B4D1ED_45%,#B4D1ED_63%,#5A6B89_75%,#B4D1ED_88%,#B4D1ED_100%)]">
    <div
      className="w-full h-full min-h-[210px] sm:min-h-[235px] rounded-[41px] overflow-hidden"
      style={{
        background:
          "linear-gradient(to bottom, rgba(126,150,208,0.30) 33%, rgba(23,26,43,0.30) 100%), #12152a",
      }}
    />
  </div>
);

export default GhostCard;
