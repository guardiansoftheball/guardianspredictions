import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMarketDetails } from '../../hooks/useMarketDetails';
import { useAuth } from '../../helpers/AuthContent';
import LoadingSpinner from '../../components/loaders/LoadingSpinner';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import TestMarketDetailsLayout from '../../components/testmarketdetails/TestMarketDetailsLayout';

const TestMarketDetails = () => {
  const { t } = useTranslation();
  const { username, usertype, moderatorStatus } = useAuth();
  const { details, error, isLoggedIn, token, refetchData, currentProbability } = useMarketDetails();

  useEffect(() => {
    if (error) {
      document.title = `${t('notFound.marketNotFound', 'Market not found')} | Guardians Predictions`;
    } else if (details?.market?.questionTitle) {
      document.title = `${details.market.questionTitle} | Guardians Predictions`;
    }
  }, [details?.market?.questionTitle, error, t]);

  if (error) return (
    <div className="bg-primary-background min-h-screen pb-16">
      <Navbar />
      <div className="relative z-10 flex flex-col items-center justify-center px-6 py-32 text-center min-h-[60vh]">
        <h1
          className="text-[100px] sm:text-[130px] font-extrabold leading-none tracking-tight"
          style={{
            background: 'linear-gradient(135deg, rgba(156,201,241,0.9), rgba(81,173,246,0.5))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          404
        </h1>
        <div className="mt-4 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
            <path d="M3 3l18 18" />
            <path d="M10.5 21H5a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v5.5" />
            <path d="M13.5 15.5l2 2" />
            <path d="M17.5 11.5l2 2" />
            <circle cx="16" cy="16" r="5.5" />
          </svg>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          {t('notFound.marketNotFound', 'Market not found')}
        </h2>
        <p className="text-white/50 text-base sm:text-lg max-w-md mb-10">
          {t('notFound.marketDescription', "This market doesn't exist or may have been removed.")}
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #1d3a5f, #2a5298)',
              border: '1px solid rgba(156,201,241,0.3)',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            {t('notFound.goHome', 'Go Home')}
          </Link>
          <Link
            to="/new-markets"
            className="flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 text-sm font-semibold text-white/70 hover:text-white hover:border-white/40 transition-all duration-200 hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            {t('notFound.browseMarkets', 'Browse Markets')}
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );

  if (!details) return <LoadingSpinner />;

  return (
    <TestMarketDetailsLayout
      market={details.market}
      creator={details.creator}
      numUsers={details.numUsers}
      totalVolume={details.totalVolume}
      currentProbability={currentProbability}
      probabilityChanges={details.probabilityChanges}
      marketId={details.market.id}
      username={username}
      usertype={usertype}
      moderatorStatus={moderatorStatus}
      isLoggedIn={isLoggedIn}
      token={token}
      refetchData={refetchData}
    />
  );
};

export default TestMarketDetails;
