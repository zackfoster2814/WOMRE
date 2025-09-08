import { DataTypes, Model } from "sequelize";
class Races extends Model {
}
export function RaceTables(sequelize, dataTypes) {
    Races.init({
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
        subrace_wheel: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0,
        },
        trait: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '',
        },
        weight: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 1,
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: '',
        },
    }, {
        sequelize,
        tableName: 'races',
        timestamps: false,
        underscored: true,
        modelName: 'Races',
    });
    return Races;
}
//# sourceMappingURL=races.js.map