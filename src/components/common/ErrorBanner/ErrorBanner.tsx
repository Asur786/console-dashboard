import React from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Button,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  MessageBarActions,
} from '@fluentui/react-components';
import { DismissRegular, ArrowClockwiseRegular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  root: {
    borderRadius: '8px',
  },
});

interface ErrorBannerProps {
  title?: string;
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({
  title = 'Something went wrong',
  message,
  onDismiss,
  onRetry,
}) => {
  const styles = useStyles();

  return (
    <MessageBar intent="error" className={styles.root} layout="multiline">
      <MessageBarBody>
        <MessageBarTitle>{title}</MessageBarTitle>
        <Text size={300}>{message}</Text>
      </MessageBarBody>
      <MessageBarActions>
        {onRetry && (
          <Button
            size="small"
            appearance="subtle"
            icon={<ArrowClockwiseRegular />}
            onClick={onRetry}
          >
            Retry
          </Button>
        )}
        {onDismiss && (
          <Button
            size="small"
            appearance="subtle"
            icon={<DismissRegular />}
            onClick={onDismiss}
            aria-label="Dismiss"
          />
        )}
      </MessageBarActions>
    </MessageBar>
  );
};

export { ErrorBanner };
