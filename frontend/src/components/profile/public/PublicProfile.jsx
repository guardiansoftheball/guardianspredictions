import React, { useMemo, useState } from "react";
import { CARD } from "../../../styles/darkTokens";
import { useTranslation } from "react-i18next";
import { useToast } from "../../../hooks/useToast";
import MarkdownLite from "../../markdown/MarkdownLite";
import { usePerformance, summarize } from "../../layouts/profile/PerformanceSection";
import ProfilePnlChart from "../account/ProfilePnlChart";
import { PositionsList } from "../account/ProfilePositions";
import ProfileActivity from "../account/ProfileActivity";

const TABS = ["positions", "activity"];

const money = (n) => {
  const v = Math.round(Number(n) || 0);
  return `${v < 0 ? "-" : ""}$${Math.abs(v).toLocaleString("en-US")}`;
};
const signedMoney = (n) => `${n > 0 ? "+" : ""}${money(n)}`;
const tone = (n) => (n > 0 ? "text-[#C6E06C]" : n < 0 ? "text-[#fb8b96]" : "text-white");

const linkLabel = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
  </svg>
);

const StatCell = ({ label, value, className = "text-white" }) => (
  <div className="min-w-0 px-5 py-4">
    <div className="text-[13px] text-white/45">{label}</div>
    <div className={`mt-1.5 truncate text-[22px] font-semibold tabular-nums ${className}`}>{value}</div>
  </div>
);

const PublicProfile = ({ userData }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const username = userData?.username;
  const performance = usePerformance(username);
  const stats = useMemo(() => summarize(performance.rows), [performance.rows]);
  const [tab, setTab] = useState("positions");
  const ready = !performance.loading;
  const links = [1, 2, 3, 4].map((i) => userData?.[`personalink${i}`]).filter(Boolean);

  const show = (fn) => (ready ? fn() : "—");
  const roi = stats.roi == null ? "—" : `${stats.roi > 0 ? "+" : ""}${(stats.roi * 100).toFixed(1)}%`;

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t("publicProfile.linkCopied"));
    } catch {
      toast.error(t("publicProfile.linkCopyError"));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <section style={CARD} className="p-5 sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-8">
          {/* Identity */}
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-[32px] sm:h-[72px] sm:w-[72px] sm:text-[36px]"
              style={{ background: "rgba(255,255,255,0.06)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }}
            >
              {userData?.personalEmoji || "👤"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="m-0 min-w-0 truncate text-[24px] font-semibold leading-tight text-white sm:text-[28px]">
                  {userData?.displayname || username}
                </h1>
                <button
                  type="button"
                  onClick={share}
                  aria-label={t("publicProfile.share")}
                  className="shrink-0 rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/[0.08] hover:text-white"
                >
                  <ShareIcon />
                </button>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[14px] text-white/45">
                <span>@{username}</span>
                {userData?.usertype && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">{userData.usertype.toLowerCase()}</span>
                  </>
                )}
              </div>
              {userData?.description && (
                <div className="mt-3 text-[15px] leading-relaxed text-white/70">
                  <MarkdownLite>{userData.description}</MarkdownLite>
                </div>
              )}
              {links.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {links.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="rounded-full bg-black/20 px-2.5 py-1 text-[12px] text-white/70 no-underline ring-1 ring-white/10 transition-colors hover:text-white hover:ring-white/25"
                    >
                      {linkLabel(url)} ↗
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats: 3×2 grid with hairline dividers */}
          <div className="grid grid-cols-2 overflow-hidden rounded-2xl ring-1 ring-white/[0.08] sm:grid-cols-3 lg:w-[540px] lg:shrink-0">
            {[
              [t("publicProfile.portfolioValue"), show(() => money(stats.openValue))],
              [t("publicProfile.totalPnl"), show(() => signedMoney(stats.totalPnl)), ready ? tone(stats.totalPnl) : undefined],
              [t("publicProfile.biggestWin"), show(() => money(stats.biggestWin))],
              [t("account.predictions"), show(() => performance.rows.length.toLocaleString("en-US"))],
              [t("performance.winRate"), show(() => (stats.winRate == null ? "—" : `${Math.round(stats.winRate * 100)}%`)), "text-[#93c5fd]"],
              [t("performance.roi"), show(() => roi), ready && stats.roi != null ? tone(stats.roi) : undefined],
            ].map(([label, value, className], i) => (
              <div
                key={label}
                className={[
                  "border-white/[0.07]",
                  i % 2 === 0 ? "border-r" : "",
                  i < 4 ? "border-b" : "",
                  i % 3 !== 2 ? "sm:border-r" : "sm:border-r-0",
                  i < 3 ? "sm:border-b" : "sm:border-b-0",
                ].join(" ")}
              >
                <StatCell label={label} value={value} className={className} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <ProfilePnlChart rows={performance.rows} loading={performance.loading} showHint={false} />

      <div className="mt-2 flex flex-col gap-4">
        <div className="flex gap-6 border-b border-white/[0.08]" role="tablist">
          {TABS.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`-mb-px border-b-2 pb-3 text-[16px] font-semibold transition-colors ${
                tab === key ? "border-white text-white" : "border-transparent text-white/45 hover:text-white"
              }`}
            >
              {t(`account.${key}`)}
            </button>
          ))}
        </div>
        {tab === "positions" ? <PositionsList {...performance} /> : <ProfileActivity username={username} thirdPerson />}
      </div>
    </div>
  );
};

export default PublicProfile;
