import { Model, Optional, Association } from 'sequelize';

// Enums
export const PaymentMethod = {
  CASH: 'cash',
  MPESA: 'mpesa',
  BANK: 'bank',
  CREDIT: 'credit'
} as const;

export const ProductCategory = {
  REGULAR: 'regular',
  PREMIUM: 'premium',
  SPECIALTY: 'specialty',
  BULK: 'bulk'
} as const;

export const PaymentStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
} as const;

export const UserRole = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  INVENTORY: 'inventory'
} as const;

export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];
export type ProductCategory = typeof ProductCategory[keyof typeof ProductCategory];
export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];
export type UserRole = typeof UserRole[keyof typeof UserRole];

// Base interface for common attributes
interface BaseAttributes {
  id: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Product Types
export interface ProductAttributes extends BaseAttributes {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  category: ProductCategory;
  reorderLevel: number;
}

export type ProductInput = Optional<ProductAttributes, 'id' | 'createdAt' | 'updatedAt'>;
export type ProductOutput = Required<ProductAttributes>;

export class Product extends Model<ProductAttributes, ProductInput> implements ProductAttributes {
  public id!: number;
  public name!: string;
  public description!: string;
  public price!: number;
  public stockQuantity!: number;
  public category!: ProductCategory;
  public reorderLevel!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Customer Types
export interface CustomerAttributes extends BaseAttributes {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export type CustomerInput = Optional<CustomerAttributes, 'id' | 'createdAt' | 'updatedAt'>;
export type CustomerOutput = Required<CustomerAttributes>;

export class Customer extends Model<CustomerAttributes, CustomerInput> implements CustomerAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public phone!: string;
  public address!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Sale Types
export interface SaleAttributes {
  id: number;
  CustomerId: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SaleInput = Optional<SaleAttributes, 'id' | 'createdAt' | 'updatedAt'>;
export type SaleOutput = Required<SaleAttributes>;

export class Sale extends Model<SaleAttributes, SaleInput> implements SaleAttributes {
  public id!: number;
  public CustomerId!: number;
  public total!: number;
  public paymentMethod!: string;
  public paymentStatus!: string;
  public date!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Define the items relationship
  public readonly items?: SaleItem[];

  public static associations: {
    items: Association<Sale, SaleItem>;
  };
}

// SaleItem Types
export interface SaleItemAttributes {
  id: number;
  SaleId: number;
  ProductId: number;
  quantity: number;
  unitPrice: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SaleItemInput = Optional<SaleItemAttributes, 'id' | 'createdAt' | 'updatedAt'>;
export type SaleItemOutput = Required<SaleItemAttributes>;

export class SaleItem extends Model<SaleItemAttributes, SaleItemInput> implements SaleItemAttributes {
  public id!: number;
  public SaleId!: number;
  public ProductId!: number;
  public quantity!: number;
  public unitPrice!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Cart Types
export interface CartItem extends ProductAttributes {
  quantity: number;
}

// User Types
export interface UserAttributes extends BaseAttributes {
  username: string;
  passwordHash: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLogin: Date | null;
  fullName: string;
  phone: string | null;
}

export type UserInput = Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin' | 'phone' | 'isActive'>;
export type UserOutput = Required<UserAttributes>;

export class User extends Model<UserAttributes, UserInput> implements UserAttributes {
  public id!: number;
  public username!: string;
  public passwordHash!: string;
  public email!: string;
  public role!: UserRole;
  public isActive!: boolean;
  public lastLogin!: Date | null;
  public fullName!: string;
  public phone!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Model Creation Attributes
export interface CustomerCreationAttributes extends Optional<CustomerAttributes, 'id'> {}
export interface ProductCreationAttributes extends Optional<ProductAttributes, 'id'> {}
export interface SaleItemCreationAttributes extends Optional<SaleItemAttributes, 'id' | 'createdAt' | 'updatedAt'> {}
export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'isActive' | 'lastLogin' | 'phone'> {}

// Error Types
export class ServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceError';
  }
}

export interface ProductAttributes {
  id: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  reorderLevel: number;
  category: ProductCategory;
  createdAt?: Date;
  updatedAt?: Date;
} 