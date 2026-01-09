import { ipcMain } from "electron";
import { getAllPlayers, getAllPlayersForBattle, insertPlayer, updatePlayer, createPlayer, importCharacterFromJSON } from "../db/player.model.js";
import { QueryTypes } from "sequelize";
import { db } from "../db/index.js";

// Transform database player to battle format
function transformPlayerForBattle(dbPlayer: any) {
  // Parse powers from GROUP_CONCAT
  const powers = dbPlayer.powers ? dbPlayer.powers.split(',').filter(Boolean) : [];
  const archetypes = dbPlayer.archetypes ? dbPlayer.archetypes.split(',').filter(Boolean) : [];

  return {
    name: dbPlayer.name || "Unknown Player",
    race: dbPlayer.race_name || "Unknown",
    subrace: dbPlayer.subrace_name || "Unknown",
    archetype: archetypes.length > 0 ? archetypes[0] : "Unknown",
    stats: {
      strength: String(dbPlayer.current_strength || dbPlayer.base_strength || 0),
      speed: String(dbPlayer.current_speed || dbPlayer.base_speed || 0),
      durability: String(dbPlayer.current_durability || dbPlayer.base_durability || 0),
      iq: String(dbPlayer.current_iq || dbPlayer.base_iq || 0),
      battleIQ: String(dbPlayer.current_biq || dbPlayer.base_biq || 0),
      martialArts: String(dbPlayer.current_martial_arts || dbPlayer.base_martial_arts || 0),
      totalBaseStat: String(
        (dbPlayer.base_strength || 0) +
        (dbPlayer.base_speed || 0) +
        (dbPlayer.base_durability || 0) +
        (dbPlayer.base_iq || 0) +
        (dbPlayer.base_biq || 0) +
        (dbPlayer.base_martial_arts || 0)
      ),
      modifiers: []
    },
    quirks: [],
    house: dbPlayer.house_name || "Unknown",
    gears: [],
    legacyGears: [],
    weapons: [],
    enchants: [],
    powers: powers,
    charDevs: [],
    pve: ""
  };
}

export function registerPlayerIpcHandlers() {
  ipcMain.handle("fetch-players", async () => {
    try {
      const players = await getAllPlayers();
      return players;
    } catch (error) {
      console.error("Error fetching players:", error);
      throw error;
    }
  });

  ipcMain.handle("get-all-players", async () => {
    try {
      console.log("IPC: get-all-players called");

      // Try simple query first
      const simplePlayers = await getAllPlayers();
      console.log("IPC: Simple players from DB:", simplePlayers);

      if (!simplePlayers || simplePlayers.length === 0) {
        console.log("IPC: No players found in database");
        return { success: true, data: [] };
      }

      // Try complex query with joins
      const players = await getAllPlayersForBattle();
      console.log("IPC: Raw players from DB:", players);

      // Transform players for battle interface
      const transformedPlayers = players ? players.map(transformPlayerForBattle) : [];
      console.log("IPC: Transformed players:", transformedPlayers);

      return { success: true, data: transformedPlayers };
    } catch (error) {
      console.error("Error fetching all players:", error);
      return { success: false, error: error.message };
    }
  });

  //bat buoc phai truyen vao event
  ipcMain.handle("insert-player", async (event, Playerdata) => {
    try {
      const players = await insertPlayer(Playerdata);
      return players;
    } catch (error) {
      console.error("Error fetching players:", error);
      throw error;
    }
  });

  ipcMain.handle("update-player", async (event, playerData) => {
    try {
      console.log("IPC: update-player called with:", playerData);
      await updatePlayer(playerData);
      return { success: true };
    } catch (error) {
      console.error("Error updating player:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("create-player", async (event, playerData) => {
    try {
      console.log("IPC: create-player called with:", playerData);
      const result = await createPlayer(playerData);
      return { success: true, playerId: result.playerId };
    } catch (error) {
      console.error("Error creating player:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("save-player-relationships", async (event, data) => {
    try {
      console.log("IPC: save-player-relationships called with:", data);
      const { playerId, powers, weapons, archetypes, quirks, gears } = data;

      // Delete existing relationships
      await db.sequelize.query("DELETE FROM Player_Power WHERE player_id = :playerId", {
        replacements: { playerId },
        type: QueryTypes.DELETE
      });
      await db.sequelize.query("DELETE FROM Player_Weapon WHERE player_id = :playerId", {
        replacements: { playerId },
        type: QueryTypes.DELETE
      });
      await db.sequelize.query("DELETE FROM Player_Archetypes WHERE player_id = :playerId", {
        replacements: { playerId },
        type: QueryTypes.DELETE
      });
      await db.sequelize.query("DELETE FROM Player_Quirks WHERE player_id = :playerId", {
        replacements: { playerId },
        type: QueryTypes.DELETE
      });
      await db.sequelize.query("DELETE FROM Player_Gear WHERE player_id = :playerId", {
        replacements: { playerId },
        type: QueryTypes.DELETE
      });

      // Insert new powers
      for (const powerId of powers) {
        await db.sequelize.query(
          "INSERT INTO Player_Power (player_id, power_id) VALUES (:playerId, :powerId)",
          {
            replacements: { playerId, powerId },
            type: QueryTypes.INSERT
          }
        );
      }

      // Insert new weapons
      for (const weaponId of weapons) {
        await db.sequelize.query(
          "INSERT INTO Player_Weapon (player_id, weapon_id) VALUES (:playerId, :weaponId)",
          {
            replacements: { playerId, weaponId },
            type: QueryTypes.INSERT
          }
        );
      }

      // Insert new archetypes
      for (const archetypeId of archetypes) {
        await db.sequelize.query(
          "INSERT INTO Player_Archetypes (player_id, archetype_id) VALUES (:playerId, :archetypeId)",
          {
            replacements: { playerId, archetypeId },
            type: QueryTypes.INSERT
          }
        );
      }

      // Insert new quirks
      for (const quirkId of quirks) {
        await db.sequelize.query(
          "INSERT INTO Player_Quirks (player_id, quirk_id) VALUES (:playerId, :quirkId)",
          {
            replacements: { playerId, quirkId },
            type: QueryTypes.INSERT
          }
        );
      }

      // Insert new gears
      for (const gearId of gears) {
        await db.sequelize.query(
          "INSERT INTO Player_Gear (player_id, gear_id) VALUES (:playerId, :gearId)",
          {
            replacements: { playerId, gearId },
            type: QueryTypes.INSERT
          }
        );
      }

      return { success: true };
    } catch (error) {
      console.error("Error saving player relationships:", error);
      return { success: false, error: error.message };
    }
  });

  // Import character from JSON
  ipcMain.handle("import-character-from-json", async (event, characterData) => {
    try {
      console.log("IPC: import-character-from-json called");
      const result = await importCharacterFromJSON(characterData);
      return { success: true, playerId: result.playerId };
    } catch (error) {
      console.error("Error importing character from JSON:", error);
      return { success: false, error: error.message };
    }
  });

  //example
  // ipcMain.handle("ping", async (...) => {
  //   return "pong";
  // });
}
