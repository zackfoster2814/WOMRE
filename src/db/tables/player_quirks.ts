import { Sequelize, DataTypes, Model } from "sequelize";

interface Players_QuirksAttributes {
    player_id: number;
    quirk_id: number;
    count: number;
}

interface Players_QuirksCreationAttributes extends Players_QuirksAttributes {}

class Players_Quirks extends Model<Players_QuirksAttributes, Players_QuirksCreationAttributes> implements Players_QuirksAttributes {
    declare player_id: number
    declare quirk_id: number;
    declare count: number;
}

export function PlayerQuirkTables(sequelize: Sequelize, dataTypes: typeof DataTypes): typeof Players_Quirks {
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