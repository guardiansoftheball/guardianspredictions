import React, { useEffect, useRef } from 'react';

// Stops sampled from the design: the light spans the full width
// (side edges land on #09121f) and keeps darkening to #050811 in the corners.
const BASE = [5, 8, 17]; // #050811 — page base color
const STOPS = [
  ['#285479', 0], ['#244c70', 10], ['#1f4262', 22], ['#1b3955', 33],
  ['#18324b', 42], ['#152c43', 50], ['#12263a', 58], ['#0f2032', 67],
  ['#0d1a2a', 75], ['#0b1624', 87], ['#09121f', 100], ['#050811', 135],
].map(([hex, pos]) => [[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)), pos]);

// Anchored mode fades the light out over the bottom 40%, so the area right
// above the footer is always the plain base color.
const FADE_START = 0.6;
// Maximum vertical radius relative to the horizontal one.
const MAX_ASPECT = 1.3;
// Keep redraws cheap on very tall sections / hi-dpi screens.
const MAX_PIXELS = 4_000_000;

const pct = (v) => parseFloat(v) / 100;

// Same piecewise-linear interpolation CSS uses between gradient stops.
const colorAt = (t, out) => {
  if (t <= STOPS[0][1]) return STOPS[0][0];
  for (let i = 1; i < STOPS.length; i++) {
    const [c1, p1] = STOPS[i];
    if (t <= p1) {
      const [c0, p0] = STOPS[i - 1];
      const k = (t - p0) / (p1 - p0);
      out[0] = c0[0] + (c1[0] - c0[0]) * k;
      out[1] = c0[1] + (c1[1] - c0[1]) * k;
      out[2] = c0[2] + (c1[2] - c0[2]) * k;
      return out;
    }
  }
  return STOPS[STOPS.length - 1][0];
};

function paint(canvas, { width, height, y, opacity, fadeBottom }) {
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  if (!cssW || !cssH) return;

  let scale = Math.min(window.devicePixelRatio || 1, 2);
  if (cssW * cssH * scale * scale > MAX_PIXELS) scale = Math.sqrt(MAX_PIXELS / (cssW * cssH));
  const w = Math.max(1, Math.round(cssW * scale));
  const h = Math.max(1, Math.round(cssH * scale));
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(w, h);
  const data = img.data;
  // On narrow/tall areas (phones) a %-based ellipse turns into a thin vertical
  // strip; cap its height so it stays a contained soft light instead.
  const rx = pct(width) * w;
  const ry = Math.min(pct(height) * h, rx * MAX_ASPECT);
  const cx = 0.5 * w;
  // Phones: long stacked lists would put the light mid-scroll; pin it near the top instead.
  const cy = cssW < 768 ? Math.min(pct(y) * h, ry * 0.8) : pct(y) * h;
  const tmp = [0, 0, 0];

  for (let py = 0; py < h; py++) {
    const dy = (py + 0.5 - cy) / ry;
    const dy2 = dy * dy;
    const yn = (py + 0.5) / h;
    const fade = fadeBottom && yn > FADE_START ? 1 - (yn - FADE_START) / (1 - FADE_START) : 1;
    const k = opacity * fade;
    let i = py * w * 4;
    for (let px = 0; px < w; px++, i += 4) {
      const dx = (px + 0.5 - cx) / rx;
      const c = colorAt(Math.sqrt(dx * dx + dy2) * 100, tmp);
      // Triangular dither of ±1 level before quantizing: invisible as grain,
      // but removes the banding of low-contrast gradients on 8-bit screens. No +0.5
      // offset: Uint8ClampedArray already rounds, and a bias would show a seam at the edge.
      data[i] = BASE[0] + (c[0] - BASE[0]) * k + Math.random() - Math.random();
      data[i + 1] = BASE[1] + (c[1] - BASE[1]) * k + Math.random() - Math.random();
      data[i + 2] = BASE[2] + (c[2] - BASE[2]) * k + Math.random() - Math.random();
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

/**
 * Blue light background, rendered on a canvas with dithering (no banding).
 * Opaque: content that must show above it needs to be positioned (e.g. `relative z-10`).
 *
 * @param {"fixed"|"absolute"} position - fixed = pinned to the viewport; absolute = fills the
 *   nearest positioned ancestor, scrolls with it and fades out at its bottom (default: "fixed")
 * @param {string} width   - Horizontal radius of the light, in % (default: "50%" = reaches both side edges)
 * @param {string} height  - Vertical radius of the light, in % (default: "70%")
 * @param {string} y       - Vertical center of the light, in % (default: "42%")
 * @param {number} opacity - Light strength, 0–1; mixes the colors toward #050811 (default: 1)
 */
const BlueGlow = ({ position = 'fixed', width = '50%', height = '70%', y = '42%', opacity = 1 }) => {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    let frame = 0;
    const draw = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        paint(canvas, { width, height, y, opacity, fadeBottom: position === 'absolute' }),
      );
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [position, width, height, y, opacity]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position,
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
        zIndex: 0,
        background: '#050811',
      }}
    />
  );
};

/**
 * Soft light coming down from the top edge, fully faded out by 1100px.
 * Standard page background (everything except the home). Place it as the first
 * child of a `position: relative` wrapper that holds the navbar + page content.
 */
export const TopGlow = () => (
  <div
    aria-hidden="true"
    // maxHeight: on short pages it never grows past the content (and below the footer)
    style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1100px', maxHeight: '100%', pointerEvents: 'none' }}
  >
    <BlueGlow position="absolute" width="60%" height="70%" y="0%" opacity={0.45} />
  </div>
);

export default BlueGlow;
