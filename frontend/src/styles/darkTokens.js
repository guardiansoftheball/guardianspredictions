// Shared design tokens for the dark / glassmorphism UI (test market pages, new navbar, etc.)

export const BG_PAGE   = 'linear-gradient(180deg,#17293f 0%,#0c1a2c 42%,#081018 100%)';

export const CARD = {
  background : 'rgba(255,255,255,0.045)',
  border     : '1px solid rgba(255,255,255,0.09)',
  borderRadius: '16px',
};

export const CARD_ELEVATED = {
  background : 'rgba(255,255,255,0.07)',
  border     : '1px solid rgba(255,255,255,0.13)',
  borderRadius: '14px',
};

// One page column for the whole app: 1840px including the 40px side gutters
// (1760px of content, the content width of the 1920px Figma frames),
// so the navbar logo and page content always line up.
export const PAGE_MAX_WIDTH = "1840px";
// Detail pages (a market, a profile) read better narrower; the navbar follows.
export const DETAIL_MAX_WIDTH = "1440px";

export const FONT      = 'Roboto,system-ui,sans-serif';
export const FONT_HEAD = 'Roboto,system-ui,sans-serif';

export const COLOR = {
  text   : '#eaf0f7',
  muted  : '#8ca0b6',
  muted2 : '#6b7f95',
  muted3 : '#5d7189',
  accent : 'rgba(255,255,255,0.85)',
  yes    : '#BAD659',
  yesText: '#C6E06C',
  no     : '#fb5b6b',
  noText : '#fb8b96',
};
