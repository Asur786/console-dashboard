import React, { useState, useCallback, useEffect } from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import {
  DashboardHeader,
  FilterBar,
  FilterDropdown,
  KPIGrid,
  KPICard,
  ErrorBanner,
} from '../../components';
import { useFilters } from '../../hooks/useFilters';
import { kpiService } from '../../services/kpi.service';
import type { ExecFilters } from '../../types/executive.types';
import type { DashboardFilterOptions } from '../../types/filter.types';
import type { KpiResult } from '../../types/kpi.types';

/* ------------------------------------------------------------------ */
/*  Styles — page-level layout only                                   */
/* ------------------------------------------------------------------ */
const useStyles = makeStyles({
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '1400px',
  },
  divider: {
    height: '1px',
    backgroundColor: tokens.colorNeutralStroke2,
  },
});

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */
const DEFAULT_FILTERS: ExecFilters = {
  channel: 'ALL',
  category: 'ALL',
  retailer: 'ALL',
  country: 'ALL',
};

function activeCount(f: ExecFilters): number {
  return Object.values(f).filter(v => v !== 'ALL').length;
}

function formatTimestamp(): string {
  const now = new Date();
  const date = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const time = now
    .toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    .toUpperCase();
  return `${date}, ${time}`;
}

/* ------------------------------------------------------------------ */
/*  Filter config — maps ExecFilters keys to DashboardFilterOptions   */
/* ------------------------------------------------------------------ */
const FILTER_DEFS: {
  key: keyof ExecFilters;
  label: string;
  optionsKey: keyof DashboardFilterOptions;
}[] = [
  { key: 'channel',  label: 'Channel',  optionsKey: 'channels' },
  { key: 'category', label: 'Category', optionsKey: 'categories' },
  { key: 'retailer', label: 'Retailer', optionsKey: 'retailers' },
  { key: 'country',  label: 'Country',  optionsKey: 'countries' },
];

/* ------------------------------------------------------------------ */
/*  Page component — composition only                                 */
/* ------------------------------------------------------------------ */
const ExecutiveSummaryPage: React.FC = () => {
  const styles = useStyles();

  // Filter options loaded from FilterService (schema-driven)
  const { filterOptions, filterOptionsLoading } = useFilters();

  const [filters, setFilters]       = useState<ExecFilters>(DEFAULT_FILTERS);
  const [kpis, setKpis]             = useState<KpiResult[]>([]);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(formatTimestamp());
  const [error, setError]           = useState<string | null>(null);

  // ----- fetch helper (reused by mount, apply, reset) -----
  const fetchKpis = useCallback(async (f: ExecFilters) => {
    setKpiLoading(true);
    setError(null);
    try {
      const result = await kpiService.getPerformanceSummary(f);
      setKpis(result.kpis);
      setLastUpdated(formatTimestamp());
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(msg);
      // Previous KPIs are preserved — we do NOT clear setKpis
    } finally {
      setKpiLoading(false);
    }
  }, []);

  // Fetch KPIs on mount with default filters
  useEffect(() => {
    fetchKpis(DEFAULT_FILTERS);
  }, [fetchKpis]);

  const handleFilterChange = useCallback(
    (key: keyof ExecFilters, value: string) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleApply = useCallback(() => {
    fetchKpis(filters);
  }, [filters, fetchKpis]);

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    fetchKpis(DEFAULT_FILTERS);
  }, [fetchKpis]);

  const handleDismissError = useCallback(() => setError(null), []);
  const handleRetry        = useCallback(() => fetchKpis(filters), [filters, fetchKpis]);

  return (
    <div className={styles.page}>
      {/* Page header */}
      <DashboardHeader
        title="Executive Summary"
        timestamp={lastUpdated}
      />

      {/* Filter bar — options sourced from FilterService */}
      <FilterBar
        activeCount={activeCount(filters)}
        loading={kpiLoading}
        onApply={handleApply}
        onReset={handleReset}
      >
        {FILTER_DEFS.map(({ key, label, optionsKey }) => (
          <FilterDropdown
            key={key}
            label={label}
            value={filters[key]}
            options={filterOptionsLoading ? [] : filterOptions[optionsKey]}
            onChange={v => handleFilterChange(key, v)}
          />
        ))}
      </FilterBar>

      {/* Error banner — shown on API failure, dismissible with retry */}
      {error && (
        <ErrorBanner
          title="Failed to load KPIs"
          message={error}
          onDismiss={handleDismissError}
          onRetry={handleRetry}
        />
      )}

      <div className={styles.divider} />

      {/* KPI cards — skeletons while loading, previous values preserved on error */}
      <KPIGrid title="Performance Highlights" loading={kpiLoading} skeletonCount={5}>
        {kpis.map(kpi => (
          <KPICard
            key={kpi.id}
            label={kpi.label}
            value={kpi.value}
            sublabel={kpi.sublabel}
            valueColor={kpi.valueColor}
          />
        ))}
      </KPIGrid>
    </div>
  );
};

export default ExecutiveSummaryPage;
