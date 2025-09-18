import { ipcMain } from "electron";
import { getAllQuirks } from "../db/quirk.model";

export function registerQuirkIpcHandlers() {
  ipcMain.handle("fetch-quirks", async () => {
    try {
      const quirks = await getAllQuirks();
      return quirks;
    } catch (error) {
      console.error("Error fetching quirks:", error);
      throw error;
    }
  });
}