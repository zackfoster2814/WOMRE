import { db } from "./index";
import { fn, col, Op, Sequelize, QueryTypes } from "sequelize";
import { PowerTables } from "./tables/power"; 
import lodash from "lodash";

const isEmpty = lodash.isEmpty;
const Powers = PowerTables(db.sequelize, db.dataTypes);

export const getAllPowers = async function (): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    Powers.findAll()
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