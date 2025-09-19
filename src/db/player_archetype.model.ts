import { db } from "./index";
import { fn, col, Op, Sequelize, QueryTypes } from "sequelize";
import { PlayerArchetypeTables } from "./tables/player_archetypes"; 
import lodash from "lodash";

const isEmpty = lodash.isEmpty;
const PlayerArchetypes = PlayerArchetypeTables(db.sequelize, db.dataTypes);

export const getAllPlayerArchetypes = async function (): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    PlayerArchetypes.findAll()
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