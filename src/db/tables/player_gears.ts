import { Sequelize, DataTypes, Model } from "sequelize";

interface Players_GearsAttributes {
    player_id: number;
    gear_id: number;
    is_usable: number;
}

interface Players_GearsCreationAttributes extends Players_GearsAttributes {}

class Players_Gears extends Model<Players_GearsAttributes, Players_GearsCreationAttributes> implements Players_GearsAttributes {
    declare player_id: number;
    declare gear_id: number;
    declare is_usable: number;
}

export function PlayerGearTables(sequelize: Sequelize, dataTypes: typeof DataTypes): typeof Players_Gears {
    Players_Gears.init({
        player_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        gear_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        is_usable: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
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