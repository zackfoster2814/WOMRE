import { ipcMain } from "electron";
import { getAllPlayers } from "../db/player.model.ts";

 export function registerPlayerIpcHandlers() {
   ipcMain.handle("fetch-players", async () => {
     try {
       const players = await getAllPlayers();
       return players;
     } catch (error) {
       console.error("Error fetching players:", error);
       throw error;
     }
   })
   //example
    // ipcMain.handle("ping", async (...) => {
    //   return "pong";
    // });
 }