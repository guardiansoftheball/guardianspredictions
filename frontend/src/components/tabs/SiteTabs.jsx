import React, { useState, useEffect } from 'react';

// Base styles for all tabs
const tabBaseStyle = "px-4 py-2 text-sm font-medium text-center cursor-pointer";
// Styles for the non-selected tabs
const tabInactiveStyle = "text-white bg-custom-gray-light border-transparent";
// Styles for the selected tab
const tabActiveStyle = "text-white bg-primary-pink";

const SiteTabs = ({ tabs, onTabChange, defaultTab, activeTab, variant }) => {
    const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || tabs[0].label);

    // Use activeTab prop if provided, otherwise fall back to internal state
    const currentTab = activeTab ?? internalActiveTab;

    useEffect(() => {
        if (defaultTab && defaultTab !== internalActiveTab) {
            setInternalActiveTab(defaultTab);
        }
    }, [defaultTab]);

    const handleTabClick = (tabLabel) => {
        if (onTabChange) {
            // External control - call the callback
            onTabChange(tabLabel);
        } else {
            // Internal control - update internal state
            setInternalActiveTab(tabLabel);
        }

        // Call individual tab's onSelect callback if it exists
        const tab = tabs.find(t => t.label === tabLabel);
        if (tab && tab.onSelect) {
            tab.onSelect();
        }
    };

    // ── dark variant (glassmorphism / new UI) ──────────────────────────────────
    if (variant === 'dark') {
        return (
            <div style={{ fontFamily: 'Manrope,system-ui,sans-serif' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', overflowX: 'auto' }}>
                    {tabs.map(tab => {
                        const isActive = currentTab === tab.label;
                        return (
                            <button
                                key={tab.label}
                                onClick={() => handleTabClick(tab.label)}
                                style={{
                                    flex: 1,
                                    minWidth: 0,
                                    padding: '13px 8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: 'transparent',
                                    fontFamily: 'Manrope,system-ui,sans-serif',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    color: isActive ? 'rgb(156,201,241)' : '#5d7189',
                                    boxShadow: isActive ? 'inset 0 -2px 0 rgb(156,201,241)' : 'none',
                                    transition: 'color .15s',
                                    whiteSpace: 'nowrap',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                }}
                            >
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{tab.label}</span>
                                {tab.badge ? (
                                    <span style={{
                                        flexShrink: 0,
                                        borderRadius: '999px',
                                        background: 'rgba(255,255,255,0.14)',
                                        padding: '1px 7px',
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        color: '#eaf0f7',
                                        lineHeight: '1.4',
                                    }}>
                                        {tab.badge}
                                    </span>
                                ) : null}
                            </button>
                        );
                    })}
                </div>
                <div style={{ padding: '16px' }}>
                    {tabs.map(tab => (
                        currentTab === tab.label && <div key={tab.label}>{tab.content}</div>
                    ))}
                </div>
            </div>
        );
    }

    // ── default (original pink) variant ────────────────────────────────────────
    return (
        <div>
            {/* Mobile-responsive tab container with overflow handling */}
            <div className="flex border-b-2 overflow-x-auto">
                {tabs.map(tab => (
                    <div
                        key={tab.label}
                        className={`${tabBaseStyle} ${currentTab === tab.label ? tabActiveStyle : tabInactiveStyle} flex-1 min-w-0`}
                        onClick={() => handleTabClick(tab.label)}
                    >
                        {/* Mobile-responsive text with truncation */}
                        <span className="flex min-w-0 items-center justify-center gap-2 text-xs sm:text-sm">
                            <span className="truncate">{tab.label}</span>
                            {tab.badge ? (
                                <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold leading-none text-white">
                                    {tab.badge}
                                </span>
                            ) : null}
                        </span>
                    </div>
                ))}
            </div>
            <div className="p-4">
                {tabs.map(tab => (
                    currentTab === tab.label && <div key={tab.label}>{tab.content}</div>
                ))}
            </div>
        </div>
    );
};

export default SiteTabs;
