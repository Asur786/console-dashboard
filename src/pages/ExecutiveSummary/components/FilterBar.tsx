import React from 'react';
import {
  makeStyles,
  tokens,
  Select,
  Button,
  Badge,
} from '@fluentui/react-components';
import { FilterRegular, DismissRegular } from '@fluentui/react-icons';
import type { ExecFilters, ExecFilterOptions } from '../../../types/executive.types';

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */
const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  /* ---------- Row of filter pills + Apply button ---------- */
  row: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
  },

  /* Each pill-chip group */
  pill: {
    display: 'flex',
    alignItems: 'center',
    gap: '0px',
    borderRadius: '20px',
    overflow: 'hidden',
    border: `1.5px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
    transition: 'box-shadow 0.15s',
    ':hover': {
      boxShadow: tokens.shadow4,
    },
  },
  pillLabel: {
    padding: '5px 0 5px 14px',
    fontSize: '12.5px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground3,
    whiteSpace: 'nowrap',
    userSelect: 'none',
  },
  pillSelect: {
    border: 'none',
    backgroundColor: 'transparent',
    minWidth: '100px',
    '& select': {
      border: 'none',
      paddingLeft: '4px',
    },
  },
  pillClose: {
    marginRight: '6px',
    cursor: 'pointer',
    color: tokens.colorNeutralForeground3,
    display: 'flex',
    alignItems: 'center',
    ':hover': {
      color: tokens.colorStatusDangerForeground1,
    },
  },

  /* Filled pill — shown when a non-ALL value is selected */
  pillFilled: {
    borderTopColor: tokens.colorBrandStroke1,
    borderRightColor: tokens.colorBrandStroke1,
    borderBottomColor: tokens.colorBrandStroke1,
    borderLeftColor: tokens.colorBrandStroke1,
    backgroundColor: tokens.colorBrandBackground2,
  },

  /* Spacer to push buttons right */
  spacer: {
    flex: 1,
  },

  /* Active-filter badge + Reset */
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  filterCountBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontWeight: '600',
    fontSize: '13px',
    color: tokens.colorBrandForeground1,
    cursor: 'default',
  },
  resetLink: {
    fontSize: '13px',
    fontWeight: '600',
    color: tokens.colorStatusDangerForeground1,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
    ':hover': {
      textDecoration: 'underline',
    },
  },
});

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
function activeCount(f: ExecFilters): number {
  return [f.channel, f.category, f.retailer, f.country].filter(v => v !== 'ALL').length;
}

function selectedLabel(value: string, options: { value: string; label: string }[]): string {
  return options.find(o => o.value === value)?.label ?? value;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
interface FilterBarProps {
  filters: ExecFilters;
  options: ExecFilterOptions;
  onChange: <K extends keyof ExecFilters>(key: K, value: string) => void;
  onApply: () => void;
  onReset: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  options,
  onChange,
  onApply,
  onReset,
}) => {
  const styles = useStyles();
  const count = activeCount(filters);

  const pills: {
    key: keyof ExecFilters;
    label: string;
    opts: { value: string; label: string }[];
  }[] = [
    { key: 'channel',  label: 'Channel',  opts: options.channels },
    { key: 'category', label: 'Category', opts: options.categories },
    { key: 'retailer', label: 'Retailer', opts: options.retailers },
    { key: 'country',  label: 'Country',  opts: options.countries },
  ];

  return (
    <div className={styles.root}>
      <div className={styles.row}>
        {pills.map(({ key, label, opts }) => {
          const active = filters[key] !== 'ALL';
          return (
            <div
              key={key}
              className={`${styles.pill} ${active ? styles.pillFilled : ''}`}
            >
              <span className={styles.pillLabel}>
                {label}:{' '}
                <strong style={{ color: active ? tokens.colorBrandForeground1 : tokens.colorNeutralForeground1 }}>
                  {active ? selectedLabel(filters[key], opts) : 'All'}
                </strong>
              </span>
              <Select
                className={styles.pillSelect}
                size="small"
                value={filters[key]}
                onChange={(_, d) => onChange(key, d.value)}
                appearance="underline"
              >
                {opts.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
              {active && (
                <span
                  className={styles.pillClose}
                  role="button"
                  tabIndex={0}
                  onClick={() => onChange(key, 'ALL')}
                  onKeyDown={e => e.key === 'Enter' && onChange(key, 'ALL')}
                  aria-label={`Clear ${label} filter`}
                >
                  <DismissRegular fontSize={14} />
                </span>
              )}
            </div>
          );
        })}

        <div className={styles.spacer} />

        <div className={styles.actions}>
          {count > 0 && (
            <span className={styles.filterCountBadge}>
              <FilterRegular fontSize={14} />
              All filters{' '}
              <Badge size="small" appearance="filled" color="informative">{count}</Badge>
            </span>
          )}

          {count > 0 && (
            <button className={styles.resetLink} onClick={onReset} type="button">
              Reset All
            </button>
          )}

          <Button appearance="primary" size="small" onClick={onApply}>
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export { FilterBar };
