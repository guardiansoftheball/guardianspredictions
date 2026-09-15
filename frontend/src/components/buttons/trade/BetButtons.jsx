import React, { useState, useRef, useCallback } from 'react';
import { buttonBaseStyle } from '../BaseButton';
import { NumberInput } from '../../inputs/InputBar';

// Toggle buttons between initial and selected states
const BetButton = ({ onClick }) => {
    const [isSelected, setIsSelected] = useState(false);
    const initialButtonStyle = "bg-custom-gray-light";
    const selectedButtonStyle = "bg-neutral-btn";
    const buttonBaseStyle = "w-full px-4 py-2 text-white border rounded focus:outline-none";

    const handleClick = () => {
        setIsSelected(!isSelected);
        onClick && onClick();
    };

    return (
        <button
            className={`${buttonBaseStyle} ${isSelected ? selectedButtonStyle : initialButtonStyle} min-w-32 text-xs sm:text-sm md:text-base`}
            onClick={handleClick}
        >
            TRADE
        </button>
    );
};

const BetNoButton = ({ onClick, label = "NO" }) => {
    return (
        <button
        className={`${buttonBaseStyle} bg-custom-gray-light hover:bg-red-btn`}
            onClick={onClick}
        >
            {label}
        </button>
    );
};

const BetYesButton = ({ onClick, label = "YES" }) => {
    return (
        <button
        className={`${buttonBaseStyle} bg-custom-gray-light hover:bg-green-btn`}
            onClick={onClick}
        >
            {label}
        </button>
    );
};

const BetInputAmount = ({ value, onChange }) => {
    return (
        <NumberInput
            value={value}
            onChange={onChange}
        />
    );
};

const ConfirmBetButton = ({ onClick, selectedDirection, yesLabel = "YES", noLabel = "NO" }) => {
    const [phase, setPhase] = useState('idle'); // 'idle' | 'success'
    const [hover, setHover] = useState(false);
    const [ripple, setRipple] = useState(null);
    const [bouncing, setBouncing] = useState(false);
    const btnRef = useRef(null);
    const timersRef = useRef({});

    const isSuccess = phase === 'success';

    const colors = {
        YES: { bg: '#BAD659', successBg: '#a3c24a', ink: '#1a2e05' },
        NO: { bg: '#D00000', successBg: '#b00000', ink: '#ffffff' },
        default: { bg: '#67697C', successBg: '#67697C', ink: '#ffffff' },
    };
    const palette = colors[selectedDirection] || colors.default;

    const buttonText = () => {
        switch (selectedDirection) {
            case 'NO': return `CONFIRM PURCHASE OF: ${noLabel}`;
            case 'YES': return `CONFIRM PURCHASE OF: ${yesLabel}`;
            default: return "CONFIRM PURCHASE";
        }
    };

    const successText = () => {
        switch (selectedDirection) {
            case 'NO': return `PURCHASED ${noLabel}`;
            case 'YES': return `PURCHASED ${yesLabel}`;
            default: return "PURCHASED";
        }
    };

    const handleClick = useCallback((e) => {
        // Ripple from click position
        const rect = e.currentTarget.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.6;
        setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top, size });
        setBouncing(true);

        clearTimeout(timersRef.current.ripple);
        clearTimeout(timersRef.current.bounce);
        timersRef.current.ripple = setTimeout(() => setRipple(null), 500);
        timersRef.current.bounce = setTimeout(() => setBouncing(false), 320);

        // Fire the actual purchase
        if (onClick) onClick();

        // Success animation
        if (phase !== 'idle') return;
        clearTimeout(timersRef.current.success);
        clearTimeout(timersRef.current.reset);
        timersRef.current.success = setTimeout(() => setPhase('success'), 180);
        timersRef.current.reset = setTimeout(() => setPhase('idle'), 2800);
    }, [onClick, phase]);

    return (
        <button
            ref={btnRef}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={handleClick}
            className="relative w-full overflow-hidden rounded-lg border-none py-3.5 font-bold text-sm tracking-wide cursor-pointer flex items-center justify-center gap-2 focus:outline-none"
            style={{
                background: isSuccess ? palette.successBg : palette.bg,
                color: palette.ink,
                boxShadow: isSuccess
                    ? `0 6px 20px -6px ${palette.bg}88`
                    : hover
                        ? `0 8px 20px -6px ${palette.bg}88`
                        : `0 3px 10px -4px ${palette.bg}55`,
                transform: isSuccess ? 'none' : hover ? 'translateY(-1px) scale(1.01)' : 'none',
                transition: 'transform 0.18s ease, box-shadow 0.25s ease, background 0.3s ease',
                animation: isSuccess
                    ? 'btn-success-pop 0.4s cubic-bezier(0.34,1.4,0.64,1)'
                    : bouncing
                        ? 'btn-bounce 0.32s ease'
                        : 'none',
            }}
        >
            {/* Shine sweep on hover */}
            <span
                className="pointer-events-none absolute inset-0"
                style={{
                    width: '35%',
                    height: '100%',
                    background: 'linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)',
                    transform: 'translateX(-160%) skewX(-18deg)',
                    opacity: hover && !isSuccess ? 1 : 0,
                    animation: hover && !isSuccess ? 'btn-shine 0.9s ease forwards' : 'none',
                }}
            />

            {/* Ripple */}
            {ripple && (
                <span
                    className="pointer-events-none absolute rounded-full"
                    style={{
                        left: ripple.x - ripple.size / 2,
                        top: ripple.y - ripple.size / 2,
                        width: ripple.size,
                        height: ripple.size,
                        background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 70%)',
                        animation: 'btn-ripple 0.5s ease-out',
                    }}
                />
            )}

            {/* Success state */}
            {isSuccess ? (
                <span className="relative z-10 flex items-center justify-center gap-2.5">
                    {/* Check circle */}
                    <span
                        className="flex items-center justify-center rounded-full"
                        style={{
                            width: 24,
                            height: 24,
                            background: palette.ink === '#ffffff' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.75)',
                            animation: 'btn-check-ring 0.42s cubic-bezier(0.34,1.5,0.64,1) both',
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M5 12.5L10 17.5L19 7"
                                stroke={palette.bg}
                                strokeWidth="3.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeDasharray="26"
                                style={{ animation: 'btn-check-draw 0.34s ease-out 0.16s both' }}
                            />
                        </svg>
                    </span>
                    {/* Success label */}
                    <span style={{ animation: 'btn-label-in 0.3s ease-out 0.1s both' }}>
                        {successText()}
                    </span>
                </span>
            ) : (
                <span className="relative z-10">{buttonText()}</span>
            )}
        </button>
    );
};



export { BetButton, BetYesButton, BetNoButton, BetInputAmount, ConfirmBetButton };
