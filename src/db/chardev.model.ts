import { db } from "./index.js";
import { fn, col, Op, Sequelize, QueryTypes } from "sequelize";
import { CharDevTables } from "./tables/char_dev.js";
import lodash from "lodash";

const isEmpty = lodash.isEmpty;
const CharDevs = CharDevTables(db.sequelize, db.dataTypes);

export const getAllCharacterDevelopments = async function (): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    CharDevs.findAll()
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
