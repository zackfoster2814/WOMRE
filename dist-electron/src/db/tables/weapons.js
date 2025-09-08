import { DataTypes, Model } from "sequelize";
class Weapons extends Model {
}
export function WeaponTables(sequelize, dataTypes) {
    Weapons.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '',
        },
        is_unique: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0,
        },
        effect: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '',
        },
        usage_persentage: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 100,
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: '',
        },
    }, {
        sequelize,
        tableName: 'weapons',
        timestamps: false,
        underscored: true,
        modelName: 'Weapons',
    });
    return Weapons;
}
//# sourceMappingURL=weapons.js.map