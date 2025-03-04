import { Product, Customer, Sale, SaleItem, ProductCreationAttributes, CustomerCreationAttributes, SaleCreationAttributes, SaleItemCreationAttributes } from '../database/models';
import { Op, Sequelize } from 'sequelize';
import { sequelize } from '../database/sequelize';
import type { 
  Product as ProductType,
  SaleItem as SaleItemType,
  Sale as SaleType,
} from '../database/models';

export class ServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ServiceError';
  }
}

export interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  totalCustomers: number;
  lowStockProducts: number;
}

interface StockAdjustment {
  productId: number;
  quantity: number;
  type: 'increase' | 'decrease';
  reason: string;
}

export interface SalesAnalytics {
  trend: Array<{
    date: string;
    sales: number;
    revenue: number;
  }>;
  summary: Array<{
    label: string;
    value: number | string;
    change: number;
  }>;
}

export interface TopProduct {
  name: string;
  value: number;
}

export class DataService {
  // Product Operations
  async getProducts(search?: string): Promise<ProductType[]> {
    try {
      if (search) {
        return await Product.findAll({
          where: {
            [Op.or]: [
              { name: { [Op.like]: `%${search}%` } },
              { description: { [Op.like]: `%${search}%` } }
            ]
          },
          order: [['name', 'ASC']]
        });
      }
      return await Product.findAll({ order: [['name', 'ASC']] });
    } catch (error) {
      throw new ServiceError('Failed to fetch products', 'FETCH_ERROR');
    }
  }

  async getProduct(id: number): Promise<ProductType> {
    try {
      const product = await Product.findByPk(id);
      if (!product) {
        throw new ServiceError('Product not found', 'PRODUCT_NOT_FOUND');
      }
      return product;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError('Failed to fetch product', 'FETCH_PRODUCT_ERROR');
    }
  }

  async createProduct(data: ProductCreationAttributes): Promise<ProductType> {
    try {
      return await Product.create({
        name: data.name,
        description: data.description || '',
        price: data.price,
        stockQuantity: data.stockQuantity,
        reorderLevel: data.reorderLevel
      });
    } catch (error) {
      throw new ServiceError('Failed to create product', 'CREATE_ERROR');
    }
  }

  async updateProduct(id: number, productData: Partial<ProductCreationAttributes>): Promise<ProductType> {
    try {
      const product = await this.getProduct(id);
      await product.update(productData);
      return product;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError('Failed to update product', 'UPDATE_PRODUCT_ERROR');
    }
  }

  async deleteProduct(id: number): Promise<void> {
    try {
      const product = await this.getProduct(id);
      
      // Check if the product has any associated sales
      const saleItems = await SaleItem.findOne({
        where: { product_id: id } as any,
      });

      if (saleItems) {
        throw new ServiceError('Cannot delete product with existing sales', 'PRODUCT_HAS_SALES');
      }

      await product.destroy();
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError('Failed to delete product', 'DELETE_PRODUCT_ERROR');
    }
  }

  async adjustStock(adjustment: StockAdjustment): Promise<ProductType> {
    const t = await sequelize.transaction();

    try {
      const product = await this.getProduct(adjustment.productId);
      const currentStock = product.stockQuantity;
      
      let newStock: number;
      if (adjustment.type === 'increase') {
        newStock = currentStock + adjustment.quantity;
      } else {
        newStock = currentStock - adjustment.quantity;
        if (newStock < 0) {
          throw new ServiceError('Cannot reduce stock below zero', 'INVALID_STOCK_ADJUSTMENT');
        }
      }

      await product.update({ stockQuantity: newStock }, { transaction: t });
      await t.commit();
      return product;
    } catch (error) {
      await t.rollback();
      if (error instanceof ServiceError) throw error;
      throw new ServiceError('Failed to adjust stock', 'STOCK_ADJUSTMENT_ERROR');
    }
  }

  async getLowStockProducts(): Promise<ProductType[]> {
    try {
      return await Product.findAll({
        where: {
          stockQuantity: {
            [Op.lte]: sequelize.col('reorderLevel'),
          },
        },
        order: [['stockQuantity', 'ASC']],
      });
    } catch (error) {
      throw new ServiceError('Failed to fetch low stock products', 'FETCH_LOW_STOCK_ERROR');
    }
  }

