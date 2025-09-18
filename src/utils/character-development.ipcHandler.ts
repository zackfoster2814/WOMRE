import { ipcMain } from "electron";
import { getAllCharacterDevelopments } from "@/db/chardev.model"; 

export function registerCharacterDevelopmentIpcHandlers() {
  ipcMain.handle("fetch-character-developments", async () => {
    try {
      const characterDevelopments = await getAllCharacterDevelopments();
      return characterDevelopments;
    } catch (error) {
      console.error("Error fetching character-developments:", error);
      throw error;
    }
  });
}