import { DataTypes, Model } from "sequelize";
class Houses extends Model {
}
export function HouseTables(sequelize, dataTypes) {
    Houses.init({
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
        effect: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '',
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: '',
        },
        quest: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: '',
        },
    }, {
        sequelize,
        tableName: 'houses',
        timestamps: false,
        underscored: true,
        modelName: 'Houses',
    });
    return Houses;
}
//# sourceMappingURL=houses.js.map