  // Customer Operations
  async getCustomers(search?: string): Promise<Customer[]> {
    try {
      const whereClause = search
        ? {
            [Op.or]: [
              { name: { [Op.like]: `%${search}%` } },
              { email: { [Op.like]: `%${search}%` } },
              { phone: { [Op.like]: `%${search}%` } },
            ],
          }
        : {};

      return await Customer.findAll({
        where: whereClause,
        order: [['name', 'ASC']],
      });
    } catch (error) {
      throw new ServiceError('Failed to fetch customers', 'FETCH_CUSTOMERS_ERROR');
    }
  }

  async getCustomer(id: number): Promise<Customer> {
    try {
      const customer = await Customer.findByPk(id);
      if (!customer) {
        throw new ServiceError('Customer not found', 'CUSTOMER_NOT_FOUND');
      }
      return customer;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError('Failed to fetch customer', 'FETCH_CUSTOMER_ERROR');
    }
  }

  async getCustomerSales(customerId: number): Promise<SaleType[]> {
    try {
      return await Sale.findAll({
        where: { customerId } as any,
        include: [
          {
            model: SaleItem,
            include: [Product],
          },
        ],
        order: [['createdAt', 'DESC']],
      });
    } catch (error) {
      throw new ServiceError('Failed to fetch customer sales', 'FETCH_CUSTOMER_SALES_ERROR');
    }
  }

  async createCustomer(data: CustomerCreationAttributes): Promise<Customer> {
    try {
      return await Customer.create({
        name: data.name,
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || ''
      });
    } catch (error) {
      throw new ServiceError('Failed to create customer', 'CREATE_ERROR');
    }
  }

  async updateCustomer(id: number, customerData: Partial<CustomerCreationAttributes>) {
    try {
      const customer = await Customer.findByPk(id);
      if (!customer) throw new Error('Customer not found');
      return await customer.update(customerData);
    } catch (error) {
      console.error('Error updating customer:', error);
      throw new Error('Failed to update customer');
    }
  }

  async deleteCustomer(id: number) {
    try {
      const customer = await Customer.findByPk(id);
      if (!customer) throw new Error('Customer not found');
      await customer.destroy();
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw new Error('Failed to delete customer');
    }
  }

  // Sales Operations
  async createSale(data: {
    CustomerId: number;
    items: Array<{
      ProductId: number;
      quantity: number;
      price: number;
    }>;
    total: number;
    paymentMethod: string;
    paymentStatus: string;
  }): Promise<SaleType> {
    try {
      const sale = await Sale.create({
        CustomerId: data.CustomerId,
        total: data.total,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus
      });

      for (const item of data.items) {
        await SaleItem.create({
          SaleId: sale.id,
          ProductId: item.ProductId,
          quantity: item.quantity,
          price: item.price
        });

        // Update product stock
        const product = await Product.findByPk(item.ProductId);
        if (product) {
          await product.update({
            stockQuantity: product.stockQuantity - item.quantity
          });
        }
      }

      return sale;
    } catch (error) {
      throw new ServiceError('Failed to create sale', 'CREATE_ERROR');
    }
  }

  // Dashboard Statistics
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [totalSales, totalRevenue, totalCustomers, lowStockProducts] = await Promise.all([
        Sale.count(),
        Sale.sum('total'),
        Customer.count(),
        Product.count({
          where: {
            stockQuantity: {
              [Op.lte]: sequelize.col('reorderLevel'),
            },
          },
        }),
      ]);

