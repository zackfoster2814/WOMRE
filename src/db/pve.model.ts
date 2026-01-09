import { db } from "./index.js";
import { fn, col, Op, Sequelize, QueryTypes } from "sequelize";
import { PveEnemiesTables } from "./tables/pve_enemies.js";
import { PveMatchResultsTable } from "./tables/pve_match_results.js";
import lodash from "lodash";

const isEmpty = lodash.isEmpty;
const Pves = PveEnemiesTables(db.sequelize, db.dataTypes);
const PveMatchResults = PveMatchResultsTable(db.sequelize, db.dataTypes);

export const getAllPves = async function (): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    Pves.findAll()
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

// Save PvE match result
export const savePveMatchResult = async function (matchData: {
  player_id: number;
  player_name: string;
  monster_id: number;
  monster_name: string;
  player_total: number;
  monster_total: number;
  winner: string;
  details?: string;
}): Promise<any> {
  try {
    const result = await PveMatchResults.create({
      ...matchData,
      match_date: new Date().toISOString(),
    });
    return result;
  } catch (err) {
    console.error("Error saving PvE match result:", err);
    throw err;
  }
};

// Get all PvE match results
export const getAllPveMatchResults = async function (): Promise<any> {
  try {
    const results = await PveMatchResults.findAll({
      order: [['id', 'DESC']],
    });
    return results;
  } catch (err) {
    console.error("Error getting PvE match results:", err);
    throw err;
  }
};

// Get PvE match results by player ID
export const getPveMatchResultsByPlayerId = async function (playerId: number): Promise<any> {
  try {
    const results = await PveMatchResults.findAll({
      where: { player_id: playerId },
      order: [['id', 'DESC']],
    });
    return results;
  } catch (err) {
    console.error("Error getting PvE match results by player:", err);
    throw err;
  }
};
