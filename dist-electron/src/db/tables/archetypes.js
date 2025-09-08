import { DataTypes, Model } from "sequelize";
class Archetypes extends Model {
}
export function ArchetypeTables(sequelize, dataTypes) {
    Archetypes.init({
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
        tableName: 'archetypes',
        timestamps: false,
        underscored: true,
        modelName: 'Archetypes',
    });
    return Archetypes;
}
//# sourceMappingURL=archetypes.js.map