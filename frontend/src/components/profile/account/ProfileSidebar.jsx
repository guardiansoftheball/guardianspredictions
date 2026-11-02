import React from "react";

const ICONS = {
  overview: <path d="M3 12h4l3-8 4 16 3-8h4" />,
  positions: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3h6v1M9 10h6M9 14h6" />
    </>
  ),
  activity: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  favorites: <path d="M6 3h12v18l-6-5-6 5z" />,
  financials: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  myMarkets: <path d="M4 5h16M4 12h16M4 19h10" />,
  marketChanges: <path d="M4 7h13l-3-3M20 17H7l3 3" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </>
  ),
  logout: <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3" />,
};

const Icon = ({ name }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
    {ICONS[name]}
  </svg>
);

const Chevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="ml-auto shrink-0 opacity-50">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

const itemClass = (active) =>
  `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] transition-colors ${
    active ? "bg-white/[0.08] text-white" : "text-white/60 hover:bg-white/[0.04] hover:text-white"
  }`;

const ProfileSidebar = ({ sections, active, onChange, onLogout, logoutLabel }) => (
  <>
    {/* Mobile: horizontal pills */}
    <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden" aria-label="Profile sections">
      {sections.map((s) => (
        <button
          key={s.key}
          type="button"
          onClick={() => onChange(s.key)}
          aria-current={active === s.key ? "page" : undefined}
          className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
            active === s.key ? "bg-white text-[#0b0f1a]" : "bg-white/[0.06] text-white/70"
          }`}
        >
          <Icon name={s.key} />
          {s.label}
        </button>
      ))}
    </nav>

    {/* Desktop: vertical sidebar */}
    <nav className="hidden w-[232px] shrink-0 flex-col gap-1 lg:flex" aria-label="Profile sections">
      {sections.map((s) => (
        <button
          key={s.key}
          type="button"
          onClick={() => onChange(s.key)}
          aria-current={active === s.key ? "page" : undefined}
          className={itemClass(active === s.key)}
        >
          <Icon name={s.key} />
          {s.label}
          <Chevron />
        </button>
      ))}
      <div className="my-3 border-t border-white/[0.08]" />
      <button type="button" onClick={onLogout} className={itemClass(false)}>
        <Icon name="logout" />
        {logoutLabel}
      </button>
    </nav>
  </>
);

export default ProfileSidebar;
