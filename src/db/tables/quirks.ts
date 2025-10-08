import { Sequelize, DataTypes, Model } from "sequelize";

interface QuirksAttributes  {
    id?: number;
    name: string;
    effect: string;
    note: string;
}

interface QuirksCreationAttributes extends Omit<QuirksAttributes, 'id'> {
    id?: number;
}

class Quirks extends Model<QuirksAttributes, QuirksCreationAttributes> implements QuirksAttributes {
    declare id: number;
    declare name: string
    declare effect: string;
    declare note: string;
}

export function QuirkTables(sequelize: Sequelize, dataTypes: typeof DataTypes): typeof Quirks {
    Quirks.init({
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
        note: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: '',
        },
    }, {
        sequelize,
        tableName: 'quirks',
        timestamps: false,
        underscored: true,
        modelName: 'Quirks',
    });
    return Quirks;
}