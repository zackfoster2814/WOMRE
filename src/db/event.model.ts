import { db } from "./index.js";
import { fn, col, Op, Sequelize, QueryTypes } from "sequelize";
import { EventTables } from "./tables/event.js";
import lodash from "lodash";

const isEmpty = lodash.isEmpty;
const Events = EventTables(db.sequelize, db.dataTypes);

export const getAllEvents = async function (): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    Events.findAll()
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
