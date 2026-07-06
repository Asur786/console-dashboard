import React from 'react';
import { makeStyles, tokens, Button, Badge, Spinner } from '@fluentui/react-components';
import { FilterRegular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
  },
  spacer: {
    flex: 1,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  filterCount: {
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
  disabledReset: {
    opacity: 0.5,
    pointerEvents: 'none',
  },
});

interface FilterBarProps {
  /** Number of currently active (non-default) filters */
  activeCount: number;
  /** Whether an operation is in progress (disables Apply + Reset) */
  loading?: boolean;
  onApply: () => void;
  onReset: () => void;
  children: React.ReactNode;
}

const FilterBar: React.FC<FilterBarProps> = ({
  activeCount,
  loading = false,
  onApply,
  onReset,
  children,
}) => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      {children}

      <div className={styles.spacer} />

      <div className={styles.actions}>
        {activeCount > 0 && (
          <span className={styles.filterCount}>
            <FilterRegular fontSize={14} />
            All filters{' '}
            <Badge size="small" appearance="filled" color="informative">
              {activeCount}
            </Badge>
          </span>
        )}

        {activeCount > 0 && (
          <button
            className={`${styles.resetLink} ${loading ? styles.disabledReset : ''}`}
            onClick={onReset}
            type="button"
            disabled={loading}
          >
            Reset All
          </button>
        )}

        <Button
          appearance="primary"
          size="small"
          onClick={onApply}
          disabled={loading}
          icon={loading ? <Spinner size="extra-tiny" /> : undefined}
        >
          {loading ? 'Applying…' : 'Apply Filters'}
        </Button>
      </div>
    </div>
  );
};

export { FilterBar };
