import { Sequelize, DataTypes, Model } from "sequelize";

interface PlayersAttributes {
  id?: number;
  stt: number;
  name: string;
  note: string;
  race_id: number;
  sub_race_id: number;
  house_id: number;
  base_strength: number;
  base_speed: number;
  base_iq: number;
  base_biq: number;
  base_durability: number;
  base_martial_arts: number;
  current_strength: number;
  current_speed: number;
  current_iq: number;
  current_biq: number;
  current_durability: number;
  current_martial_arts: number;
  pvp_reward: string;
  tailored_reward: string;
  tournament_status: number;
}

interface PlayersCreationAttributes extends Omit<PlayersAttributes, "id"> {
  id?: number;
}

class Players
  extends Model<PlayersAttributes, PlayersCreationAttributes>
  implements PlayersAttributes
{
  declare id: number;
  declare stt: number;
  declare name: string;
  declare note: string;
  declare race_id: number;
  declare sub_race_id: number;
  declare house_id: number;
  declare base_strength: number;
  declare base_speed: number;
  declare base_iq: number;
  declare base_biq: number;
  declare base_durability: number;
  declare base_martial_arts: number;
  declare current_strength: number;
  declare current_speed: number;
  declare current_iq: number;
  declare current_biq: number;
  declare current_durability: number;
  declare current_martial_arts: number;
  declare pvp_reward: string;
  declare tailored_reward: string;
  declare tournament_status: number;
}

export function PlayerTables(
  sequelize: Sequelize,
  dataTypes: typeof DataTypes
): typeof Players {
  Players.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      stt: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "",
      },
      note: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "",
      },
      race_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      sub_race_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      house_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      base_strength: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      base_speed: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      base_iq: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      base_biq: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      base_durability: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      base_martial_arts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      current_strength: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      current_speed: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      current_iq: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      current_biq: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      current_durability: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      current_martial_arts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      pvp_reward: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "",
      },
      tailored_reward: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "",
      },
      tournament_status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      tableName: "Players",
      timestamps: false,
      underscored: true,
      modelName: "Players",
    }
  );
  return Players;
}
