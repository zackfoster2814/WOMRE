import { db } from "./index";
import { fn, col, Op, Sequelize, QueryTypes } from "sequelize";
import { QuirkTables } from "./tables/quirks"; 
import lodash from "lodash";

const isEmpty = lodash.isEmpty;
const Quirks = QuirkTables(db.sequelize, db.dataTypes);

export const getAllQuirks = async function (): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    Quirks.findAll()
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