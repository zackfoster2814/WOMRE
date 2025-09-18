import { ipcMain } from "electron";
import { getAllEvents } from "../db/event.model";

export function registerEventIpcHandlers() {
  ipcMain.handle("fetch-events", async () => {
    try {
      const events = await getAllEvents();
      return events;
    } catch (error) {
      console.error("Error fetching events:", error);
      throw error;
    }
  });
}