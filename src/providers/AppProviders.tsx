import React from 'react';
import { ThemeProvider } from '../theme/ThemeProvider';
import { NotificationProvider } from '../context/NotificationContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default AppProviders; 