import { db } from "./index.js";
import { fn, col, Op, Sequelize, QueryTypes } from "sequelize";
import { ArchetypeTables } from "./tables/archetypes.js";
import lodash from "lodash";

const isEmpty = lodash.isEmpty;
const Archetypes = ArchetypeTables(db.sequelize, db.dataTypes);

export const getAllArchetypes = async function (): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    Archetypes.findAll()
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
