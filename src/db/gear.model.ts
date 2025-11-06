import { db } from "./index.js";
import { fn, col, Op, Sequelize, QueryTypes } from "sequelize";
import { GearTables } from "./tables/gears.js";
import lodash from "lodash";

const isEmpty = lodash.isEmpty;
const Gears = GearTables(db.sequelize, db.dataTypes);

export const getAllGears = async function (): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    Gears.findAll()
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

export const getGearByLegacy = async function (id: number): Promise<any> {  
  return new Promise<any>((resolve, reject) => {
    Gears.findAll({
      where: {
        is_special: id, 
      },
    })
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
