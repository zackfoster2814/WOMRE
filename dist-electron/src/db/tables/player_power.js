import { DataTypes, Model } from "sequelize";
class Players_Power extends Model {
}
export function PlayerPowerTables(sequelize, dataTypes) {
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
//# sourceMappingURL=player_power.js.map