import { Sequelize } from 'sequelize';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get database path from environment variables
const dbPath = process.env.DB_PATH || 'data/database.sqlite';

// Ensure the path is absolute
const absoluteDbPath = path.isAbsolute(dbPath)
  ? dbPath
  : path.join(process.cwd(), dbPath);

// Create Sequelize instance
export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: absoluteDbPath,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

// Test database connection
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};
 