import { sequelize, Product, Customer } from './models';

export async function initializeDatabase() {
  try {
    // Sync database
    await sequelize.sync({ force: true }); // Be careful with force: true in production!

    // Create default customer for walk-in sales
    await Customer.create({
      name: 'Walk-in Customer',
      email: 'walkin@example.com',
      phone: 'N/A',
      address: 'N/A'
    });

    // Create some sample products
    await Product.create({
      name: 'Regular Salt - 1kg',
      description: 'Standard table salt',
      price: 50,
      stockQuantity: 100,
      reorderLevel: 20
    });

    await Product.create({
      name: 'Premium Salt - 1kg',
      description: 'Premium quality salt',
      price: 75,
      stockQuantity: 50,
      reorderLevel: 15
    });

    await Product.create({
      name: 'Mineral Salt - 1kg',
      description: 'Enriched with minerals',
      price: 100,
      stockQuantity: 30,
      reorderLevel: 10
    });

    await Product.create({
      name: 'Bulk Salt - 50kg',
      description: 'Bulk packaging for commercial use',
      price: 2000,
      stockQuantity: 10,
      reorderLevel: 3
    });

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
} 