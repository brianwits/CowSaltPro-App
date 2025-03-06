import Store from 'electron-store';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

export interface BackupInfo {
  lastBackup: string | null;
  backupLocation: string;
  status: 'success' | 'failed' | 'none';
}

export interface SettingsService {
  getBackupInfo(): Promise<BackupInfo>;
  performBackup(): Promise<void>;
  getSetting<T>(key: string): T | undefined;
  setSetting<T>(key: string, value: T): void;
}

class ElectronSettingsService implements SettingsService {
  private store: Store;
  private backupDir: string;

  constructor() {
    this.store = new Store();
    this.backupDir = path.join(app.getPath('userData'), 'backups');
    
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async getBackupInfo(): Promise<BackupInfo> {
    const lastBackup = this.store.get('lastBackup') as string | null;
    const status = this.store.get('backupStatus') as 'success' | 'failed' | 'none' || 'none';

    return {
      lastBackup,
      backupLocation: this.backupDir,
      status
    };
  }

  async performBackup(): Promise<void> {
    try {
      const dbPath = path.join(app.getPath('userData'), 'database.sqlite');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.backupDir, `backup-${timestamp}.sqlite`);

      // Copy the database file
      fs.copyFileSync(dbPath, backupPath);

      // Update backup info
      this.store.set('lastBackup', new Date().toISOString());
      this.store.set('backupStatus', 'success');
    } catch (error) {
      this.store.set('backupStatus', 'failed');
      throw new Error('Backup failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  getSetting<T>(key: string): T | undefined {
    return this.store.get(key) as T | undefined;
  }

  setSetting<T>(key: string, value: T): void {
    this.store.set(key, value);
  }
}

export const settingsService = new ElectronSettingsService(); 