import { Sequelize, DataTypes, Model } from "sequelize";

export interface ArchetypesAttributes {
    id: number;
    name: string;
    effect: string;
    weight: number;
    note: string;
}

interface ArchetypesCreationAttributes extends Omit<ArchetypesAttributes, 'id'> {
    id?: number;
}

class Archetypes extends Model<ArchetypesAttributes, ArchetypesCreationAttributes> implements ArchetypesAttributes {
    declare id: number;
    declare name: string;
    declare effect: string;
    declare weight: number;
    declare note: string;
}

export function ArchetypeTables(sequelize: Sequelize, dataTypes: typeof DataTypes): typeof Archetypes {
    Archetypes.init({
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
        tableName: 'archetypes',
        timestamps: false,
        underscored: true,
        modelName: 'Archetypes',
    });
    return Archetypes;
}