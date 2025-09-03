import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  fetchAllPlayers: () => ipcRenderer.invoke("fetch-players"),
  insertPlayer: async (Playerdata:any) => {
      return await ipcRenderer.invoke('insert-player', Playerdata);
    },  
    //expose cac ham ipc khac tai day
});
