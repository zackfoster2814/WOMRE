import { DataTypes, Model } from "sequelize";
class Players_Gears extends Model {
}
export function PlayerGearTables(sequelize, dataTypes) {
    Players_Gears.init({
        player_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        gear_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
    }, {
        sequelize,
        tableName: 'players_gears',
        timestamps: false,
        underscored: true,
        modelName: 'Players_Gears',
    });
    return Players_Gears;
}
//# sourceMappingURL=player_gears.js.map