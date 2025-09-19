import { db } from "./index.js";
import { fn, col, Op, Sequelize, QueryTypes } from "sequelize";
import { RaceTables } from "./tables/races.js";
import lodash from "lodash";

const isEmpty = lodash.isEmpty;
const Races = RaceTables(db.sequelize, db.dataTypes);

export const getAllRaces = async function (): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    Races.findAll()
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
