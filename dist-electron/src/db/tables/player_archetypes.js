import { DataTypes, Model } from "sequelize";
class Players_Archetypes extends Model {
}
export function PlayerArchetypeTables(sequelize, dataTypes) {
    Players_Archetypes.init({
        player_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        archetype_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
    }, {
        sequelize,
        tableName: 'players_archetypes',
        timestamps: false,
        underscored: true,
        modelName: 'Players_Archetypes',
    });
    return Players_Archetypes;
}
//# sourceMappingURL=player_archetypes.js.map