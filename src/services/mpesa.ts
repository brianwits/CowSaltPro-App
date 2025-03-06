import axios from 'axios';
import { Buffer } from 'buffer';

interface MPESAConfig {
  consumerKey: string;
  consumerSecret: string;
  passKey: string;
  shortCode: string;
  environment: 'sandbox' | 'production';
}

interface MPESAResponse {
  access_token: string;
  expires_in: number;
}

class MPESAService {
  private config: MPESAConfig;
  private baseURL: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(config: MPESAConfig) {
    this.config = config;
    this.baseURL = config.environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    const auth = Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString('base64');
    
    try {
      const response = await axios.get<MPESAResponse>(`${this.baseURL}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      if (!response.data.access_token) {
        throw new Error('Invalid response from MPESA API');
      }

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000));
      
      return this.accessToken;
    } catch (error) {
      console.error('Error getting MPESA access token:', error);
      throw new Error('Failed to get MPESA access token');
    }
  }

  private generateTimestamp(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hour}${minute}${second}`;
  }

  private generatePassword(timestamp: string): string {
    const str = this.config.shortCode + this.config.passKey + timestamp;
    return Buffer.from(str).toString('base64');
  }

  async initiateSTKPush(phoneNumber: string, amount: number, accountReference: string, transactionDesc: string) {
    try {
      const token = await this.getAccessToken();
      const timestamp = this.generateTimestamp();
      const password = this.generatePassword(timestamp);

      const response = await axios.post(
        `${this.baseURL}/mpesa/stkpush/v1/processrequest`,
        {
          BusinessShortCode: this.config.shortCode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: Math.round(amount),
          PartyA: phoneNumber,
          PartyB: this.config.shortCode,
          PhoneNumber: phoneNumber,
          CallBackURL: `${process.env.APP_URL}/api/mpesa/callback`,
          AccountReference: accountReference,
          TransactionDesc: transactionDesc,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error initiating STK push:', error);
      throw new Error('Failed to initiate MPESA payment');
    }
  }

  async checkTransactionStatus(checkoutRequestID: string) {
    try {
      const token = await this.getAccessToken();
      const timestamp = this.generateTimestamp();
      const password = this.generatePassword(timestamp);

      const response = await axios.post(
        `${this.baseURL}/mpesa/stkpushquery/v1/query`,
        {
          BusinessShortCode: this.config.shortCode,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: checkoutRequestID,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error checking transaction status:', error);
      throw new Error('Failed to check MPESA transaction status');
    }
  }
}

// Create and export the MPESA service instance
export const mpesaService = new MPESAService({
  consumerKey: process.env.MPESA_CONSUMER_KEY || '',
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
  passKey: process.env.MPESA_PASS_KEY || '',
  shortCode: process.env.MPESA_SHORT_CODE || '',
  environment: (process.env.NODE_ENV === 'production') ? 'production' : 'sandbox',
}); 