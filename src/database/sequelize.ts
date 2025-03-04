import { Sequelize } from 'sequelize';
import path from 'path';

// Create the database file in the user's app data directory
const dbPath = path.join(process.env.APPDATA || process.env.HOME || '.', 'cowsaltpro', 'database.sqlite');

// Create Sequelize instance
export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false, // Disable logging SQL queries
});

// Test the connection
sequelize
  .authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  }); 