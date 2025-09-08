const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("api", {
    fetchAllPlayers: () => ipcRenderer.invoke("fetch-players"),
    insertPlayer: async (Playerdata) => {
        return await ipcRenderer.invoke("insert-player", Playerdata);
    },
    //expose cac ham ipc khac tai day
});
//# sourceMappingURL=preload.js.map