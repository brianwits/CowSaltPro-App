/**
 * Debug utilities for the application
 */

// Log levels
export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug'
}

// Configuration for debug mode
const DEBUG_MODE = process.env.NODE_ENV === 'development';
const LOG_LEVEL = DEBUG_MODE ? LogLevel.DEBUG : LogLevel.ERROR;

// Logger interface
interface Logger {
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, data?: any): void;
  debug(message: string, data?: any): void;
}

// Create a logger
export const createLogger = (namespace: string): Logger => {
  const formatMessage = (message: string): string => {
    return `[${namespace}] ${message}`;
  };

  return {
    info(message: string, data?: any): void {
      if ([LogLevel.INFO, LogLevel.DEBUG].includes(LOG_LEVEL)) {
        console.info(formatMessage(message), data || '');
      }
    },
    warn(message: string, data?: any): void {
      if ([LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG].includes(LOG_LEVEL)) {
        console.warn(formatMessage(message), data || '');
      }
    },
    error(message: string, data?: any): void {
      console.error(formatMessage(message), data || '');
    },
    debug(message: string, data?: any): void {
      if (LOG_LEVEL === LogLevel.DEBUG) {
        console.debug(formatMessage(message), data || '');
      }
    }
  };
};

// Performance monitoring
export const measurePerformance = <T>(
  name: string,
  fn: () => T,
  logger = createLogger('Performance')
): T => {
  const start = performance.now();
  try {
    return fn();
  } finally {
    const end = performance.now();
    logger.debug(`${name} took ${end - start}ms`);
  }
};

// Error handling and reporting
export const reportError = (error: Error, componentName: string): void => {
  const logger = createLogger(`Error:${componentName}`);
  logger.error(error.message, {
    stack: error.stack,
    name: error.name,
    component: componentName
  });
  
  // In a real app, you might want to report to a service like Sentry here
};

// Feature flags for testing new features
export const featureFlags = {
  isEnabled(featureName: string): boolean {
    // Check localStorage for feature flags
    const flagsString = localStorage.getItem('app.featureFlags');
    if (!flagsString) return false;
    
    try {
      const flags = JSON.parse(flagsString);
      return !!flags[featureName];
    } catch (e) {
      return false;
    }
  },
  
  enableFeature(featureName: string): void {
    const flagsString = localStorage.getItem('app.featureFlags');
    let flags = {};
    
    if (flagsString) {
      try {
        flags = JSON.parse(flagsString);
      } catch (e) {
        // If parsing fails, we start with an empty object
      }
    }
    
    flags = { ...flags, [featureName]: true };
    localStorage.setItem('app.featureFlags', JSON.stringify(flags));
  },
  
  disableFeature(featureName: string): void {
    const flagsString = localStorage.getItem('app.featureFlags');
    let flags = {};
    
    if (flagsString) {
      try {
        flags = JSON.parse(flagsString);
      } catch (e) {
        // If parsing fails, we start with an empty object
      }
    }
    
    flags = { ...flags, [featureName]: false };
    localStorage.setItem('app.featureFlags', JSON.stringify(flags));
  }
};

// Function to clear application cache
export const clearAppCache = (): void => {
  const keysToPreserve = ['user', 'auth.token'];
  const keysToRemove: string[] = [];
  
  // Identify keys to remove
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !keysToPreserve.includes(key)) {
      keysToRemove.push(key);
    }
  }
  
  // Remove the identified keys
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Set cache timestamp
  localStorage.setItem('app.cacheTimestamp', Date.now().toString());
  
  const logger = createLogger('Cache');
  logger.info(`Cache cleared (${keysToRemove.length} items removed)`, keysToRemove);
};

// React component profiler
export const startProfiling = (componentName: string): () => void => {
  const start = performance.now();
  const logger = createLogger(`Profiler:${componentName}`);
  
  logger.debug(`Component ${componentName} started rendering`);
  
  return () => {
    const end = performance.now();
    logger.debug(`Component ${componentName} finished rendering (${end - start}ms)`);
  };
};

export default {
  createLogger,
  measurePerformance,
  reportError,
  featureFlags,
  clearAppCache,
  startProfiling
}; 