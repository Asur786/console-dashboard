import React from 'react';
import {
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
} from '@fluentui/react-components';

interface ErrorMessageProps {
  title?: string;
  message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Error',
  message,
}) => {
  return (
    <MessageBar intent="error" style={{ margin: '1rem 0' }}>
      <MessageBarBody>
        <MessageBarTitle>{title}</MessageBarTitle>
        {message}
      </MessageBarBody>
    </MessageBar>
  );
};
