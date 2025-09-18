import { db } from "./index";
import { fn, col, Op, Sequelize, QueryTypes } from "sequelize";
import { PveEnemiesTables } from "./tables/pve_enemies"; 
import lodash from "lodash";

const isEmpty = lodash.isEmpty;
const Pves = PveEnemiesTables(db.sequelize, db.dataTypes);

export const getAllPves = async function (): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    Pves.findAll()
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