import { db } from "./index.js";
import { fn, col, Op, Sequelize, QueryTypes } from "sequelize";
import { PlayerTables } from "./tables/player.js";
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

// Get all players with full details for battle
export const getAllPlayersForBattle = async function (): Promise<any> {
  try {
    const query = `
      SELECT
        p.id,
        p.name,
        p.base_strength,
        p.base_speed,
        p.base_iq,
        p.base_biq,
        p.base_durability,
        p.base_martial_arts,
        p.current_strength,
        p.current_speed,
        p.current_iq,
        p.current_biq,
        p.current_durability,
        p.current_martial_arts,
        r.name as race_name,
        sr.name as subrace_name,
        h.name as house_name,
        GROUP_CONCAT(DISTINCT a.name) as archetypes,
        GROUP_CONCAT(DISTINCT pow.name) as powers
      FROM Players p
      LEFT JOIN Races r ON p.race_id = r.id
      LEFT JOIN Sub_Race sr ON p.sub_race_id = sr.id
      LEFT JOIN Houses h ON p.house_id = h.id
      LEFT JOIN Player_Archetypes pa ON p.id = pa.player_id
      LEFT JOIN Archetypes a ON pa.archetype_id = a.id
      LEFT JOIN Player_Power pp ON p.id = pp.player_id
      LEFT JOIN Powers pow ON pp.power_id = pow.id
      GROUP BY p.id
    `;

    console.log("Executing getAllPlayersForBattle query...");
    const players = await db.sequelize.query(query, {
      type: QueryTypes.SELECT,
      raw: true,
    });

    console.log(`Found ${players ? players.length : 0} players:`, players);
    return players;
  } catch (err) {
    console.error("Error getting players for battle:", err);
    throw err;
  }
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

// Create new player with full data
export const createPlayer = async function (playerData: any) {
  try {
    const query = `
      INSERT INTO Players (
        stt, name, note, race_id, sub_race_id, house_id,
        base_strength, base_speed, base_iq, base_biq, base_durability, base_martial_arts,
        current_strength, current_speed, current_iq, current_biq, current_durability, current_martial_arts,
        pvp_reward, tailored_reward, tournament_status
      ) VALUES (
        :stt, :name, :note, :race_id, :sub_race_id, :house_id,
        :base_strength, :base_speed, :base_iq, :base_biq, :base_durability, :base_martial_arts,
        :current_strength, :current_speed, :current_iq, :current_biq, :current_durability, :current_martial_arts,
        '', '', 0
      )
    `;

    const result: any = await db.sequelize.query(query, {
      replacements: {
        stt: playerData.stt,
        name: playerData.name,
        note: playerData.note || '',
        race_id: playerData.race_id !== undefined ? playerData.race_id : null,
        sub_race_id: playerData.sub_race_id !== undefined ? playerData.sub_race_id : null,
        house_id: playerData.house_id !== undefined ? playerData.house_id : null,
        base_strength: playerData.base_strength || 0,
        base_speed: playerData.base_speed || 0,
        base_iq: playerData.base_iq || 0,
        base_biq: playerData.base_biq || 0,
        base_durability: playerData.base_durability || 0,
        base_martial_arts: playerData.base_martial_arts || 0,
        current_strength: playerData.current_strength || 0,
        current_speed: playerData.current_speed || 0,
        current_iq: playerData.current_iq || 0,
        current_biq: playerData.current_biq || 0,
        current_durability: playerData.current_durability || 0,
        current_martial_arts: playerData.current_martial_arts || 0,
      },
      type: QueryTypes.INSERT,
      raw: true,
    });

    // Return the inserted ID (for SQLite, result[0] contains the last inserted row ID)
    return { playerId: result[0] };
  } catch (err) {
    console.error("Error creating player:", err);
    throw err;
  }
};

// Update player
export const updatePlayer = async function (playerData: any) {
  try {
    const query = `
      UPDATE Players SET
        stt = :stt,
        name = :name,
        note = :note,
        race_id = :race_id,
        sub_race_id = :sub_race_id,
        house_id = :house_id,
        base_strength = :base_strength,
        base_speed = :base_speed,
        base_iq = :base_iq,
        base_biq = :base_biq,
        base_durability = :base_durability,
        base_martial_arts = :base_martial_arts,
        current_strength = :current_strength,
        current_speed = :current_speed,
        current_iq = :current_iq,
        current_biq = :current_biq,
        current_durability = :current_durability,
        current_martial_arts = :current_martial_arts
      WHERE id = :id
    `;

    const result = await db.sequelize.query(query, {
      replacements: {
        id: playerData.id,
        stt: playerData.stt,
        name: playerData.name,
        note: playerData.note,
        race_id: playerData.race_id,
        sub_race_id: playerData.sub_race_id,
        house_id: playerData.house_id,
        base_strength: playerData.base_strength,
        base_speed: playerData.base_speed,
        base_iq: playerData.base_iq,
        base_biq: playerData.base_biq,
        base_durability: playerData.base_durability,
        base_martial_arts: playerData.base_martial_arts,
        current_strength: playerData.current_strength,
        current_speed: playerData.current_speed,
        current_iq: playerData.current_iq,
        current_biq: playerData.current_biq,
        current_durability: playerData.current_durability,
        current_martial_arts: playerData.current_martial_arts,
      },
      type: QueryTypes.UPDATE,
      raw: true,
    });

    return result;
  } catch (err) {
    console.error("Error updating player:", err);
    throw err;
  }
};

// Import character from JSON into database
export const importCharacterFromJSON = async function (characterData: any) {
  try {
    console.log("Importing character from JSON:", characterData);

    // Get IDs from names
    const getRaceId = async (raceName: string) => {
      const result: any = await db.sequelize.query(
        "SELECT id FROM Races WHERE name = :name LIMIT 1",
        { replacements: { name: raceName }, type: QueryTypes.SELECT }
      );
      return result[0]?.id || 0;
    };

    const getSubraceId = async (subraceName: string) => {
      const result: any = await db.sequelize.query(
        "SELECT id FROM Sub_Race WHERE name = :name LIMIT 1",
        { replacements: { name: subraceName }, type: QueryTypes.SELECT }
      );
      return result[0]?.id || null;
    };

    const getHouseId = async (houseName: string) => {
      const result: any = await db.sequelize.query(
        "SELECT id FROM Houses WHERE name = :name LIMIT 1",
        { replacements: { name: houseName }, type: QueryTypes.SELECT }
      );
      return result[0]?.id || null;
    };

    // Get IDs
    const race_id = characterData.race ? await getRaceId(characterData.race) : null;
    const sub_race_id = characterData.subrace ? await getSubraceId(characterData.subrace) : null;
    const house_id = characterData.house ? await getHouseId(characterData.house) : null;

    // Get current max STT
    const maxSttResult: any = await db.sequelize.query(
      "SELECT MAX(stt) as max_stt FROM Players",
      { type: QueryTypes.SELECT }
    );
    const nextStt = (maxSttResult[0]?.max_stt || 0) + 1;

    // Create player
    const stats = characterData.stats || {};
    const playerResult = await createPlayer({
      stt: nextStt,
      name: characterData.name || "Unnamed Character",
      note: characterData.pve || "",
      race_id,
      sub_race_id,
      house_id,
      base_strength: parseInt(stats.strength) || 0,
      base_speed: parseInt(stats.speed) || 0,
      base_iq: parseInt(stats.iq) || 0,
      base_biq: parseInt(stats.battleIQ) || 0,
      base_durability: parseInt(stats.durability) || 0,
      base_martial_arts: parseInt(stats.martialArts) || 0,
      current_strength: parseInt(stats.strength) || 0,
      current_speed: parseInt(stats.speed) || 0,
      current_iq: parseInt(stats.iq) || 0,
      current_biq: parseInt(stats.battleIQ) || 0,
      current_durability: parseInt(stats.durability) || 0,
      current_martial_arts: parseInt(stats.martialArts) || 0,
    });

    const playerId = playerResult.playerId;
    console.log("Created player with ID:", playerId);

    // Helper to get ID by name
    const getIdByName = async (table: string, name: string) => {
      const result: any = await db.sequelize.query(
        `SELECT id FROM ${table} WHERE name = :name LIMIT 1`,
        { replacements: { name }, type: QueryTypes.SELECT }
      );
      return result[0]?.id || null;
    };

    // Add Powers
    if (characterData.powers && Array.isArray(characterData.powers)) {
      for (const powerName of characterData.powers) {
        const powerId = await getIdByName("Powers", powerName);
        if (powerId) {
          await db.sequelize.query(
            "INSERT INTO Player_Power (player_id, power_id) VALUES (:player_id, :power_id)",
            { replacements: { player_id: playerId, power_id: powerId }, type: QueryTypes.INSERT }
          );
        }
      }
    }

    // Add Weapons
    if (characterData.weapons && Array.isArray(characterData.weapons)) {
      for (const weapon of characterData.weapons) {
        const weaponName = typeof weapon === 'string' ? weapon : weapon.name;
        const weaponId = await getIdByName("Weapons", weaponName);
        if (weaponId) {
          await db.sequelize.query(
            "INSERT INTO Player_Weapon (player_id, weapon_id) VALUES (:player_id, :weapon_id)",
            { replacements: { player_id: playerId, weapon_id: weaponId }, type: QueryTypes.INSERT }
          );
        }
      }
    }

    // Add Archetypes
    if (characterData.archetype) {
      const archetypeId = await getIdByName("Archetypes", characterData.archetype);
      if (archetypeId) {
        await db.sequelize.query(
          "INSERT INTO Player_Archetypes (player_id, archetype_id) VALUES (:player_id, :archetype_id)",
          { replacements: { player_id: playerId, archetype_id: archetypeId }, type: QueryTypes.INSERT }
        );
      }
    }

    // Add Quirks
    if (characterData.quirks && Array.isArray(characterData.quirks)) {
      for (const quirkName of characterData.quirks) {
        const quirkId = await getIdByName("Quirks", quirkName);
        if (quirkId) {
          await db.sequelize.query(
            "INSERT INTO Player_Quirks (player_id, quirk_id) VALUES (:player_id, :quirk_id)",
            { replacements: { player_id: playerId, quirk_id: quirkId }, type: QueryTypes.INSERT }
          );
        }
      }
    }

    // Add Gears
    if (characterData.gears && Array.isArray(characterData.gears)) {
      for (const gear of characterData.gears) {
        const gearName = typeof gear === 'string' ? gear : gear.name;
        const gearId = await getIdByName("Gears", gearName);
        if (gearId) {
          await db.sequelize.query(
            "INSERT INTO Player_Gear (player_id, gear_id) VALUES (:player_id, :gear_id)",
            { replacements: { player_id: playerId, gear_id: gearId }, type: QueryTypes.INSERT }
          );
        }
      }
    }

    // Add Character Developments
    if (characterData.charDevs && Array.isArray(characterData.charDevs)) {
      for (const charDevName of characterData.charDevs) {
        const charDevId = await getIdByName("Character_Developments", charDevName);
        if (charDevId) {
          await db.sequelize.query(
            "INSERT INTO Player_CharDev (player_id, chardev_id) VALUES (:player_id, :chardev_id)",
            { replacements: { player_id: playerId, chardev_id: charDevId }, type: QueryTypes.INSERT }
          );
        }
      }
    }

    console.log("Successfully imported character to database");
    return { success: true, playerId };
  } catch (err) {
    console.error("Error importing character from JSON:", err);
    throw err;
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
