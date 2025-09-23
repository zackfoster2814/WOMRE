import { Sequelize, DataTypes, Model } from "sequelize";

interface Players_WeaponsAttributes {
    player_id: number;
    weapon_id: number;
    is_useable: number;
}

interface Players_WeaponsCreationAttributes extends Players_WeaponsAttributes {}

class Players_Weapons extends Model<Players_WeaponsAttributes, Players_WeaponsCreationAttributes> implements Players_WeaponsAttributes {
    declare player_id: number;
    declare weapon_id: number;
    declare is_useable: number;
}

export function PlayerWeaponTables(sequelize: Sequelize, dataTypes: typeof DataTypes): typeof Players_Weapons {
    Players_Weapons.init({
        player_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        weapon_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        is_useable: {
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