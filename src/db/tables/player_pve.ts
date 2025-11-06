import { Sequelize, DataTypes, Model } from "sequelize";

interface Players_Pve_Attributes {
    player_id: number;
    pve_enemies: number;
}

interface Players_PveCreationAttributes extends Players_Pve_Attributes {}

class Player_Pve extends Model<Players_Pve_Attributes, Players_PveCreationAttributes> implements Players_Pve_Attributes {
    declare player_id: number;
    declare pve_enemies: number;
}

export function Player_PveTables(sequelize: Sequelize, dataTypes: typeof DataTypes): typeof Player_Pve {
    Player_Pve.init({
        player_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'Players',
                key: 'id',
            }
        },
        pve_enemies: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references:{
                model:'Pve_Enemies',
                key:'id'
            }
        },
    }, {
        sequelize,
        tableName: 'player_pve',
        timestamps: false,
        underscored: true,
        modelName: 'Player_Pve',
    });
    return Player_Pve;
}