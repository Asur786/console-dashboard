import React from 'react';
import { Text, Button, makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
    gap: '1rem',
    textAlign: 'center',
  },
  code: {
    fontSize: '6rem',
    fontWeight: '700',
    color: tokens.colorBrandForeground1,
    lineHeight: 1,
  },
});

const NotFoundPage: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <div className={styles.code}>404</div>
      <Text size={600} as="h2">
        Page not found
      </Text>
      <Text size={400}>
        The page you're looking for doesn't exist or has been moved.
      </Text>
      <Button as="a" onClick={() => window.location.href = '/'} appearance="primary">
        Go to Home
      </Button>
    </div>
  );
};

export default NotFoundPage;
