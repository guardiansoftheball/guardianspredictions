import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "../../assets/logo/logo.png";
import {
  XSVG,
  YoutubeSVG,
  TiktokSVG,
  InstagramSVG,
  LinkedinSVG,
  TelegramSVG,
} from "../../assets/components/SvgIcons";

const LINK_COLUMNS = [
  [
    { labelKey: "footer.faq", to: "#" },
    { labelKey: "footer.info", to: "/about" },
  ],
  [
    { labelKey: "footer.terms", to: "#" },
    { labelKey: "footer.privacy", to: "#" },
  ],
];

const SOCIAL_LINKS = [
  { label: "X", Icon: XSVG, href: "https://x.com" },
  { label: "YouTube", Icon: YoutubeSVG, href: "https://youtube.com" },
  { label: "TikTok", Icon: TiktokSVG, href: "https://tiktok.com" },
  { label: "Instagram", Icon: InstagramSVG, href: "https://instagram.com" },
  { label: "LinkedIn", Icon: LinkedinSVG, href: "https://linkedin.com" },
  { label: "Telegram", Icon: TelegramSVG, href: "https://telegram.org" },
];

const linkStyle = "text-[#F1EFEF] hover:text-white transition-colors text-sm";

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="w-full bg-primary-background border-t border-white/10">
      <div className="flex flex-wrap items-start justify-between gap-x-12 gap-y-8 px-10 py-10 max-lg:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center shrink-0">
          <img
            src={logo}
            alt="Guardians Predict"
            className="h-9 object-contain"
          />
        </Link>

        {/* Link columns */}
        <div className="flex flex-wrap gap-x-16 gap-y-6">
          {LINK_COLUMNS.map((column, i) => (
            <div key={i} className="flex flex-col gap-3">
              {column.map((link) => (
                <Link key={link.labelKey} to={link.to} className={linkStyle}>
                  {t(link.labelKey)}
                </Link>
              ))}
            </div>
          ))}

          <div className="flex flex-col gap-3">
            <a href="mailto:info@guardianspredict.com" className={linkStyle}>
              {t('footer.email')}
            </a>
          </div>
        </div>

        {/* Social links */}
        <div className="flex flex-col gap-3">
          <span className="text-[#F1EFEF] text-sm">{t('footer.followUs')}</span>
          <div className="flex items-center gap-4">
            {SOCIAL_LINKS.map(({ label, Icon, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-[#F1EFEF] hover:text-white transition-colors"
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
