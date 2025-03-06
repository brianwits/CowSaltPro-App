import { Model, Op, Transaction } from 'sequelize';
import {
  Product,
  Customer,
  Sale,
  SaleItem,
  sequelize,
  ProductCreationAttributes,
  CustomerCreationAttributes,
  SaleCreationAttributes,
  SaleItemCreationAttributes,
} from '../models';
import { ServiceError, ErrorCodes, createError, isError } from '../utils/errors';

export interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  totalCustomers: number;
  lowStockProducts: number;
}

export interface SalesAnalytics {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  trend: {
    date: string;
    sales: number;
    revenue: number;
  }[];
  summary: {
    label: string;
    value: number;
    change: number;
  }[];
}

export interface TopProduct {
  id: number;
  name: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface StockAdjustment {
  productId: number;
  quantity: number;
  type: 'increase' | 'decrease';
  reason: string;
}

export class DataService {
  private static instance: DataService;

  private constructor() {}

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  // Product Operations
  async getProducts(search?: string): Promise<Product[]> {
    try {
      if (search) {
        return await Product.findAll({
          where: {
            [Op.or]: [
              { name: { [Op.like]: `%${search}%` } },
              { description: { [Op.like]: `%${search}%` } },
            ],
          },
        });
      }
      return await Product.findAll();
    } catch (error) {
      throw new Error(`Failed to fetch products: ${error}`);
    }
  }

  async getProduct(id: number): Promise<Product> {
    try {
      const product = await Product.findByPk(id);
      if (!product) {
        throw createError.notFound('Product');
      }
      return product;
    } catch (error: unknown) {
      if (error instanceof ServiceError) throw error;
      throw createError.database(`Failed to fetch product: ${isError(error) ? error.message : 'Unknown error'}`);
    }
  }

  async createProduct(data: Omit<ProductCreationAttributes, 'id'>): Promise<Product> {
    const transaction = await sequelize.transaction();
    try {
      const product = await Product.create(data, { transaction });
      await transaction.commit();
      return product;
    } catch (error: unknown) {
      await transaction.rollback();
      if (error instanceof Error && error.name === 'SequelizeUniqueConstraintError') {
        throw createError.conflict('Product with this name already exists');
      }
      throw createError.database(`Failed to create product: ${isError(error) ? error.message : 'Unknown error'}`);
    }
  }

  async updateProduct(id: number, data: Partial<ProductCreationAttributes>): Promise<Product> {
    const transaction = await sequelize.transaction();
    try {
      const product = await Product.findByPk(id, { transaction });
      if (!product) {
        await transaction.rollback();
        throw createError.notFound('Product');
      }
      await product.update(data, { transaction });
      await transaction.commit();
      return product;
    } catch (error: unknown) {
      await transaction.rollback();
      if (error instanceof ServiceError) throw error;
      throw createError.database(`Failed to update product: ${isError(error) ? error.message : 'Unknown error'}`);
    }
  }

  async deleteProduct(id: number): Promise<void> {
    try {
      const product = await this.getProduct(id);
      await product.destroy();
    } catch (error) {
      throw new Error(`Failed to delete product: ${error}`);
    }
  }

  async adjustStock(adjustment: StockAdjustment): Promise<Product> {
    const t = await sequelize.transaction();

    try {
      const product = await Product.findByPk(adjustment.productId, { transaction: t });
      if (!product) {
        throw new Error('Product not found');
      }

      const currentStock = product.stockQuantity;
      const adjustmentQuantity = adjustment.type === 'increase' ? adjustment.quantity : -adjustment.quantity;
      const newStock = currentStock + adjustmentQuantity;

      if (newStock < 0) {
        throw new Error('Stock adjustment would result in negative stock');
      }

      await product.update({ stockQuantity: newStock }, { transaction: t });
      await t.commit();
      return product;
    } catch (error) {
      await t.rollback();
      throw new Error(`Failed to adjust stock: ${error}`);
    }
  }

