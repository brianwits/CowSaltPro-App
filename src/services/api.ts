import { Product, Customer, Sale, SaleItem } from '../database/models';
import { Op } from 'sequelize';

export interface ProductInput {
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  reorderLevel: number;
}

export interface CustomerInput {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface SaleInput {
  customerId: number;
  items: {
    productId: number;
    quantity: number;
    price: number;
  }[];
  paymentMethod: string;
}

class APIService {
  // Product Operations
  async createProduct(data: ProductInput) {
    return await Product.create(data);
  }

  async updateProduct(id: number, data: Partial<ProductInput>) {
    const product = await Product.findByPk(id);
    if (!product) throw new Error('Product not found');
    return await product.update(data);
  }

  async getProduct(id: number) {
    return await Product.findByPk(id);
  }

  async searchProducts(query: string) {
    return await Product.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { description: { [Op.like]: `%${query}%` } },
        ],
      },
    });
  }

  async getLowStockProducts() {
    return await Product.findAll({
      where: {
        stockQuantity: {
          [Op.lte]: sequelize.col('reorderLevel'),
        },
      },
    });
  }

  // Customer Operations
  async createCustomer(data: CustomerInput) {
    return await Customer.create(data);
  }

  async updateCustomer(id: number, data: Partial<CustomerInput>) {
    const customer = await Customer.findByPk(id);
    if (!customer) throw new Error('Customer not found');
    return await customer.update(data);
  }

  async getCustomer(id: number) {
    return await Customer.findByPk(id);
  }

  async searchCustomers(query: string) {
    return await Customer.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } },
          { phone: { [Op.like]: `%${query}%` } },
        ],
      },
    });
  }

  // Sale Operations
  async createSale(data: SaleInput) {
    const sale = await Sale.create({
      customerId: data.customerId,
      total: data.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      paymentMethod: data.paymentMethod,
      paymentStatus: 'pending',
    });

    // Create sale items and update inventory
    for (const item of data.items) {
      await SaleItem.create({
        saleId: sale.id,
        ...item,
      });

      // Update product stock
      const product = await Product.findByPk(item.productId);
      if (product) {
        await product.update({
          stockQuantity: product.stockQuantity - item.quantity,
        });
      }
    }

    return sale;
  }

  async getSale(id: number) {
    return await Sale.findByPk(id, {
      include: [
        { model: Customer },
        { model: SaleItem, include: [Product] },
      ],
    });
  }

  async getCustomerSales(customerId: number) {
    return await Sale.findAll({
      where: { customerId },
      include: [
        { model: SaleItem, include: [Product] },
      ],
    });
  }

  async getSalesReport(startDate: Date, endDate: Date) {
    return await Sale.findAll({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [
        { model: Customer },
        { model: SaleItem, include: [Product] },
      ],
    });
  }

  // MPESA Integration (to be implemented)
  async processMpesaPayment(saleId: number, phoneNumber: string) {
    // Implement MPESA payment processing
    throw new Error('MPESA integration not implemented');
  }

  // QuickBooks Integration (to be implemented)
  async syncWithQuickBooks() {
    // Implement QuickBooks sync
    throw new Error('QuickBooks integration not implemented');
  }
}

export const apiService = new APIService(); 