import { Sequelize, DataTypes, Model } from "sequelize";

export interface EnchantsAttributes  {
    id?: number;
    name: string;
    effect: string;
    weight: number;
}

interface EnchantsCreationAttributes extends Omit<EnchantsAttributes, 'id'> {
    id?: number;
}

class Enchants extends Model<EnchantsAttributes, EnchantsCreationAttributes> implements EnchantsAttributes {
    declare id: number
    declare name: string;
    declare effect: string;
    declare weight: number;
}

export function EnchantTables(sequelize: Sequelize, dataTypes: typeof DataTypes): typeof Enchants {
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
            type: DataTypes.DECIMAL(5,2),
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