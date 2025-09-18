import { ipcMain } from "electron";
import { getAllSubraces } from "../db/subrace.model";

export function registerSubraceIpcHandlers() {
  ipcMain.handle("fetch-subraces", async () => {
    try {
      const subraces = await getAllSubraces();
      return subraces;
    } catch (error) {
      console.error("Error fetching subraces:", error);
      throw error;
    }
  });
}