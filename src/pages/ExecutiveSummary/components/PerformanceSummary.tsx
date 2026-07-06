import React from 'react';
import { makeStyles, Text } from '@fluentui/react-components';
import { PerformanceKpiCard, KpiCardSkeleton } from './PerformanceKpiCard';
import type { ExecKpi } from '../../../types/executive.types';

const useStyles = makeStyles({
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
  },
  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
  },
});

interface PerformanceSummaryProps {
  kpis: ExecKpi[];
  loading?: boolean;
}

const PerformanceSummary: React.FC<PerformanceSummaryProps> = ({ kpis, loading }) => {
  const styles = useStyles();

  return (
    <div className={styles.section}>
      <Text className={styles.sectionTitle}>Performance Highlights</Text>
      <div className={styles.grid}>
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <KpiCardSkeleton key={i} />)
          : kpis.map(kpi => <PerformanceKpiCard key={kpi.id} kpi={kpi} />)
        }
      </div>
    </div>
  );
};

export { PerformanceSummary };
