import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

interface Config {
  app: {
    name: string;
    port: number;
    url: string;
    environment: string;
    backupPath: string;
    backupInterval: number;
  };
  database: {
    path: string;
  };
  mpesa: {
    consumerKey: string;
    consumerSecret: string;
    passKey: string;
    shortCode: string;
    environment: 'sandbox' | 'production';
  };
  quickbooks: {
    clientId: string;
    clientSecret: string;
    environment: 'sandbox' | 'production';
    redirectUri: string;
  };
}

const config: Config = {
  app: {
    name: 'CowSalt Pro',
    port: parseInt(process.env.PORT || '3000', 10),
    url: process.env.APP_URL || 'http://localhost:3000',
    environment: process.env.NODE_ENV || 'development',
    backupPath: process.env.BACKUP_PATH || path.join(__dirname, '../../data/backups'),
    backupInterval: parseInt(process.env.BACKUP_INTERVAL || '86400', 10),
  },
  database: {
    path: path.join(__dirname, '../../data/database.sqlite'),
  },
  mpesa: {
    consumerKey: process.env.MPESA_CONSUMER_KEY || '',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
    passKey: process.env.MPESA_PASS_KEY || '',
    shortCode: process.env.MPESA_SHORT_CODE || '',
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  },
  quickbooks: {
    clientId: process.env.QUICKBOOKS_CLIENT_ID || '',
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET || '',
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
    redirectUri: process.env.QUICKBOOKS_REDIRECT_URI || 'http://localhost:3000/quickbooks/callback',
  },
};

export default config; 