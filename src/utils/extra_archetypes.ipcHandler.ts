import { ipcMain } from "electron";
import {
  getAllExtraArchetypes,
  getExtraArchetypeById,
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
}