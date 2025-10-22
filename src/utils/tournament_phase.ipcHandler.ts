import { ipcMain } from "electron";
import { getAllTournamentPhases } from "../db/tournament_phase.model.js"; 

export function registerTournamentPhaseIpcHandlers() {
  ipcMain.handle("fetch-tournament-phases", async () => {
    try {
      const tournamentPhases = await getAllTournamentPhases();
      return tournamentPhases;
    } catch (error) {
      console.error("Error fetching tournament-phases:", error);
      throw error;
    }
  });
}