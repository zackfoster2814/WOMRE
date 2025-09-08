// Fix cho Electron types
declare module "electron" {
  export interface App {
    whenReady(): Promise<void>;
  }

  export interface BrowserWindow {
    loadURL(url: string): Promise<void>;
    loadFile(filePath: string): Promise<void>;
    webContents: WebContents;
  }

  export interface WebPreferences {
    nodeIntegration?: boolean;
    contextIsolation?: boolean;
    preload?: string;
  }

  export interface IpcMain {
    handle(
      channel: string,
      listener: (event: any, ...args: any[]) => any
    ): void;
  }

  export interface IpcRenderer {
    invoke(channel: string, ...args: any[]): Promise<any>;
  }

  export const app: App;
  export const BrowserWindow: any;
  export const ipcMain: IpcMain;
  export const ipcRenderer: IpcRenderer;
  export const contextBridge: any;
}
