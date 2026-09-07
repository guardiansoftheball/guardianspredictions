import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";

const NotFound = () => {
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "404 | Guardians Predictions";
  }, []);

  return (
    <div className="bg-primary-background min-h-screen pb-16">
      {/* Background glow */}
      <div
        style={{
          position: "fixed",
          width: "75vw",
          height: "100vh",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          background:
            "linear-gradient(135deg, rgb(81 173 246 / 35%) 0%, rgb(30 144 255 / 30%) 0%)",
          filter: "blur(250px)",
          pointerEvents: "none",
          zIndex: 0,
          borderRadius: "50%",
        }}
      />
      <Navbar />

      <div className="relative z-10 flex flex-col items-center justify-center px-6 py-32 text-center min-h-[60vh]">
        {/* 404 number */}
        <h1
          className="text-[120px] sm:text-[160px] font-extrabold leading-none tracking-tight"
          style={{
            background: "linear-gradient(135deg, rgba(156,201,241,0.9), rgba(81,173,246,0.5))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </h1>

        {/* Icon */}
        <div className="mt-4 mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white/30"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </div>

        {/* Text */}
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          {t("notFound.title", "Page not found")}
        </h2>
        <p className="text-white/50 text-base sm:text-lg max-w-md mb-10">
          {t("notFound.description", "The page you're looking for doesn't exist or has been moved.")}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #1d3a5f, #2a5298)",
              border: "1px solid rgba(156,201,241,0.3)",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            {t("notFound.goHome", "Go Home")}
          </Link>

          <Link
            to="/new-markets"
            className="flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 text-sm font-semibold text-white/70 hover:text-white hover:border-white/40 transition-all duration-200 hover:scale-105"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            {t("notFound.browseMarkets", "Browse Markets")}
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default NotFound;
