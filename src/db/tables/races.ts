import { Sequelize, DataTypes, Model } from "sequelize";

interface RacesAttributes {
    id: number;
    name: string;
    subrace_wheel: number;
    trait: string;
    weight: number;
    note: string;
}

interface RacesCreationAttributes extends Omit<RacesAttributes, 'id'> {
    id?: number;
}

class Races extends Model<RacesAttributes, RacesCreationAttributes> implements RacesAttributes {
    declare id: number
    declare name: string;
    declare subrace_wheel: number;
    declare trait: string;
    declare weight: number;
    declare note: string;
}
export function RaceTables(sequelize: Sequelize, dataTypes: typeof DataTypes): typeof Races {
    Races.init({
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
        subrace_wheel: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0,
        },
        trait: {
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
        tableName:'races',
        timestamps: false,
        underscored: true,
        modelName:'Races',
    });
    return Races;
}
