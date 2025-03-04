import { app } from 'electron';
import path from 'path';

interface Config {
  app: {
    name: string;
    version: string;
    userDataPath: string;
  };
  database: {
    path: string;
  };
  mpesa: {
    consumerKey: string;
    consumerSecret: string;
    shortCode: string;
  };
  quickbooks: {
    clientId: string;
    clientSecret: string;
  };
}

const config: Config = {
  app: {
    name: 'CowSalt Pro',
    version: '1.0.0',
    userDataPath: app.getPath('userData'),
  },
  database: {
    path: process.env.DB_PATH || path.join(app.getPath('userData'), 'database.sqlite'),
  },
  mpesa: {
    consumerKey: process.env.MPESA_CONSUMER_KEY || '',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
    shortCode: process.env.MPESA_SHORT_CODE || '',
  },
  quickbooks: {
    clientId: process.env.QUICKBOOKS_CLIENT_ID || '',
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET || '',
  },
};

export default config; 