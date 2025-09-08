import { DataTypes, Model } from "sequelize";
class char_dev extends Model {
}
export function CharDevTables(sequelize, dataTypes) {
    char_dev.init({
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
        tableName: 'char_dev',
        timestamps: false,
        underscored: true,
        modelName: 'char_dev',
    });
    return char_dev;
}
//# sourceMappingURL=char_dev.js.map