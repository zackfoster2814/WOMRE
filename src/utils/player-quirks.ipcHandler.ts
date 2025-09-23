import { ipcMain } from "electron";
import { getAllPlayerQuirks } from "../db/player_quirk.model.js";

export function registerPlayerQuirksIpcHandlers() {
  ipcMain.handle("fetch-player-quirks", async () => {
    try {
      const playerQuirks = await getAllPlayerQuirks();
      return playerQuirks;
    } catch (error) {
      console.error("Error fetching player-quirks:", error);
      throw error;
    }
  });
}