import { ipcMain } from "electron";
import { getAllMatchRewards } from "../db/match-reward.model.js";

export function registerMatchRewardIpcHandlers() {
  ipcMain.handle("fetch-match-rewards", async () => {
    try {
      const matchRewards = await getAllMatchRewards();
      return matchRewards;
    } catch (error) {
      console.error("Error fetching match-rewards:", error);
      throw error;
    }
  });
}