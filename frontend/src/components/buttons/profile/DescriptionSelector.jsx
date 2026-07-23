import { API_URL } from '../../../config';
import React, { useState } from 'react';
import { ErrorBanner, GhostButton, inputStyle } from '../../layouts/profile/ProfileUiKit';

const DescriptionSelector = ({ onSave }) => {
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!description.trim()) {
            setError('Please enter a description before saving.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/v0/profilechange/description`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ description }),
            });
            if (!response.ok) {
                throw new Error('Failed to update description');
            }
            await response.json();
            onSave(description);
        } catch (err) {
            setError(err.message || 'Failed to update description.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '360px', maxWidth: '80vw' }}>
            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter new description..."
                rows={4}
                style={{ ...inputStyle, resize: 'vertical' }}
                className="rounded-[10px] focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                autoFocus
            />
            {error && <ErrorBanner message={error} />}
            <GhostButton onClick={handleSave} disabled={saving} tone="sky" style={{ alignSelf: 'flex-start' }}>
                {saving ? 'Saving…' : 'Save description'}
            </GhostButton>
        </div>
    );
};

export default DescriptionSelector;
