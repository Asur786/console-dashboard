import React from 'react';
import { makeStyles, tokens, Text } from '@fluentui/react-components';

const useStyles = makeStyles({
  card: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: '8px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: tokens.shadow4,
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
    fontSize: '12px',
  },
});

interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, subtitle, action, children }) => {
  const styles = useStyles();

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <Text weight="semibold" size={400}>{title}</Text>
          {subtitle && <Text className={styles.subtitle}>{subtitle}</Text>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
};

export { ChartCard };
