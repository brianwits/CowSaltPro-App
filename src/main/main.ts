import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { format as formatUrl } from 'url';
import { logInfo, logError } from '../utils/logger';

const isDevelopment = process.env.NODE_ENV !== 'production';

// Keep a global reference of the window object to prevent garbage collection
let mainWindow: BrowserWindow | null = null;

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    backgroundColor: '#ffffff'
  });

  if (isDevelopment) {
    // Load from webpack dev server
    window.loadURL(`http://localhost:${process.env.PORT || 3000}`);
    // Open DevTools only after window is shown
    window.webContents.once('dom-ready', () => {
      window.webContents.openDevTools();
    });
  } else {
    // Load the index.html from a url
    window.loadURL(
      formatUrl({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true,
      })
    );
  }

  window.on('closed', () => {
    mainWindow = null;
  });

  window.webContents.on('did-finish-load', () => {
    if (!window.isDestroyed()) {
      window.show();
      window.focus();
    }
  });

  window.on('unresponsive', () => {
    logError('Window became unresponsive');
  });

  window.webContents.on('crashed', () => {
    logError('Window crashed');
  });

  return window;
}

// Quit application when all windows are closed
app.on('window-all-closed', () => {
  // On macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow();
  }
});

// Create main BrowserWindow when electron is ready
app.whenReady().then(() => {
  logInfo('App is ready');
  
  try {
    mainWindow = createMainWindow();
    logInfo('Main window created');
  } catch (error) {
    logError('Failed to create main window', { error });
  }
}).catch((error) => {
  logError('Failed to initialize app', { error });
  app.quit();
});

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  logError('Uncaught exception', { error });
});

process.on('unhandledRejection', (error) => {
  logError('Unhandled rejection', { error });
});

// IPC handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-system-info', () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: process.version,
    versions: process.versions,
    env: process.env.NODE_ENV,
  };
});

// Export for testing
export { createMainWindow }; 