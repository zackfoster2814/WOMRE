import { Sequelize,Op,DataTypes,QueryTypes } from "sequelize";
import path from "path";
import { PlayerTables } from "./tables/player";
import { RaceTables } from "./tables/races";
import { GearTables } from "./tables/gears";
import { WeaponTables } from "./tables/weapons";
import { PowerTables } from "./tables/power";
import { QuirkTables } from "./tables/quirks";
import { SubRaceTables } from "./tables/sub_race";
import { legacyGearWheel } from "@/Common/Config/GearConfig";
import { HouseTables } from "./tables/houses";
import { ArchetypeTables } from "./tables/archetypes";
import { PlayerArchetypeTables } from "./tables/player_archetypes";
import { PlayerQuirkTables } from "./tables/player_quirks";
import { PlayerGearTables } from "./tables/player_gears";
import { PlayerWeaponTables } from "./tables/player_weapons";
import { CharDevTables } from "./tables/char_dev";
import { EnchantTables } from "./tables/enchants";
import { WeaponEnchantTables } from "./tables/weapon_enchants";
import { PlayerPowerTables } from "./tables/player_power";
import { PveEnemiesTables } from "./tables/pve_enemies";
import { TournamentPhaseTables } from "./tables/tournament_phase";
import { EventEmitterAsyncResource } from "stream";
import { EventTables } from "./tables/event";
import { RewardTables } from "./tables/rewards";
import { MatchTables } from "./tables/matches";
import { MatchEventsTables } from "./tables/match_events";
import { MatchRewardTables } from "./tables/match_reward";
import { PlayerCharDevTables } from "./tables/player_char_dev";

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
    typeCast: true
  },
  // logging: false,
  logging: false,
  benchmark: true,
  define: {
    timestamps: false,
    underscored: true
  },
});


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
