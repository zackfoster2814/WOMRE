import { db } from "./index.js";
import { fn, col, Op, Sequelize, QueryTypes } from "sequelize";
import { HouseTables } from "./tables/houses.js";
import lodash from "lodash";

const isEmpty = lodash.isEmpty;
const Houses = HouseTables(db.sequelize, db.dataTypes);

export const getAllHouses = async function (): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    Houses.findAll()
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
