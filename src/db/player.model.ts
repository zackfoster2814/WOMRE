import {db} from "./index.ts";
import {fn , col ,Op } from "sequelize";
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