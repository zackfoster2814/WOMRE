import { Sequelize, DataTypes, Model } from "sequelize";

interface GearsAttributes  {
    id?: number;
    name: string;
    effect: string;
    type: string;
    is_special: number;
    note: string;
}

interface GearsCreationAttributes extends Omit<GearsAttributes, 'id'> {
    id?: number;
}

class Gears extends Model<GearsAttributes, GearsCreationAttributes> implements GearsAttributes {
    declare id: number;
    declare name: string;
    declare effect: string;
    declare type: string;
    declare is_special: number;
    declare note: string;
}

export function GearTables(sequelize: Sequelize, dataTypes: typeof DataTypes): typeof Gears {
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