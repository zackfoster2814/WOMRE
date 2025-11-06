import { db } from "./index.js";
import { fn, col, Op, Sequelize, QueryTypes } from "sequelize";
import { MatchEventsTables } from "./tables/match_events.js";
import lodash from "lodash";

const isEmpty = lodash.isEmpty;
const MatchEvents = MatchEventsTables(db.sequelize, db.dataTypes);

export const getAllMatchEvents = async function (): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    MatchEvents.findAll()
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
