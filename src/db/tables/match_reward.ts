import { Sequelize, DataTypes, Model } from "sequelize";

interface Matches_RewardAttributes {
    match_id: number;
    reward_id: number;
}
interface Matches_RewardCreationAttributes extends Matches_RewardAttributes {}

class Matches_Reward extends Model<Matches_RewardAttributes, Matches_RewardCreationAttributes> implements Matches_RewardAttributes {
    declare match_id: number
    declare reward_id: number;
}
export function MatchRewardTables(sequelize: Sequelize, dataTypes: typeof DataTypes): typeof Matches_Reward {
    Matches_Reward.init({
        match_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'Matches',
                key: 'id',
            },
        },
        reward_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'Rewards',
                key: 'id',
            },
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