import { API_URL } from '../../../config';
import React, { useState } from 'react';
import { ErrorBanner, GhostButton, inputStyle } from '../../layouts/profile/ProfileUiKit';

const DisplayNameSelector = ({ onSave }) => {
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!displayName.trim()) {
            setError('Please enter a display name before saving.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/v0/profilechange/displayname`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ displayName }),
            });
            if (!response.ok) {
                throw new Error('Failed to update display name');
            }
            await response.json();
            onSave(displayName);
        } catch (err) {
            setError(err.message || 'Failed to update display name.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '320px', maxWidth: '80vw' }}>
            <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter new display name..."
                style={inputStyle}
                className="rounded-[10px] focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                autoFocus
            />
            {error && <ErrorBanner message={error} />}
            <GhostButton onClick={handleSave} disabled={saving} tone="sky" style={{ alignSelf: 'flex-start' }}>
                {saving ? 'Saving…' : 'Save display name'}
            </GhostButton>
        </div>
    );
};

export default DisplayNameSelector;
