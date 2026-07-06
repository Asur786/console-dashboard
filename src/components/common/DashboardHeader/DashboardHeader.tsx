import React from 'react';
import { makeStyles, tokens, Text } from '@fluentui/react-components';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '8px',
  },
  title: {
    fontSize: '26px',
    fontWeight: '700',
    color: tokens.colorNeutralForeground1,
    margin: 0,
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  timestamp: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
  },
});

interface DashboardHeaderProps {
  title: string;
  timestamp?: string;
  /** Optional slot rendered to the right (e.g. action buttons) */
  actions?: React.ReactNode;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  timestamp,
  actions,
}) => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <Text className={styles.title} as="h1">{title}</Text>
      <div className={styles.right}>
        {timestamp && (
          <Text className={styles.timestamp}>Last Updated: {timestamp}</Text>
        )}
        {actions}
      </div>
    </div>
  );
};

export { DashboardHeader };
