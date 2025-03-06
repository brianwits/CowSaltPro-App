const { contextBridge, ipcRenderer } = require('electron');

// Setup simple logging
function logPreload(message) {
  const timestamp = new Date().toISOString();
  console.log(`[Preload ${timestamp}] ${message}`);
  
  // Also send to main process for central logging
  try {
    ipcRenderer.send('log-message', {
      source: 'preload',
      level: 'info',
      message
    });
  } catch (err) {
    // Silent fail if main process not ready
  }
}

// Log preload initialization
logPreload('Preload script initializing...');

// Performance measurement
const startTime = performance.now();

// Define all API methods
const api = {
  // Application info
  app: {
    getPath: (name) => ipcRenderer.invoke('get-app-path', name),
    getVersion: () => ipcRenderer.invoke('get-app-version'),
    platform: process.platform,
    isElectron: true,
    isDev: process.env.NODE_ENV === 'development',
    quit: () => ipcRenderer.send('app-quit')
  },
  
  // Window state management
  window: {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    restore: () => ipcRenderer.send('window-restore'),
    close: () => ipcRenderer.send('window-close'),
    isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
    reload: () => ipcRenderer.send('window-reload'),
    getFocusedState: () => ipcRenderer.invoke('window-is-focused')
  },
  
  // Database operations with improved error handling
  db: {
    getData: async (channel, params = {}) => {
      try {
        logPreload(`Invoking getData: ${channel}`);
        return await ipcRenderer.invoke('get-data', channel, params);
      } catch (error) {
        logPreload(`Error in getData (${channel}): ${error.message}`);
        throw new Error(`Database error (${channel}): ${error.message}`);
      }
    },
    
    saveData: async (channel, data) => {
      try {
        logPreload(`Invoking saveData: ${channel}`);
        return await ipcRenderer.invoke('save-data', channel, data);
      } catch (error) {
        logPreload(`Error in saveData (${channel}): ${error.message}`);
        throw new Error(`Database save error (${channel}): ${error.message}`);
      }
    },
    
    deleteData: async (channel, id) => {
      try {
        logPreload(`Invoking deleteData: ${channel}`);
        return await ipcRenderer.invoke('delete-data', channel, id);
      } catch (error) {
        logPreload(`Error in deleteData (${channel}): ${error.message}`);
        throw new Error(`Database delete error (${channel}): ${error.message}`);
      }
    }
  },
  
  // Event handling system
  events: {
    on: (channel, func) => {
      const validChannels = [
        'update-available', 
        'download-progress',
        'app-error',
        'database-error',
        'network-status',
        'window-state-change',
        'auth-state-change',
        'theme-change'
      ];
      
      if (validChannels.includes(channel)) {
        // Remove existing listeners to avoid duplicates
        ipcRenderer.removeAllListeners(channel);
        
        // Add new listener with error handling
        ipcRenderer.on(channel, (event, ...args) => {
          try {
            func(...args);
          } catch (error) {
            logPreload(`Error in event handler for ${channel}: ${error.message}`);
          }
        });
        return true;
      }
      return false;
    },
    
    send: (channel, ...args) => {
      const validChannels = [
        'app-ready',
        'user-action',
        'log-message',
        'database-request',
        'ui-interaction',
        'auth-request'
      ];
      
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, ...args);
        return true;
      }
      return false;
    },
    
    removeAllListeners: (channel) => {
      const validChannels = [
        'update-available', 
        'download-progress',
        'app-error',
        'database-error',
        'network-status',
        'window-state-change',
        'auth-state-change',
        'theme-change'
      ];
      
      if (validChannels.includes(channel)) {
        ipcRenderer.removeAllListeners(channel);
        return true;
      }
      return false;
    }
  },
  
  // Utility methods for UI performance
  utils: {
    checkRendering: async () => {
      // This checks if the renderer is working properly
      try {
        const element = document.createElement('div');
        element.style.width = '1px';
        element.style.height = '1px';
        element.style.position = 'absolute';
        element.style.top = '-9999px';
        element.style.left = '-9999px';
        document.body.appendChild(element);
        
        // Force a reflow
        const _ = element.offsetHeight;
        
        // Clean up
        document.body.removeChild(element);
        return true;
      } catch (e) {
        logPreload(`Rendering check failed: ${e.message}`);
        return false;
      }
    },
    
    getPerformanceMetrics: () => {
      if (window.performance && window.performance.getEntriesByType) {
        try {
          const metrics = {
            navigation: window.performance.getEntriesByType('navigation')[0],
            resources: window.performance.getEntriesByType('resource'),
            memory: window.performance.memory,
            timing: window.performance.timing
          };
          return metrics;
        } catch (e) {
          logPreload(`Error getting performance metrics: ${e.message}`);
          return null;
        }
      }
      return null;
    }
  }
};

// Expose protected methods to renderer process
try {
  contextBridge.exposeInMainWorld('api', api);
  logPreload('API exposed to renderer process');
} catch (error) {
  logPreload(`Failed to expose API: ${error.message}`);
}

// Add additional debugging and error handling
window.addEventListener('error', (event) => {
  logPreload(`Global error: ${event.message} at ${event.filename}:${event.lineno}`);
  ipcRenderer.send('renderer-error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error ? event.error.stack : null
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logPreload(`Unhandled Promise rejection: ${event.reason}`);
  ipcRenderer.send('renderer-promise-rejection', {
    reason: event.reason ? event.reason.toString() : 'Unknown reason'
  });
});

// Setup DOMContentLoaded listener to confirm UI rendering
window.addEventListener('DOMContentLoaded', () => {
  logPreload('DOM content loaded');
  
  // Check if basic UI elements can be rendered
  setTimeout(() => {
    api.utils.checkRendering()
      .then(result => {
        if (result) {
          logPreload('Rendering check passed');
          ipcRenderer.send('app-ready', { renderSuccess: true });
        } else {
          logPreload('Rendering check failed');
          ipcRenderer.send('app-ready', { renderSuccess: false });
        }
      })
      .catch(err => {
        logPreload(`Rendering check error: ${err.message}`);
        ipcRenderer.send('app-ready', { renderSuccess: false, error: err.message });
      });
  }, 100);
});

// Calculate and log initialization time
const endTime = performance.now();
logPreload(`Preload script initialized in ${(endTime - startTime).toFixed(2)}ms`);

// Notify main process that preload is complete
ipcRenderer.send('preload-complete'); 