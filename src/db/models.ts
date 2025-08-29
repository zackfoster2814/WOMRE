import { Sequelize, DataTypes, Model } from "sequelize";

export class User extends Model {
  public id!: number;
  public name!: string;
}

export const UserFactory = (sequelize: Sequelize) => {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "users",
      sequelize,
    }
  );
  return User;
};
