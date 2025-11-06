import { ipcMain } from "electron";
import {
  getAllExtraHouses,
  getExtraHouseById,
} from "../db/extra_house.model.js";

export function registerExtraHousesHandlers() {
  ipcMain.handle("get-all-extra-houses", async () => {
    try {
      const extraHouses = await getAllExtraHouses();
      return extraHouses;
    } catch (error) {
      console.error("Error getting all extra houses:", error);
      throw error;
    }
  });

  ipcMain.handle("get-extra-house-by-id", async (event, id) => {
    try {
      const extraHouse = await getExtraHouseById(id);
      return extraHouse;
    } catch (error) {
      console.error("Error getting extra house by id:", error);
      throw error;
    }
  });
}
