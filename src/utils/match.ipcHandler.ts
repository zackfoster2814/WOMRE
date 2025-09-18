import { ipcMain } from "electron";
import { getAllMatches } from "../db/match.model";

export function registerMatchIpcHandlers() {
  ipcMain.handle("fetch-matches", async () => {
    try {
      const matches = await getAllMatches();
      return matches;
    } catch (error) {
      console.error("Error fetching matches:", error);
      throw error;
    }
  });
}