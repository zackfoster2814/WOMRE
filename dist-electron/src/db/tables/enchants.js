import { DataTypes, Model } from "sequelize";
class Enchants extends Model {
}
export function EnchantTables(sequelize, dataTypes) {
    Enchants.init({
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
    }, {
        sequelize,
        tableName: 'enchants',
        timestamps: false,
        underscored: true,
        modelName: 'Enchants',
    });
    return Enchants;
}
//# sourceMappingURL=enchants.js.map