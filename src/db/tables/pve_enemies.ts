import { Sequelize, DataTypes, Model } from "sequelize";

interface pve_enemies_Attributes {
    id?: number;
    name: string;
    strength: number;
    speed: number;
    iq: number;
    biq: number;
    durability: number;
    martial_arts: number;
    power: JSON;
    reward: string;
    pusnishment: string;
    weight: number;
}

interface pve_enemies_CreationAttributes extends Omit<pve_enemies_Attributes, 'id'> {
    id?: number;
}

class Pve_Enemies extends Model<pve_enemies_Attributes, pve_enemies_CreationAttributes> implements pve_enemies_Attributes {
    declare id: number;
    declare name: string;
    declare strength: number;
    declare speed: number;
    declare iq: number;
    declare biq: number;
    declare durability: number;
    declare martial_arts: number;
    declare power: JSON;
    declare reward: string
    declare pusnishment: string;
    declare weight: number;
}
export function PveEnemiesTables(sequelize: Sequelize, dataTypes: typeof DataTypes): typeof Pve_Enemies {
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
            type: DataTypes.DECIMAL(5,2),
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
