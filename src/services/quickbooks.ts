import OAuthClient, { OAuthResponse } from 'intuit-oauth';
import QuickBooks from 'node-quickbooks';
import { Sale, Customer, Product, SaleItem, CustomerAttributes, ProductAttributes, SaleAttributes } from '../database/models/types';
import { ServiceError, createError } from '../utils/errors';
import { z } from 'zod';
import { logError, logInfo } from '../utils/logger';

// Extended type declarations for intuit-oauth
declare module 'intuit-oauth' {
  interface OAuthConfig {
    clientId: string;
    clientSecret: string;
    environment: string;
    redirectUri: string;
  }

  interface OAuthToken {
    access_token: string;
    refresh_token: string;
    realmId?: string;
    expires_in: number;
  }

  export interface OAuthResponse {
    token: OAuthToken;
  }

  class OAuthClientClass {
    constructor(config: OAuthConfig);
    authorizeUri(options: { scope: string[]; state: string }): string;
    createToken(url: string): Promise<OAuthResponse>;
    refresh(): Promise<OAuthResponse>;
    static scopes: {
      Accounting: string;
    };
  }
}

// Configuration validation schema
const configSchema = z.object({
  clientId: z.string().min(1, 'QuickBooks Client ID is required'),
  clientSecret: z.string().min(1, 'QuickBooks Client Secret is required'),
  environment: z.enum(['sandbox', 'production']),
  redirectUri: z.string().url('Invalid redirect URI')
});

// Type declarations for node-quickbooks
declare module 'node-quickbooks' {
  interface QuickBooksConfig {
    clientId: string;
    clientSecret: string;
    accessToken: string;
    refreshToken: string;
    realmId: string;
    useSandbox: boolean;
  }

  class QuickBooksClass {
    constructor(
      clientId: string,
      clientSecret: string,
      accessToken: string,
      useSandbox: boolean,
      realmId: string
    );

    createCustomer(
      customer: Record<string, any>,
      callback: (err: Error | null, customer: any) => void
    ): void;

    createItem(
      item: Record<string, any>,
      callback: (err: Error | null, item: any) => void
    ): void;

    createSalesReceipt(
      receipt: Record<string, any>,
      callback: (err: Error | null, receipt: any) => void
    ): void;
  }
}

interface QuickBooksConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
  redirectUri: string;
}

class QuickBooksService {
  private config: QuickBooksConfig;
  private oauthClient: OAuthClient;
  private qbo: QuickBooks | null = null;
  private realmId: string | null = null;
  private tokenExpiryTime: number | null = null;
  private readonly TOKEN_REFRESH_THRESHOLD = 600000; // 10 minutes in milliseconds
  private readonly MAX_SYNC_RETRIES = 3;
  private readonly SYNC_RETRY_DELAY = 5000; // 5 seconds

  constructor(config: QuickBooksConfig) {
    try {
      this.config = configSchema.parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw createError.validation('Invalid QuickBooks configuration', { 
          details: error.errors 
        });
      }
      throw error;
    }
    
