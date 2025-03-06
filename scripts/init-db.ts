import { sequelize, testConnection } from '../src/database/connection';
import { initializeModels } from '../src/database/models';
import { 
  Customer, 
  Product, 
  Sale, 
  SaleItem, 
  PaymentMethod, 
  ProductCategory,
  PaymentStatus
} from '../src/database/models/types';

async function initializeDatabase() {
  try {
    // Initialize models
    initializeModels();

    // Test the database connection
    await testConnection();

    // Sync all models with the database
    await sequelize.sync({ force: true });
    console.log('Database schema has been synchronized successfully.');

    // Create sample data
    const customer = await Customer.create({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+254700000000',
      address: '123 Main St'
    });

    const product = await Product.create({
      name: 'Cow Salt Block',
      description: 'High-quality mineral salt block for cattle',
      price: 1000,
      stockQuantity: 100,
      category: ProductCategory.PREMIUM,
      reorderLevel: 10
    });

    const sale = await Sale.create({
      CustomerId: customer.id,
      total: 2000,
      paymentMethod: PaymentMethod.CASH,
      paymentStatus: PaymentStatus.COMPLETED
    });

    await SaleItem.create({
      SaleId: sale.id,
      ProductId: product.id,
      quantity: 2,
      unitPrice: 1000
    });

    console.log('Sample data has been created successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

initializeDatabase(); 