import { ipcMain } from "electron";
import { getAllHouses } from "../db/house.model";

export function registerHouseIpcHandlers() {
  ipcMain.handle("fetch-houses", async () => {
    try {
      const houses = await getAllHouses();
      return houses;
    } catch (error) {
      console.error("Error fetching houses:", error);
      throw error;
    }
  });
}