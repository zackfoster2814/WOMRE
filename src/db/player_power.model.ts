import { db } from "./index";
import { fn, col, Op, Sequelize, QueryTypes } from "sequelize";
import { PlayerPowerTables } from "./tables/player-powers"; 
import lodash from "lodash";

const isEmpty = lodash.isEmpty;
const PlayerPowers = PlayerPowerTables(db.sequelize, db.dataTypes);

export const getAllPlayerPowers = async function (): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    PlayerPowers.findAll()
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