import { DataTypes, Model } from "sequelize";
class Matches_Events extends Model {
}
export function MatchEventsTables(sequelize, dataTypes) {
    Matches_Events.init({
        match_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        event_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
    }, {
        sequelize,
        tableName: 'matches_events',
        timestamps: false,
        underscored: true,
        modelName: 'Matches_Events',
    });
    return Matches_Events;
}
//# sourceMappingURL=match_events.js.map