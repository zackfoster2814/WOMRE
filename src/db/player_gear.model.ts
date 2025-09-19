import { db } from "./index.js";
import { fn, col, Op, Sequelize, QueryTypes } from "sequelize";
import { PlayerGearTables } from "./tables/player_gears.js";
import lodash from "lodash";

const isEmpty = lodash.isEmpty;
const PlayerGears = PlayerGearTables(db.sequelize, db.dataTypes);

export const getAllPlayerGears = async function (): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    PlayerGears.findAll()
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
