import React from 'react';
import { makeStyles, tokens, Button } from '@fluentui/react-components';
import { DismissRegular } from '@fluentui/react-icons';
import { FilterSelect } from '../../../components/common/FilterSelect';
import { TIMEFRAME_LABELS } from '../../../types';
import type { DashboardFilters, FilterOptions } from '../../../types';
import type { Timeframe } from '../../../types';

const useStyles = makeStyles({
  bar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: '1rem',
    padding: '1rem 1.25rem',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: '8px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  divider: {
    width: '1px',
    height: '32px',
    backgroundColor: tokens.colorNeutralStroke2,
    alignSelf: 'flex-end',
    marginBottom: '2px',
  },
  reset: {
    alignSelf: 'flex-end',
    minWidth: 'auto',
  },
});

const TIMEFRAME_OPTIONS: { value: string; label: string }[] = (
  Object.entries(TIMEFRAME_LABELS) as [Timeframe, string][]
).map(([v, l]) => ({ value: v, label: `${v} — ${l}` }));

interface FiltersBarProps {
  filters: DashboardFilters;
  options: FilterOptions;
  onUpdate: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void;
  onReset: () => void;
}

const FiltersBar: React.FC<FiltersBarProps> = ({ filters, options, onUpdate, onReset }) => {
  const styles = useStyles();

  const availableBrands = filters.category === 'ALL'
    ? options.brands['ALL'] ?? []
    : options.brands[filters.category] ?? [];

  const countryOpts = [
    { value: 'ALL', label: 'All Countries' },
    ...options.countries.map(c => ({ value: c, label: c })),
  ];
  const categoryOpts = [
    { value: 'ALL', label: 'All Categories' },
    ...options.categories.map(c => ({ value: c, label: c })),
  ];
  const brandOpts = [
    { value: 'ALL', label: 'All Brands' },
    ...availableBrands.map(b => ({ value: b, label: b })),
  ];
  const periodOpts = [
    { value: 'ALL', label: 'All Periods' },
    ...options.periods.map(p => ({
      value: p,
      label: new Date(`${p}-01`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    })),
  ];

  return (
    <div className={styles.bar}>
      <FilterSelect
        id="filter-timeframe"
        label="Timeframe"
        value={filters.timeframe}
        options={TIMEFRAME_OPTIONS}
        onChange={v => onUpdate('timeframe', v as Timeframe)}
      />
      <FilterSelect
        id="filter-period"
        label="Period"
        value={filters.periodMonth}
        options={periodOpts}
        onChange={v => onUpdate('periodMonth', v)}
      />

      <div className={styles.divider} />

      <FilterSelect
        id="filter-country"
        label="Country"
        value={filters.country}
        options={countryOpts}
        onChange={v => onUpdate('country', v)}
      />
      <FilterSelect
        id="filter-category"
        label="Category"
        value={filters.category}
        options={categoryOpts}
        onChange={v => onUpdate('category', v)}
      />
      <FilterSelect
        id="filter-brand"
        label="Brand"
        value={filters.brand}
        options={brandOpts}
        onChange={v => onUpdate('brand', v)}
      />

      <div className={styles.divider} />

      <Button
        className={styles.reset}
        icon={<DismissRegular />}
        size="small"
        appearance="subtle"
        onClick={onReset}
        title="Reset all filters"
      >
        Reset
      </Button>
    </div>
  );
};

export { FiltersBar };
