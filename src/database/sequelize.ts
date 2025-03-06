import { Sequelize, Options } from 'sequelize';
import path from 'path';
import fs from 'fs';

// Ensure app data directory exists
const appDataDir = path.join(process.env.APPDATA || process.env.HOME || '.', 'cowsaltpro');
if (!fs.existsSync(appDataDir)) {
  fs.mkdirSync(appDataDir, { recursive: true });
}

const dbPath = path.join(appDataDir, 'database.sqlite');

// Database configuration
const config: Options = {
  dialect: 'sqlite',
  storage: dbPath,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  retry: {
    max: 3,
    match: [
      /SQLITE_BUSY/,
      /SQLITE_LOCKED/,
      /SQLITE_TIMEOUT/
    ]
  }
};

// Create Sequelize instance
export const sequelize = new Sequelize(config);

// Initialize database connection with retry logic
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

export async function initializeDatabase(retryCount = 0): Promise<void> {
  try {
    // Check if database file exists and is accessible
    if (!fs.existsSync(dbPath)) {
      console.log('Database file does not exist, creating new database...');
      fs.writeFileSync(dbPath, '');
    }

    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Verify database integrity
    await sequelize.query('PRAGMA integrity_check');
    
  } catch (error) {
    console.error('Database connection error:', error);
    
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying connection in ${RETRY_DELAY/1000} seconds... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return initializeDatabase(retryCount + 1);
    }
    
    // If all retries failed, try to recover
    try {
      console.log('Attempting database recovery...');
      await sequelize.close();
      const backupPath = `${dbPath}.backup`;
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, dbPath);
        console.log('Restored from backup file');
        return initializeDatabase(0);
      }
    } catch (recoveryError) {
      console.error('Recovery failed:', recoveryError);
    }
    
    throw new Error(`Failed to connect to database after ${MAX_RETRIES} attempts`);
  }
}

// Enhanced cleanup handling
process.on('SIGINT', async () => {
  try {
    // Ensure all queries are finished
    await sequelize.query('PRAGMA wal_checkpoint(FULL)');
    await sequelize.close();
    console.log('Database connection closed safely.');
    process.exit(0);
  } catch (error) {
    console.error('Error during safe database shutdown:', error);
    process.exit(1);
  }
});

// Add periodic integrity checks
setInterval(async () => {
  try {
    const result = await sequelize.query('PRAGMA integrity_check');
    const integrityStatus = (result[0] as any)[0]?.integrity_check;
    if (integrityStatus !== 'ok') {
      console.error('Database integrity check failed:', integrityStatus);
    }
  } catch (error) {
    console.error('Error during integrity check:', error);
  }
}, 3600000); // Check every hour 