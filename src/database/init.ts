import { sequelize, Product, Customer, ProductCategory } from './models';

export async function initializeDatabase() {
  try {
    // Sync all models with the database
    await sequelize.sync({ force: true });

    // Create default customer for walk-in sales
    await Customer.create({
      name: 'Walk-in Customer',
      email: 'walkin@example.com',
      phone: 'N/A',
      address: 'N/A'
    });

    // Create initial products
    await Product.create({
      name: 'Fine Table Salt',
      description: 'High-quality fine table salt for everyday use',
      price: 100.00,
      stockQuantity: 100,
      reorderLevel: 20,
      category: 'Table Salt' as ProductCategory
    });

    await Product.create({
      name: 'Premium Rock Salt',
      description: 'Premium quality rock salt with natural minerals',
      price: 150.00,
      stockQuantity: 50,
      reorderLevel: 15,
      category: 'Premium Salt' as ProductCategory
    });

    await Product.create({
      name: 'Mineral Salt Mix',
      description: 'Special mineral salt mix for livestock',
      price: 200.00,
      stockQuantity: 30,
      reorderLevel: 10,
      category: 'Mineral Salt' as ProductCategory
    });

    await Product.create({
      name: 'Bulk Industrial Salt',
      description: 'Industrial grade salt in bulk quantities',
      price: 80.00,
      stockQuantity: 10,
      reorderLevel: 3,
      category: 'Bulk Salt' as ProductCategory
    });

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
} 