import { Model, Op } from 'sequelize';
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
  ProductCategory,
  PaymentMethod,
  PaymentStatus,
} from '../models';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosProgressEvent, InternalAxiosRequestConfig, AxiosHeaders } from 'axios';
import { logApiRequest, logApiError } from '../utils/logger';

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: number;
  };
}

interface ExtendedAxiosResponse extends AxiosResponse {
  config: ExtendedAxiosRequestConfig;
  duration?: number;
}

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  reorderLevel: number;
  category: string;
}

export interface CustomerInput {
  name: string;
  email: string;
  phone: string;
  address?: string;
}

export interface SaleItemInput {
  ProductId: number;
  quantity: number;
  price: number;
}

export interface SaleInput {
  CustomerId: number;
  items: SaleItemInput[];
  paymentMethod: string;
  paymentStatus: string;
  date: Date;
}

// API Service class
export class ApiService {
  private static instance: ApiService;
  private axiosInstance: AxiosInstance;

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
      timeout: 10000,
    });

    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config: ExtendedAxiosRequestConfig) => {
        const startTime = Date.now();
        config.metadata = { startTime };
        return config;
      },
      (error: Error) => {
        logApiError(error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: ExtendedAxiosResponse) => {
        const endTime = Date.now();
        const duration = endTime - (response.config.metadata?.startTime || endTime);
        return { ...response, duration };
      },
      (error: Error) => {
        logApiError(error);
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Generic request method
  private async request<T>(
    method: string,
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.request<T>({
        method,
        url,
        data,
        ...config,
      });
      return response.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  }

  // GET request
  public async get<T>(url: string): Promise<T> {
    return this.request<T>('GET', url);
  }

  // POST request
  public async post<T>(url: string, data: unknown): Promise<T> {
    return this.request<T>('POST', url, data);
  }

  // PUT request
  public async put<T>(url: string, data: unknown): Promise<T> {
    return this.request<T>('PUT', url, data);
  }

  // DELETE request
  public async delete<T>(url: string): Promise<T> {
    return this.request<T>('DELETE', url);
  }

  // PATCH request
  public async patch<T>(url: string, data: unknown): Promise<T> {
    return this.request<T>('PATCH', url, data);
  }

  // File upload with progress
  async uploadFile<T>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await this.axiosInstance.post<T>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(progress);
          }
        },
      });
      return response.data;
    } catch (error) {
      logApiError(error as Error);
      throw error;
    }
  }

  // File download with progress
  async downloadFile(
    url: string,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    try {
      const response = await this.axiosInstance.get(url, {
        responseType: 'blob',
        onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(progress);
          }
        },
      });
      return response.data;
    } catch (error) {
      logApiError(error as Error);
      throw error;
    }
  }

  // Authentication methods
  public async login(email: string, password: string): Promise<{ token: string }> {
    try {
      const response = await this.post<{ token: string }>('/auth/login', {
        email,
        password,
      });
      localStorage.setItem('authToken', response.token);
      return response;
    } catch (error) {
      logApiError(error as Error);
      throw new Error('Login failed. Please check your credentials and try again.');
    }
  }

  public async logout(): Promise<void> {
    try {
      await this.post('/auth/logout', {});
    } finally {
      localStorage.removeItem('authToken');
    }
  }

  public async refreshToken(): Promise<{ token: string }> {
    try {
      const response = await this.post<{ token: string }>('/auth/refresh', {});
      localStorage.setItem('authToken', response.token);
      return response;
    } catch (error) {
      logApiError(error as Error);
      throw new Error('Token refresh failed. Please log in again.');
    }
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }

  // Product Operations
  async createProduct(data: {
    name: string;
    description: string;
    price: number;
    stockQuantity: number;
    reorderLevel: number;
    category: ProductCategory;
  }): Promise<Product> {
    const product = await Product.create({
      name: data.name,
      description: data.description,
      price: data.price,
      stockQuantity: data.stockQuantity,
      reorderLevel: data.reorderLevel,
      category: data.category as ProductCategory,
    });
    return product;
  }

  async updateProduct(id: number, data: Partial<{
    name: string;
    description: string;
    price: number;
    stockQuantity: number;
    reorderLevel: number;
    category: ProductCategory;
  }>): Promise<Product> {
    const product = await Product.findByPk(id);
    if (!product) {
      throw new Error('Product not found');
    }
    if (data.category) {
      data.category = data.category as ProductCategory;
    }
    await product.update(data);
    return product;
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

  async getLowStockProducts(): Promise<Product[]> {
    return await Product.findAll({
      where: {
        stockQuantity: {
          [Op.lte]: sequelize.literal('reorderLevel'),
        },
      },
    });
  }

  // Customer Operations
  async createCustomer(data: {
    name: string;
    email: string;
    phone: string;
    address: string;
  }): Promise<Customer> {
    const customer = await Customer.create({
      name: data.name,
      email: data.email || '',
      phone: data.phone,
      address: data.address || '',
    });
    return customer;
  }

  async updateCustomer(id: number, data: Partial<CustomerInput>): Promise<Customer> {
    const customer = await Customer.findByPk(id);
    if (!customer) {
      throw new Error('Customer not found');
    }
    await customer.update(data);
    return customer;
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
  async createSale(data: {
    CustomerId: number;
    items: Array<{
      ProductId: number;
      quantity: number;
      price: number;
    }>;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
  }): Promise<Sale> {
    const sale = await sequelize.transaction(async (t) => {
      // Create the sale
      const newSale = await Sale.create({
        CustomerId: data.CustomerId,
        total: data.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        paymentMethod: data.paymentMethod as PaymentMethod,
        paymentStatus: data.paymentStatus as PaymentStatus,
      }, { transaction: t });

      // Create sale items
      await Promise.all(data.items.map(item =>
        SaleItem.create({
          SaleId: newSale.id,
          ProductId: item.ProductId,
          quantity: item.quantity,
          price: item.price,
        }, { transaction: t })
      ));

      return newSale;
    });

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

  async getCustomerSales(customerId: number): Promise<Sale[]> {
    return await Sale.findAll({
      where: { CustomerId: customerId },
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

export const apiService = ApiService.getInstance(); 