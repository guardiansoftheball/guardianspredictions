import { API_URL } from '../../../config';
import React, { useState, useEffect } from 'react';
import { ErrorBanner, SuccessBanner, GhostButton, inputStyle } from '../../layouts/profile/ProfileUiKit';
import { FONT, COLOR } from '../../../styles/darkTokens';

const PersonalLinksSelector = ({ onSave, initialLinks }) => {
    const [links, setLinks] = useState({
        personalLink1: initialLinks?.personalLink1 || '',
        personalLink2: initialLinks?.personalLink2 || '',
        personalLink3: initialLinks?.personalLink3 || '',
        personalLink4: initialLinks?.personalLink4 || ''
    });
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Update component state when initialLinks prop changes
        setLinks({
            personalLink1: initialLinks?.personalLink1 || '',
            personalLink2: initialLinks?.personalLink2 || '',
            personalLink3: initialLinks?.personalLink3 || '',
            personalLink4: initialLinks?.personalLink4 || ''
        });
    }, [initialLinks]);

    const handleSave = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/v0/profilechange/links`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    personalLink1: links.personalLink1,
                    personalLink2: links.personalLink2,
                    personalLink3: links.personalLink3,
                    personalLink4: links.personalLink4
                }),
            });
            if (response.ok) {
                onSave(links);
                setSuccessMessage('Links updated successfully.');
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                throw new Error('Failed to update links');
            }
        } catch (err) {
            setError('Failed to save links. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '360px', maxWidth: '80vw' }}>
            {Object.keys(links).map((key, index) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ font: `600 11px ${FONT}`, letterSpacing: '.06em', color: COLOR.muted2, textTransform: 'uppercase' }}>
                        Link {index + 1}
                    </label>
                    <input
                        type="text"
                        value={links[key]}
                        onChange={(e) => setLinks({ ...links, [key]: e.target.value })}
                        placeholder={`https://…`}
                        style={inputStyle}
                        className="rounded-[10px] focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                    />
                </div>
            ))}
            {error && <ErrorBanner message={error} />}
            {successMessage && <SuccessBanner message={successMessage} />}
            <GhostButton onClick={handleSave} disabled={loading} tone="sky" style={{ alignSelf: 'flex-start', marginTop: '4px' }}>
                {loading ? 'Saving…' : 'Save links'}
            </GhostButton>
        </div>
    );
};

export default PersonalLinksSelector;
