import { DataTypes, Model } from "sequelize";
class Matches extends Model {
}
export function MatchTables(sequelize, dataTypes) {
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
//# sourceMappingURL=matches.js.map