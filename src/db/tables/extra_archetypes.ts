import { Sequelize, DataTypes, Model } from "sequelize";

interface ExtraArchetypesAttributes {
    id: number;
    name: string;
    archetype_id: number;
    weight: number;
    effect: string;
    note: string;
}
interface ExtraArchetypesCreationAttributes extends Omit<ExtraArchetypesAttributes, 'id'> {
    id?: number;
}
class ExtraArchetypes extends Model<ExtraArchetypesAttributes, ExtraArchetypesCreationAttributes> implements ExtraArchetypesAttributes {
    declare id: number
    declare name: string;
    declare archetype_id: number;
    declare weight: number;
    declare effect: string;
    declare note: string;
}
export function ExtraArchetypeTables(sequelize: Sequelize, dataTypes: typeof DataTypes): typeof ExtraArchetypes {
    ExtraArchetypes.init({
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
        archetype_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            references: {
                model: 'Archetypes',
                key: 'id',
            },
        },
        weight: {
            type: DataTypes.DECIMAL(5,2),
            allowNull: false,
            defaultValue: 0,
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
    }, {
        sequelize,
        tableName: 'extra_archetypes',
        timestamps: false,
        underscored: true,
        modelName: 'ExtraArchetypes',
    });
    return ExtraArchetypes;
}