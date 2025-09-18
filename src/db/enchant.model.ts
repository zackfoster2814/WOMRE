import { db } from "./index";
import { fn, col, Op, Sequelize, QueryTypes } from "sequelize";
import { EnchantTables } from "./tables/enchants"; 
import lodash from "lodash";

const isEmpty = lodash.isEmpty;
const Enchants = EnchantTables(db.sequelize, db.dataTypes);

export const getAllEnchants = async function (): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    Enchants.findAll()
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