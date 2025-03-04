import OAuthClient from 'intuit-oauth';
import QuickBooks from 'node-quickbooks';
import { Sale, Customer, Product } from '../database/models';

interface QuickBooksConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
  redirectUri: string;
}

class QuickBooksService {
  private config: QuickBooksConfig;
  private oauthClient: any;
  private qbo: any;

  constructor(config: QuickBooksConfig) {
    this.config = config;
    this.oauthClient = new OAuthClient({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      environment: config.environment,
      redirectUri: config.redirectUri,
    });
  }

  getAuthorizationUrl(): string {
    return this.oauthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting],
      state: 'testState',
    });
  }

  async handleCallback(url: string) {
    const authResponse = await this.oauthClient.createToken(url);
    const { access_token, refresh_token, realmId } = authResponse.token;

    this.qbo = new QuickBooks(
      this.config.clientId,
      this.config.clientSecret,
      access_token,
      false, // don't use sandbox if in production
      realmId
    );

    return { access_token, refresh_token, realmId };
  }

  async syncCustomer(customer: any) {
    return new Promise((resolve, reject) => {
      this.qbo.createCustomer({
        DisplayName: customer.name,
        PrimaryEmailAddr: { Address: customer.email },
        PrimaryPhone: { FreeFormNumber: customer.phone },
        BillAddr: { Line1: customer.address },
      }, (err: any, customer: any) => {
        if (err) reject(err);
        resolve(customer);
      });
    });
  }

  async syncProduct(product: any) {
    return new Promise((resolve, reject) => {
      this.qbo.createItem({
        Name: product.name,
        Description: product.description,
        UnitPrice: product.price,
        Type: 'Inventory',
        TrackQtyOnHand: true,
        QtyOnHand: product.stockQuantity,
        InvStartDate: new Date(),
      }, (err: any, item: any) => {
        if (err) reject(err);
        resolve(item);
      });
    });
  }

  async syncSale(sale: any) {
    return new Promise((resolve, reject) => {
      this.qbo.createSalesReceipt({
        CustomerRef: { value: sale.customerId },
        PaymentMethodRef: { value: sale.paymentMethod },
        Line: sale.items.map((item: any) => ({
          DetailType: 'SalesItemLineDetail',
          Amount: item.price * item.quantity,
          SalesItemLineDetail: {
            ItemRef: { value: item.productId },
            Qty: item.quantity,
            UnitPrice: item.price,
          },
        })),
      }, (err: any, salesReceipt: any) => {
        if (err) reject(err);
        resolve(salesReceipt);
      });
    });
  }

  async syncAllData() {
    try {
      // Sync all customers
      const customers = await Customer.findAll();
      for (const customer of customers) {
        await this.syncCustomer(customer);
      }

      // Sync all products
      const products = await Product.findAll();
      for (const product of products) {
        await this.syncProduct(product);
      }

      // Sync all sales
      const sales = await Sale.findAll({
        include: ['items'],
      });
      for (const sale of sales) {
        await this.syncSale(sale);
      }

      return { success: true, message: 'All data synced successfully' };
    } catch (error) {
      console.error('Error syncing data with QuickBooks:', error);
      throw new Error('Failed to sync data with QuickBooks');
    }
  }

  async refreshToken() {
    try {
      const authResponse = await this.oauthClient.refresh();
      const { access_token, refresh_token } = authResponse.token;
      return { access_token, refresh_token };
    } catch (error) {
      console.error('Error refreshing QuickBooks token:', error);
      throw new Error('Failed to refresh QuickBooks token');
    }
  }
}

// Create and export the QuickBooks service instance
export const quickbooksService = new QuickBooksService({
  clientId: process.env.QUICKBOOKS_CLIENT_ID || '',
  clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET || '',
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  redirectUri: process.env.QUICKBOOKS_REDIRECT_URI || 'http://localhost:3000/quickbooks/callback',
}); 