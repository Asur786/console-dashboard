import React from 'react';
import { makeStyles, tokens, Text, SkeletonItem } from '@fluentui/react-components';
import type { ExecKpi } from '../../../types/executive.types';

/* ------------------------------------------------------------------ */
/*  Styles — enterprise BI card look                                  */
/* ------------------------------------------------------------------ */
const useStyles = makeStyles({
  card: {
    flex: '1 1 170px',
    minWidth: '170px',
    maxWidth: '240px',
    padding: '20px 22px 16px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: '10px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: tokens.shadow4,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    transition: 'box-shadow 0.2s, transform 0.15s',
    ':hover': {
      boxShadow: tokens.shadow8,
      transform: 'translateY(-1px)',
    },
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: tokens.colorNeutralForeground3,
  },
  infoIcon: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: `1.5px solid ${tokens.colorNeutralStroke1}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: '700',
    color: tokens.colorNeutralForeground3,
    cursor: 'help',
    flexShrink: 0,
  },
  value: {
    fontSize: '30px',
    fontWeight: '700',
    lineHeight: 1.2,
    marginTop: '4px',
  },
  valueDefault: { color: tokens.colorNeutralForeground1 },
  valueGreen:   { color: '#107c10' },
  valueRed:     { color: '#a4262c' },
  sublabel: {
    marginTop: '4px',
    fontSize: '11.5px',
    fontWeight: '500',
    color: tokens.colorNeutralForeground4,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },

  /* Loading skeleton */
  skeletonCard: {
    flex: '1 1 170px',
    minWidth: '170px',
    maxWidth: '240px',
    padding: '20px 22px 16px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: '10px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
});

/* ------------------------------------------------------------------ */
/*  Skeleton (loading state)                                          */
/* ------------------------------------------------------------------ */
const KpiCardSkeleton: React.FC = () => {
  const styles = useStyles();
  return (
    <div className={styles.skeletonCard}>
      <SkeletonItem size={12} style={{ width: '80px' }} />
      <SkeletonItem size={28} style={{ width: '110px' }} />
      <SkeletonItem size={10} style={{ width: '40px' }} />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  KPI Card                                                          */
/* ------------------------------------------------------------------ */
interface PerformanceKpiCardProps {
  kpi: ExecKpi;
  loading?: boolean;
}

const PerformanceKpiCard: React.FC<PerformanceKpiCardProps> = ({ kpi, loading }) => {
  const styles = useStyles();

  if (loading) return <KpiCardSkeleton />;

  const colorClass =
    kpi.valueColor === 'green' ? styles.valueGreen
    : kpi.valueColor === 'red' ? styles.valueRed
    : styles.valueDefault;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Text className={styles.label}>{kpi.label}</Text>
        <span className={styles.infoIcon} title={kpi.label}>i</span>
      </div>
      <span className={`${styles.value} ${colorClass}`}>{kpi.value}</span>
      <span className={styles.sublabel}>{kpi.sublabel}</span>
    </div>
  );
};

export { PerformanceKpiCard, KpiCardSkeleton };
