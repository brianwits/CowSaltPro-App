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
    console.warn(`[Preload] Failed to send log to main process: ${err.message}`);
  }
}

// Log preload initialization
logPreload('Preload script initializing...');

// Performance measurement
const startTime = performance.now();

// Enhanced error handling wrapper for IPC calls
function safeIpcInvoke(channel, ...args) {
  return new Promise((resolve, reject) => {
    try {
      ipcRenderer.invoke(channel, ...args)
        .then(resolve)
        .catch(error => {
          logPreload(`IPC invoke error (${channel}): ${error.message}`);
          reject(error);
        });
    } catch (error) {
      logPreload(`Failed to invoke IPC (${channel}): ${error.message}`);
      reject(error);
    }
  });
}

function safeIpcSend(channel, ...args) {
  try {
    ipcRenderer.send(channel, ...args);
    return true;
  } catch (error) {
    logPreload(`Failed to send IPC (${channel}): ${error.message}`);
    return false;
  }
}

// Define all API methods
const api = {
  // Application info
  app: {
    getPath: (name) => safeIpcInvoke('get-app-path', name),
    getVersion: () => safeIpcInvoke('get-app-version'),
    platform: process.platform,
    isElectron: true,
    isDev: process.env.NODE_ENV === 'development',
    quit: () => safeIpcSend('app-quit')
  },
  
  // Window state management
  window: {
    minimize: () => safeIpcSend('window-minimize'),
    maximize: () => safeIpcSend('window-maximize'),
    restore: () => safeIpcSend('window-restore'),
    close: () => safeIpcSend('window-close'),
    isMaximized: () => safeIpcInvoke('window-is-maximized'),
    reload: () => safeIpcSend('window-reload'),
    getFocusedState: () => safeIpcInvoke('window-is-focused')
  },
  
  // Database operations with improved error handling
  db: {
    getData: async (channel, params = {}) => {
      try {
        logPreload(`Invoking getData: ${channel}`);
        return await safeIpcInvoke('get-data', channel, params);
      } catch (error) {
        logPreload(`Error in getData (${channel}): ${error.message}`);
        throw new Error(`Database error (${channel}): ${error.message}`);
      }
    },
    
    saveData: async (channel, data) => {
      try {
        logPreload(`Invoking saveData: ${channel}`);
        return await safeIpcInvoke('save-data', channel, data);
      } catch (error) {
        logPreload(`Error in saveData (${channel}): ${error.message}`);
        throw new Error(`Database save error (${channel}): ${error.message}`);
      }
    },
    
    deleteData: async (channel, id) => {
      try {
        logPreload(`Invoking deleteData: ${channel}`);
        return await safeIpcInvoke('delete-data', channel, id);
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
        return safeIpcSend(channel, ...args);
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
        try {
          ipcRenderer.removeAllListeners(channel);
          return true;
        } catch (error) {
          logPreload(`Error removing listeners for ${channel}: ${error.message}`);
          return false;
        }
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
        
        // Check if we can manipulate the DOM
        element.style.backgroundColor = 'red';
        const computed = window.getComputedStyle(element).backgroundColor;
        
        // Clean up
        document.body.removeChild(element);
        
        // Verify content isn't empty
        const hasContent = document.body.innerHTML.trim() !== '';
        
        return computed === 'rgb(255, 0, 0)' && hasContent;
      } catch (e) {
        logPreload(`Rendering check failed: ${e.message}`);
        return false;
      }
    },
    
    getPerformanceMetrics: () => {
      if (window.performance) {
        try {
          const metrics = {
            navigation: window.performance.getEntriesByType ? 
              window.performance.getEntriesByType('navigation')[0] : null,
            resources: window.performance.getEntriesByType ? 
              window.performance.getEntriesByType('resource') : [],
            memory: window.performance.memory,
            timing: window.performance.timing,
            now: window.performance.now()
          };
          return metrics;
        } catch (e) {
          logPreload(`Error getting performance metrics: ${e.message}`);
          return null;
        }
      }
      return null;
    },
    
    // Force repaint of the entire window
    forceRepaint: () => {
      try {
        const docStyle = document.documentElement.style;
        docStyle.setProperty('--force-repaint', '0');
        setTimeout(() => {
          docStyle.setProperty('--force-repaint', '1');
        }, 10);
        return true;
      } catch (e) {
        logPreload(`Force repaint failed: ${e.message}`);
        return false;
      }
    }
  }
};

// Expose protected methods to renderer process
let exposureSuccess = false;
try {
  contextBridge.exposeInMainWorld('api', api);
  exposureSuccess = true;
  logPreload('API exposed to renderer process');
} catch (error) {
  logPreload(`Failed to expose API: ${error.message}`);
}

// Add additional debugging and error handling
window.addEventListener('error', (event) => {
  logPreload(`Global error: ${event.message} at ${event.filename}:${event.lineno}`);
  safeIpcSend('renderer-error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error ? event.error.stack : null
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logPreload(`Unhandled Promise rejection: ${event.reason}`);
  safeIpcSend('renderer-promise-rejection', {
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
          safeIpcSend('app-ready', { 
            renderSuccess: true,
            exposureSuccess,
            timestamp: new Date().toISOString()
          });
        } else {
          logPreload('Rendering check failed');
          safeIpcSend('app-ready', { 
            renderSuccess: false,
            exposureSuccess,
            timestamp: new Date().toISOString() 
          });
        }
      })
      .catch(err => {
        logPreload(`Rendering check error: ${err.message}`);
        safeIpcSend('app-ready', { 
          renderSuccess: false, 
          error: err.message,
          exposureSuccess,
          timestamp: new Date().toISOString()
        });
      });
      
    // Check again after a longer delay
    setTimeout(() => {
      api.utils.checkRendering()
        .then(result => {
          if (!result) {
            logPreload('Secondary rendering check failed, forcing repaint');
            api.utils.forceRepaint();
          }
        })
        .catch(() => {
          // If check fails, try force repainting anyway
          api.utils.forceRepaint();
        });
    }, 2000);
  }, 100);
});

// Calculate and log initialization time
const endTime = performance.now();
logPreload(`Preload script initialized in ${(endTime - startTime).toFixed(2)}ms`);

// Notify main process that preload is complete
safeIpcSend('preload-complete'); 