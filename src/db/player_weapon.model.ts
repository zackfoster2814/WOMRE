import { db } from "./index";
import { fn, col, Op, Sequelize, QueryTypes } from "sequelize";
import { PlayerWeaponTables } from "./tables/player_weapons"; 
import lodash from "lodash";

const isEmpty = lodash.isEmpty;
const PlayerWeapons = PlayerWeaponTables(db.sequelize, db.dataTypes);

export const getAllPlayerWeapons = async function (): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    PlayerWeapons.findAll()
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