      return {
        totalSales,
        totalRevenue: totalRevenue || 0,
        totalCustomers,
        lowStockProducts,
      };
    } catch (error) {
      throw new ServiceError('Failed to fetch dashboard stats', 'FETCH_DASHBOARD_ERROR');
    }
  }

  // Reports
  async getSalesReport(startDate: Date, endDate: Date) {
    try {
      return await Sale.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        },
        include: [
          {
            model: Customer,
            attributes: ['name', 'email', 'phone']
          },
          {
            model: SaleItem,
            include: [{
              model: Product,
              attributes: ['name', 'price']
            }]
          }
        ]
      });
    } catch (error) {
      console.error('Error generating sales report:', error);
      throw new Error('Failed to generate sales report');
    }
  }

  async getInventoryReport() {
    try {
      return await Product.findAll({
        attributes: [
          'id',
          'name',
          'description',
          'price',
          'stockQuantity',
          'reorderLevel'
        ],
        order: [
          ['stockQuantity', 'ASC']
        ]
      });
    } catch (error) {
      console.error('Error generating inventory report:', error);
      throw new Error('Failed to generate inventory report');
    }
  }

  async getCustomerReport() {
    try {
      return await Customer.findAll({
        include: [{
          model: Sale,
          attributes: ['id', 'total', 'createdAt']
        }],
        order: [
          [Sale, 'createdAt', 'DESC']
        ]
      });
    } catch (error) {
      console.error('Error generating customer report:', error);
      throw new Error('Failed to generate customer report');
    }
  }

  async getSalesAnalytics(timeRange: 'week' | 'month' | 'year'): Promise<SalesAnalytics> {
    try {
      const endDate = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const sales = await Sale.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        },
        include: [{ model: SaleItem, include: [Product] }],
        order: [['createdAt', 'ASC']]
      });

      // Calculate previous period for comparison
      const previousStartDate = new Date(startDate);
      const previousEndDate = new Date(endDate);
      switch (timeRange) {
        case 'week':
          previousStartDate.setDate(previousStartDate.getDate() - 7);
          previousEndDate.setDate(previousEndDate.getDate() - 7);
          break;
        case 'month':
          previousStartDate.setMonth(previousStartDate.getMonth() - 1);
          previousEndDate.setMonth(previousEndDate.getMonth() - 1);
          break;
        case 'year':
          previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
          previousEndDate.setFullYear(previousEndDate.getFullYear() - 1);
          break;
      }

      const previousSales = await Sale.findAll({
        where: {
          createdAt: {
            [Op.between]: [previousStartDate, previousEndDate]
          }
        }
      });

      // Calculate trends
      const trend = sales.reduce((acc: SalesAnalytics['trend'], sale) => {
        const date = sale.createdAt.toISOString().split('T')[0];
        const existingDay = acc.find(day => day.date === date);
        
        if (existingDay) {
          existingDay.sales += 1;
          existingDay.revenue += Number(sale.total);
        } else {
          acc.push({
            date,
            sales: 1,
            revenue: Number(sale.total)
          });
        }
        
        return acc;
      }, []);

      // Calculate summary statistics
      const currentPeriodTotal = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
      const previousPeriodTotal = previousSales.reduce((sum, sale) => sum + Number(sale.total), 0);
      const revenueChange = previousPeriodTotal ? 
        ((currentPeriodTotal - previousPeriodTotal) / previousPeriodTotal) * 100 : 
        100;

      const summary = [
        {
          label: 'Total Sales',
          value: sales.length,
          change: previousSales.length ? 
            ((sales.length - previousSales.length) / previousSales.length) * 100 : 
            100
        },
        {
          label: 'Total Revenue',
          value: `$${currentPeriodTotal.toFixed(2)}`,
          change: revenueChange
        },
        {
          label: 'Average Order Value',
          value: `$${(currentPeriodTotal / (sales.length || 1)).toFixed(2)}`,
          change: revenueChange
        },
        {
          label: 'Items Sold',
          value: sales.reduce((sum, sale) => 
            sum + sale.SaleItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0),
          change: 0 // Calculate if needed
        }
      ];

      return { trend, summary };
    } catch (error) {
      throw new ServiceError('Failed to fetch sales analytics', 'ANALYTICS_ERROR');
    }
  }

  async getTopProducts(): Promise<TopProduct[]> {
    try {
      const result = await SaleItem.findAll({
        attributes: [
          'ProductId',
          [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity']
        ],
        include: [{
          model: Product,
          attributes: ['name']
        }],
        group: ['ProductId', 'Product.id', 'Product.name'],
        order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
        limit: 5
      });

      return result.map(item => ({
        name: item.Product.name,
        value: Number(item.getDataValue('total_quantity'))
      }));
    } catch (error) {
      throw new ServiceError('Failed to fetch top products', 'ANALYTICS_ERROR');
    }
  }
}

export const dataService = new DataService(); 