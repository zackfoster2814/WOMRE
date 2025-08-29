import { timeStamp } from "console";
import { Sequelize, DataTypes, Model } from "sequelize";

interface Sub_race_Attributes {
    id?: number;
    race_id: number;
    name: string;
    trait: string;
    weight: number;
}

interface Sub_race_CreationAttributes extends Sub_race_Attributes{
    id?: number;
}

class Sub_Race extends Model<Sub_race_Attributes,Sub_race_CreationAttributes> implements Sub_Race {
    declare id: number;
    declare race_id:number;
    declare name:string;
    declare trait:string;
    declare weight:number;
}
export function SubRaceTables(sequelize: Sequelize, dataTypes: typeof DataTypes): typeof Sub_Race{
     Sub_Race.init({
        id:{
            type:DataTypes.INTEGER,
            autoIncrement:true,
            primaryKey:true,
        },
        race_id:{
            type:DataTypes.INTEGER,
            allowNull:false,
            defaultValue:0,
        },
        name:{
            type:DataTypes.STRING,
            allowNull:false,
            defaultValue:'',
        },
        trait:{
            type:DataTypes.STRING,
            allowNull:false,
            defaultValue:'',
        },
        weight:{
            type:dataTypes.DECIMAL(5,2),
            allowNull:false,
            defaultValue:0,
        }
    },{
        sequelize,
        tableName:'Sub_race',
        timestamps:false,
        underscored:true,
        modelName:'Sub_Race',
        });
    return Sub_Race;
}