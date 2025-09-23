import { db } from "./index.js";
import { fn, col, Op, Sequelize, QueryTypes } from "sequelize";
import { PlayerQuirkTables } from "./tables/player_quirks.js";
import lodash from "lodash";

const isEmpty = lodash.isEmpty;
const PlayerQuirks = PlayerQuirkTables(db.sequelize, db.dataTypes);

export const getAllPlayerQuirks = async function (): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    PlayerQuirks.findAll()
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
