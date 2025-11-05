import { ipcMain } from "electron";
import {
  getAllExtraArchetypes,
  getExtraArchetypeById,
  createExtraArchetype,
  updateExtraArchetype,
  deleteExtraArchetype,
} from "../db/extra_archetypes.model.js";

export function registerExtraArchetypesHandlers() {
  ipcMain.handle("get-all-extra-archetypes", async () => {
    try {
      const extraArchetypes = await getAllExtraArchetypes();
      return extraArchetypes;
    } catch (error) {
      console.error("Error getting all extra archetypes:", error);
      throw error;
    }
  });

  ipcMain.handle("get-extra-archetype-by-id", async (event, id) => {
    try {
      const extraArchetype = await getExtraArchetypeById(id);
      return extraArchetype;
    } catch (error) {
      console.error("Error getting extra archetype by id:", error);
      throw error;
    }
  });

  ipcMain.handle("create-extra-archetype", async (event, data) => {
    try {
      const newExtraArchetype = await createExtraArchetype(data);
      return newExtraArchetype;
    } catch (error) {
      console.error("Error creating extra archetype:", error);
      throw error;
    }
  });

  ipcMain.handle("update-extra-archetype", async (event, { id, data }) => {
    try {
      const updatedExtraArchetype = await updateExtraArchetype(id, data);
      return updatedExtraArchetype;
    } catch (error) {
      console.error("Error updating extra archetype:", error);
      throw error;
    }
  });

  ipcMain.handle("delete-extra-archetype", async (event, id) => {
    try {
      const result = await deleteExtraArchetype(id);
      return result;
    } catch (error) {
      console.error("Error deleting extra archetype:", error);
      throw error;
    }
  });
}