import { DataTypes, Model } from "sequelize";
class Powers extends Model {
}
export function PowerTables(sequelize, dataTypes) {
    Powers.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        effect: {
            type: DataTypes.STRING,
            allowNull: false,
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
        tableName: 'powers',
        timestamps: false,
        underscored: true,
        modelName: 'Powers',
    });
    return Powers;
}
//# sourceMappingURL=power.js.map