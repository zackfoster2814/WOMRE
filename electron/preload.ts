const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  fetchAllPlayers: () => ipcRenderer.invoke('fetch-players'),
  insertPlayer: async (playerData) => await ipcRenderer.invoke('insert-player', playerData),

  fetchAllRaces: () => ipcRenderer.invoke('fetch-races'),
  insertRace: async (raceData) => await ipcRenderer.invoke('insert-race', raceData),

  fetchAllSubraces: () => ipcRenderer.invoke('fetch-subraces'),
  insertSubrace: async (subraceData) => await ipcRenderer.invoke('insert-subrace', subraceData),

  fetchAllArchetypes: () => ipcRenderer.invoke('fetch-archetypes'),
  insertArchetype: async (archetypeData) => await ipcRenderer.invoke('insert-archetype', archetypeData),

  fetchAllPlayerArchetypes: () => ipcRenderer.invoke('fetch-player-archetypes'),
  insertPlayerArchetype: async (playerArchetypeData) => await ipcRenderer.invoke('insert-player-archetype', playerArchetypeData),

  fetchAllQuirks: () => ipcRenderer.invoke('fetch-quirks'),
  insertQuirk: async (quirkData) => await ipcRenderer.invoke('insert-quirk', quirkData),

  fetchAllPlayerQuirks: () => ipcRenderer.invoke('fetch-player-quirks'),
  insertPlayerQuirk: async (playerQuirkData) => await ipcRenderer.invoke('insert-player-quirk', playerQuirkData),

  fetchAllGears: () => ipcRenderer.invoke('fetch-gears'),
  insertGear: async (gearData) => await ipcRenderer.invoke('insert-gear', gearData),

  fetchAllPlayerGears: () => ipcRenderer.invoke('fetch-player-gears'),
  insertPlayerGear: async (playerGearData) => await ipcRenderer.invoke('insert-player-gear', playerGearData),

  fetchAllWeapons: () => ipcRenderer.invoke('fetch-weapons'),
  insertWeapon: async (weaponData) => await ipcRenderer.invoke('insert-weapon', weaponData),

  fetchAllPlayerWeapons: () => ipcRenderer.invoke('fetch-player-weapons'),
  insertPlayerWeapon: async (playerWeaponData) => await ipcRenderer.invoke('insert-player-weapon', playerWeaponData),

  fetchAllEnchants: () => ipcRenderer.invoke('fetch-enchants'),
  insertEnchant: async (enchantData) => await ipcRenderer.invoke('insert-enchant', enchantData),

  fetchAllWeaponEnchants: () => ipcRenderer.invoke('fetch-weapon-enchants'),
  insertWeaponEnchant: async (weaponEnchantData) => await ipcRenderer.invoke('insert-weapon-enchant', weaponEnchantData),

  fetchAllPowers: () => ipcRenderer.invoke('fetch-powers'),
  insertPower: async (powerData) => await ipcRenderer.invoke('insert-power', powerData),

  fetchAllPlayerPowers: () => ipcRenderer.invoke('fetch-player-powers'),
  insertPlayerPower: async (playerPowerData) => await ipcRenderer.invoke('insert-player-power', playerPowerData),

  fetchAllHouses: () => ipcRenderer.invoke('fetch-houses'),
  insertHouse: async (houseData) => await ipcRenderer.invoke('insert-house', houseData),

  fetchAllCharacterDevelopments: () => ipcRenderer.invoke('fetch-character-developments'),
  insertCharacterDevelopment: async (charDevData) => await ipcRenderer.invoke('insert-character-development', charDevData),

  fetchAllPves: () => ipcRenderer.invoke('fetch-pves'),
  insertPve: async (pveData) => await ipcRenderer.invoke('insert-pve', pveData),

  fetchAllTournamentPhases: () => ipcRenderer.invoke('fetch-tournament-phases'),
  insertTournamentPhase: async (tournamentPhaseData) => await ipcRenderer.invoke('insert-tournament-phase', tournamentPhaseData),

  fetchAllMatches: () => ipcRenderer.invoke('fetch-matches'),
  insertMatch: async (matchData) => await ipcRenderer.invoke('insert-match', matchData),

  fetchAllMatchEvents: () => ipcRenderer.invoke('fetch-match-events'),
  insertMatchEvent: async (matchEventData) => await ipcRenderer.invoke('insert-match-event', matchEventData),

  fetchAllMatchRewards: () => ipcRenderer.invoke('fetch-match-rewards'),
  insertMatchReward: async (matchRewardData) => await ipcRenderer.invoke('insert-match-reward', matchRewardData),

  fetchAllEvents: () => ipcRenderer.invoke('fetch-events'),
  insertEvent: async (eventData) => await ipcRenderer.invoke('insert-event', eventData),

  fetchAllRewards: () => ipcRenderer.invoke('fetch-rewards'),
  insertReward: async (rewardData) => await ipcRenderer.invoke('insert-reward', rewardData),

  fetchAllPlayerCharDevs: () => ipcRenderer.invoke('fetch-player-chardevs'),
  insertPlayerCharDev: async (playerCharDevData) => await ipcRenderer.invoke('insert-player-chardev', playerCharDevData),
});