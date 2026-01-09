import { db } from "./index";
import { fn, col, Op, Sequelize, QueryTypes } from "sequelize";
import { TournamentPhaseTables } from "./tables/tournament_phase"; 
import lodash from "lodash";

const isEmpty = lodash.isEmpty;
const TournamentPhases = TournamentPhaseTables(db.sequelize, db.dataTypes);

export const getAllTournamentPhases = async function (): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    TournamentPhases.findAll()
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