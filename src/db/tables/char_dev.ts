import { Sequelize, DataTypes, Model } from "sequelize";

export interface char_devAttributes {
    id: number;
    name: string;
    effect : string;
    weight: number;
    note: string;    
}

interface char_devCreationAttributes extends Omit<char_devAttributes, 'id'> {
    id?: number;
}

class char_dev extends Model<char_devAttributes, char_devCreationAttributes> implements char_devAttributes {
    declare id: number;
    declare name: string;
    declare effect: string;
    declare weight: number;
    declare note: string;
}
export function CharDevTables(sequelize: Sequelize, dataTypes: typeof DataTypes): typeof char_dev {
    char_dev.init({
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
            type: DataTypes.DECIMAL(5,2),
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
        tableName: 'char_dev',
        timestamps: false,
        underscored: true,
        modelName: 'char_dev',
    });
    return char_dev;
}