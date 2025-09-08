import { DataTypes, Model } from "sequelize";
class Quirks extends Model {
}
export function QuirkTables(sequelize, dataTypes) {
    Quirks.init({
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
        effect: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '',
        },
        tags: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {},
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: '',
        },
    }, {
        sequelize,
        tableName: 'quirks',
        timestamps: false,
        underscored: true,
        modelName: 'Quirks',
    });
    return Quirks;
}
//# sourceMappingURL=quirks.js.map