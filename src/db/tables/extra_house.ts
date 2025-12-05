import { Sequelize, DataTypes, Model } from "sequelize";
export interface ExtraHouseAttributes {
    id: number;
    house_id: number;
    name: string;
    effect: string;
    weight: number;
    note: string;
}
interface ExtraHouseCreationAttributes extends Omit<ExtraHouseAttributes, 'id'> {
    id?: number;
}
class ExtraHouse extends Model<ExtraHouseAttributes, ExtraHouseCreationAttributes> implements ExtraHouseAttributes {
    declare id: number
    declare house_id: number;
    declare name: string;
    declare effect: string;
    declare weight: number;
    declare note: string;
}
export function ExtraHouseTables(sequelize: Sequelize, dataTypes: typeof DataTypes): typeof ExtraHouse {
    ExtraHouse.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        house_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            references: {
                model: 'Houses',
                key: 'id',
            },
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
            defaultValue: 0,
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: '',
        },
    }, {
        sequelize,
        tableName: 'extra_house',
        timestamps: false,
        underscored: true,
        modelName: 'ExtraHouse',
    });
    return ExtraHouse;
}