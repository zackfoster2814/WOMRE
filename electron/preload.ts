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

  // ---------------------Weapons------------------------
  fetchAllWeapons: () => ipcRenderer.invoke('fetch-weapons'),

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
  createExtraHouse: async (data) => await ipcRenderer.invoke('create-extra-house', data),
  updateExtraHouse: async (id, data) => await ipcRenderer.invoke('update-extra-house', { id, data }),
  deleteExtraHouse: async (id) => await ipcRenderer.invoke('delete-extra-house', id),

  // ----------------------Extra Archetypes----------------------
  fetchAllExtraArchetypes: () => ipcRenderer.invoke('get-all-extra-archetypes'),
  fetchExtraArchetypeById: async (id) => await ipcRenderer.invoke('get-extra-archetype-by-id', id),
  createExtraArchetype: async (data) => await ipcRenderer.invoke('create-extra-archetype', data),
  updateExtraArchetype: async (id, data) => await ipcRenderer.invoke('update-extra-archetype', { id, data }),
  deleteExtraArchetype: async (id) => await ipcRenderer.invoke('delete-extra-archetype', id),
});