import React from 'react';
import { useMarketDetails } from '../../hooks/useMarketDetails';
import { useAuth } from '../../helpers/AuthContent';
import LoadingSpinner from '../../components/loaders/LoadingSpinner';
import TestMarketDetailsLayout from '../../components/testmarketdetails/TestMarketDetailsLayout';

const TestMarketDetails = () => {
  const { username, usertype, moderatorStatus } = useAuth();
  const { details, error, isLoggedIn, token, refetchData, currentProbability } = useMarketDetails();

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8ca0b6', fontFamily: 'Manrope,system-ui,sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#eaf0f7', marginBottom: '8px' }}>Market not found</div>
        <div style={{ fontSize: '14px' }}>{error}</div>
      </div>
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
