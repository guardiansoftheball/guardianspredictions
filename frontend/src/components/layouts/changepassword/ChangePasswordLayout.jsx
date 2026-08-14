import React, { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import SiteButton from '../../buttons/SiteButtons';
import { RegularInput } from '../../inputs/InputBar';
import { AuthContext } from '../../../helpers/AuthContent';
import { authenticatedApiRequest } from '../../../api/httpClient';

function ChangePasswordLayout() {
    const { t } = useTranslation();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const history = useHistory();
    const { logout } = useContext(AuthContext);
    const changePasswordReasonMessages = {
        AUTHORIZATION_DENIED: t('auth.changePassword.errors.AUTHORIZATION_DENIED'),
        VALIDATION_FAILED: t('auth.changePassword.errors.VALIDATION_FAILED'),
        INVALID_TOKEN: t('auth.changePassword.errors.INVALID_TOKEN'),
        INVALID_REQUEST: t('auth.changePassword.errors.INVALID_REQUEST'),
    };

    const handleCurrentPasswordChange = (event) => {
        setCurrentPassword(event.target.value);
    };

    const handleNewPasswordChange = (event) => {
        setNewPassword(event.target.value);
    };

    const handleConfirmPasswordChange = (event) => {
        setConfirmPassword(event.target.value);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError(t('auth.changePassword.passwordsNoMatch'));
            return;
        }

        try {
            await authenticatedApiRequest('/v0/changepassword', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ currentPassword, newPassword }),
                fallbackMessage: t('auth.changePassword.fallback'),
                reasonMessages: changePasswordReasonMessages,
            });

            setSuccess(t('auth.changePassword.success'));

            setTimeout(() => {
                logout();
                history.push('/');
            }, 2000);
        } catch (err) {
            console.error('Failed to change password:', err);
            setError(capitalizeFirstChar(err.message || t('auth.changePassword.fallback')));
        }
    };

    return (
        <div className="p-6 bg-primary-background shadow-md rounded-lg text-white">
            <h1 className="text-2xl font-bold mb-4">{t('auth.changePassword.title')}</h1>
            <p>{t('auth.changePassword.description')}</p>
            <form onSubmit={handleSubmit} className="space-y-8">
                <label htmlFor="current-password" className="block text-sm font-medium text-gray-300">
                    {t('auth.changePassword.currentPassword')}
                </label>
                <RegularInput
                    id="current-password"
                    name="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={handleCurrentPasswordChange}
                    placeholder={t('auth.changePassword.currentPassword')}
                    autoComplete="current-password"
                    required
                />
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-300">
                    {t('auth.changePassword.newPassword')}
                </label>
                <RegularInput
                    id="new-password"
                    name="new-password"
                    type="password"
                    value={newPassword}
                    onChange={handleNewPasswordChange}
                    placeholder={t('auth.changePassword.newPassword')}
                    autoComplete="new-password"
                    ariaDescribedBy="new-password-requirements"
                    required
                />
                <p id="new-password-requirements" className="text-sm text-gray-300">
                    {t('auth.changePassword.requirements')}
                </p>
                <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-300">
                    {t('auth.changePassword.confirmNewPassword')}
                </label>
                <RegularInput
                    id="confirm-new-password"
                    name="confirm-new-password"
                    type="password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    placeholder={t('auth.changePassword.confirmNewPassword')}
                    autoComplete="new-password"
                    required
                />
                <SiteButton type="submit">
                    {t('auth.changePassword.saveBtn')}
                </SiteButton>
            </form>
            {success && <p className="text-green-500" role="status">{success}</p>}
            {error && <p className="error" role="alert">{error}</p>}
        </div>
    );
}

function capitalizeFirstChar(str) {
  if (typeof str !== 'string' || str.length === 0) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default ChangePasswordLayout;
