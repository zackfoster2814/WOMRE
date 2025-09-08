import { DataTypes, Model } from "sequelize";
class tournament_phase extends Model {
}
export function TournamentPhaseTables(sequelize, dataTypes) {
    tournament_phase.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '',
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: '',
        },
    }, {
        sequelize,
        tableName: 'tournament_phase',
        timestamps: false,
        underscored: true,
        modelName: 'tournament_phase',
    });
    return tournament_phase;
}
//# sourceMappingURL=tournament_phase.js.map