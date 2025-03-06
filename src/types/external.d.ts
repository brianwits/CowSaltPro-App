declare module 'intuit-oauth' {
  export default class OAuthClient {
    constructor(config: {
      clientId: string;
      clientSecret: string;
      environment: string;
      redirectUri: string;
    });

    authorizeUri(options: { scope: string[]; state: string }): string;
    createToken(url: string): Promise<{
      token: {
        access_token: string;
        refresh_token: string;
        realmId: string;
      };
    }>;
    refresh(): Promise<{
      token: {
        access_token: string;
        refresh_token: string;
      };
    }>;

    static scopes: {
      Accounting: string;
    };
  }
}

declare module 'node-quickbooks' {
  export default class QuickBooks {
    constructor(
      clientId: string,
      clientSecret: string,
      accessToken: string,
      useSandbox: boolean,
      realmId: string
    );

    createCustomer(customer: any, callback: (err: any, customer: any) => void): void;
    createItem(item: any, callback: (err: any, item: any) => void): void;
    createSalesReceipt(receipt: any, callback: (err: any, receipt: any) => void): void;
  }
} 