  async getLowStockProducts(limit: number = 10): Promise<Product[]> {
    try {
      return await Product.findAll({
        where: {
          stockQuantity: {
            [Op.lte]: sequelize.literal('reorderLevel'),
          },
        },
        order: [
          [sequelize.literal('(stockQuantity - reorderLevel)'), 'ASC'],
        ],
        limit,
      });
    } catch (error) {
      console.error('Error getting low stock products:', error);
      throw error;
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
      });
    } catch (error) {
      throw new Error(`Failed to fetch customers: ${error}`);
    }
  }

  async getCustomer(id: number): Promise<Customer> {
    try {
      const customer = await Customer.findByPk(id);
      if (!customer) {
        throw createError.notFound('Customer');
      }
      return customer;
    } catch (error: unknown) {
      if (error instanceof ServiceError) throw error;
      throw createError.database(`Failed to fetch customer: ${isError(error) ? error.message : 'Unknown error'}`);
    }
  }

  async getCustomerSales(customerId: number): Promise<Sale[]> {
    try {
      return await Sale.findAll({
        where: { CustomerId: customerId },
        include: [
          {
            model: SaleItem,
            include: [Product],
          },
        ],
      });
    } catch (error) {
      throw new Error(`Failed to fetch customer sales: ${error}`);
    }
  }

  async createCustomer(data: Omit<CustomerCreationAttributes, 'id'>): Promise<Customer> {
    const transaction = await sequelize.transaction();
    try {
      const customer = await Customer.create(data, { transaction });
      await transaction.commit();
      return customer;
    } catch (error: unknown) {
      await transaction.rollback();
      if (error instanceof Error && error.name === 'SequelizeUniqueConstraintError') {
        throw createError.conflict('Customer with this email already exists');
      }
      throw createError.database(`Failed to create customer: ${isError(error) ? error.message : 'Unknown error'}`);
    }
  }

  async updateCustomer(id: number, data: Partial<CustomerCreationAttributes>): Promise<Customer> {
    try {
      const customer = await this.getCustomer(id);
      await customer.update(data);
      return customer;
    } catch (error) {
      throw new Error(`Failed to update customer: ${error}`);
    }
  }

  async deleteCustomer(id: number): Promise<void> {
    try {
      const customer = await this.getCustomer(id);
      await customer.destroy();
    } catch (error) {
      throw new Error(`Failed to delete customer: ${error}`);
    }
  }

  // Sales Operations
  async createSale(data: SaleCreationAttributes & { items: Array<Omit<SaleItemCreationAttributes, 'id' | 'SaleId'>> }): Promise<Sale> {
    const transaction = await sequelize.transaction();
    try {
      // Validate customer exists
      const customer = await Customer.findByPk(data.CustomerId, { transaction });
      if (!customer) {
        throw createError.notFound('Customer');
      }

      // Create the sale
      const sale = await Sale.create({
        CustomerId: data.CustomerId,
        total: data.total,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus
      }, { transaction });

      // Create sale items and update stock
      for (const item of data.items) {
        const product = await Product.findByPk(item.ProductId, { transaction });
        if (!product) {
          await transaction.rollback();
          throw createError.notFound(`Product with ID ${item.ProductId}`);
        }

        if (product.stockQuantity < item.quantity) {
          throw createError.validation(`Insufficient stock for product ${product.name}`);
        }

        await SaleItem.create({
          SaleId: sale.id,
          ProductId: item.ProductId,
          quantity: item.quantity,
          price: item.price
        }, { transaction });

        await product.update({
          stockQuantity: product.stockQuantity - item.quantity
        }, { transaction });
      }

      await transaction.commit();
      return sale;
    } catch (error: unknown) {
      await transaction.rollback();
      if (error instanceof ServiceError) throw error;
      throw createError.database(`Failed to create sale: ${isError(error) ? error.message : 'Unknown error'}`);
    }
  }

  async createSaleItem(data: Omit<SaleItemCreationAttributes, 'id'>): Promise<SaleItem> {
    try {
      return await SaleItem.create(data);
    } catch (error) {
      throw new Error(`Failed to create sale item: ${error}`);
    }
  }

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [
        totalSales,
        totalRevenue,
        totalCustomers,
        lowStockProducts
      ] = await Promise.all([
        Sale.count(),
        Sale.sum('total'),
        Customer.count(),
        Product.count({
          where: {
            stockQuantity: {
              [Op.lt]: sequelize.col('reorderLevel')
            }
          }
        })
      ]);

      return {
        totalSales: totalSales || 0,
        totalRevenue: totalRevenue || 0,
        totalCustomers: totalCustomers || 0,
        lowStockProducts: lowStockProducts || 0
      };
    } catch (error: unknown) {
      throw createError.database(`Failed to fetch dashboard stats: ${isError(error) ? error.message : 'Unknown error'}`);
    }
  }

  async getSalesAnalytics(startDate: Date, endDate: Date): Promise<SalesAnalytics> {
    try {
      // Get sales within date range
      const sales = await Sale.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        },
      });

      // Calculate total metrics
      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
      const averageOrderValue = totalRevenue / totalSales || 0;

      // Calculate daily trend
      const trend = await Sale.findAll({
        attributes: [
          [sequelize.fn('date', sequelize.col('createdAt')), 'date'],
          [sequelize.fn('count', sequelize.col('id')), 'sales'],
          [sequelize.fn('sum', sequelize.col('total')), 'revenue'],
        ],
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        },
        group: [sequelize.fn('date', sequelize.col('createdAt'))],
        order: [[sequelize.fn('date', sequelize.col('createdAt')), 'ASC']],
        raw: true,
      });

      // Calculate previous period metrics for comparison
      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const previousSales = await Sale.findAll({
        where: {
          createdAt: {
            [Op.between]: [previousStartDate, startDate],
          },
        },
      });

      const previousTotalSales = previousSales.length;
      const previousTotalRevenue = previousSales.reduce((sum, sale) => sum + Number(sale.total), 0);
      const previousAverageOrderValue = previousTotalRevenue / previousTotalSales || 0;

      // Calculate percentage changes
      const salesChange = ((totalSales - previousTotalSales) / previousTotalSales) * 100 || 0;
      const revenueChange = ((totalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100 || 0;
      const aovChange = ((averageOrderValue - previousAverageOrderValue) / previousAverageOrderValue) * 100 || 0;

      // Prepare summary metrics
      const summary = [
        {
          label: 'Total Sales',
          value: totalSales,
          change: salesChange,
        },
        {
          label: 'Total Revenue',
          value: totalRevenue,
          change: revenueChange,
        },
        {
          label: 'Average Order Value',
          value: averageOrderValue,
          change: aovChange,
        },
      ];

      return {
        totalSales,
        totalRevenue,
        averageOrderValue,
        trend: trend.map((t: any) => ({
          date: t.date,
          sales: Number(t.sales),
          revenue: Number(t.revenue),
        })),
        summary,
      };
    } catch (error) {
      console.error('Error getting sales analytics:', error);
      throw error;
    }
  }

  async getTopProducts(startDate: Date, endDate: Date, limit: number = 5): Promise<TopProduct[]> {
    try {
      const topProducts = await SaleItem.findAll({
        attributes: [
          'ProductId',
          [sequelize.fn('sum', sequelize.col('quantity')), 'totalQuantity'],
          [sequelize.fn('sum', sequelize.literal('quantity * price')), 'totalRevenue'],
        ],
        include: [
          {
            model: Product,
            attributes: ['name'],
          },
          {
            model: Sale,
            attributes: [],
            where: {
              createdAt: {
                [Op.between]: [startDate, endDate],
              },
            },
          },
        ],
        group: ['ProductId', 'Product.id'],
        order: [[sequelize.literal('totalRevenue'), 'DESC']],
        limit,
        raw: true,
        nest: true,
      });

      return topProducts.map((product: any) => ({
        id: product.ProductId,
        name: product.Product.name,
        totalQuantity: Number(product.totalQuantity),
        totalRevenue: Number(product.totalRevenue),
      }));
    } catch (error) {
      console.error('Error getting top products:', error);
      throw error;
    }
  }
}

export default DataService.getInstance(); 