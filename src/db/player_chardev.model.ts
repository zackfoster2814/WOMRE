import { db } from "./index";
import { fn, col, Op, Sequelize, QueryTypes } from "sequelize";
import { PlayerCharDevTables } from "./tables/player_char_dev"; 
import lodash from "lodash";

const isEmpty = lodash.isEmpty;
const PlayerCharDevs = PlayerCharDevTables(db.sequelize, db.dataTypes);

export const getAllPlayerCharDevs = async function (): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    PlayerCharDevs.findAll()
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