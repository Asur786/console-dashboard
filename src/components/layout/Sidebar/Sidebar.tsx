import React from 'react';
import { NavLink } from 'react-router-dom';
import { makeStyles, tokens } from '@fluentui/react-components';
import {
  Settings20Regular,
} from '@fluentui/react-icons';
import { ROUTES } from '../../../constants/routes';

const useStyles = makeStyles({
  sidebar: {
    width: '210px',
    minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem 0',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.625rem 1.25rem',
    color: tokens.colorNeutralForeground2,
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    borderRadius: '4px',
    margin: '2px 8px',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      color: tokens.colorNeutralForeground1,
    },
  },
  activeNavItem: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
  },
});

const navItems = [
  { to: ROUTES.PREFERENCES, label: 'User Preferences', icon: <Settings20Regular /> },
];

export const Sidebar: React.FC = () => {
  const styles = useStyles();

  return (
    <aside className={styles.sidebar}>
      {navItems.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.activeNavItem : ''}`
          }
        >
          {icon}
          {label}
        </NavLink>
      ))}
    </aside>
  );
};
