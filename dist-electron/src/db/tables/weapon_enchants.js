import { DataTypes, Model } from "sequelize";
class Weapons_Enchants extends Model {
}
export function WeaponEnchantTables(sequelize, dataTypes) {
    Weapons_Enchants.init({
        weapon_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        enchant_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
    }, {
        sequelize,
        tableName: 'weapons_enchants',
        timestamps: false,
        underscored: true,
        modelName: 'Weapons_Enchants',
    });
    return Weapons_Enchants;
}
//# sourceMappingURL=weapon_enchants.js.map