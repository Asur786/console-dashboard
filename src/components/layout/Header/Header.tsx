import React from 'react';
import { makeStyles, Text } from '@fluentui/react-components';
import { AlertRegular, GlobeRegular, PersonCircleRegular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  header: {
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1.25rem',
    backgroundColor: '#1b1b1f',
    borderBottom: 'none',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logo: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    backgroundColor: '#0078d4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '700',
    color: '#fff',
  },
  title: {
    fontWeight: '600',
    color: '#ffffff',
    fontSize: '15px',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  iconBtn: {
    color: '#b0b0b8',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    ':hover': {
      color: '#ffffff',
    },
  },
  avatar: {
    color: '#b0b0b8',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    ':hover': {
      color: '#ffffff',
    },
  },
});

interface HeaderProps {
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'AI Console',
}) => {
  const styles = useStyles();

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.logo}>D</div>
        <Text className={styles.title}>{title}</Text>
      </div>
      <div className={styles.right}>
        <span className={styles.iconBtn}><GlobeRegular fontSize={20} /></span>
        <span className={styles.iconBtn}><AlertRegular fontSize={20} /></span>
        <span className={styles.avatar}><PersonCircleRegular fontSize={28} /></span>
      </div>
    </header>
  );
};
