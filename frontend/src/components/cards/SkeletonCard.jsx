import React from "react";

const shimmer =
  "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent";

const Shell = ({ children }) => (
  <div className="w-full max-w-[344px] min-w-0 mx-auto rounded-[41px] p-px box-border animate-skeleton-pulse">
    <div className="w-full h-full min-h-[210px] sm:min-h-[235px] rounded-[41px] overflow-hidden box-border p-4 flex flex-col justify-between gap-4">
      {children}
    </div>
  </div>
);

const Bar = ({ className = "" }) => (
  <div className={`${shimmer} rounded-full bg-white/15 ${className}`} />
);

const Pill = ({ className = "" }) => (
  <div
    className={`${shimmer} rounded-xl bg-white/15 h-[34px] sm:h-[38px] ${className}`}
  />
);

/* ── Match skeleton ─────────────────────────────── */
export const MatchCardSkeleton = () => (
  <Shell>
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div className={`${shimmer} w-9 h-9 rounded-full bg-white/10 shrink-0`} />
        <Bar className="flex-1 h-[18px]" />
        <Bar className="w-10 h-[18px] shrink-0" />
      </div>
      <div className="flex items-center gap-2.5">
        <div className={`${shimmer} w-9 h-9 rounded-full bg-white/10 shrink-0`} />
        <Bar className="flex-1 h-[18px]" />
        <Bar className="w-10 h-[18px] shrink-0" />
      </div>
    </div>
    <div className="flex gap-2">
      <Pill className="flex-1" />
      <Pill className="flex-1" />
      <Pill className="flex-1" />
    </div>
    <div className="flex items-center justify-between">
      <Bar className="w-20 h-[16px]" />
      <Bar className="w-[14.5px] h-[20px] rounded-sm" />
    </div>
  </Shell>
);

/* ── Question skeleton ──────────────────────────── */
export const QuestionCardSkeleton = () => (
  <Shell>
    <div className="flex items-start gap-3">
      <div className={`${shimmer} w-[46px] h-[34px] sm:w-[52px] sm:h-[38px] rounded bg-white/10 shrink-0`} />
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <Bar className="w-full h-[16px]" />
        <Bar className="w-3/4 h-[16px]" />
      </div>
      <div className={`${shimmer} w-10 h-10 rounded-full bg-white/10 shrink-0`} />
    </div>
    <div className="flex gap-2">
      <Pill className="flex-1" />
      <Pill className="flex-1" />
    </div>
    <div className="flex items-center justify-between">
      <Bar className="w-20 h-[16px]" />
      <Bar className="w-[14.5px] h-[20px] rounded-sm" />
    </div>
  </Shell>
);

/* ── Prediction skeleton ────────────────────────── */
export const PredictionCardSkeleton = () => (
  <Shell>
    <div className="flex items-start gap-4">
      <div className={`${shimmer} w-[42px] h-[30px] sm:w-[46px] sm:h-[34px] rounded bg-white/10 shrink-0`} />
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <Bar className="w-full h-[16px]" />
        <Bar className="w-2/3 h-[16px]" />
      </div>
    </div>
    <div className="flex flex-col gap-3">
      {[0, 1].map((i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <Bar className="flex-1 h-[18px]" />
          <div className="flex items-center gap-2 shrink-0">
            <Bar className="w-10 h-[18px]" />
            <Pill className="w-[clamp(46px,14vw,65px)]" />
            <Pill className="w-[clamp(46px,14vw,65px)]" />
          </div>
        </div>
      ))}
    </div>
    <div className="flex items-center justify-between">
      <Bar className="w-20 h-[16px]" />
      <Bar className="w-[14.5px] h-[20px] rounded-sm" />
    </div>
  </Shell>
);

/**
 * Returns the skeleton component matching a card's type.
 */
export const skeletonForType = (type) =>
  type === "match"
    ? MatchCardSkeleton
    : type === "question"
      ? QuestionCardSkeleton
      : PredictionCardSkeleton;

/**
 * Generic skeleton that cycles through the three card types
 * to mimic a realistic loading grid.
 */
const SKELETON_CYCLE = [MatchCardSkeleton, QuestionCardSkeleton, PredictionCardSkeleton];

export const SkeletonCardGrid = ({ count = 12 }) =>
  Array.from({ length: count }, (_, i) => {
    const Component = SKELETON_CYCLE[i % 3];
    return <Component key={i} />;
  });

export default SkeletonCardGrid;
