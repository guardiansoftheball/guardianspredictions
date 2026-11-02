import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import EmojiPicker from "emoji-picker-react";
import { CARD } from "../../../styles/darkTokens";
import { useToast } from "../../../hooks/useToast";
import { updateDescription, updateDisplayName, updateEmoji, updateLinks } from "../../../api/profileApi";
import ChangePasswordForm from "./ChangePasswordForm";

const inputClass =
  "w-full min-w-0 rounded-xl border border-white/[0.08] bg-white/[0.05] px-4 py-2.5 text-[14px] text-white placeholder:text-white/30 outline-none transition-colors focus:border-white/30 disabled:text-white/45";
const ghostButton =
  "shrink-0 rounded-xl border border-white/15 px-4 py-2.5 text-[13px] font-semibold text-white/85 no-underline transition-colors hover:border-white/35 hover:text-white";
const saveButton =
  "shrink-0 rounded-xl bg-white px-4 py-2 text-[13px] font-semibold text-[#0b0f1a] transition-opacity disabled:opacity-50";
const cancelButton = "shrink-0 rounded-xl px-3 py-2 text-[13px] text-white/60 hover:text-white";

const LINK_KEYS = ["personalLink1", "personalLink2", "personalLink3", "personalLink4"];

// Keeps a draft next to the saved value; Save/Cancel only appear once they differ.
function useEditable(initial, save, toast, t) {
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const commit = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      await save(draft);
      setSaved(draft);
      toast.success(t("account.saved"));
    } catch (err) {
      toast.error(err.message || t("account.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return { draft, setDraft, dirty, saving, commit, reset: () => setDraft(saved) };
}

const Field = ({ label, hint, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[12px] text-white/50">{label}</label>
    {children}
    {hint && <div className="text-[12px] text-white/35">{hint}</div>}
  </div>
);

const SaveBar = ({ field, t }) =>
  field.dirty && (
    <div className="flex items-center justify-end gap-1">
      <button type="button" onClick={field.reset} className={cancelButton}>{t("account.cancel")}</button>
      <button type="button" onClick={field.commit} disabled={field.saving} className={saveButton}>
        {field.saving ? t("account.saving") : t("account.save")}
      </button>
    </div>
  );

const EmojiField = ({ value, onChange, t }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative flex items-center gap-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("profile.editEmoji")}
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-[32px] transition-colors hover:bg-white/[0.1]"
      >
        {value || "👤"}
      </button>
      <div>
        <div className="text-[14px] font-semibold text-white">{t("account.avatar")}</div>
        <button type="button" onClick={() => setOpen((v) => !v)} className="mt-0.5 text-[13px] text-white/55 hover:text-white">
          {t("account.changeAvatar")}
        </button>
      </div>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-2">
          <EmojiPicker
            theme="dark"
            width={320}
            height={380}
            previewConfig={{ showPreview: false }}
            onEmojiClick={(e) => { onChange(e.emoji); setOpen(false); }}
          />
        </div>
      )}
    </div>
  );
};

const ProfileSettings = ({ userData }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [changingPassword, setChangingPassword] = useState(false);

  const emoji = useEditable(userData?.personalEmoji || "", updateEmoji, toast, t);
  const displayName = useEditable(userData?.displayname || "", (v) => {
    if (!v.trim()) throw new Error(t("account.nameRequired"));
    return updateDisplayName(v.trim());
  }, toast, t);
  const description = useEditable(userData?.description || "", updateDescription, toast, t);
  const links = useEditable(
    Object.fromEntries(LINK_KEYS.map((k, i) => [k, userData?.[`personalink${i + 1}`] || ""])),
    updateLinks,
    toast,
    t,
  );

  // Saving the avatar right away feels natural: picking one is the decision.
  useEffect(() => {
    if (emoji.dirty) emoji.commit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emoji.draft]);

  const onEnter = (field) => (e) => {
    if (e.key === "Enter") field.commit();
    if (e.key === "Escape") field.reset();
  };

  return (
    <div className="flex flex-col gap-4">
      <section style={CARD} className="flex flex-col gap-5 p-5">
        <div>
          <h2 className="m-0 text-[15px] font-semibold text-white">{t("account.generalInfo")}</h2>
          <p className="m-0 mt-1 text-[13px] text-white/50">{t("account.generalInfoHint")}</p>
        </div>

        <EmojiField value={emoji.draft} onChange={emoji.setDraft} t={t} />

        <Field label={t("account.username")} hint={t("account.usernameHint")}>
          <input className={inputClass} value={`@${userData?.username ?? ""}`} disabled readOnly />
        </Field>

        <Field label={t("account.displayName")}>
          <input
            className={inputClass}
            value={displayName.draft}
            maxLength={50}
            onChange={(e) => displayName.setDraft(e.target.value)}
            onKeyDown={onEnter(displayName)}
          />
          <SaveBar field={displayName} t={t} />
        </Field>

        <Field label={t("account.description")}>
          <textarea
            className={`${inputClass} min-h-[96px] resize-y`}
            value={description.draft}
            maxLength={2000}
            placeholder={t("profile.noDescription")}
            onChange={(e) => description.setDraft(e.target.value)}
          />
          <SaveBar field={description} t={t} />
        </Field>

        <Field label={t("account.links")}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {LINK_KEYS.map((key, i) => (
              <input
                key={key}
                className={inputClass}
                type="url"
                inputMode="url"
                placeholder={`https://… (${i + 1})`}
                value={links.draft[key]}
                onChange={(e) => links.setDraft({ ...links.draft, [key]: e.target.value })}
              />
            ))}
          </div>
          <SaveBar field={links} t={t} />
        </Field>
      </section>

      <section style={CARD} className="flex flex-col gap-4 p-5">
        <div>
          <h2 className="m-0 text-[15px] font-semibold text-white">{t("account.security")}</h2>
          <p className="m-0 mt-1 text-[13px] text-white/50">{t("account.securityHint")}</p>
        </div>
        {changingPassword ? (
          <ChangePasswordForm onCancel={() => setChangingPassword(false)} />
        ) : (
          <Field label={t("account.password")}>
            <div className="flex items-center gap-2">
              <input className={inputClass} value="••••••••" disabled readOnly />
              <button type="button" onClick={() => setChangingPassword(true)} className={ghostButton}>
                {t("account.changePassword")}
              </button>
            </div>
          </Field>
        )}
      </section>
    </div>
  );
};

export default ProfileSettings;
