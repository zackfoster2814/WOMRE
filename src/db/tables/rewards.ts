import { Sequelize, DataTypes, Model } from "sequelize";

interface RewardAttributes{
    id?: number;
    type: string;
    description: string;
    weight: number;
}

interface RewardCreationAttributes extends Omit<RewardAttributes, 'id'> {
    id?: number;
}

class Reward extends Model<RewardAttributes, RewardCreationAttributes> implements RewardAttributes {
    declare id: number;
    declare type: string;
    declare description: string;
    declare weight: number;
}
export function RewardTables(sequelize: Sequelize, dataTypes: typeof DataTypes): typeof Reward {
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
            type: DataTypes.DECIMAL(5,2),
            allowNull: false,
            defaultValue: 1,
        }
    },{
        sequelize,
        tableName: 'rewards',
        timestamps: false,
        underscored: true,
        modelName: 'Reward',
    });
    return Reward;
}