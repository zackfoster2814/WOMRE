import { db } from "./index";
import { fn, col, Op, Sequelize, QueryTypes } from "sequelize";
import { MatchRewardTables } from "./tables/match_reward"; 
import lodash from "lodash";

const isEmpty = lodash.isEmpty;
const MatchRewards = MatchRewardTables(db.sequelize, db.dataTypes);

export const getAllMatchRewards = async function (): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    MatchRewards.findAll()
      .then(function (obj: any) {
        if (!isEmpty(obj)) {
          resolve(obj);
        } else {
          resolve(null);
        }
      })
      .catch((err: any) => {
        reject(err);
      });
  });
};