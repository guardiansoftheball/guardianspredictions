import React, { useState } from 'react';
import { API_URL } from '../../../config';
import EmojiPickerInput from '../../inputs/EmojiPicker';
import { ErrorBanner, GhostButton, inputStyle } from '../../layouts/profile/ProfileUiKit';
import { FONT, COLOR } from '../../../styles/darkTokens';

const EmojiSelector = ({ currentEmoji = '', onSave }) => {
    const [selectedEmoji, setSelectedEmoji] = useState(currentEmoji || '');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        const emoji = selectedEmoji.trim();
        if (!emoji) {
            setError('Please select an emoji before saving.');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            setError('Authentication token not found. Please log in again.');
            return;
        }

        setSaving(true);
        setError('');
        try {
            const response = await fetch(`${API_URL}/v0/profilechange/emoji`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ emoji }),
            });

            if (!response.ok) {
                throw new Error('Failed to change emoji');
            }

            await response.json();
            if (onSave) onSave(emoji);
        } catch (err) {
            setError(err.message || 'Failed to change emoji.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '320px', maxWidth: '80vw' }}>
            <div style={{ font: `500 12.5px/1.5 ${FONT}`, color: COLOR.muted }}>
                Pick an emoji to represent you across the platform.
            </div>
            <EmojiPickerInput
                type="text"
                value={selectedEmoji}
                onChange={(event) => setSelectedEmoji(event.target.value)}
                placeholder="Choose an emoji"
                maxLength={20}
                replaceValueOnEmojiSelect
                className="rounded-[10px] focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                style={{ ...inputStyle, paddingRight: '40px' }}
            />
            {error && <ErrorBanner message={error} />}
            <GhostButton onClick={handleSave} disabled={saving} tone="sky" style={{ alignSelf: 'flex-start' }}>
                {saving ? 'Saving…' : 'Save emoji'}
            </GhostButton>
        </div>
    );
};

export default EmojiSelector;
