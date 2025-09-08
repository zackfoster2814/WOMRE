import { DataTypes, Model } from "sequelize";
class Pve_Enemies extends Model {
}
export function PveEnemiesTables(sequelize, dataTypes) {
    Pve_Enemies.init({
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
        strength: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        speed: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        iq: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        biq: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        durability: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        martial_arts: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        power: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {},
        },
        reward: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '',
        },
        pusnishment: {
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
        tableName: 'pve_enemies',
        timestamps: false,
        underscored: true,
        modelName: 'Pve_Enemies',
    });
    return Pve_Enemies;
}
//# sourceMappingURL=pve_enemies.js.map