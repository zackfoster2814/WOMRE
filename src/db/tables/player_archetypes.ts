import { Sequelize, DataTypes, Model } from "sequelize";

interface Players_ArchetypesAttributes {
    player_id: number;
    archetype_id: number;
}

interface Players_ArchetypesCreationAttributes extends Players_ArchetypesAttributes {}

class Players_Archetypes extends Model<Players_ArchetypesAttributes, Players_ArchetypesCreationAttributes> implements Players_ArchetypesAttributes {
    declare player_id: number;
    declare archetype_id: number;
}

export function PlayerArchetypeTables(sequelize: Sequelize, dataTypes: typeof DataTypes): typeof Players_Archetypes {
    Players_Archetypes.init({
        player_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'Players',
                key: 'id',
            },
        },
        archetype_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'Archetypes',
                key: 'id',
            },
        },
    }, {
        sequelize,
        tableName: 'players_archetypes',
        timestamps: false,
        underscored: true,
        modelName: 'Players_Archetypes',
    });
    return Players_Archetypes;
}