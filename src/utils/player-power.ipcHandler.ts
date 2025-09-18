import { ipcMain } from "electron";
import { getAllPlayerPowers } from "@/db/player_power.model";

export function registerPlayerPowerIpcHandlers() {
  ipcMain.handle("fetch-player-powers", async () => {
    try {
      const playerPowers = await getAllPlayerPowers();
      return playerPowers;
    } catch (error) {
      console.error("Error fetching player-powers:", error);
      throw error;
    }
  });
}