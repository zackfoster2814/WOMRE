import { Sequelize, DataTypes, Model } from "sequelize";

export interface Weapons_EnchantsAttributes {
    weapon_id: number;
    enchant_id: number;
    player_id: number;
}

interface Weapons_EnchantsCreationAttributes extends Weapons_EnchantsAttributes {}

class Weapons_Enchants extends Model<Weapons_EnchantsAttributes, Weapons_EnchantsCreationAttributes> implements Weapons_EnchantsAttributes {
    declare weapon_id: number;
    declare enchant_id: number;
    declare player_id: number;
}

export function WeaponEnchantTables(sequelize: Sequelize, dataTypes: typeof DataTypes): typeof Weapons_Enchants {
    Weapons_Enchants.init({
        weapon_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'Weapons',
                key: 'id',
            }
        },
        enchant_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'Enchants',
                key: 'id',
            }
        },
        player_id: {
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