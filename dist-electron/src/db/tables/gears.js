import { DataTypes, Model } from "sequelize";
class Gears extends Model {
}
export function GearTables(sequelize, dataTypes) {
    Gears.init({
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
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '',
        },
        is_special: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0,
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: '',
        },
    }, {
        sequelize,
        tableName: 'gears',
        timestamps: false,
        underscored: true,
        modelName: 'Gears',
    });
    return Gears;
}
//# sourceMappingURL=gears.js.map