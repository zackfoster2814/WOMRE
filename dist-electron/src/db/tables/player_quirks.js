import { DataTypes, Model } from "sequelize";
class Players_Quirks extends Model {
}
export function PlayerQuirkTables(sequelize, dataTypes) {
    Players_Quirks.init({
        player_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        quirk_id: {
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
        tableName: 'players_quirks',
        timestamps: false,
        underscored: true,
        modelName: 'Players_Quirks',
    });
    return Players_Quirks;
}
//# sourceMappingURL=player_quirks.js.map