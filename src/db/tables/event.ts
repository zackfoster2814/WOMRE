import { Sequelize, DataTypes, Model } from "sequelize";

export interface EventsAttributes {
    id?: number;
    target: string;
    amount: number;
    stat:string;
}

interface EventsCreationAttributes extends EventsAttributes {
    id?: number;
}

class Events extends Model<EventsAttributes, EventsCreationAttributes> implements EventsAttributes {
    declare id: number;
    declare target: string;
    declare amount: number;
    declare stat: string;
}

export function EventTables(sequelize: Sequelize, dataTypes: typeof DataTypes): typeof Events {
    Events.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        target: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '',
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        stat: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '',
        },
    }, {
        sequelize,
        tableName: 'events',
        timestamps: false,
        underscored: true,
        modelName: 'Events',
    });
    return Events;
}

