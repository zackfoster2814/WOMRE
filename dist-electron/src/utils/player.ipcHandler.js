import { ipcMain } from "electron";
import { getAllPlayers, insertPlayer } from "../db/player.model";
export function registerPlayerIpcHandlers() {
    ipcMain.handle("fetch-players", async () => {
        try {
            const players = await getAllPlayers();
            return players;
        }
        catch (error) {
            console.error("Error fetching players:", error);
            throw error;
        }
    });
    //bat buoc phai truyen vao event
    ipcMain.handle("insert-player", async (event, Playerdata) => {
        try {
            const players = await insertPlayer(Playerdata);
            return players;
        }
        catch (error) {
            console.error("Error fetching players:", error);
            throw error;
        }
    });
    //example
    // ipcMain.handle("ping", async (...) => {
    //   return "pong";
    // });
}
//# sourceMappingURL=player.ipcHandler.js.map