import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import { TopGlow } from '../../components/ui/BlueGlow';
import { CARD } from '../../styles/darkTokens';
import ChangePasswordForm from '../../components/profile/account/ChangePasswordForm';

function ChangePassword() {
    const { t } = useTranslation();

    useEffect(() => {
        document.title = `${t('auth.changePassword.title')} | Guardians Predictions`;
    }, [t]);

    return (
        <div className="bg-[#050811] min-h-screen">
            <div className="relative">
                <TopGlow />
                <Navbar />
                <main className="relative z-10 mx-auto max-w-[520px] px-4 pb-24 pt-10">
                    <section style={CARD} className="p-6">
                        <h1 className="m-0 text-[22px] font-semibold text-white">{t('auth.changePassword.title')}</h1>
                        <p className="m-0 mt-2 mb-6 text-[13px] text-white/55">{t('auth.changePassword.description')}</p>
                        <ChangePasswordForm />
                    </section>
                </main>
            </div>
            <Footer />
        </div>
    );
}

export default ChangePassword;
