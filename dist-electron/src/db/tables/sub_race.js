import { DataTypes, Model } from "sequelize";
class Sub_Race extends Model {
}
export function SubRaceTables(sequelize, dataTypes) {
    Sub_Race.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        race_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '',
        },
        trait: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '',
        },
        weight: {
            type: dataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 0,
        }
    }, {
        sequelize,
        tableName: 'Sub_race',
        timestamps: false,
        underscored: true,
        modelName: 'Sub_Race',
    });
    return Sub_Race;
}
//# sourceMappingURL=sub_race.js.map