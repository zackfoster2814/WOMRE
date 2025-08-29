import { Sequelize, DataTypes, Model } from "sequelize";

interface tournament_phaseAttributes {
    id?: number;
    name: string;
    description: string;
}

interface tournament_phaseCreationAttributes extends Omit<tournament_phaseAttributes, 'id'> {
    id?: number;
}
class tournament_phase extends Model<tournament_phaseAttributes, tournament_phaseCreationAttributes> implements tournament_phaseAttributes {
    declare id: number
    declare name: string;
    declare description: string;
}
export function TournamentPhaseTables(sequelize: Sequelize, dataTypes: typeof DataTypes): typeof tournament_phase {
    tournament_phase.init({
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
    },{
        sequelize,
        tableName:'tournament_phase',
        timestamps:false,
        underscored:true,
        modelName:'tournament_phase',
    });
    return tournament_phase;
}