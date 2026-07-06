import React from 'react';
import { Outlet } from 'react-router-dom';
import { makeStyles } from '@fluentui/react-components';
import { Header } from '../Header';
import { Sidebar } from '../Sidebar';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  body: {
    display: 'flex',
    flex: 1,
  },
  main: {
    flex: 1,
    padding: '24px 32px',
    overflowY: 'auto',
  },
});

export const AppLayout: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <Header />
      <div className={styles.body}>
        <Sidebar />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
