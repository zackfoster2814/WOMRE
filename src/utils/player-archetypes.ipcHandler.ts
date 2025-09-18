import { ipcMain } from "electron";
import { getAllPlayerArchetypes } from "@/db/player_archetype.model";

export function registerPlayerArchetypesIpcHandlers() {
  ipcMain.handle("fetch-player-archetypes", async () => {
    try {
      const playerArchetypes = await getAllPlayerArchetypes();
      return playerArchetypes;
    } catch (error) {
      console.error("Error fetching player-archetypes:", error);
      throw error;
    }
  });
}