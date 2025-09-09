import { db } from "./index";
import { QueryTypes } from "sequelize";
import { PlayerTables } from "./tables/player";
import lodash from "lodash";
const isEmpty = lodash.isEmpty;
const Players = PlayerTables(db.sequelize, db.dataTypes);
export const getAllPlayers = async function () {
  return new Promise((resolve, reject) => {
    Players.findAll()
      .then(function (obj) {
        if (!isEmpty(obj)) {
          resolve(obj);
        } else {
          resolve(null);
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
};
// example raw query
export const insertPlayer = async function (Playerdata) {
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
//# sourceMappingURL=player.model.js.map
