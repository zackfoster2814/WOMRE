import { Sequelize, DataTypes, Model } from "sequelize";

export interface Player_char_dev_Attributes {
    player_id: number;
    char_dev_id: number;
}

interface Player_char_dev_CreationAttributes extends Player_char_dev_Attributes {}
class Player_char_dev extends Model<Player_char_dev_Attributes, Player_char_dev_CreationAttributes> implements Player_char_dev_Attributes {
    declare player_id: number
    declare char_dev_id: number;
}

export function PlayerCharDevTables(sequelize: Sequelize, dataTypes: typeof DataTypes): typeof Player_char_dev {
    Player_char_dev.init({
        player_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'Players',
                key: 'id',
            }
        },
        char_dev_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'char_dev',
                key: 'id',
            }
        },
    }, {
        sequelize,
        tableName: 'player_char_dev',
        timestamps: false,
        underscored: true,
        modelName: 'Player_char_dev',
    }); 
    return Player_char_dev;
}