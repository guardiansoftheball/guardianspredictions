import React from 'react';
import { useTranslation } from 'react-i18next';
import SiteTabs from './SiteTabs';
import BetsActivityLayout from '../layouts/activity/bets/BetsActivity';
import PositionsActivityLayout from '../layouts/activity/positions/PositionsActivity';
import LeaderboardActivity from '../layouts/activity/leaderboard/LeaderboardActivity';
import DarkBetsActivity from '../layouts/activity/dark/DarkBetsActivity';
import DarkPositionsActivity from '../layouts/activity/dark/DarkPositionsActivity';
import DarkLeaderboardActivity from '../layouts/activity/dark/DarkLeaderboardActivity';
import DarkCommentsActivity from '../layouts/activity/dark/DarkCommentsActivity';

const ActivityTabs = ({ marketId, market, refreshTrigger, variant, activeTab, onTabChange }) => {
    const { t } = useTranslation();
    const props = { marketId, market, refreshTrigger };

    const tabsData = variant === 'dark'
        ? [
            { label: t('activity.comments'), content: <DarkCommentsActivity /> },
            { label: t('activity.bets'), content: <DarkBetsActivity {...props} /> },
            { label: t('activity.positions'), content: <DarkPositionsActivity {...props} /> },
            { label: t('activity.leaderboard'), content: <DarkLeaderboardActivity {...props} /> },
        ]
        : [
            { label: t('activity.bets'), content: <BetsActivityLayout marketId={marketId} refreshTrigger={refreshTrigger} /> },
            { label: t('activity.positions'), content: <PositionsActivityLayout marketId={marketId} market={market} refreshTrigger={refreshTrigger} /> },
            { label: t('activity.leaderboard'), content: <LeaderboardActivity marketId={marketId} market={market} refreshTrigger={refreshTrigger} /> },
            { label: t('activity.comments'), content: <div>Comments Go here...</div> },
        ];

    return <SiteTabs tabs={tabsData} variant={variant} activeTab={activeTab} onTabChange={onTabChange} />;
};

export default ActivityTabs;
