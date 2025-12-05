import { Sequelize, DataTypes, Model } from "sequelize";

export interface PowersAttributes {
    id?: number;
    name: string;
    effect: string;
    note: string;
}

interface PowersCreationAttributes extends Omit<PowersAttributes, 'id'> {
    id?: number;
}

class Powers extends Model<PowersAttributes, PowersCreationAttributes> implements PowersAttributes {
    declare id: number;
    declare name: string;
    declare effect: string;
    declare note: string;
}

export function PowerTables(sequelize: Sequelize, dataTypes: typeof DataTypes): typeof Powers {
    Powers.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        effect: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: '',
        },
    }, {
        sequelize,
        tableName: 'powers',
        timestamps: false,
        underscored: true,
        modelName: 'Powers',
    }); 
    return Powers;
}