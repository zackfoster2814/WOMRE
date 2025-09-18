import { db } from "./index";
import { fn, col, Op, Sequelize, QueryTypes } from "sequelize";
import { WeaponTables } from "./tables/weapons"; 
import lodash from "lodash";

const isEmpty = lodash.isEmpty;
const Weapons = WeaponTables(db.sequelize, db.dataTypes);

export const getAllWeapons = async function (): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    Weapons.findAll()
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