import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { API_URL } from "../../../config";
import { useAuth } from "../../../helpers/AuthContent";
import { CARD } from "../../../styles/darkTokens";
import { ErrorBanner } from "../../layouts/profile/ProfileUiKit";
import { usePerformance, summarize, PerformanceView } from "../../layouts/profile/PerformanceSection";
import ProfilePnlChart from "./ProfilePnlChart";

const money = (n) => {
  const v = Math.round(Number(n) || 0);
  return `${v < 0 ? "-" : ""}$${Math.abs(v).toLocaleString("en-US")}`;
};

const Panel = ({ children, className = "" }) => (
  <div style={CARD} className={`p-5 ${className}`}>{children}</div>
);

const Stat = ({ label, value }) => (
  <div style={CARD} className="min-w-0 px-4 py-3">
    <div className="text-[11px] leading-tight text-white/50 sm:text-[12px]">{label}</div>
    <div className="mt-1 text-[15px] font-semibold tabular-nums text-white">{value}</div>
  </div>
);

const BreakdownRow = ({ color, label, value }) => (
  <div className="flex items-center gap-2.5 py-1.5 text-[13px]">
    <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: color }} />
    <span className="flex-1 text-white/70">{label}</span>
    <span className="tabular-nums text-white">{value}</span>
  </div>
);

const ProfileOverview = ({ username }) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [predictionsCount, setPredictionsCount] = useState(null);
  const performance = usePerformance(username);
  const winRate = useMemo(() => summarize(performance.rows).winRate, [performance.rows]);

  useEffect(() => {
    if (!username || !token) return undefined;
    let cancelled = false;
    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${API_URL}/v0/users/${username}/financial`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((json) => { if (!cancelled) setData(json.financial); })
      .catch((err) => { if (!cancelled) setError(err.message); });
    fetch(`${API_URL}/v0/portfolio/${username}`, { headers })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => { if (!cancelled && json) setPredictionsCount(json.portfolioItems?.length ?? 0); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [username, token]);

  if (error) return <ErrorBanner message={error} />;

  const show = (v) => (data ? money(v) : "—");
  const balance = data?.accountBalance ?? 0;
  const inPlay = data?.amountInPlayActive ?? data?.amountInPlay ?? 0;
  const borrowed = data?.amountBorrowed ?? 0;
  const barTotal = Math.max(0, balance) + inPlay + borrowed;
  const share = (v) => (barTotal > 0 ? `${(v / barTotal) * 100}%` : "0%");

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Panel className="flex flex-col">
          <div className="text-[13px] text-white/60">{t("account.availableBalance")}</div>
          <div className="mt-2 text-[28px] font-semibold md:text-[32px] leading-none tabular-nums text-white">{show(balance)}</div>
          <div className="mt-3 text-[12px] text-white/40">{t("account.availableHint")}</div>
        </Panel>

        <Panel>
          <div className="text-[13px] text-white/60">{t("account.totalValue")}</div>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div className="text-[24px] font-semibold leading-none tabular-nums text-white">{show(balance + inPlay)}</div>
            <div className="text-[11px] text-white/40">{t("account.totalValueHint")}</div>
          </div>
          <div className="my-4 flex h-1 gap-0.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div style={{ width: share(Math.max(0, balance)), background: "#60a5fa" }} />
            <div style={{ width: share(inPlay), background: "#4fd1c5" }} />
            <div style={{ width: share(borrowed), background: "#f6ad55" }} />
          </div>
          <BreakdownRow color="#60a5fa" label={t("account.available")} value={show(balance)} />
          <BreakdownRow color="#4fd1c5" label={t("account.openPositions")} value={show(inPlay)} />
          {borrowed > 0 && <BreakdownRow color="#f6ad55" label={t("account.borrowed")} value={show(borrowed)} />}
        </Panel>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label={t("account.totalProfit")} value={show(data?.totalProfits)} />
        <Stat label={t("performance.winRate")} value={winRate == null ? "—" : `${Math.round(winRate * 100)}%`} />
        <Stat label={t("account.predictions")} value={predictionsCount ?? "—"} />
      </div>

      <ProfilePnlChart rows={performance.rows} loading={performance.loading} />

      <div className="mt-2">
        <PerformanceView {...performance} t={t} hideStats />
      </div>
    </div>
  );
};

export default ProfileOverview;
