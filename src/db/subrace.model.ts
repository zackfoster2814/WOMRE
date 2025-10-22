import { db } from "./index.js";
import { fn, col, Op, Sequelize, QueryTypes } from "sequelize";
import { SubRaceTables } from "./tables/sub_race.js";
import lodash from "lodash";

const isEmpty = lodash.isEmpty;
const Subraces = SubRaceTables(db.sequelize, db.dataTypes);

export const getAllSubraces = async function (): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    Subraces.findAll()
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
export const getSubracesByRaceId = async function (race_id: number): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    Subraces.findAll({
      where: {
        race_id: race_id
      }
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