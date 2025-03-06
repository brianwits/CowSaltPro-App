import { Sequelize, Model, DataTypes, Optional } from 'sequelize';
import * as path from 'path';

// Enums
export enum ProductCategory {
  SALT = 'SALT',
  FEED = 'FEED',
  SUPPLEMENT = 'SUPPLEMENT'
}

export enum PaymentMethod {
  CASH = 'CASH',
  MPESA = 'MPESA',
  BANK = 'BANK'
}

export enum PaymentStatus {
  PAID = 'PAID',
  PENDING = 'PENDING',
  FAILED = 'FAILED'
}

// Base attributes
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

export interface CustomerAttributes {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SaleAttributes {
  id: number;
  CustomerId: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SaleItemAttributes {
  id: number;
  SaleId: number;
  ProductId: number;
  quantity: number;
  price: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Creation attributes (optional timestamps)
export type ProductCreationAttributes = Optional<ProductAttributes, 'id' | 'createdAt' | 'updatedAt'>;
export type CustomerCreationAttributes = Optional<CustomerAttributes, 'id' | 'createdAt' | 'updatedAt'>;
export type SaleCreationAttributes = Optional<SaleAttributes, 'id' | 'createdAt' | 'updatedAt'>;
export type SaleItemCreationAttributes = Optional<SaleItemAttributes, 'id' | 'createdAt' | 'updatedAt'>;

// Initialize Sequelize
export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(process.env.APPDATA || process.env.HOME || '', 'cowsaltpro.sqlite'),
  logging: false
});

// Define models
export class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: number;
  public name!: string;
  public description!: string;
  public price!: number;
  public stockQuantity!: number;
  public reorderLevel!: number;
  public category!: ProductCategory;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export class Customer extends Model<CustomerAttributes, CustomerCreationAttributes> implements CustomerAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public phone!: string;
  public address!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export class Sale extends Model<SaleAttributes, SaleCreationAttributes> implements SaleAttributes {
  public id!: number;
  public CustomerId!: number;
  public total!: number;
  public paymentMethod!: PaymentMethod;
  public paymentStatus!: PaymentStatus;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export class SaleItem extends Model<SaleItemAttributes, SaleItemCreationAttributes> implements SaleItemAttributes {
  public id!: number;
  public SaleId!: number;
  public ProductId!: number;
  public quantity!: number;
  public price!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize models
Product.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    stockQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    reorderLevel: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
    category: { type: DataTypes.ENUM(...Object.values(ProductCategory)), allowNull: false }
  },
  { sequelize }
);

Customer.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING },
    phone: { type: DataTypes.STRING },
    address: { type: DataTypes.TEXT }
  },
  { sequelize }
);

Sale.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    CustomerId: { type: DataTypes.INTEGER, allowNull: false },
    total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    paymentMethod: { type: DataTypes.ENUM(...Object.values(PaymentMethod)), allowNull: false },
    paymentStatus: { type: DataTypes.ENUM(...Object.values(PaymentStatus)), allowNull: false }
  },
  { sequelize }
);

SaleItem.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    SaleId: { type: DataTypes.INTEGER, allowNull: false },
    ProductId: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
  },
  { sequelize }
);

// Define associations
Product.hasMany(SaleItem);
SaleItem.belongsTo(Product);

Customer.hasMany(Sale);
Sale.belongsTo(Customer);

Sale.hasMany(SaleItem);
SaleItem.belongsTo(Sale);

export default {
  sequelize,
  Product,
  Customer,
  Sale,
  SaleItem
}; 