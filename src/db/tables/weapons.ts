import { Sequelize, DataTypes, Model } from "sequelize";

export interface WeaponsAttributes  {
    id?: number;
    name: string;
    type: string;
    is_unique: number;
    effect: string;
    usage_persentage: number;
    note: string;
}

interface WeaponsCreationAttributes extends Omit<WeaponsAttributes, 'id'> {
    id?: number;
}

class Weapons extends Model<WeaponsAttributes, WeaponsCreationAttributes> implements WeaponsAttributes {
    declare id: number;
    declare name: string;
    declare type: string;
    declare is_unique: number;
    declare effect: string;
    declare usage_persentage: number;
    declare note: string;
}

export function WeaponTables(sequelize: Sequelize, dataTypes: typeof DataTypes): typeof Weapons {
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
            type: DataTypes.DECIMAL(5,2),
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
