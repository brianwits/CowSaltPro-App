import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';
import { 
  Customer as CustomerModel, 
  Product as ProductModel, 
  Sale as SaleModel, 
  SaleItem as SaleItemModel,
  User as UserModel,
  PaymentMethod as PaymentMethodEnum,
  ProductCategory as ProductCategoryEnum,
  PaymentStatus as PaymentStatusEnum,
  UserRole as UserRoleEnum
} from './types';

// Product Model
export interface ProductAttributes {
  id: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  reorderLevel: number;
  category: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductInput extends Optional<ProductAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Product extends Model<ProductAttributes, ProductInput> implements ProductAttributes {
  public id!: number;
  public name!: string;
  public description!: string;
  public price!: number;
  public stockQuantity!: number;
  public reorderLevel!: number;
  public category!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Customer Model
export interface CustomerAttributes {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CustomerInput extends Optional<CustomerAttributes, 'id' | 'address' | 'createdAt' | 'updatedAt'> {}

class Customer extends Model<CustomerAttributes, CustomerInput> implements CustomerAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public phone!: string;
  public address!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Sale Model
export type PaymentMethod = 'cash' | 'mpesa' | 'card' | 'bank';
export type PaymentStatus = 'paid' | 'pending' | 'failed';

export interface SaleAttributes {
  id: number;
  CustomerId: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SaleInput extends Optional<SaleAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Sale extends Model<SaleAttributes, SaleInput> implements SaleAttributes {
  public id!: number;
  public CustomerId!: number;
  public total!: number;
  public paymentMethod!: PaymentMethod;
  public paymentStatus!: PaymentStatus;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// SaleItem Model
export interface SaleItemAttributes {
  id: number;
  SaleId: number;
  ProductId: number;
  quantity: number;
  unitPrice: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SaleItemInput extends Optional<SaleItemAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class SaleItem extends Model<SaleItemAttributes, SaleItemInput> implements SaleItemAttributes {
  public id!: number;
  public SaleId!: number;
  public ProductId!: number;
  public quantity!: number;
  public unitPrice!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize models and set up associations
const initializeModels = () => {
  // Initialize Customer model
  CustomerModel.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Customer',
      tableName: 'customers',
    }
  );

  // Initialize Product model
  ProductModel.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      stockQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: ProductCategoryEnum.REGULAR,
        validate: {
          isIn: [Object.values(ProductCategoryEnum)]
        }
      },
      reorderLevel: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },
    },
    {
      sequelize,
      modelName: 'Product',
      tableName: 'products',
    }
  );

  // Initialize Sale model
  SaleModel.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      CustomerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id',
        },
      },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      paymentMethod: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: PaymentMethodEnum.CASH,
        validate: {
          isIn: [Object.values(PaymentMethodEnum)]
        }
      },
      paymentStatus: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: PaymentStatusEnum.PENDING,
        validate: {
          isIn: [Object.values(PaymentStatusEnum)]
        }
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'Sale',
      tableName: 'sales',
    }
  );

  // Initialize SaleItem model
  SaleItemModel.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      SaleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'sales',
          key: 'id',
        },
      },
      ProductId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      unitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'SaleItem',
      tableName: 'sale_items',
    }
  );

  // Initialize User model
  UserModel.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: UserRoleEnum.CASHIER,
        validate: {
          isIn: [Object.values(UserRoleEnum)]
        }
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
    }
  );

  // Set up associations
  SaleModel.belongsTo(CustomerModel);
  CustomerModel.hasMany(SaleModel);

  SaleModel.hasMany(SaleItemModel, { as: 'items' });
  SaleItemModel.belongsTo(SaleModel);

  SaleItemModel.belongsTo(ProductModel);
  ProductModel.hasMany(SaleItemModel);
};

// Initialize models
initializeModels();

// Export models and initialization function
export { 
  CustomerModel as Customer, 
  ProductModel as Product, 
  SaleModel as Sale, 
  SaleItemModel as SaleItem,
  UserModel as User,
  initializeModels
};