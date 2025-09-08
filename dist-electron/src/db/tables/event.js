import { DataTypes, Model } from "sequelize";
class Events extends Model {
}
export function EventTables(sequelize, dataTypes) {
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
//# sourceMappingURL=event.js.map