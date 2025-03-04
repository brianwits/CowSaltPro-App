import Store from 'electron-store';
import { app } from 'electron';
import path from 'path';

interface Settings {
  general: {
    theme: 'light' | 'dark';
    language: 'en' | 'sw';
    bannerImage: string;
  };
  integrations: {
    mpesa: {
      enabled: boolean;
      consumerKey: string;
      consumerSecret: string;
      shortCode: string;
    };
    quickbooks: {
      enabled: boolean;
      clientId: string;
      clientSecret: string;
    };
  };
  backup: {
    enabled: boolean;
    interval: number;
    maxBackups: number;
    lastBackup: string | null;
  };
}

const schema = {
  general: {
    type: 'object',
    properties: {
      theme: {
        type: 'string',
        enum: ['light', 'dark'],
        default: 'light'
      },
      language: {
        type: 'string',
        enum: ['en', 'sw'],
        default: 'en'
      },
      bannerImage: {
        type: 'string',
        default: './assets/default-banner.jpg'
      }
    }
  },
  integrations: {
    type: 'object',
    properties: {
      mpesa: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean', default: false },
          consumerKey: { type: 'string', default: '' },
          consumerSecret: { type: 'string', default: '' },
          shortCode: { type: 'string', default: '' }
        }
      },
      quickbooks: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean', default: false },
          clientId: { type: 'string', default: '' },
          clientSecret: { type: 'string', default: '' }
        }
      }
    }
  },
  backup: {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      interval: { type: 'number', default: 86400 },
      maxBackups: { type: 'number', default: 10 },
      lastBackup: { type: ['string', 'null'], default: null }
    }
  }
};

class SettingsService {
  private store: Store<Settings>;

  constructor() {
    this.store = new Store<Settings>({
      name: 'settings',
      schema: schema as any,
      encryptionKey: process.env.SETTINGS_ENCRYPTION_KEY || 'your-encryption-key',
      fileExtension: 'dat',
      clearInvalidConfig: true,
    });
  }

  // General Settings
  getTheme(): Settings['general']['theme'] {
    return this.store.get('general.theme');
  }

  setTheme(theme: Settings['general']['theme']): void {
    this.store.set('general.theme', theme);
  }

  getLanguage(): Settings['general']['language'] {
    return this.store.get('general.language');
  }

  setLanguage(language: Settings['general']['language']): void {
    this.store.set('general.language', language);
  }

  getBannerImage(): string {
    return this.store.get('general.bannerImage');
  }

  setBannerImage(imagePath: string): void {
    this.store.set('general.bannerImage', imagePath);
  }

  // Integration Settings
  getMpesaSettings(): Settings['integrations']['mpesa'] {
    return this.store.get('integrations.mpesa');
  }

  setMpesaSettings(settings: Partial<Settings['integrations']['mpesa']>): void {
    this.store.set('integrations.mpesa', {
      ...this.getMpesaSettings(),
      ...settings
    });
  }

  getQuickbooksSettings(): Settings['integrations']['quickbooks'] {
    return this.store.get('integrations.quickbooks');
  }

  setQuickbooksSettings(settings: Partial<Settings['integrations']['quickbooks']>): void {
    this.store.set('integrations.quickbooks', {
      ...this.getQuickbooksSettings(),
      ...settings
    });
  }

  // Backup Settings
  getBackupSettings(): Settings['backup'] {
    return this.store.get('backup');
  }

  setBackupSettings(settings: Partial<Settings['backup']>): void {
    this.store.set('backup', {
      ...this.getBackupSettings(),
      ...settings
    });
  }

  updateLastBackup(timestamp: string | null): void {
    this.store.set('backup.lastBackup', timestamp);
  }

  // Reset Settings
  resetToDefaults(): void {
    this.store.clear();
  }

  // Export/Import Settings
  exportSettings(): string {
    return JSON.stringify(this.store.store, null, 2);
  }

  importSettings(settings: string): void {
    try {
      const parsedSettings = JSON.parse(settings);
      this.store.store = parsedSettings;
    } catch (error) {
      throw new Error('Invalid settings file');
    }
  }

  // Migration helper
  migrateFromLocalStorage(): void {
    if (typeof localStorage !== 'undefined') {
      // Migrate theme
      const theme = localStorage.getItem('theme');
      if (theme) this.setTheme(theme as Settings['general']['theme']);

      // Migrate language
      const language = localStorage.getItem('language');
      if (language) this.setLanguage(language as Settings['general']['language']);

      // Migrate banner image
      const bannerImage = localStorage.getItem('bannerImage');
      if (bannerImage) this.setBannerImage(bannerImage);

      // Migrate backup settings
      const autoBackupEnabled = localStorage.getItem('autoBackupEnabled');
      const backupInterval = localStorage.getItem('backupInterval');
      if (autoBackupEnabled || backupInterval) {
        this.setBackupSettings({
          enabled: autoBackupEnabled === 'true',
          interval: Number(backupInterval) || 86400
        });
      }

      // Clear localStorage after migration
      localStorage.clear();
    }
  }
}

export const settingsService = new SettingsService(); 