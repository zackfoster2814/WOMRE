import { DataTypes, Model } from "sequelize";
class Reward extends Model {
}
export function RewardTables(sequelize, dataTypes) {
    Reward.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '',
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: '',
        },
        weight: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 1,
        }
    }, {
        sequelize,
        tableName: 'rewards',
        timestamps: false,
        underscored: true,
        modelName: 'Reward',
    });
    return Reward;
}
//# sourceMappingURL=rewards.js.map