    this.oauthClient = new OAuthClient(config);
    this.initializeOAuth();
  }

  private initializeOAuth() {
    try {
      // Initialize OAuth client
      logInfo('QuickBooks OAuth client initialized');
    } catch (error) {
      logError('Failed to initialize QuickBooks OAuth client', { error });
      throw createError.external('QuickBooks', 'Failed to initialize OAuth client');
    }
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.tokenExpiryTime || !this.qbo) {
      throw createError.unauthorized('QuickBooks client not authenticated');
    }

    const now = Date.now();
    if (now + this.TOKEN_REFRESH_THRESHOLD >= this.tokenExpiryTime) {
      await this.refreshToken();
    }
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    context: string,
    retries = this.MAX_SYNC_RETRIES
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.ensureValidToken();
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logError(`QuickBooks ${context} failed (Attempt ${attempt}/${retries})`, { error: lastError });
        
        if (attempt === retries) break;
        
        // Wait before retrying (exponential backoff)
        const delay = Math.min(this.SYNC_RETRY_DELAY * Math.pow(2, attempt - 1), 30000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw createError.external(
      'QuickBooks',
      `${context} failed after ${retries} attempts`,
      { details: { lastError } }
    );
  }

  getAuthorizationUrl(state: string): string {
    try {
      return this.oauthClient.authorizeUri({
        scope: [OAuthClient.scopes.Accounting],
        state,
      });
    } catch (error) {
      throw createError.external(
        'QuickBooks',
        'Failed to generate authorization URL',
        { details: { error } }
      );
    }
  }

  async handleCallback(url: string): Promise<void> {
    try {
      const response = await this.oauthClient.createToken(url) as OAuthResponse;
      const { access_token, refresh_token, realmId, expires_in } = response.token;

      if (!realmId) {
        throw createError.external('QuickBooks', 'No realm ID received');
      }

      this.realmId = realmId;
      this.tokenExpiryTime = Date.now() + (expires_in * 1000);

      this.qbo = new QuickBooks(
        this.config.clientId,
        this.config.clientSecret,
        access_token,
        this.config.environment !== 'production',
        realmId
      );

      logInfo('QuickBooks authentication successful', { realmId });
    } catch (error) {
      logError('QuickBooks authentication failed', { error });
      throw createError.external(
        'QuickBooks',
        'Failed to handle OAuth callback',
        { details: { error } }
      );
    }
  }

  async syncCustomer(customer: CustomerAttributes): Promise<any> {
    return this.retryOperation(
      async () => {
        if (!this.qbo) {
          throw createError.unauthorized('QuickBooks client not initialized');
        }

        return new Promise((resolve, reject) => {
          this.qbo!.createCustomer({
            DisplayName: customer.name,
            PrimaryEmailAddr: { Address: customer.email },
            PrimaryPhone: { FreeFormNumber: customer.phone },
            BillAddr: { Line1: customer.address },
          }, (err: any, result: any) => {
            if (err) {
              reject(createError.external('QuickBooks', `Failed to sync customer: ${err.message}`));
            }
            logInfo('Customer synced successfully', { customerId: customer.id });
            resolve(result);
          });
        });
      },
      'customer sync'
    );
  }

  async syncProduct(product: ProductAttributes): Promise<any> {
    return this.retryOperation(
      async () => {
        if (!this.qbo) {
          throw createError.unauthorized('QuickBooks client not initialized');
        }

        return new Promise((resolve, reject) => {
          this.qbo!.createItem({
            Name: product.name,
            Description: product.description,
            UnitPrice: product.price,
            Type: 'Inventory',
            TrackQtyOnHand: true,
            QtyOnHand: product.stockQuantity,
            InvStartDate: new Date(),
          }, (err: any, result: any) => {
            if (err) {
              reject(createError.external('QuickBooks', `Failed to sync product: ${err.message}`));
            }
            logInfo('Product synced successfully', { productId: product.id });
            resolve(result);
          });
        });
      },
      'product sync'
    );
  }

  async syncSale(sale: Sale): Promise<any> {
    return this.retryOperation(
      async () => {
        if (!this.qbo) {
          throw createError.unauthorized('QuickBooks client not initialized');
        }

        if (!sale.items) {
          throw createError.validation('Sale items not loaded');
        }

        const items = sale.items;

        return new Promise((resolve, reject) => {
          this.qbo!.createSalesReceipt({
            CustomerRef: { value: sale.CustomerId },
            PaymentMethodRef: { value: sale.paymentMethod },
            Line: items.map((item) => ({
              DetailType: 'SalesItemLineDetail',
              Amount: item.unitPrice * item.quantity,
              SalesItemLineDetail: {
                ItemRef: { value: item.ProductId },
                Qty: item.quantity,
                UnitPrice: item.unitPrice,
              },
            })),
          }, (err: any, result: any) => {
            if (err) {
              reject(createError.external('QuickBooks', `Failed to sync sale: ${err.message}`));
            }
            logInfo('Sale synced successfully', { saleId: sale.id });
            resolve(result);
          });
        });
      },
      'sale sync'
    );
  }

  async syncAllData(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.qbo) {
        throw createError.unauthorized('QuickBooks client not initialized');
      }

      let successCount = 0;
      let failureCount = 0;
      const errors: Array<{ type: string; id: number; error: string }> = [];

      // Sync all customers
      const customers = await Customer.findAll();
      for (const customer of customers) {
        try {
          await this.syncCustomer(customer);
          successCount++;
        } catch (error) {
          failureCount++;
          errors.push({
            type: 'customer',
            id: customer.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Sync all products
      const products = await Product.findAll();
      for (const product of products) {
        try {
          await this.syncProduct(product);
          successCount++;
        } catch (error) {
          failureCount++;
          errors.push({
            type: 'product',
            id: product.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Sync all sales
      const sales = await Sale.findAll({
        include: [{ model: SaleItem, as: 'items' }],
      });
      for (const sale of sales) {
        try {
          await this.syncSale(sale);
          successCount++;
        } catch (error) {
          failureCount++;
          errors.push({
            type: 'sale',
            id: sale.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const message = `Sync completed. Success: ${successCount}, Failures: ${failureCount}`;
      if (failureCount > 0) {
        logError('Some items failed to sync', { errors });
      }
      logInfo(message, { successCount, failureCount });

      return { 
        success: failureCount === 0,
        message 
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error syncing data with QuickBooks:', { error });
      throw createError.external(
        'QuickBooks',
        `Failed to sync data with QuickBooks: ${message}`,
        { details: { error } }
      );
    }
  }

  async refreshToken(): Promise<void> {
    try {
      if (!this.realmId) {
        throw createError.unauthorized('No realm ID available');
      }

      const response = await this.oauthClient.refresh() as OAuthResponse;
      const { access_token, expires_in } = response.token;

      this.tokenExpiryTime = Date.now() + (expires_in * 1000);
      
      this.qbo = new QuickBooks(
        this.config.clientId,
        this.config.clientSecret,
        access_token,
        this.config.environment !== 'production',
        this.realmId
      );

      logInfo('QuickBooks token refreshed successfully');
    } catch (error) {
      logError('Failed to refresh QuickBooks token', { error });
      throw createError.external(
        'QuickBooks',
        'Failed to refresh token',
        { details: { error } }
      );
    }
  }
}

// Validate environment variables
const validateEnvVariables = () => {
  const requiredVars = {
    QUICKBOOKS_CLIENT_ID: process.env.QUICKBOOKS_CLIENT_ID,
    QUICKBOOKS_CLIENT_SECRET: process.env.QUICKBOOKS_CLIENT_SECRET,
    QUICKBOOKS_REDIRECT_URI: process.env.QUICKBOOKS_REDIRECT_URI
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw createError.validation(
      'Missing required environment variables',
      { details: { missingVars } }
    );
  }
};

// Create QuickBooks service instance
validateEnvVariables();

const quickbooksService = new QuickBooksService({
  clientId: process.env.QUICKBOOKS_CLIENT_ID!,
  clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET!,
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  redirectUri: process.env.QUICKBOOKS_REDIRECT_URI!,
});

export { quickbooksService }; 