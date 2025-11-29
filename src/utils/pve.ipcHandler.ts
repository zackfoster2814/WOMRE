import { ipcMain } from "electron";
import { getAllPves, savePveMatchResult, getAllPveMatchResults, getPveMatchResultsByPlayerId } from "../db/pve.model.js";

export function registerPveIpcHandlers() {
  ipcMain.handle("fetch-pves", async () => {
    try {
      const pves = await getAllPves();
      return pves;
    } catch (error) {
      console.error("Error fetching pves:", error);
      throw error;
    }
  });

  ipcMain.handle("get-pve-monsters", async () => {
    try {
      const pves = await getAllPves();
      return { success: true, data: pves };
    } catch (error) {
      console.error("Error fetching PvE monsters:", error);
      return { success: false, error: error.message };
    }
  });

  // Save PvE match result
  ipcMain.handle("save-pve-match-result", async (event, matchData) => {
    try {
      console.log("Saving PvE match result:", matchData);
      const result = await savePveMatchResult(matchData);
      return { success: true, data: result };
    } catch (error) {
      console.error("Error saving PvE match result:", error);
      return { success: false, error: error.message };
    }
  });

  // Get all PvE match results
  ipcMain.handle("get-all-pve-match-results", async () => {
    try {
      const results = await getAllPveMatchResults();
      return { success: true, data: results };
    } catch (error) {
      console.error("Error getting PvE match results:", error);
      return { success: false, error: error.message };
    }
  });

  // Get PvE match results by player ID
  ipcMain.handle("get-pve-match-results-by-player", async (event, playerId) => {
    try {
      const results = await getPveMatchResultsByPlayerId(playerId);
      return { success: true, data: results };
    } catch (error) {
      console.error("Error getting PvE match results by player:", error);
      return { success: false, error: error.message };
    }
  });
}