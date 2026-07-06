import React from 'react';
import { Spinner } from '@fluentui/react-components';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'tiny' | 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large' | 'huge';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading…',
  size = 'medium',
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        padding: '2rem',
      }}
    >
      <Spinner size={size} label={label} />
    </div>
  );
};
