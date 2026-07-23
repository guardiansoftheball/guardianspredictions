import React, { useEffect } from 'react';
import { FONT, FONT_HEAD, COLOR } from '../../../styles/darkTokens';

const ProfileModal = ({ isOpen, onClose, children, title }) => {
    useEffect(() => {
        if (!isOpen) return undefined;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(5,10,18,0.65)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                padding: '20px',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '420px',
                    background: 'linear-gradient(180deg, rgba(23,41,63,0.97) 0%, rgba(12,26,44,0.98) 100%)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: '18px',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
                    padding: '24px',
                }}
                onClick={(event) => event.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    aria-label="Close"
                    style={{
                        position: 'absolute',
                        top: '14px',
                        right: '14px',
                        width: '28px',
                        height: '28px',
                        borderRadius: '9px',
                        border: '1px solid rgba(255,255,255,0.12)',
                        background: 'rgba(255,255,255,0.06)',
                        color: COLOR.muted,
                        font: `700 14px ${FONT}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    ✕
                </button>
                <h2
                    style={{
                        margin: '0 28px 18px 0',
                        font: `800 18px ${FONT_HEAD}`,
                        color: COLOR.text,
                        letterSpacing: '-.01em',
                    }}
                >
                    {title}
                </h2>
                {children}
            </div>
        </div>
    );
};

export default ProfileModal;
