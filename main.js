// Essential imports for Electron
const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';

// Enable hardware acceleration with explicit GPU preferences
app.commandLine.appendSwitch('enable-accelerated-mjpeg-decode');
app.commandLine.appendSwitch('enable-accelerated-video');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-native-gpu-memory-buffers');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('enable-hardware-overlays');

// Force WebGL rendering
app.commandLine.appendSwitch('enable-webgl');
app.commandLine.appendSwitch('enable-webgl2');

// Force software rendering as fallback if hardware acceleration fails
app.commandLine.appendSwitch('use-gl', 'swiftshader');

// Disable frame rate limit for smoother rendering
app.commandLine.appendSwitch('disable-frame-rate-limit');

// Improve font rendering
app.commandLine.appendSwitch('disable-font-antialiasing', 'false');

// Create a store for persisting window state
const Store = require('electron-store');
const store = new Store();

let mainWindow;
let loadAttempts = 0;
const MAX_LOAD_ATTEMPTS = 10;

// Check if the application is ready to create window
function isAppReady() {
  return app.isReady();
}

// Ensure logs directory exists
const logsDir = path.join(app.getPath('userData'), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Simple logging function
function log(message) {
  const logFile = path.join(logsDir, 'app.log');
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}\n`;
  
  console.log(message);
  fs.appendFileSync(logFile, logMessage);
}

async function createWindow() {
  log('Creating main window...');
  
  // Set up Content Security Policy with explicit websocket permissions
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:* data:",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:*",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' data: https://fonts.gstatic.com",
          "img-src 'self' data: https: blob:",
          "connect-src 'self' http://localhost:* ws://localhost:* https:",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'self'",
          "object-src 'none'"
        ].join('; ')
      }
    });
  });

  // Restore window dimensions
  const windowState = store.get('windowState', {
    width: 1200,
    height: 800
  });

  // Create window with explicit GPU settings
  mainWindow = new BrowserWindow({
    ...windowState,
    show: false, // Don't show until loaded
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false,
      webSecurity: true,
      devTools: true,
      backgroundThrottling: false, // Prevent background throttling
      offscreen: false, // Explicitly disable offscreen rendering which can cause blank screens
    },
    backgroundColor: '#ffffff', // Set a background color to prevent white flash
  });

  // Save window state on close
  ['resize', 'move'].forEach(event => {
    mainWindow.on(event, () => {
      if (!mainWindow.isDestroyed()) {
        store.set('windowState', mainWindow.getBounds());
      }
    });
  });

  // Critical: Setup all event handlers before loading content
  setupWindowEventHandlers();

  // Load the app
  if (isDev) {
    log('Loading in development mode...');
    loadDevApp();
  } else {
    log('Loading in production mode...');
    loadProductionApp();
  }

  return mainWindow;
}

function setupWindowEventHandlers() {
  if (!mainWindow) return;

  // Show window once it's ready
  mainWindow.once('ready-to-show', () => {
    log('Window ready to show');
    mainWindow.show();
    mainWindow.focus();
    
    // Check if renderer is working properly
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.executeJavaScript(`
          if (document.body.innerHTML === '') {
            console.log('Empty body detected, triggering reload');
            window.location.reload();
          }
        `).catch(err => {
          log(`Error checking body content: ${err.message}`);
        });
      }
    }, 1000);
  });

  // Handle content loading errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    log(`Page failed to load: ${errorDescription} (${errorCode})`);
    
    if (loadAttempts < MAX_LOAD_ATTEMPTS) {
      log(`Retrying load attempt ${loadAttempts + 1}/${MAX_LOAD_ATTEMPTS}...`);
      loadAttempts++;
      
      // More aggressive retry with different delay based on attempt count
      const delay = Math.min(1000 * loadAttempts, 5000);
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          if (isDev) {
            loadDevApp();
          } else {
            loadProductionApp();
          }
        }
      }, delay);
    } else {
      log('Max load attempts reached, loading fallback page');
      loadFallbackPage();
    }
  });

  // Clean up resources
  mainWindow.on('closed', () => {
    log('Window closed');
    mainWindow = null;
  });
  
  // Log successful loads
  mainWindow.webContents.on('did-finish-load', () => {
    log('Content loaded successfully');
    loadAttempts = 0; // Reset counter on successful load
  });
  
  // Handle window crashes
  mainWindow.webContents.on('crashed', (event, killed) => {
    log(`Window crashed (killed: ${killed}), attempting to reload`);
    if (mainWindow && !mainWindow.isDestroyed()) {
      // Create new window if crashed
      createWindow();
    }
  });
  
  // Handle window becoming unresponsive
  mainWindow.on('unresponsive', () => {
    log('Window became unresponsive, reloading');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.reload();
    }
  });

  // Handle external links securely
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      require('electron').shell.openExternal(url);
    }
    return { action: 'deny' };
  });
}

// Function to load dev app with retry capability
function loadDevApp() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  
  const devServerUrl = 'http://localhost:3000';
  
  log(`Attempting to load: ${devServerUrl} (Attempt ${loadAttempts + 1}/${MAX_LOAD_ATTEMPTS})`);
  
  // Load local dev server
  mainWindow.loadURL(devServerUrl).catch(err => {
    log(`Error loading dev server: ${err.message}`);
    if (loadAttempts < MAX_LOAD_ATTEMPTS) {
      setTimeout(loadDevApp, 1000);
    } else {
      log('Max load attempts reached. Could not connect to dev server.');
      // Try to load from local files as fallback
      loadProductionApp();
    }
  });
  
  // Open DevTools in development
  if (!mainWindow.webContents.isDevToolsOpened()) {
    mainWindow.webContents.openDevTools();
  }
}

// Function to load production app from built files
function loadProductionApp() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  log(`Loading production app from: ${indexPath}`);
  
  // Check if the file exists
  if (!fs.existsSync(indexPath)) {
    log(`ERROR: Production file not found: ${indexPath}`);
    loadFallbackPage();
    return;
  }
  
  // Load the index.html file with a file:// protocol
  mainWindow.loadFile(indexPath).catch(err => {
    log(`Error loading production file: ${err.message}`);
    loadFallbackPage();
  });
}

// Load a basic HTML page as fallback
function loadFallbackPage() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  
  log('Loading fallback page');
  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <title>CowSalt Pro - Error</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background-color: #f5f5f5;
          color: #333;
          flex-direction: column;
          text-align: center;
          padding: 20px;
        }
        h1 { color: #d32f2f; margin-bottom: 10px; }
        p { margin: 10px 0; max-width: 600px; line-height: 1.5; }
        button {
          background-color: #2196f3;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 20px;
          font-size: 14px;
        }
        button:hover { background-color: #0b7dda; }
        .error-container {
          background-color: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
      </style>
    </head>
    <body>
      <div class="error-container">
        <h1>Application Error</h1>
        <p>We're having trouble loading the CowSalt Pro application. This could be due to missing files or a configuration issue.</p>
        <p>Try restarting the application or reinstalling if the problem persists.</p>
        <button onclick="window.location.reload()">Reload Application</button>
      </div>
      <script>
        // Add reload button functionality
        document.querySelector('button').addEventListener('click', () => {
          window.location.reload();
        });
      </script>
    </body>
  </html>
  `;
  
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

// Initialize app when ready
app.whenReady().then(async () => {
  log('Application ready');
  
  // Set security defaults
  app.on('web-contents-created', (event, contents) => {
    // Disable navigation except for development server
    contents.on('will-navigate', (event, navigationUrl) => {
      if (!isDev) {
        const parsedUrl = new URL(navigationUrl);
        if (parsedUrl.origin !== 'file://') {
          event.preventDefault();
        }
      }
    });

    // Disable new windows
    contents.setWindowOpenHandler(() => {
      return { action: 'deny' };
    });
  });

  await createWindow();
  
  log('Main window created');
});

// Handle renderer process crashes more gracefully
app.on('render-process-gone', (event, webContents, details) => {
  log(`Renderer process gone: ${details.reason} (${details.exitCode})`);
  if (mainWindow && !mainWindow.isDestroyed()) {
    createWindow(); // Create a new window
  }
});

app.on('window-all-closed', () => {
  log('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle IPC communications securely
ipcMain.handle('get-app-path', () => app.getPath('userData'));

// Handle IPC communications here
ipcMain.on('app-ready', (event, details) => {
  log(`Renderer process reported ready: ${JSON.stringify(details)}`);
  
  // If renderer reports rendering issues, reload the window
  if (details && details.renderSuccess === false) {
    log('Renderer reported rendering issues, reloading window');
    if (mainWindow && !mainWindow.isDestroyed()) {
      setTimeout(() => mainWindow.reload(), 1000);
    }
  }
});

// Handle preload complete notification
ipcMain.on('preload-complete', () => {
  log('Preload script execution completed');
}); 