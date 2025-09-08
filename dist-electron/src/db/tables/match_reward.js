import { DataTypes, Model } from "sequelize";
class Matches_Reward extends Model {
}
export function MatchRewardTables(sequelize, dataTypes) {
    Matches_Reward.init({
        match_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        reward_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
    }, {
        sequelize,
        tableName: 'matches_reward',
        timestamps: false,
        underscored: true,
        modelName: 'Matches_Reward',
    });
    return Matches_Reward;
}
//# sourceMappingURL=match_reward.js.map