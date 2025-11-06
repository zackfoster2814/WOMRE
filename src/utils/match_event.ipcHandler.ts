import { ipcMain } from "electron";
import { getAllMatchEvents } from "../db/match_event.model.js";

export function registerMatchEventIpcHandlers() {
  ipcMain.handle("fetch-match-events", async () => {
    try {
      const matchEvents = await getAllMatchEvents();
      return matchEvents;
    } catch (error) {
      console.error("Error fetching match-events:", error);
      throw error;
    }
  });
}