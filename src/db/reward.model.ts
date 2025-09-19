import { db } from "./index.js";
import { fn, col, Op, Sequelize, QueryTypes } from "sequelize";
import { RewardTables } from "./tables/rewards.js";
import lodash from "lodash";

const isEmpty = lodash.isEmpty;
const Rewards = RewardTables(db.sequelize, db.dataTypes);

export const getAllRewards = async function (): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    Rewards.findAll()
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
