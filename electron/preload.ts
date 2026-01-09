const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // -------------------Players--------------------
  fetchAllPlayers: () => ipcRenderer.invoke('fetch-players'),
  insertPlayer: async (playerData) => await ipcRenderer.invoke('insert-player', playerData),

  // -------------------Races--------------------
  fetchAllRaces: () => ipcRenderer.invoke('fetch-races'),
  fetchRacesWithSubraceWheel: () => ipcRenderer.invoke('fetch-races-with-subrace-wheel'),
  // ------------------Subraces--------------------
  fetchAllSubraces: () => ipcRenderer.invoke('fetch-subraces'),
  fetchAllSubracesWithRace: () => ipcRenderer.invoke('fetch-subraces-with-race'),

  fetchSubraceById: async (raceId) => await ipcRenderer.invoke('fetch-subrace-by-id', raceId),

  // ------------------Archetypes------------------
  fetchAllArchetypes: () => ipcRenderer.invoke('fetch-archetypes'),

  // ------------------Player Archetypes------------------
  fetchAllPlayerArchetypes: () => ipcRenderer.invoke('fetch-player-archetypes'),

  // ----------------------Quirks-------------------------
  fetchAllQuirks: () => ipcRenderer.invoke('fetch-quirks'),

  // -------------------Player Quirks---------------------
  fetchAllPlayerQuirks: () => ipcRenderer.invoke('fetch-player-quirks'),

  // ----------------------Gears-------------------------
  fetchAllGears: () => ipcRenderer.invoke('fetch-gears'),

  // -------------------Player Gears---------------------
  fetchAllPlayerGears: () => ipcRenderer.invoke('fetch-player-gears'),
  fetchGearByLegacy: async (id) => await ipcRenderer.invoke('fetch-gear-by-legacy', id),
  // ---------------------Weapons------------------------
  fetchAllWeapons: () => ipcRenderer.invoke('fetch-weapons'),
  fetchUniqueWeapons: async (id) => await ipcRenderer.invoke('fetch-unique-weapons', id),

  // ------------------Player Weapons--------------------
  fetchAllPlayerWeapons: () => ipcRenderer.invoke('fetch-player-weapons'),

  // --------------------Enchants-----------------------
  fetchAllEnchants: () => ipcRenderer.invoke('fetch-enchants'),

  // ------------------Weapon Enchants--------------------
  fetchAllWeaponEnchants: () => ipcRenderer.invoke('fetch-weapon-enchants'),

  // ----------------------Powers---------------------
  fetchAllPowers: () => ipcRenderer.invoke('fetch-powers'),

  // ----------------------Player Powers----------------------
  fetchAllPlayerPowers: () => ipcRenderer.invoke('fetch-player-powers'),

  // ----------------------Houses----------------------
  fetchAllHouses: () => ipcRenderer.invoke('fetch-houses'),

  // ----------------------Character Developments----------------------
  fetchAllCharacterDevelopments: () => ipcRenderer.invoke('fetch-character-developments'),

  // ----------------------PVE----------------------
  fetchAllPves: () => ipcRenderer.invoke('fetch-pves'),

  // ----------------------Tournaments----------------------
  fetchAllTournamentPhases: () => ipcRenderer.invoke('fetch-tournament-phases'),

  // ----------------------Matches----------------------
  fetchAllMatches: () => ipcRenderer.invoke('fetch-matches'),

  // ----------------------Match Events----------------------
  fetchAllMatchEvents: () => ipcRenderer.invoke('fetch-match-events'),

  // ----------------------Match Rewards----------------------
  fetchAllMatchRewards: () => ipcRenderer.invoke('fetch-match-rewards'),

  // ----------------------Events----------------------
  fetchAllEvents: () => ipcRenderer.invoke('fetch-events'),

  // ----------------------Rewards----------------------
  fetchAllRewards: () => ipcRenderer.invoke('fetch-rewards'),

  // ----------------------Character Developments for Players----------------------
  fetchAllPlayerCharDevs: () => ipcRenderer.invoke('fetch-player-chardevs'),

  // ----------------------Extra Houses----------------------
  fetchAllExtraHouses: () => ipcRenderer.invoke('get-all-extra-houses'),
  fetchExtraHouseById: async (id) => await ipcRenderer.invoke('get-extra-house-by-id', id),


  // ----------------------Extra Archetypes----------------------
  fetchAllExtraArchetypes: () => ipcRenderer.invoke('get-all-extra-archetypes'),
  fetchExtraArchetypeById: async (id) => await ipcRenderer.invoke('get-extra-archetype-by-id', id),

  // ----------------------Import Character----------------------
  importCharacterFromJSON: (characterData: any) => ipcRenderer.invoke('import-character-from-json', characterData),
});

// Expose electron API for battle pages
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  }
});