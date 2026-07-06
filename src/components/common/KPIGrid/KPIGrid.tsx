import React from 'react';
import { makeStyles, Text } from '@fluentui/react-components';
import { KPICardSkeleton } from '../KpiCard/KpiCard';

const useStyles = makeStyles({
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
  },
  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
  },
});

interface KPIGridProps {
  title?: string;
  /** Number of skeleton cards to show while loading */
  skeletonCount?: number;
  loading?: boolean;
  children: React.ReactNode;
}

const KPIGrid: React.FC<KPIGridProps> = ({
  title,
  skeletonCount = 5,
  loading,
  children,
}) => {
  const styles = useStyles();

  return (
    <div className={styles.section}>
      {title && <Text className={styles.title}>{title}</Text>}
      <div className={styles.grid}>
        {loading
          ? Array.from({ length: skeletonCount }).map((_, i) => (
              <KPICardSkeleton key={i} />
            ))
          : children}
      </div>
    </div>
  );
};

export { KPIGrid };
