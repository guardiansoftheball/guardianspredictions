import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';

const FONT      = 'Manrope,system-ui,sans-serif';
const FONT_HEAD = 'Sora,system-ui,sans-serif';
const YES_COLOR = '#22c55e';
const NO_COLOR  = '#fb5b6b';
const MUTED2    = '#6b7f95';
const TEXT      = '#eaf0f7';

const TIME_FILTERS = ['1H', '1D', '1W', 'ALL'];
const CUTOFF_MS    = { '1H': 3_600_000, '1D': 86_400_000, '1W': 604_800_000 };

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatTick(ts) {
  const d = new Date(ts);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function formatTooltipDate(ts) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${hh}:${mm}`;
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
      <div style={{ font: `800 18px ${FONT_HEAD}`, color }}>
        {val != null ? val.toFixed(1) : '—'}%
      </div>
      <div style={{ font: `500 11px ${FONT}`, color: '#5d7189', marginTop: '2px' }}>
        {side} chance
      </div>
    </div>
  );
};

// ─── main component ───────────────────────────────────────────────────────────
const NewMarketChart = ({
  data,
  currentProbability,
  closeDateTime,
  yesLabel = 'Yes',
  noLabel  = 'No',
}) => {
  const [showYes,    setShowYes]    = useState(true);
  const [timeFilter, setTimeFilter] = useState('ALL');

  const color = showYes ? YES_COLOR : NO_COLOR;
  const gradId = showYes ? 'gpYes' : 'gpNo';

  const points = useMemo(() => {
    const now       = Date.now();
    const closeDate = closeDateTime ? new Date(closeDateTime) : null;
    const isClosed  = closeDate && closeDate.getTime() <= now;
    const cutoff    = timeFilter === 'ALL' ? 0 : now - CUTOFF_MS[timeFilter];

    const raw = Array.isArray(data) ? data : [];
    const base = isClosed && closeDate
      ? raw.filter(item => new Date(item.timestamp).getTime() <= closeDate.getTime())
      : raw;

    // Find the last point before the cutoff to use as the starting value
    const beforeCutoff = cutoff > 0 ? base.filter(item => new Date(item.timestamp).getTime() < cutoff) : [];
    const anchor = beforeCutoff.length > 0 ? [{ ...beforeCutoff[beforeCutoff.length - 1], timestamp: new Date(cutoff).toISOString() }] : [];

    const filtered = [
      ...anchor,
      ...base.filter(item => new Date(item.timestamp).getTime() >= cutoff),
    ];

    const pts = filtered.map(item => ({
      t: new Date(item.timestamp).getTime(),
      y: showYes
        ? Math.round(item.probability * 1000) / 10
        : Math.round((1 - item.probability) * 1000) / 10,
    }));

    if (currentProbability != null) {
      const endTime = isClosed && closeDate ? closeDate.getTime() : now;
      const endY    = showYes
        ? Math.round(currentProbability * 1000) / 10
        : Math.round((1 - currentProbability) * 1000) / 10;
      const last = pts[pts.length - 1];
      if (!last || last.t < endTime) pts.push({ t: endTime, y: endY });
    }

    return pts;
  }, [data, currentProbability, closeDateTime, showYes, timeFilter]);

  const currentPct = showYes
    ? Math.round(currentProbability * 100)
    : Math.round((1 - currentProbability) * 100);

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-end',
        justifyContent: 'space-between', marginBottom: '14px', gap: '12px',
      }}>
        {/* Probability number */}
        <div>
          <div style={{ font: `700 11px ${FONT}`, letterSpacing: '.08em', color, marginBottom: '2px' }}>
            {(showYes ? yesLabel : noLabel).toUpperCase()} CHANCE
          </div>
          <div style={{ font: `800 38px/1 ${FONT_HEAD}`, color: TEXT }}>
            {currentPct}<span style={{ fontSize: '20px' }}>%</span>
          </div>
        </div>

        {/* Controls: YES/NO pills + time filters */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          {/* YES / NO */}
          <div style={{
            display: 'flex', gap: '2px',
            background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '3px',
          }}>
            {[{ label: yesLabel, active: showYes, color: YES_COLOR, onClick: () => setShowYes(true) },
              { label: noLabel,  active: !showYes, color: NO_COLOR,  onClick: () => setShowYes(false) }
            ].map(({ label, active, color: c, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                style={{
                  padding: '5px 14px', borderRadius: '8px',
                  border: active ? `1px solid ${c}55` : '1px solid transparent',
                  background: active ? `${c}22` : 'transparent',
                  color: active ? c : MUTED2,
                  font: `700 12px ${FONT}`, cursor: 'pointer', transition: 'all .15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Time filters */}
          <div style={{
            display: 'flex', gap: '2px',
            background: 'rgba(0,0,0,0.25)', borderRadius: '9px', padding: '3px',
          }}>
            {TIME_FILTERS.map(tf => (
              <button
                key={tf}
                onClick={() => setTimeFilter(tf)}
                style={{
                  padding: '4px 10px', borderRadius: '7px', border: 'none',
                  font: `700 11px ${FONT}`, cursor: 'pointer',
                  background: timeFilter === tf ? 'rgba(255,255,255,0.10)' : 'transparent',
                  color: timeFilter === tf ? TEXT : MUTED2,
                  transition: 'all .15s',
                }}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
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
            dataKey="t" type="number" domain={['dataMin', 'dataMax']} scale="time"
            tickFormatter={formatTick}
            tick={{ fill: '#5d7189', fontSize: 11, fontFamily: FONT, fontWeight: 600 }}
            axisLine={false} tickLine={false} minTickGap={55}
          />
          <YAxis
            domain={[0, 100]} tickFormatter={v => `${v}%`}
            tick={{ fill: '#5d7189', fontSize: 11, fontFamily: FONT, fontWeight: 600 }}
            axisLine={false} tickLine={false} ticks={[0, 25, 50, 75, 100]}
          />
          {[25, 50, 75].map(v => (
            <ReferenceLine key={v} y={v} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
          ))}
          <Tooltip
            content={<CustomTooltip color={color} side={showYes ? yesLabel : noLabel} />}
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Area
            type="stepAfter" dataKey="y"
            stroke={color} strokeWidth={2.5}
            fill={`url(#${gradId})`}
            dot={false} activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
            isAnimationActive={true} animationDuration={400}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default NewMarketChart;
