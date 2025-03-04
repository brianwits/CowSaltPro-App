import { Product, Customer, Sale, SaleItem } from './index';

export type ProductType = Product;
export type CustomerType = Customer;
export type SaleType = Sale;
export type SaleItemType = SaleItem;

export interface ProductAttributes {
  id: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  reorderLevel: number;
  createdAt?: Date;
  updatedAt?: Date;
} 