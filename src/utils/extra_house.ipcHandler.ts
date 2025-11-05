import { ipcMain } from "electron";
import {
  getAllExtraHouses,
  getExtraHouseById,
  createExtraHouse,
  updateExtraHouse,
  deleteExtraHouse,
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

  ipcMain.handle("create-extra-house", async (event, data) => {
    try {
      const newExtraHouse = await createExtraHouse(data);
      return newExtraHouse;
    } catch (error) {
      console.error("Error creating extra house:", error);
      throw error;
    }
  });

  ipcMain.handle("update-extra-house", async (event, { id, data }) => {
    try {
      const updatedExtraHouse = await updateExtraHouse(id, data);
      return updatedExtraHouse;
    } catch (error) {
      console.error("Error updating extra house:", error);
      throw error;
    }
  });

  ipcMain.handle("delete-extra-house", async (event, id) => {
    try {
      const result = await deleteExtraHouse(id);
      return result;
    } catch (error) {
      console.error("Error deleting extra house:", error);
      throw error;
    }
  });
}
