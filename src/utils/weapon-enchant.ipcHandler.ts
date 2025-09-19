import { ipcMain } from "electron";
import { getAllWeaponEnchants } from "../db/weapon_enchant.model";

export function registerWeaponEnchantIpcHandlers() {
  ipcMain.handle("fetch-weapon-enchants", async () => {
    try {
      const weaponEnchants = await getAllWeaponEnchants();
      return weaponEnchants;
    } catch (error) {
      console.error("Error fetching weapon-enchants:", error);
      throw error;
    }
  });
}