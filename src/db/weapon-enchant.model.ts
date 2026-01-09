import { db } from "./index";
import { fn, col, Op, Sequelize, QueryTypes } from "sequelize";
import { WeaponEnchantTables } from "./tables/weapon_enchants"; 
import lodash from "lodash";

const isEmpty = lodash.isEmpty;
const WeaponEnchants = WeaponEnchantTables(db.sequelize, db.dataTypes);

export const getAllWeaponEnchants = async function (): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    WeaponEnchants.findAll()
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