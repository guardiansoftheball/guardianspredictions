import React from 'react';
import { useTranslation } from 'react-i18next';
import SiteTabs from './SiteTabs';
import BetsActivityLayout from '../layouts/activity/bets/BetsActivity';
import PositionsActivityLayout from '../layouts/activity/positions/PositionsActivity';
import LeaderboardActivity from '../layouts/activity/leaderboard/LeaderboardActivity';

const ActivityTabs = ({ marketId, market, refreshTrigger, variant }) => {
    const { t } = useTranslation();
    const tabsData = [
        { label: t('activity.bets'), content: <BetsActivityLayout marketId={marketId} refreshTrigger={refreshTrigger} /> },
        { label: t('activity.positions'), content: <PositionsActivityLayout marketId={marketId} market={market} refreshTrigger={refreshTrigger} /> },
        { label: t('activity.leaderboard'), content: <LeaderboardActivity marketId={marketId} market={market} refreshTrigger={refreshTrigger} /> },
        { label: t('activity.comments'), content: <div>Comments Go here...</div> },
    ];

    return <SiteTabs tabs={tabsData} variant={variant} />;
};

export default ActivityTabs;
