import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  fetchAllPlayers: () => ipcRenderer.invoke("fetch-players"),
  //expose cac ham ipc khac tai day
});
