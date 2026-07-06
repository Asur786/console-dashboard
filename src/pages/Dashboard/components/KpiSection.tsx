import React from 'react';
import { makeStyles } from '@fluentui/react-components';
import { KPICard } from '../../../components/common/KpiCard';
import type { KpiMetric } from '../../../types';

const useStyles = makeStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: '1rem',
  },
});

function formatValue(value: number, unit: KpiMetric['unit']): string {
  const fmt = (n: number, prefix = '', suffix = '') => {
    if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M${suffix}`;
    if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(0)}K${suffix}`;
    return `${prefix}${n.toFixed(0)}${suffix}`;
  };
  if (unit === 'USD') return fmt(value, '$');
  if (unit === 'VOL') return fmt(value, '', ' L');
  return fmt(value);
}

interface KpiSectionProps {
  metrics: KpiMetric[];
}

const KpiSection: React.FC<KpiSectionProps> = ({ metrics }) => {
  const styles = useStyles();
  return (
    <div className={styles.grid}>
      {metrics.map(m => {
        const pct = Math.abs(m.yoyChangePercent).toFixed(1);
        const sign = m.yoyChangePercent >= 0 ? '+' : '-';
        return (
          <KPICard
            key={m.id}
            label={m.label}
            value={formatValue(m.currentYear, m.unit)}
            sublabel={`${sign}${pct}% vs PY`}
            valueColor={m.yoyChangePercent >= 0 ? 'green' : 'red'}
          />
        );
      })}
    </div>
  );
};

export { KpiSection };
