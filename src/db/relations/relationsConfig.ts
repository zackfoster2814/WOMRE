import { Sequelize } from "sequelize";

export function RelationsConfig(sequelize: Sequelize) {
  // DEBUG: Kiểm tra các model nào bị thiếu
  const requiredModels = [
    "Players",
    "Powers",
    "Weapons",
    "Gears",
    "Quirks",
    "char_dev",
    "Archetypes",
    "Enchants",
    "Matches",
    "Events",
    "Reward",
    "Matches_Events",
    "Matches_Reward",
    "Players_Power",
    "Players_Weapons",
    "Players_Quirks",
    "Player_char_dev",
    "Players_Archetypes",
    "Pve_Enemies",
    "Players_Gears",
    "Weapons_Enchants",
    "Races",
    "Sub_Race",
    "Player_Pve",
    "tournament_phase",
  ];

  const {
    Players,
    Powers,
    Weapons,
    Gears,
    Quirks,
    char_dev,
    Archetypes,
    Enchants,
    Matches,
    Events,
    Reward,
    Matches_Events,
    Matches_Reward,
    Players_Power,
    Players_Weapons,
    Players_Quirks,
    Player_char_dev,
    Players_Archetypes,
    Pve_Enemies,
    Players_Gears,
    Weapons_Enchants,
    Races,
    Sub_Race,
    Player_Pve,
    tournament_phase,
  } = sequelize.models;

  // Players <-> Powers
  Players.belongsToMany(Powers, {
    through: Players_Power,
    foreignKey: "player_id",
    otherKey: "power_id",
    as: "powers",
  });
  Powers.belongsToMany(Players, {
    through: Players_Power,
    foreignKey: "power_id",
    otherKey: "player_id",
    as: "players",
  });

  // Players <-> Weapons
  Players.belongsToMany(Weapons, {
    through: Players_Weapons,
    foreignKey: "player_id",
    otherKey: "weapon_id",
    as: "weapons",
  });
  Weapons.belongsToMany(Players, {
    through: Players_Weapons,
    foreignKey: "weapon_id",
    otherKey: "player_id",
    as: "players",
  });

  // Players <-> Gears
  Players.belongsToMany(Gears, {
    through: Players_Gears,
    foreignKey: "player_id",
    otherKey: "gear_id",
    as: "gears",
  });
  Gears.belongsToMany(Players, {
    through: Players_Gears,
    foreignKey: "gear_id",
    otherKey: "player_id",
    as: "players",
  });

  // Players <-> Quirks
  Players.belongsToMany(Quirks, {
    through: Players_Quirks,
    foreignKey: "player_id",
    otherKey: "quirk_id",
    as: "quirks",
  });
  Quirks.belongsToMany(Players, {
    through: Players_Quirks,
    foreignKey: "quirk_id",
    otherKey: "player_id",
    as: "players",
  });

  // Players <-> char_dev
  Players.belongsToMany(char_dev, {
    through: Player_char_dev,
    foreignKey: "player_id",
    otherKey: "char_dev_id",
    as: "char_dev",
  });
  char_dev.belongsToMany(Players, {
    through: Player_char_dev,
    foreignKey: "char_dev_id",
    otherKey: "player_id",
    as: "players",
  });

  // Players <-> Archetypes
  Players.belongsToMany(Archetypes, {
    through: Players_Archetypes,
    foreignKey: "player_id",
    otherKey: "archetype_id",
    as: "archetypes",
  });
  Archetypes.belongsToMany(Players, {
    through: Players_Archetypes,
    foreignKey: "archetype_id",
    otherKey: "player_id",
    as: "players",
  });

  // Weapons <-> Enchants
  Weapons.belongsToMany(Enchants, {
    through: Weapons_Enchants,
    foreignKey: "weapon_id",
    otherKey: "enchant_id",
    as: "enchants",
  });
  Enchants.belongsToMany(Weapons, {
    through: Weapons_Enchants,
    foreignKey: "enchant_id",
    otherKey: "weapon_id",
    as: "weapons",
  });

  // Players <-> Pve_Enemies
  Players.belongsToMany(Pve_Enemies, {
    through: Player_Pve,
    foreignKey: "player_id",
    otherKey: "pve_enemy_id",
    as: "pve_enemies",
  });
  Pve_Enemies.belongsToMany(Players, {
    through: Player_Pve,
    foreignKey: "pve_enemy_id",
    otherKey: "player_id",
    as: "players",
  });

  // Races -> Sub_Race (One-to-Many)
  Races.hasMany(Sub_Race, {
    foreignKey: "race_id",
    as: "sub_race",
  });
  Sub_Race.belongsTo(Races, {
    foreignKey: "race_id",
    as: "race",
  });

  // Matches <-> Events
  Matches.belongsToMany(Events, {
    through: Matches_Events,
    foreignKey: "match_id",
    otherKey: "event_id",
    as: "events",
  });
  Events.belongsToMany(Matches, {
    through: Matches_Events,
    foreignKey: "event_id",
    otherKey: "match_id",
    as: "matches",
  });

  // Matches <-> Reward
  Matches.belongsToMany(Reward, {
    through: Matches_Reward,
    foreignKey: "match_id",
    otherKey: "reward_id",
    as: "rewards",
  });
  Reward.belongsToMany(Matches, {
    through: Matches_Reward,
    foreignKey: "reward_id",
    otherKey: "match_id",
    as: "matches",
  });

  // Matches -> Pve_Enemies (Many-to-One)
  Matches.belongsTo(Pve_Enemies, {
    foreignKey: "pve_enemy_id",
    as: "pveEnemy",
  });
  Pve_Enemies.hasMany(Matches, {
    foreignKey: "pve_enemy_id",
    as: "matches",
  });

  // Matches -> tournament_phase (Many-to-One)
  Matches.belongsTo(tournament_phase, {
    foreignKey: "phase_id",
    as: "phase",
  });
  tournament_phase.hasMany(Matches, {
    foreignKey: "phase_id",
    as: "matches",
  });
}
