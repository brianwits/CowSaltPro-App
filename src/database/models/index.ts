import { Sequelize, Model, DataTypes, Association } from 'sequelize';
import path from 'path';

// Initialize Sequelize
export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../../database.sqlite'),
  logging: false
});

// Product Model
export class Product extends Model {
  public id!: number;
  public name!: string;
  public description!: string;
  public price!: number;
  public stockQuantity!: number;
  public reorderLevel!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static associations: {
    saleItems: Association<Product, SaleItem>;
  };
}

// Customer Model
export class Customer extends Model {
  public id!: number;
  public name!: string;
  public email!: string;
  public phone!: string;
  public address!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static associations: {
    sales: Association<Customer, Sale>;
  };
}

// Sale Model
export class Sale extends Model {
  public id!: number;
  public CustomerId!: number;
  public total!: number;
  public paymentMethod!: string;
  public paymentStatus!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public Customer?: Customer;
  public SaleItems?: SaleItem[];

  public static associations: {
    customer: Association<Sale, Customer>;
    saleItems: Association<Sale, SaleItem>;
  };
}

// SaleItem Model
export class SaleItem extends Model {
  public id!: number;
  public SaleId!: number;
  public ProductId!: number;
  public quantity!: number;
  public price!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public Product?: Product;
  public Sale?: Sale;

  public static associations: {
    product: Association<SaleItem, Product>;
    sale: Association<SaleItem, Sale>;
  };
}

// Initialize Models
Product.init(
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
    reorderLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
    },
  },
  {
    sequelize,
    tableName: 'products',
  }
);

Customer.init(
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
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'customers',
  }
);

Sale.init(
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
    },
    paymentStatus: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending',
    },
  },
  {
    sequelize,
    tableName: 'sales',
  }
);

SaleItem.init(
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
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'sale_items',
  }
);

// Define Associations
Product.hasMany(SaleItem, {
  foreignKey: 'ProductId',
  as: 'saleItems',
});
SaleItem.belongsTo(Product, {
  foreignKey: 'ProductId',
  as: 'product',
});

Customer.hasMany(Sale, {
  foreignKey: 'CustomerId',
  as: 'sales',
});
Sale.belongsTo(Customer, {
  foreignKey: 'CustomerId',
  as: 'customer',
});

Sale.hasMany(SaleItem, {
  foreignKey: 'SaleId',
  as: 'saleItems',
});
SaleItem.belongsTo(Sale, {
  foreignKey: 'SaleId',
  as: 'sale',
});

export { Product, Customer, Sale, SaleItem };