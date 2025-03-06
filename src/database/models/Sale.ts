import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../connection';
import { SaleAttributes, SaleCreationAttributes } from './types';

class Sale extends Model<SaleAttributes, SaleCreationAttributes> {
  declare id: number;
  declare CustomerId: number;
  declare total: number;
  declare paymentMethod: string;
  declare paymentStatus: string;
  declare date: Date;
}

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
  }
);

export default Sale; 