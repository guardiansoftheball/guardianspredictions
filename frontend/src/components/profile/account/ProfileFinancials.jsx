import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { API_URL } from "../../../config";
import { useAuth } from "../../../helpers/AuthContent";
import { CARD } from "../../../styles/darkTokens";
import { EmptyState, ErrorBanner, FinancialGroup, buildFinancialItemGroups } from "../../layouts/profile/ProfileUiKit";
import LoadingSpinner from "../../loaders/LoadingSpinner";

const BLUE = "#60a5fa";
const TEAL = "#4fd1c5";
const ORANGE = "#f6ad55";
const RED = "#e0605a";
const GREEN = "#BAD659";

const money = (n) => {
  const v = Math.round(Number(n) || 0);
  return `${v < 0 ? "-" : ""}$${Math.abs(v).toLocaleString("en-US")}`;
};

const Panel = ({ title, hint, children }) => (
  <section style={CARD} className="flex flex-col p-5">
    <h3 className="m-0 text-[14px] font-semibold text-white">{title}</h3>
    {hint && <p className="m-0 mt-1 text-[12px] text-white/45">{hint}</p>}
    <div className="mt-4 flex-1">{children}</div>
  </section>
);

const Legend = ({ items }) => (
  <div className="flex flex-col gap-2">
    {items.map((it) => (
      <div key={it.label} className="flex items-center gap-2.5 text-[13px]">
        <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: it.color }} />
        <span className="flex-1 text-white/70">{it.label}</span>
        <span className="tabular-nums text-white">{money(it.value)}</span>
      </div>
    ))}
  </div>
);

const Donut = ({ items, center, centerLabel }) => {
  const data = items.filter((i) => i.value > 0);
  return (
    <div className="flex items-center gap-5">
      <div className="relative h-[132px] w-[132px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.length ? data : [{ value: 1, color: "rgba(255,255,255,0.08)" }]}
              dataKey="value"
              innerRadius={46}
              outerRadius={64}
              paddingAngle={data.length > 1 ? 2 : 0}
              stroke="none"
              isAnimationActive={false}
            >
              {(data.length ? data : [{ color: "rgba(255,255,255,0.08)" }]).map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[16px] font-semibold tabular-nums text-white">{center}</span>
          <span className="text-[10px] text-white/45">{centerLabel}</span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <Legend items={items} />
      </div>
    </div>
  );
};

// Horizontal bars on a shared scale, so magnitudes compare at a glance.
const CompareBars = ({ items }) => {
  const max = Math.max(...items.map((i) => Math.abs(i.value)), 1);
  return (
    <div className="flex flex-col gap-3.5">
      {items.map((it) => (
        <div key={it.label}>
          <div className="mb-1.5 flex justify-between text-[13px]">
            <span className="text-white/70">{it.label}</span>
            <span className="tabular-nums text-white">{money(it.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full" style={{ width: `${(Math.abs(it.value) / max) * 100}%`, background: it.color }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const ProfileFinancials = ({ username }) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [data, setData] = useState(undefined);
  const [error, setError] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    if (!username || !token) return undefined;
    let cancelled = false;
    fetch(`${API_URL}/v0/users/${username}/financial`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((json) => { if (!cancelled) setData(json.financial ?? null); })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [username, token]);

  if (error) return <ErrorBanner message={error} />;
  if (data === undefined) return <LoadingSpinner />;
  if (!data) return <EmptyState>{t("profile.noFinancialData")}</EmptyState>;

  const balance = data.accountBalance ?? 0;
  const inPlay = data.amountInPlay ?? 0;
  const borrowed = data.amountBorrowed ?? 0;
  const debtLimit = data.maximumDebtAllowed ?? 0;
  const creditUsed = debtLimit > 0 ? Math.min(1, borrowed / debtLimit) : 0;
  const groups = buildFinancialItemGroups(data);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel title={t("account.finWhereTitle")} hint={t("account.finWhereHint")}>
          <Donut
            center={money(Math.max(0, balance) + inPlay)}
            centerLabel={t("account.finTotal")}
            items={[
              { label: t("account.available"), value: Math.max(0, balance), color: BLUE },
              { label: t("account.openPositions"), value: inPlay, color: TEAL },
            ]}
          />
        </Panel>

        <Panel title={t("account.finCreditTitle")} hint={t("account.finCreditHint", { limit: money(debtLimit) })}>
          <div className="flex items-baseline justify-between">
            <span className="text-[24px] font-semibold tabular-nums text-white">{money(borrowed)}</span>
            <span className="text-[13px] text-white/45">{t("account.finOf", { limit: money(debtLimit) })}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full"
              style={{ width: `${creditUsed * 100}%`, background: creditUsed > 0.8 ? RED : ORANGE }}
            />
          </div>
          <div className="mt-2 text-[12px] text-white/45">
            {t("account.finCreditLeft", { amount: money(Math.max(0, debtLimit - borrowed)) })}
          </div>
        </Panel>

        <Panel title={t("account.finSpentTitle")} hint={t("account.finSpentHint")}>
          <CompareBars
            items={[
              { label: t("account.finSpentInPlay"), value: data.totalSpentInPlay ?? 0, color: "rgba(255,255,255,0.35)" },
              { label: t("account.finValueNow"), value: data.potentialValue ?? 0, color: TEAL },
            ]}
          />
        </Panel>

        <Panel title={t("account.finProfitTitle")} hint={t("account.finProfitHint")}>
          <CompareBars
            items={[
              { label: t("account.finTrading"), value: data.tradingProfits ?? 0, color: (data.tradingProfits ?? 0) >= 0 ? GREEN : RED },
              { label: t("account.finWork"), value: data.workProfits ?? 0, color: (data.workProfits ?? 0) >= 0 ? GREEN : RED },
              { label: t("account.totalProfit"), value: data.totalProfits ?? 0, color: (data.totalProfits ?? 0) >= 0 ? GREEN : RED },
            ]}
          />
        </Panel>
      </div>

      <button
        type="button"
        onClick={() => setShowDetail((v) => !v)}
        aria-expanded={showDetail}
        className="mx-auto mt-2 rounded-full border border-white/15 px-5 py-2 text-[13px] text-white/75 hover:border-white/35 hover:text-white"
      >
        {showDetail ? t("account.finHideDetail") : t("account.finShowDetail")}
      </button>

      {showDetail && (
        <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
          <FinancialGroup title={t("profile.balanceSheet")} accent={BLUE} items={groups.balanceSheetItems} />
          <FinancialGroup title={t("profile.incomeStatement")} accent={GREEN} items={groups.incomeStatementItems} />
          <FinancialGroup title={t("profile.cashFlow")} accent={ORANGE} items={groups.cashFlowItems} />
          <FinancialGroup title={t("profile.marketPosition")} accent={TEAL} items={groups.marketPositionItems} />
        </div>
      )}
    </div>
  );
};

export default ProfileFinancials;
