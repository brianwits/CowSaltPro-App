import { sequelize } from '../src/database/models';

async function initializeDatabase() {
  try {
    // Sync database models
    await sequelize.sync({ force: true });
    console.log('Database synchronized successfully');

    // Create sample data using raw queries
    await sequelize.query(`
      INSERT INTO products (name, description, price, stockQuantity, reorderLevel, createdAt, updatedAt)
      VALUES 
        ('Regular Salt - 1kg', 'Standard cow salt for daily use', 50, 1000, 100, datetime('now'), datetime('now')),
        ('Premium Salt - 1kg', 'Premium quality cow salt with added minerals', 75, 500, 50, datetime('now'), datetime('now')),
        ('Mineral Salt - 1kg', 'Enhanced mineral content for better nutrition', 100, 300, 30, datetime('now'), datetime('now')),
        ('Bulk Salt - 50kg', 'Bulk packaging for commercial use', 2000, 50, 5, datetime('now'), datetime('now'))
    `);
    console.log('Sample products created');

    await sequelize.query(`
      INSERT INTO customers (name, email, phone, address, createdAt, updatedAt)
      VALUES ('John Doe', 'john@example.com', '+254700000000', 'Nairobi, Kenya', datetime('now'), datetime('now'))
    `);
    console.log('Sample customer created');

    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase(); 