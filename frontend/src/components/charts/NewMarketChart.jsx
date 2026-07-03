import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';

const FONT = 'Manrope,system-ui,sans-serif';
const YES_COLOR = '#22c55e';
const NO_COLOR  = '#fb5b6b';

// ─── helpers ──────────────────────────────────────────────────────────────────
function formatTick(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

function formatTooltipDate(ts) {
  const d = new Date(ts);
  return d.toLocaleString('es-AR', {
    day: '2-digit', month: 'short', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── custom tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, color, side }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  return (
    <div style={{
      background: 'rgba(12,26,44,0.95)',
      border: `1px solid ${color}44`,
      borderRadius: '10px',
      padding: '10px 14px',
      fontFamily: FONT,
    }}>
      <div style={{ font: `600 11px ${FONT}`, color: '#8ca0b6', marginBottom: '4px' }}>
        {formatTooltipDate(label)}
      </div>
      <div style={{ font: `800 18px ${FONT}`, color }}>
        {val != null ? val.toFixed(1) : '—'}%
      </div>
      <div style={{ font: `500 11px ${FONT}`, color: '#5d7189', marginTop: '2px' }}>
        {side} chance
      </div>
    </div>
  );
};

// ─── pill toggle ──────────────────────────────────────────────────────────────
const Pill = ({ label, active, color, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: '5px 14px',
      borderRadius: '8px',
      border: active ? `1px solid ${color}55` : '1px solid transparent',
      background: active ? `${color}22` : 'transparent',
      color: active ? color : '#5d7189',
      font: `700 12px ${FONT}`,
      cursor: 'pointer',
      transition: 'all .15s',
    }}
  >
    {label}
  </button>
);

// ─── main component ───────────────────────────────────────────────────────────
const NewMarketChart = ({
  data,
  currentProbability,
  closeDateTime,
  yesLabel = 'Yes',
  noLabel  = 'No',
}) => {
  const [showYes, setShowYes] = useState(true);

  const color = showYes ? YES_COLOR : NO_COLOR;
  const gradId = showYes ? 'gpYes' : 'gpNo';

  const points = useMemo(() => {
    const now = new Date();
    const closeDate = closeDateTime ? new Date(closeDateTime) : null;
    const isMarketClosed = closeDate && closeDate <= now;

    const raw = Array.isArray(data) ? data : [];
    const filtered = isMarketClosed && closeDate
      ? raw.filter(item => new Date(item.timestamp) <= closeDate)
      : raw;

    const pts = filtered.map(item => ({
      t: new Date(item.timestamp).getTime(),
      y: showYes
        ? Math.round(item.probability * 1000) / 10
        : Math.round((1 - item.probability) * 1000) / 10,
    }));

    // Append current / close endpoint
    if (currentProbability != null) {
      const endTime = isMarketClosed && closeDate ? closeDate.getTime() : now.getTime();
      const endY = showYes
        ? Math.round(currentProbability * 1000) / 10
        : Math.round((1 - currentProbability) * 1000) / 10;
      const last = pts[pts.length - 1];
      if (!last || last.t < endTime) {
        pts.push({ t: endTime, y: endY });
      }
    }

    return pts;
  }, [data, currentProbability, closeDateTime, showYes]);

  const currentPct = showYes
    ? Math.round(currentProbability * 100)
    : Math.round((1 - currentProbability) * 100);

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <div style={{ font: `700 11px ${FONT}`, letterSpacing: '.08em', color, marginBottom: '2px' }}>
            {(showYes ? yesLabel : noLabel).toUpperCase()} CHANCE
          </div>
          <div style={{ font: `800 38px/1 'Sora',system-ui,sans-serif`, color: '#eaf0f7' }}>
            {currentPct}<span style={{ fontSize: '20px' }}>%</span>
          </div>
        </div>

        {/* YES / NO toggle pills */}
        <div style={{
          display: 'flex', gap: '4px',
          background: 'rgba(0,0,0,0.25)',
          borderRadius: '10px',
          padding: '3px',
        }}>
          <Pill
            label={yesLabel}
            active={showYes}
            color={YES_COLOR}
            onClick={() => setShowYes(true)}
          />
          <Pill
            label={noLabel}
            active={!showYes}
            color={NO_COLOR}
            onClick={() => setShowYes(false)}
          />
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={points} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="gpYes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={YES_COLOR} stopOpacity={0.38} />
              <stop offset="100%" stopColor={YES_COLOR} stopOpacity={0}    />
            </linearGradient>
            <linearGradient id="gpNo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={NO_COLOR} stopOpacity={0.35} />
              <stop offset="100%" stopColor={NO_COLOR} stopOpacity={0}    />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="t"
            type="number"
            domain={['dataMin', 'dataMax']}
            scale="time"
            tickFormatter={formatTick}
            tick={{ fill: '#5d7189', fontSize: 11, fontFamily: FONT, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            minTickGap={60}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={v => `${v}%`}
            tick={{ fill: '#5d7189', fontSize: 11, fontFamily: FONT, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            ticks={[0, 25, 50, 75, 100]}
          />

          {/* Subtle horizontal grid lines */}
          {[25, 50, 75].map(v => (
            <ReferenceLine key={v} y={v} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
          ))}

          <Tooltip
            content={<CustomTooltip color={color} side={showYes ? yesLabel : noLabel} />}
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }}
          />

          <Area
            type="stepAfter"
            dataKey="y"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gradId})`}
            dot={false}
            activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
            isAnimationActive={true}
            animationDuration={400}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default NewMarketChart;
