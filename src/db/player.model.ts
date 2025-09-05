import { db } from "./index.ts";
import { fn, col, Op, Sequelize, QueryTypes } from "sequelize";
import { PlayerTables } from "./tables/player.ts";
import lodash from "lodash";

const isEmpty = lodash.isEmpty;
const Players = PlayerTables(db.sequelize, db.dataTypes);

export const getAllPlayers = async function (): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    Players.findAll()
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
// example raw query
export const insertPlayer = async function (Playerdata: any) {
  try {
    const { stt, name, note } = Playerdata;
    const query = `INSERT INTO Players (stt, name, note) 
                   VALUES (:stt, :name, :note)`;

    const data = await db.sequelize.query(query, {
      replacements: {
        stt: stt,
        name: name,
        note: note,
      },
      type: QueryTypes.INSERT,
      raw: true,
    });
    return data;
  } catch (err) {
    console.error("er:", err);
  }
};
//example
// export const updatePlayers = async function(where:any,obj:any) : Promise<any>{
//     return new Promise<any>((resolve,reject) => {
//         Players.update(
//             obj,
//             {
//                 where: where,
//                 raw:true,
//             }
//         ).then(function (obj: any) {
//            if (!isEmpty(obj)) {
//                 resolve(obj);
//             } else {
//                 resolve(null);
//             }
//         }).catch((err: any) => {
//             reject(err);
//         });
//     });
// }
