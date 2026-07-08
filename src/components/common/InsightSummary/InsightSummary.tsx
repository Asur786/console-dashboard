/**
 * InsightSummary (v2 — enterprise UX)
 *
 * Pure presentational component.
 * All fetching is managed by the parent (ExecutiveSummaryPage).
 *
 * Renders a 3-column responsive grid of InsightCards:
 *   Desktop  → 3 columns
 *   Tablet   → 2 columns
 *   Mobile   → 1 column
 *
 * States:
 *   loading  → 3 skeleton cards of equal height
 *   error    → friendly error state
 *   empty    → "No insights" placeholder
 *   data     → 3 InsightCards (Executive Summary / Root Cause / Recommendation)
 */

import React from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Skeleton,
  SkeletonItem,
} from '@fluentui/react-components';
import { BrainCircuit20Regular } from '@fluentui/react-icons';
import { InsightCard } from './InsightCard';
import type { InsightResponse } from '../../../types/insight.types';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerIcon: {
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
  },
  headerTitle: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground1,
  },
  badge: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    backgroundColor: tokens.colorNeutralBackground3,
    padding: '2px 8px',
    borderRadius: tokens.borderRadiusCircular,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    alignItems: 'stretch',
  },
  skeletonCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minHeight: '200px',
  },
  centeredState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '40px 16px',
    textAlign: 'center',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  stateText: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300,
    maxWidth: '340px',
  },
  errorState: {
    backgroundColor: tokens.colorStatusDangerBackground1,
    border: `1px solid ${tokens.colorStatusDangerBorder1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '16px 20px',
  },
  errorText: {
    color: tokens.colorStatusDangerForeground1,
    fontSize: tokens.fontSizeBase300,
  },
});

const SkeletonCard: React.FC = () => {
  const styles = useStyles();
  return (
    <div className={styles.skeletonCard}>
      <Skeleton>
        <SkeletonItem size={8} style={{ width: '40%' }} />
        <SkeletonItem size={8} style={{ marginTop: 12 }} />
        <SkeletonItem size={8} style={{ marginTop: 8 }} />
        <SkeletonItem size={8} style={{ marginTop: 8, width: '90%' }} />
        <SkeletonItem size={8} style={{ marginTop: 8, width: '85%' }} />
        <SkeletonItem size={8} style={{ marginTop: 8, width: '75%' }} />
        <SkeletonItem size={8} style={{ marginTop: 8, width: '60%' }} />
      </Skeleton>
    </div>
  );
};

interface InsightSummaryProps {
  loading: boolean;
  insight: InsightResponse | null;
  error: string | null;
}

const CARD_DEFS: {
  key: keyof Pick<InsightResponse, 'executiveSummary' | 'rootCause' | 'recommendation'>;
  label: string;
}[] = [
  { key: 'executiveSummary', label: 'Executive Summary' },
  { key: 'rootCause',        label: 'Root Cause Analysis' },
  { key: 'recommendation',   label: 'Business Recommendation' },
];

export const InsightSummary: React.FC<InsightSummaryProps> = ({
  loading,
  insight,
  error,
}) => {
  const styles = useStyles();

  const renderContent = () => {
    if (loading) {
      return (
        <div className={styles.grid}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      );
    }
    if (error) {
      return (
        <div className={styles.errorState}>
          <Text className={styles.errorText}>&#9888; {error}</Text>
        </div>
      );
    }
    if (!insight) {
      return (
        <div className={styles.centeredState}>
          <BrainCircuit20Regular style={{ fontSize: 32, color: tokens.colorNeutralForeground4 }} />
          <Text className={styles.stateText}>
            AI insights will appear here once KPI values have loaded.
          </Text>
        </div>
      );
    }
    return (
      <div className={styles.grid}>
        {CARD_DEFS.map(({ key, label }) => (
          <InsightCard
            key={key}
            title={label}
            content={insight[key] || 'No content available for this section.'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <BrainCircuit20Regular className={styles.headerIcon} />
        <Text className={styles.headerTitle}>AI Insight Summary</Text>
      </div>
      {renderContent()}
    </div>
  );
};
