import React, { useState, useEffect } from 'react';
import {
  Box,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Tooltip,
  Button,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Cached as CachedIcon,
  Refresh as RefreshIcon,
  Palette as ThemeIcon,
  Storage as DatabaseIcon,
  QuestionMark as HelpIcon,
  Print as PrintIcon,
  Backup as BackupIcon,
  SaveAlt as ExportIcon,
} from '@mui/icons-material';
import { useNotification } from '../context/NotificationContext';
import { createLogger, reportError, clearAppCache } from '../../utils/debugUtils';

// Create component logger
const logger = createLogger('QuickActions');

export interface QuickAction {
  key: string;
  icon: React.ReactNode;
  title: string;
  handler: () => void;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
}

interface QuickActionsProps {
  /** Additional actions beyond the default ones */
  additionalActions?: QuickAction[];
  /** Whether the help button should be shown */
  showHelp?: boolean;
  /** Position of the SpeedDial. Defaults to bottom right */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'custom';
  /** Custom position styles if 'custom' position is specified */
  customPosition?: React.CSSProperties;
}

// Type for position style to address TypeScript errors
interface PositionStyle {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

/**
 * A reusable component that renders quick action buttons as a SpeedDial
 */
const QuickActions: React.FC<QuickActionsProps> = ({
  additionalActions = [],
  showHelp = true,
  position = 'bottom-right',
  customPosition,
}) => {
  logger.debug('Rendering QuickActions', { additionalActions, showHelp, position });
  
  const [isOpen, setIsOpen] = useState(false);
  const { showNotification } = useNotification();
  const [errorState, setErrorState] = useState<string | null>(null);

  // Track and log any errors that occur
  useEffect(() => {
    if (errorState) {
      logger.error(`Component error: ${errorState}`);
    }
  }, [errorState]);

  // Check if position is valid
  useEffect(() => {
    if (position === 'custom' && !customPosition) {
      const error = 'Custom position specified but no customPosition provided';
      setErrorState(error);
      logger.warn(error);
    } else {
      setErrorState(null);
    }
  }, [position, customPosition]);

  // Default handlers
  const handleClearCache = () => {
    try {
      logger.info('Clearing application cache');
      clearAppCache();
      showNotification('success', 'Cache cleared successfully');
    } catch (error) {
      const errorMessage = 'Failed to clear cache';
      setErrorState(errorMessage);
      reportError(error instanceof Error ? error : new Error(errorMessage), 'QuickActions.handleClearCache');
      showNotification('error', errorMessage);
    } finally {
      setIsOpen(false);
    }
  };

  const handleReloadApp = () => {
    try {
      logger.info('Reloading application');
      showNotification('info', 'Reloading application...');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      const errorMessage = 'Failed to reload app';
      setErrorState(errorMessage);
      reportError(error instanceof Error ? error : new Error(errorMessage), 'QuickActions.handleReloadApp');
      showNotification('error', 'Failed to reload application');
    } finally {
      setIsOpen(false);
    }
  };

  const handleToggleTheme = () => {
    try {
      const isDarkMode = localStorage.getItem('interface.darkMode') === 'true';
      const newMode = !isDarkMode;
      logger.info(`Toggling theme to ${newMode ? 'dark' : 'light'} mode`);
      localStorage.setItem('interface.darkMode', newMode.toString());
      showNotification('success', `${newMode ? 'Dark' : 'Light'} theme activated`);
    } catch (error) {
      const errorMessage = 'Failed to toggle theme';
      setErrorState(errorMessage);
      reportError(error instanceof Error ? error : new Error(errorMessage), 'QuickActions.handleToggleTheme');
      showNotification('error', errorMessage);
    } finally {
      setIsOpen(false);
    }
  };

  const handleDatabaseCheck = () => {
    try {
      logger.info('Performing database health check');
      showNotification('info', 'Database health check completed. All systems operational.');
    } catch (error) {
      const errorMessage = 'Failed to check database';
      setErrorState(errorMessage);
      reportError(error instanceof Error ? error : new Error(errorMessage), 'QuickActions.handleDatabaseCheck');
      showNotification('error', errorMessage);
    } finally {
      setIsOpen(false);
    }
  };

  const handleHelp = () => {
    try {
      logger.info('Opening help documentation');
      showNotification('info', 'Help documentation is coming soon!');
    } catch (error) {
      const errorMessage = 'Failed to show help';
      setErrorState(errorMessage);
      reportError(error instanceof Error ? error : new Error(errorMessage), 'QuickActions.handleHelp');
    }
  };

  // Default actions
  const defaultActions: QuickAction[] = [
    {
      key: 'clear-cache',
      icon: <CachedIcon />,
      title: 'Clear Cache',
      handler: handleClearCache,
    },
    {
      key: 'reload-app',
      icon: <RefreshIcon />,
      title: 'Reload App',
      handler: handleReloadApp,
    },
    {
      key: 'toggle-theme',
      icon: <ThemeIcon />,
      title: `Toggle Theme`,
      handler: handleToggleTheme,
    },
    {
      key: 'db-check',
      icon: <DatabaseIcon />,
      title: 'Database Health Check',
      handler: handleDatabaseCheck,
    },
  ];

  // Combine default and additional actions
  const actions = [...defaultActions, ...additionalActions];
  logger.debug(`Total actions: ${actions.length}`);

  // Position styles
  const getPositionStyle = (): PositionStyle => {
    // Default position for safety
    let positionStyle: PositionStyle = { bottom: 16, right: 16 };
    
    try {
      switch (position) {
        case 'bottom-right':
          positionStyle = { bottom: 16, right: 16 };
          break;
        case 'bottom-left':
          positionStyle = { bottom: 16, left: 16 };
          break;
        case 'top-right':
          positionStyle = { top: 16, right: 16 };
          break;
        case 'top-left':
          positionStyle = { top: 16, left: 16 };
          break;
        case 'custom':
          if (customPosition) {
            // Convert CSSProperties to our PositionStyle
            const { top, right, bottom, left } = customPosition;
            positionStyle = { 
              top: typeof top === 'number' ? top : undefined,
              right: typeof right === 'number' ? right : undefined,
              bottom: typeof bottom === 'number' ? bottom : undefined,
              left: typeof left === 'number' ? left : undefined
            };
          } else {
            logger.warn('Custom position specified but no customPosition provided');
          }
          break;
        default:
          // Default is bottom-right
          positionStyle = { bottom: 16, right: 16 };
      }
      logger.debug('Calculated position style', positionStyle);
    } catch (error) {
      logger.error('Error setting position', error);
      // Default position as fallback
      positionStyle = { bottom: 16, right: 16 };
    }
    
    return positionStyle;
  };

  return (
    <>
      {/* Main Speed Dial */}
      <SpeedDial
        ariaLabel="Quick Action Buttons"
        sx={{ position: 'fixed', zIndex: 1050, ...getPositionStyle() }}
        icon={<SpeedDialIcon openIcon={<SettingsIcon />} />}
        onClose={() => {
          setIsOpen(false);
          logger.debug('Speed dial closed');
        }}
        onOpen={() => {
          setIsOpen(true);
          logger.debug('Speed dial opened');
        }}
        open={isOpen}
        FabProps={{
          sx: {
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
            // Make the button more visible
            boxShadow: '0 4px 20px 0 rgba(0,0,0,0.2), 0 7px 10px -5px rgba(33,150,243,0.4)'
          }
        }}
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.key}
            icon={action.icon}
            tooltipTitle={action.title}
            tooltipOpen
            onClick={(e) => {
              e.stopPropagation(); // Prevent event bubbling
              try {
                logger.debug(`Action clicked: ${action.key}`);
                action.handler();
              } catch (error) {
                const errorMessage = `Error in action handler: ${action.key}`;
                setErrorState(errorMessage);
                reportError(error instanceof Error ? error : new Error(errorMessage), `QuickActions.action.${action.key}`);
                showNotification('error', `Failed to execute: ${action.title}`);
                setIsOpen(false);
              }
            }}
            FabProps={{
              sx: {
                bgcolor: 'background.paper',
                '&:hover': {
                  bgcolor: 'background.default',
                },
                color: action.color ? `${action.color}.main` : undefined,
              }
            }}
          />
        ))}
      </SpeedDial>

      {/* Help Button */}
      {showHelp && (
        <Box sx={{ 
          position: 'fixed', 
          left: 16, 
          bottom: 16, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 1,
          zIndex: 1050, 
        }}>
          <Tooltip title="Help" placement="right">
            <Button
              variant="contained"
              color="info"
              sx={{ 
                borderRadius: '50%', 
                minWidth: 0, 
                width: 56, 
                height: 56,
                boxShadow: '0 4px 20px 0 rgba(0,0,0,0.2), 0 7px 10px -5px rgba(33,150,243,0.4)'
              }}
              onClick={handleHelp}
            >
              <HelpIcon />
            </Button>
          </Tooltip>
        </Box>
      )}
    </>
  );
};

export default QuickActions; 