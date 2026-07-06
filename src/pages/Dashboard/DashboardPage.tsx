import React from 'react';
import { makeStyles, tokens, Text, Spinner } from '@fluentui/react-components';
import { useDashboard } from '../../hooks/useDashboard';
import { FiltersBar } from './components/FiltersBar';
import { KpiSection } from './components/KpiSection';
import { SalesTrendChart } from './components/SalesTrendChart';
import { BrandBreakdown } from './components/BrandBreakdown';
import { MarketBreakdown } from './components/MarketBreakdown';

const useStyles = makeStyles({
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    maxWidth: '1400px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
    fontSize: '13px',
  },
  chartsTop: {
    display: 'grid',
    gridTemplateColumns: '3fr 2fr',
    gap: '1rem',
  },
});

const DashboardPage: React.FC = () => {
  const styles = useStyles();
  const { filters, data, filterOptions, updateFilter, resetFilters } = useDashboard();

  if (!data) {
    return <Spinner size="large" label="Loading dashboard…" />;
  }

  return (
    <div className={styles.page}>
      {/* Page header */}
      <div className={styles.titleRow}>
        <Text size={700} weight="bold" as="h1">
          Sales Dashboard
        </Text>
        <Text className={styles.subtitle}>
          {filters.timeframe} &nbsp;·&nbsp;
          {filters.country === 'ALL' ? 'All Markets' : filters.country}
          {filters.category !== 'ALL' && ` · ${filters.category}`}
          {filters.brand !== 'ALL' && ` · ${filters.brand}`}
        </Text>
      </div>

      {/* Filters */}
      <FiltersBar
        filters={filters}
        options={filterOptions}
        onUpdate={updateFilter}
        onReset={resetFilters}
      />

      {/* KPI cards */}
      <KpiSection metrics={data.kpis} />

      {/* Trend + brand side-by-side */}
      <div className={styles.chartsTop}>
        <SalesTrendChart data={data.trend} timeframe={filters.timeframe} />
        <BrandBreakdown data={data.brandBreakdown} />
      </div>

      {/* Country breakdown full width */}
      <MarketBreakdown data={data.marketBreakdown} />
    </div>
  );
};

export default DashboardPage;
