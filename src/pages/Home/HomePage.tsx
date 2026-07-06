import React from 'react';
import { Text, makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  hero: {
    padding: '2rem',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: '8px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
});

const HomePage: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <div className={styles.hero}>
        <Text size={700} as="h1" block>
          Welcome to Console Dashboard
        </Text>
        <Text size={400} as="p" block style={{ marginTop: '0.5rem' }}>
          Your central hub for monitoring and managing resources.
        </Text>
      </div>
    </div>
  );
};

export default HomePage;
