import { DataTypes, Model } from "sequelize";
class Players_Weapons extends Model {
}
export function PlayerWeaponTables(sequelize, dataTypes) {
    Players_Weapons.init({
        player_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        weapon_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        mastery_level: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        is_primary: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0,
        },
    }, {
        sequelize,
        tableName: 'players_weapons',
        timestamps: false,
        underscored: true,
        modelName: 'Players_Weapons',
    });
    return Players_Weapons;
}
//# sourceMappingURL=player_weapons.js.map