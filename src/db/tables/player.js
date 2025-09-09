import { DataTypes, Model } from "sequelize";
class Players extends Model {
}
export function PlayerTables(sequelize, dataTypes) {
    Players.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        stt: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        note: {
            type: DataTypes.STRING,
            allowNull: false
        },
        race_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        sub_race_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        house_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        base_strength: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        base_speed: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        base_iq: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        base_biq: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        base_durability: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        base_martial_arts: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        current_strength: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        current_speed: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        current_iq: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        current_biq: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        current_durability: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        current_martial_arts: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        pvp_reward: {
            type: DataTypes.JSON,
            allowNull: false
        },
        tailored_reward: {
            type: DataTypes.JSON,
            allowNull: false
        },
        tournament_status: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        sequelize,
        tableName: "Players",
        timestamps: false,
        underscored: true,
        modelName: 'Players'
    });
    return Players;
}
//# sourceMappingURL=player.js.map