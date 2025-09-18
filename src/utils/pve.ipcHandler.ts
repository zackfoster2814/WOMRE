import { ipcMain } from "electron";
import { getAllPves } from "../db/pve.model";

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
}