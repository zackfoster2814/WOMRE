import { Sequelize, Op, DataTypes, QueryTypes } from "sequelize";
import path from "path";
import { RelationsConfig } from "./relations/relationsConfig.js";

import { ArchetypeTables } from "./tables/archetypes.js";
import { CharDevTables } from "./tables/char_dev.js";
import { EnchantTables } from "./tables/enchants.js";
import { EventTables } from "./tables/event.js";
import { GearTables } from "./tables/gears.js";
import { HouseTables } from "./tables/houses.js";
import { MatchEventsTables } from "./tables/match_events.js";
import { MatchRewardTables } from "./tables/match_reward.js";
import { MatchTables } from "./tables/matches.js";
import { PlayerArchetypeTables } from "./tables/player_archetypes.js";
import { PlayerCharDevTables } from "./tables/player_char_dev.js";
import { PlayerGearTables } from "./tables/player_gears.js";
import { PlayerPowerTables } from "./tables/player_power.js";
import { PlayerQuirkTables } from "./tables/player_quirks.js";
import { PlayerWeaponTables } from "./tables/player_weapons.js";
import { PlayerTables } from "./tables/player.js";
import { PowerTables } from "./tables/power.js";
import { PveEnemiesTables } from "./tables/pve_enemies.js";
import { QuirkTables } from "./tables/quirks.js";
import { RaceTables } from "./tables/races.js";
import { RewardTables } from "./tables/rewards.js";
import { SubRaceTables } from "./tables/sub_race.js";
import { TournamentPhaseTables } from "./tables/tournament_phase.js";
import { WeaponEnchantTables } from "./tables/weapon_enchants.js";
import { WeaponTables } from "./tables/weapons.js";
import { Player_PveTables } from "./tables/player_pve.js";

interface DbConnection {
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
  dataTypes: typeof DataTypes;
  QueryTypes: typeof QueryTypes;
  Op: typeof Op;
}

const db = {} as DbConnection;

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(process.cwd(), "womre.sqlite"),
  dialectOptions: {
    dateStrings: true,
    typeCast: true,
  },
  // logging: false,
  logging: false,
  benchmark: true,
  define: {
    timestamps: false,
    underscored: true,
  },
});

// Initialize models
ArchetypeTables(sequelize, DataTypes);
CharDevTables(sequelize, DataTypes);
EnchantTables(sequelize, DataTypes);
EventTables(sequelize, DataTypes);
GearTables(sequelize, DataTypes);
HouseTables(sequelize, DataTypes);
MatchEventsTables(sequelize, DataTypes);
MatchRewardTables(sequelize, DataTypes);
MatchTables(sequelize, DataTypes);
PlayerArchetypeTables(sequelize, DataTypes);
PlayerCharDevTables(sequelize, DataTypes);
PlayerGearTables(sequelize, DataTypes);
PlayerPowerTables(sequelize, DataTypes);
PlayerQuirkTables(sequelize, DataTypes);
PlayerWeaponTables(sequelize, DataTypes);
PlayerTables(sequelize, DataTypes);
PowerTables(sequelize, DataTypes);
PveEnemiesTables(sequelize, DataTypes);
QuirkTables(sequelize, DataTypes);
RaceTables(sequelize, DataTypes);
RewardTables(sequelize, DataTypes);
SubRaceTables(sequelize, DataTypes);
TournamentPhaseTables(sequelize, DataTypes);
WeaponEnchantTables(sequelize, DataTypes);
WeaponTables(sequelize, DataTypes);
Player_PveTables(sequelize, DataTypes);

RelationsConfig(sequelize);

export default async function initDb() {
  await sequelize.authenticate();
  await sequelize.sync();
  console.log("✅ Database synced");
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.dataTypes = DataTypes;
db.QueryTypes = QueryTypes;
db.Op = Op;

export { sequelize, db };
