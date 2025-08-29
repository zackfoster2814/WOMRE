import {db} from "./index.ts";
import {fn , col ,Op, Sequelize,QueryTypes } from "sequelize";
import {PlayerTables} from "./tables/player.ts";
import lodash from "lodash";

const isEmpty = lodash.isEmpty;
const Players = PlayerTables(db.sequelize,db.dataTypes);

export const getAllPlayers = async function (): Promise<any> {
    return new Promise<any>((resolve,reject) => {
     Players.findAll().then(function (obj: any) {
           if (!isEmpty(obj)) {
                resolve(obj);
            } else {
                resolve(null);
            }
        }).catch((err: any) => {
            reject(err);
        });
    });
}
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

//Exmaple Raw Query cho cach query phuc tap hoac cho a nao thich old style
// export const ... = async function (params:type) {
//     try{
//         const query = '...';
//         const data = Players.sequelize.query(query,{
//             replacements:{
//                 ...
//             },
//             type: QueryTypes.SELECT,
//             raw:true
//         })
//         return data;
//     }catch (error){
//         console.error(...);
//     }
// };