import { Sequelize, DataTypes, Model } from "sequelize";

export interface HousesAttributes {
    id?: number;
    name: string;
    description: string;
    effect: string;
    note: string;
    quest: string;
}
interface HousesCreationAttributes extends Omit<HousesAttributes, 'id'> {
    id?: number;
}
class Houses extends Model<HousesAttributes, HousesCreationAttributes> implements HousesAttributes {
    declare id: number
    declare name: string;
    declare description: string;
    declare effect: string;
    declare note: string;
    declare quest: string;
}

export function HouseTables(sequelize: Sequelize, dataTypes: typeof DataTypes): typeof Houses {
    Houses.init({
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
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: '',

        },
        effect: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '',
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: '',
        },
        quest: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: '',
        },
    }, {
        sequelize,
        tableName: 'houses',
        timestamps: false,
        underscored: true,
        modelName: 'Houses',
    });
    return Houses;
}