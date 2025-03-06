import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron',
  {
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  }
);

// Add any other methods you want to expose to the renderer process here
contextBridge.exposeInMainWorld(
  'api',
  {
    // Example: Send a message to the main process
    send: (channel: string, data: any) => {
      // whitelist channels
      const validChannels = ['toMain'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    // Example: Receive a message from the main process
    receive: (channel: string, func: (...args: any[]) => void) => {
      const validChannels = ['fromMain'];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender` 
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    // Example: Invoke a method in the main process and get a response
    invoke: (channel: string, data: any) => {
      const validChannels = ['get-app-version', 'get-system-info'];
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, data);
      }
      return Promise.reject(new Error(`Invalid channel: ${channel}`));
    },
  }
);

// Add any global types you want to expose to TypeScript
declare global {
  interface Window {
    electron: {
      getAppVersion: () => Promise<string>;
      getSystemInfo: () => Promise<{
        platform: string;
        arch: string;
        version: string;
        versions: NodeJS.ProcessVersions;
        env: string | undefined;
      }>;
      platform: string;
    };
    api: {
      send: (channel: string, data: any) => void;
      receive: (channel: string, func: (...args: any[]) => void) => void;
      invoke: (channel: string, data: any) => Promise<any>;
    };
  }
} 