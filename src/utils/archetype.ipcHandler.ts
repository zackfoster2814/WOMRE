import { ipcMain } from "electron";
import { getAllArchetypes } from "../db/archetypes.model.js"; 

export function registerArchetypeIpcHandlers() {
  ipcMain.handle("fetch-archetypes", async () => {
    try {
      const archetypes = await getAllArchetypes();
      return archetypes;
    } catch (error) {
      console.error("Error fetching archetypes:", error);
      throw error;
    }
  });
}