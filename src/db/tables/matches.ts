import { Sequelize, DataTypes, Model } from "sequelize";

export interface MatchesAttributes {
    id?: number;
    phase_id: number;
    player_a_id: number;
    player_b_id: number;
    pve_enemy_id: number;
    winner_id: number;
    score_a: number;
    score_b: number;
    effect_applied: string;
    match_date: Date;
}

interface MatchesCreationAttributes extends Omit<MatchesAttributes, 'id'> {
    id?: number;
}

class Matches extends Model<MatchesAttributes, MatchesCreationAttributes> implements MatchesAttributes {
    declare id: number;
    declare phase_id: number;
    declare player_a_id: number;
    declare player_b_id: number;
    declare pve_enemy_id: number;
    declare winner_id: number;
    declare score_a: number;
    declare score_b: number;
    declare effect_applied: string;
    declare match_date: Date;
}

export function MatchTables(sequelize: Sequelize, dataTypes: typeof DataTypes): typeof Matches {
    Matches.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        phase_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            references: {
                model: 'tournament_phase',
                key: 'id',
            },
        },

        player_a_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        player_b_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        pve_enemy_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        winner_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        score_a: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        score_b: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        effect_applied: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '',
        },
        match_date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    }, {
        sequelize,
        tableName: 'matches',
        timestamps: false,
        underscored: true,
        modelName: 'Matches',
    });
    return Matches;
}