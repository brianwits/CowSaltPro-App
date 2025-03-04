import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { sequelize } from '../database/sequelize';

class BackupService {
  private backupDir: string;
  private autoBackupInterval: NodeJS.Timeout | null = null;
  private dbPath: string;

  constructor() {
    this.backupDir = path.join(app.getPath('userData'), 'backups');
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
    // Get the database path from the config or environment
    this.dbPath = process.env.DB_PATH || path.join(app.getPath('userData'), 'database.sqlite');
  }

  async createBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.backupDir, `backup-${timestamp}.sqlite`);
      
      // Create a backup by copying the database file
      await fs.promises.copyFile(this.dbPath, backupPath);
      
      return backupPath;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error('Failed to create backup');
    }
  }

  async restoreBackup(backupPath: string): Promise<void> {
    try {
      // Close all database connections
      await sequelize.close();
      
      // Restore the backup by copying the backup file over the current database file
      await fs.promises.copyFile(backupPath, this.dbPath);
      
      // Reconnect to the database
      await sequelize.authenticate();
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw new Error('Failed to restore backup');
    }
  }

  async deleteBackup(backupPath: string): Promise<void> {
    try {
      await fs.promises.unlink(backupPath);
    } catch (error) {
      console.error('Error deleting backup:', error);
      throw new Error('Failed to delete backup');
    }
  }

  listBackups(): string[] {
    try {
      const files = fs.readdirSync(this.backupDir);
      return files
        .filter(file => file.startsWith('backup-') && file.endsWith('.sqlite'))
        .map(file => path.join(this.backupDir, file))
        .sort((a, b) => fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime());
    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }

  startAutoBackup(intervalSeconds: number = 86400): void {
    if (this.autoBackupInterval) {
      clearInterval(this.autoBackupInterval);
    }

    this.autoBackupInterval = setInterval(async () => {
      try {
        await this.createBackup();
        console.log('Auto backup created successfully');
      } catch (error) {
        console.error('Auto backup failed:', error);
      }
    }, intervalSeconds * 1000);
  }

  stopAutoBackup(): void {
    if (this.autoBackupInterval) {
      clearInterval(this.autoBackupInterval);
      this.autoBackupInterval = null;
    }
  }
}

export const backupService = new BackupService(); 