import React, { useState } from "react";
import ReactDOM from "react-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";

const imgLogo            = "/guardiansPredictionLogo.svg";
const imgIconClose       = "/icons/icon-close.svg";
const imgIconGoogle      = "/icons/icon-google.svg";
const imgIconFacebook    = "/icons/icon-facebook.svg";
const imgIconBinance     = "/icons/icon-binance.svg";
const imgIconGuardiansID = "/icons/icon-guardiansid.svg";

const SSO_PROVIDERS = [
  { icon: imgIconBinance,     alt: "Binance"      },
  { icon: imgIconFacebook,    alt: "Facebook"     },
  { icon: imgIconGoogle,      alt: "Google"       },
  { icon: imgIconGuardiansID, alt: "Guardians ID" },
];

const RegisterModal = ({ isOpen, onClose, onSwitchToLogin }) => {
  const { t } = useTranslation();
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#618FC7]/10 backdrop-blur-md">
      {/* Card */}
      <div className="relative flex flex-col gap-5 w-[516px] max-w-[95vw] rounded-[41px] border border-white/30 bg-white/20 px-14 py-12 shadow-2xl backdrop-blur-xl">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-6 top-5 opacity-70 hover:opacity-100 transition-opacity"
          aria-label={t('auth.register.close')}
        >
          <img src={imgIconClose} alt={t('auth.register.close')} className="h-[18px] w-[18px]" />
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-2">
          <img src={imgLogo} alt="Guardians Predictions" className="h-16 w-auto" />
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-3">
          <Input
            type="text"
            placeholder={t('auth.register.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Input
            type="password"
            placeholder={t('auth.register.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <Input
            type="password"
            placeholder={t('auth.register.confirmPasswordPlaceholder')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        {/* Sign up */}
        <div className="flex justify-end">
          <Button variant="primary" withArrow>
            {t('auth.register.signUpBtn')}
          </Button>
        </div>

        {/* Separator */}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-white/40" />
          <span className="text-white/50 text-[20px]">{t('auth.register.or')}</span>
          <div className="flex-1 border-t border-white/40" />
        </div>

        {/* SSO */}
        <div className="flex justify-center gap-4">
          {SSO_PROVIDERS.map(({ icon, alt }) => (
            <Button
              key={alt}
              variant="glass"
              disabled
              title={t('auth.register.comingSoon', { provider: alt })}
              className="h-[52px] w-[104px] rounded-[16px]"
            >
              {icon && <img src={icon} alt={alt} className="h-[30px] w-[30px] object-contain" />}
            </Button>
          ))}
        </div>

        {/* Already have account */}
        <div className="flex justify-center">
          <button
            onClick={onSwitchToLogin}
            className="text-white/95 text-[16px] underline hover:text-white transition-colors"
          >
            {t('auth.register.alreadyHaveAccount')}
          </button>
        </div>

      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

export default RegisterModal;
