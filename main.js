const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// Disable GPU acceleration
app.disableHardwareAcceleration();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false,
      backgroundThrottling: false
    }
  });

  // Load the index.html file using absolute path
  const indexPath = path.join(__dirname, 'public', 'index.html');
  mainWindow.loadFile(indexPath);

  // Open DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
    
    // Watch for changes in the renderer process
    mainWindow.webContents.on('did-fail-load', () => {
      mainWindow.loadFile(indexPath);
    });
  }

  // Prevent navigation and reload the main page
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.includes('index.html')) {
      event.preventDefault();
      mainWindow.loadFile(indexPath);
    }
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle IPC communications here
ipcMain.on('app-ready', () => {
  console.log('App is ready');
}); 