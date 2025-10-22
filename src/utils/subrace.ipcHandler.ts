import { ipcMain } from "electron";
import { getAllSubraces , getSubracesByRaceId} from "../db/subrace.model.js";

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
  ipcMain.handle("fetch-subrace-by-id", async (_event, id: number) => {
    try {
      const subraces = await getSubracesByRaceId(id);
      return subraces;
    } catch (error) {
      console.error("Error fetching subrace by id:", error);
      throw error;
    }
  });
}