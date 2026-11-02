import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../helpers/AuthContent";
import { authenticatedApiRequest } from "../../../api/httpClient";

const inputClass =
  "w-full rounded-xl border border-white/[0.08] bg-white/[0.05] px-4 py-2.5 text-[14px] text-white placeholder:text-white/30 outline-none transition-colors focus:border-white/30";

const PasswordInput = ({ id, label, value, onChange, autoComplete, describedBy }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-[12px] text-white/50">{label}</label>
    <input
      id={id}
      type="password"
      className={inputClass}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete={autoComplete}
      aria-describedby={describedBy}
      required
    />
  </div>
);

// Shared by the profile settings and the standalone /changepassword page.
// The backend invalidates the session on success, so we log out and go home.
const ChangePasswordForm = ({ onCancel }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const { logout } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reasonMessages = {
    AUTHORIZATION_DENIED: t("auth.changePassword.errors.AUTHORIZATION_DENIED"),
    VALIDATION_FAILED: t("auth.changePassword.errors.VALIDATION_FAILED"),
    INVALID_TOKEN: t("auth.changePassword.errors.INVALID_TOKEN"),
    INVALID_REQUEST: t("auth.changePassword.errors.INVALID_REQUEST"),
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (next !== confirm) {
      setError(t("auth.changePassword.passwordsNoMatch"));
      return;
    }
    setSubmitting(true);
    try {
      await authenticatedApiRequest("/v0/changepassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
        fallbackMessage: t("auth.changePassword.fallback"),
        reasonMessages,
      });
      setSuccess(t("auth.changePassword.success"));
      setTimeout(() => {
        logout();
        history.push("/");
      }, 2000);
    } catch (err) {
      setError(err.message || t("auth.changePassword.fallback"));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PasswordInput id="current-password" label={t("auth.changePassword.currentPassword")} value={current} onChange={setCurrent} autoComplete="current-password" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PasswordInput id="new-password" label={t("auth.changePassword.newPassword")} value={next} onChange={setNext} autoComplete="new-password" describedBy="new-password-requirements" />
        <PasswordInput id="confirm-new-password" label={t("auth.changePassword.confirmNewPassword")} value={confirm} onChange={setConfirm} autoComplete="new-password" />
      </div>
      <p id="new-password-requirements" className="m-0 text-[12px] text-white/40">{t("auth.changePassword.requirements")}</p>

      {error && <p role="alert" className="m-0 rounded-xl bg-[#fb5b6b]/10 px-4 py-2.5 text-[13px] text-[#fb8b96]">{error}</p>}
      {success && <p role="status" className="m-0 rounded-xl bg-[#BAD659]/10 px-4 py-2.5 text-[13px] text-[#C6E06C]">{success}</p>}

      <div className="flex items-center justify-end gap-1">
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-xl px-3 py-2 text-[13px] text-white/60 hover:text-white">
            {t("account.cancel")}
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || !current || !next || !confirm}
          className="rounded-xl bg-white px-4 py-2 text-[13px] font-semibold text-[#0b0f1a] transition-opacity disabled:opacity-50"
        >
          {t("auth.changePassword.saveBtn")}
        </button>
      </div>
    </form>
  );
};

export default ChangePasswordForm;
