import { db } from "./index";
import { fn, col, Op, Sequelize, QueryTypes } from "sequelize";
import { MatchTables } from "./tables/matches"; 
import lodash from "lodash";

const isEmpty = lodash.isEmpty;
const Matches = MatchTables(db.sequelize, db.dataTypes);

export const getAllMatches = async function (): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    Matches.findAll()
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