import { Sequelize, DataTypes, Model } from "sequelize";

interface Players_PowerAttributes  {
    player_id: number;
    power_id: number;
    count: number;
}

interface Players_PowerCreationAttributes extends Players_PowerAttributes {}

class Players_Power extends Model<Players_PowerAttributes, Players_PowerCreationAttributes> implements Players_PowerAttributes {
    declare player_id: number;
    declare power_id: number;
    declare count: number;
}

export function PlayerPowerTables(sequelize: Sequelize, dataTypes: typeof DataTypes): typeof Players_Power {
    Players_Power.init({
        player_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        power_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
    }, {
        sequelize,
        tableName: 'players_power',
        timestamps: false,
        underscored: true,
        modelName: 'Players_Power',
    }); 
    return Players_Power;
}