import { ipcMain } from "electron";
import { getAllRewards } from "../db/reward.model";

export function registerRewardIpcHandlers() {
  ipcMain.handle("fetch-rewards", async () => {
    try {
      const rewards = await getAllRewards();
      return rewards;
    } catch (error) {
      console.error("Error fetching rewards:", error);
      throw error;
    }
  });
}