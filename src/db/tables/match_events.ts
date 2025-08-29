import { Sequelize, DataTypes, Model } from "sequelize";

interface Matches_Events_Attributes {
    match_id: number;
    event_id: number;
}

interface Matches_Events_CreationAttributes extends Matches_Events_Attributes {}

class Matches_Events extends Model<Matches_Events_Attributes, Matches_Events_CreationAttributes> implements Matches_Events_Attributes {
    declare match_id: number;
    declare event_id: number;
}
export function MatchEventsTables(sequelize: Sequelize, dataTypes: typeof DataTypes): typeof Matches_Events {
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