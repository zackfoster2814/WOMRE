import { Sequelize, DataTypes, Model } from "sequelize";

export interface Players_QuirksAttributes {
    player_id: number;
    quirk_id: number;
}

interface Players_QuirksCreationAttributes extends Players_QuirksAttributes {}

class Players_Quirks extends Model<Players_QuirksAttributes, Players_QuirksCreationAttributes> implements Players_QuirksAttributes {
    declare player_id: number;
    declare quirk_id: number;
}

export function PlayerQuirkTables(sequelize: Sequelize, dataTypes: typeof DataTypes): typeof Players_Quirks {
    Players_Quirks.init({
        player_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'Players',
                key: 'id',
            }
        },
        quirk_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'Quirks',
                key: 'id',
            }
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