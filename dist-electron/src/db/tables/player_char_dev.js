import { DataTypes, Model } from "sequelize";
class Player_char_dev extends Model {
}
export function PlayerCharDevTables(sequelize, dataTypes) {
    Player_char_dev.init({
        player_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        char_dev_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
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
//# sourceMappingURL=player_char_dev.js.map